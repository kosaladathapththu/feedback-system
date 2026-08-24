import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function submitFeedback(location, values, reference) {
  if (!db) throw new Error('Firebase has not been configured yet.');
  const feedbackRef = doc(db, 'feedback', reference);
  await runTransaction(db, async transaction => {
    if ((await transaction.get(feedbackRef)).exists()) throw new Error('Reference collision. Please submit again.');
    transaction.set(feedbackRef, {
      feedbackId: reference, locationId: location.code, locationName: location.name, zone: location.zone,
      rating: values.rating, categories: values.categories, comment: values.comment.trim(),
      customerName: values.customerName.trim(), phone: values.phone.trim(), urgent: values.urgent,
      status: 'open', assignedTo: null, resolutionNote: null, createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(), resolvedAt: null,
    });
  });
}
