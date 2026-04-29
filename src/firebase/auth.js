import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from './config';

// ─── Sign In ─────────────────────────────────────────────────────────────────
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export const logout = () => signOut(auth);

// ─── Auth State Listener ──────────────────────────────────────────────────────
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// ─── Re-authenticate (needed before changing password) ───────────────────────
export const reauth = (email, password) => {
  const credential = EmailAuthProvider.credential(email, password);
  return reauthenticateWithCredential(auth.currentUser, credential);
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const changeUserPassword = (newPassword) =>
  updatePassword(auth.currentUser, newPassword);

export default auth;
