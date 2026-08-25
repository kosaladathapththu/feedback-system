import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

export async function submitFeedback(location, values, reference) {
  if (!db) {
    const stored = JSON.parse(
      localStorage.getItem("supun-preview-feedback") || "[]",
    );
    localStorage.setItem(
      "supun-preview-feedback",
      JSON.stringify([
        {
          feedbackId: reference,
          locationId: location.code,
          locationName: location.name,
          rating: values.rating,
          categories: values.categories,
          comment: values.comment.trim(),
          otherDetail: values.otherDetail?.trim() || "",
          customerName: values.customerName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          urgent: values.urgent,
          status: "open",
          createdAt: new Date().toISOString(),
        },
        ...stored,
      ]),
    );
    return;
  }
  const feedbackRef = doc(db, "feedback", reference);
  await runTransaction(db, async (transaction) => {
    if ((await transaction.get(feedbackRef)).exists())
      throw new Error("Reference collision. Please submit again.");
    transaction.set(feedbackRef, {
      feedbackId: reference,
      locationId: location.code,
      locationName: location.name,
      zone: location.zone,
      rating: values.rating,
      categories: values.categories,
      comment: values.comment.trim(),
      otherDetail: values.otherDetail?.trim() || "",
      customerName: values.customerName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      urgent: values.urgent,
      status: "open",
      assignedTo: null,
      resolutionNote: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedAt: null,
    });
  });
}

export async function getFeedback({
  status = "all",
  locationCode = "all",
} = {}) {
  if (!db) return [];
  const filters = [];
  if (status !== "all") filters.push(where("status", "==", status));
  if (locationCode !== "all")
    filters.push(where("locationId", "==", locationCode));
  const snapshot = await getDocs(
    query(
      collection(db, "feedback"),
      ...filters,
      orderBy("createdAt", "desc"),
      limit(100),
    ),
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function updateFeedback(id, changes) {
  if (!db) {
    const stored = JSON.parse(
      localStorage.getItem("supun-preview-feedback") || "[]",
    );
    localStorage.setItem(
      "supun-preview-feedback",
      JSON.stringify(
        stored.map((item) =>
          item.feedbackId === id || item.id === id
            ? { ...item, ...changes, updatedAt: new Date().toISOString() }
            : item,
        ),
      ),
    );
    return;
  }
  await updateDoc(doc(db, "feedback", id), {
    ...changes,
    updatedAt: serverTimestamp(),
    ...(changes.status === "resolved" ? { resolvedAt: serverTimestamp() } : {}),
  });
}

export async function getFeedbackStatus(reference) {
  const value = reference.trim().toUpperCase();
  if (!value) throw new Error("Enter your feedback reference number.");

  if (!db) {
    const stored = JSON.parse(
      localStorage.getItem("supun-preview-feedback") || "[]",
    );
    const item = stored.find((feedback) => feedback.feedbackId === value);
    if (!item) throw new Error("We could not find that feedback reference.");
    return item;
  }

  const snapshot = await getDoc(doc(db, "feedbackStatus", value));
  if (!snapshot.exists())
    throw new Error("We could not find that feedback reference.");
  return snapshot.data();
}

export function createAutoReplyDraft({ feedback, status, comment }) {
  const reference = feedback?.feedbackId || "N/A";
  const locationName = feedback?.locationName || "the property";
  const categoryText = feedback?.categories?.length
    ? feedback.categories.join(", ")
    : "General feedback";
  const statusText =
    status === "in_progress"
      ? "in progress"
      : status === "resolved"
        ? "resolved"
        : "received";

  const subject = `Feedback ${statusText} - ${reference}`;
  const body = [
    "This is an automated status update from feedback@supungroup.lk.",
    "",
    `Feedback reference: ${reference}`,
    `Location: ${locationName}`,
    `Category: ${categoryText}`,
    `Current status: ${statusText}`,
    comment ? `Update note: ${comment}` : "",
    "",
    "Thank you for sharing your feedback. Our team is reviewing this and will continue follow-up as needed.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to: feedback?.email?.trim() || "",
    from: "feedback@supungroup.lk",
    subject,
    body,
  };
}

export function openAutoReplyDraft({ feedback, status, comment }) {
  if (typeof window === "undefined") return null;
  const draft = createAutoReplyDraft({ feedback, status, comment });
  const mailtoLink = `mailto:${draft.to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
  window.location.href = mailtoLink;
  return draft;
}
