import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getLocationByCode(code) {
  if (!db) throw new Error('Firebase has not been configured yet.');
  const normalized = code.trim().toUpperCase();
  const snapshot = await getDocs(query(collection(db, 'locations'), where('code', '==', normalized), where('active', '==', true), limit(1)));
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}
