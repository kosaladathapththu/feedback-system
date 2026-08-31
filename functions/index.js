const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const nodemailer = require("nodemailer");

initializeApp();

const smtpUrl = defineSecret("EMAIL_SMTP_URL");
const emailFrom = defineSecret("EMAIL_FROM");

const trackedFields = (feedback) => ({
  feedbackId: feedback.feedbackId,
  locationName: feedback.locationName,
  categories: Array.isArray(feedback.categories) ? feedback.categories : [],
  status: feedback.status || "open",
  resolutionNote: feedback.resolutionNote || null,
  createdAt: feedback.createdAt || FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  resolvedAt: feedback.resolvedAt || null,
});

const statusLabel = (status) =>
  status === "in_progress"
    ? "In progress"
    : status === "resolved"
      ? "Resolved"
      : "Received";

function emailMarkup(feedback, heading, message) {
  const reference = feedback.feedbackId;
  const appUrl = (process.env.PUBLIC_APP_URL || "").replace(/\/$/, "");
  const trackingUrl = appUrl ? `${appUrl}/track/${reference}` : "";
  const note = feedback.resolutionNote
    ? `<p style="margin:18px 0;padding:14px;border-left:3px solid #c69845;background:#faf7ef"><strong>Team update</strong><br>${escapeHtml(feedback.resolutionNote)}</p>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#f3f1eb;font-family:Arial,sans-serif;color:#173f34">
    <div style="max-width:600px;margin:0 auto;padding:32px 18px">
      <div style="background:#fff;border:1px solid #e3e4de;border-radius:18px;padding:30px">
        <p style="margin:0 0 8px;color:#9a6b20;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Supun Arcade Guest Experience</p>
        <h1 style="margin:0 0 14px;font-size:28px">${escapeHtml(heading)}</h1>
        <p style="color:#607068;line-height:1.6">${escapeHtml(message)}</p>
        <table style="width:100%;margin:22px 0;border-collapse:collapse">
          <tr><td style="padding:9px 0;color:#7b847f">Reference</td><td style="padding:9px 0;text-align:right;font-weight:700">${escapeHtml(reference)}</td></tr>
          <tr><td style="padding:9px 0;color:#7b847f">Location</td><td style="padding:9px 0;text-align:right;font-weight:700">${escapeHtml(feedback.locationName)}</td></tr>
          <tr><td style="padding:9px 0;color:#7b847f">Status</td><td style="padding:9px 0;text-align:right;font-weight:700">${statusLabel(feedback.status)}</td></tr>
        </table>
        ${note}
        ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;margin-top:10px;padding:12px 18px;border-radius:10px;background:#1f5948;color:#fff;text-decoration:none;font-weight:700">Track feedback</a>` : ""}
      </div>
      <p style="text-align:center;color:#849089;font-size:12px">This is an automatic message. Please keep your reference number private.</p>
    </div></body></html>`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character]);
}

async function sendEmail(feedback, subject, heading, message) {
  if (!feedback.email) return;
  const transporter = nodemailer.createTransport(smtpUrl.value());
  await transporter.sendMail({
    from: emailFrom.value(),
    to: feedback.email,
    subject,
    text: `${heading}\n\n${message}\n\nReference: ${feedback.feedbackId}\nLocation: ${feedback.locationName}\nStatus: ${statusLabel(feedback.status)}`,
    html: emailMarkup(feedback, heading, message),
  });
}

exports.feedbackCreated = onDocumentCreated(
  {
    document: "feedback/{feedbackId}",
    secrets: [smtpUrl, emailFrom],
  },
  async (event) => {
    const feedback = event.data.data();
    await getFirestore()
      .doc(`feedbackStatus/${event.params.feedbackId}`)
      .set(trackedFields(feedback));

    try {
      await sendEmail(
        feedback,
        `Feedback received - ${feedback.feedbackId}`,
        "Thank you for your feedback",
        "Your feedback has reached our team. We will keep you informed as it progresses.",
      );
    } catch (error) {
      logger.error("Confirmation email failed", { feedbackId: event.params.feedbackId, error });
    }
  },
);

exports.feedbackUpdated = onDocumentUpdated(
  {
    document: "feedback/{feedbackId}",
    secrets: [smtpUrl, emailFrom],
  },
  async (event) => {
    const before = event.data.before.data();
    const feedback = event.data.after.data();
    await getFirestore()
      .doc(`feedbackStatus/${event.params.feedbackId}`)
      .set(trackedFields(feedback), { merge: true });

    const guestVisibleChange =
      before.status !== feedback.status ||
      before.resolutionNote !== feedback.resolutionNote;
    if (!guestVisibleChange) return;

    try {
      await sendEmail(
        feedback,
        `Feedback ${statusLabel(feedback.status).toLowerCase()} - ${feedback.feedbackId}`,
        `Your feedback is ${statusLabel(feedback.status).toLowerCase()}`,
        feedback.status === "resolved"
          ? "Our team has completed its review of your feedback."
          : "Our team has updated your feedback and is working on the next steps.",
      );
    } catch (error) {
      logger.error("Status email failed", { feedbackId: event.params.feedbackId, error });
    }
  },
);
