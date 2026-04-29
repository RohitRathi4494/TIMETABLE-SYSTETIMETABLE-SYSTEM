import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

// ─── School ID (single school model) ─────────────────────────────────────────
// All data lives under one school document. Change this if you ever go multi-school.
export const SCHOOL_ID = 'main';

// ─── Reference Helpers ────────────────────────────────────────────────────────
export const schoolRef = () => doc(db, 'schools', SCHOOL_ID);
export const colRef = (colName) => collection(db, 'schools', SCHOOL_ID, colName);
export const docRef = (colName, id) => doc(db, 'schools', SCHOOL_ID, colName, id);
export const userDocRef = (uid) => doc(db, 'users', uid);

// ─── User Profile ─────────────────────────────────────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : null;
};

export const setUserProfile = async (uid, data) => {
  await setDoc(userDocRef(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

// ─── School Info ──────────────────────────────────────────────────────────────
export const getSchoolInfo = async () => {
  const snap = await getDoc(schoolRef());
  return snap.exists() ? snap.data() : null;
};

export const saveSchoolInfo = async (data) => {
  await setDoc(schoolRef(), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

// ─── Generic Collection Helpers ───────────────────────────────────────────────
export const getCollection = async (colName) => {
  const snap = await getDocs(colRef(colName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const saveDocument = async (colName, id, data) => {
  await setDoc(docRef(colName, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const deleteDocument = async (colName, id) => {
  await deleteDoc(docRef(colName, id));
};

// ─── Bulk Write ───────────────────────────────────────────────────────────────
export const bulkSave = async (colName, items) => {
  const batch = writeBatch(db);
  items.forEach((item) => {
    const ref = docRef(colName, item.id);
    batch.set(ref, { ...item, updatedAt: serverTimestamp() }, { merge: true });
  });
  await batch.commit();
};

export const bulkDelete = async (colName, ids) => {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(docRef(colName, id)));
  await batch.commit();
};

// ─── Real-time Listeners ──────────────────────────────────────────────────────
export const listenCollection = (colName, callback) => {
  return onSnapshot(colRef(colName), (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
};

export const listenDocument = (colName, id, callback) => {
  return onSnapshot(docRef(colName, id), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
};

export { db, serverTimestamp };
