import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getLocations() { if (!db) return []; const snapshot = await getDocs(collection(db, 'locations')); return snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => a.name.localeCompare(b.name)); }
export async function saveLocation(values) { if (!db) throw new Error('Firebase has not been configured yet.'); const data={ ...values, code: values.code.trim().toUpperCase(), name: values.name.trim(), updatedAt: serverTimestamp() }; if(values.id) { const {id,...change}=data; await updateDoc(doc(db,'locations',id),change); } else await addDoc(collection(db,'locations'),{...data, createdAt:serverTimestamp()}); }
export async function getUsers() { if (!db) return []; const snapshot=await getDocs(collection(db,'users')); return snapshot.docs.map(item=>({id:item.id,...item.data()})); }
export async function updateUser(id, changes) { if (!db) throw new Error('Firebase has not been configured yet.'); await updateDoc(doc(db,'users',id),{...changes,updatedAt:serverTimestamp()}); }
