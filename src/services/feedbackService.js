import {
  collection,
  doc,
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
          customerName: values.customerName.trim(),
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
      customerName: values.customerName.trim(),
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
  if (!db) throw new Error("Firebase has not been configured yet.");
  await updateDoc(doc(db, "feedback", id), {
    ...changes,
    updatedAt: serverTimestamp(),
    ...(changes.status === "resolved" ? { resolvedAt: serverTimestamp() } : {}),
  });
}
