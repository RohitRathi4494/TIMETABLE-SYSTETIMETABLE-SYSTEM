import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/auth';
import { getUserProfile } from '../firebase/db';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);   // Firebase user object
  const [userProfile, setUserProfile] = useState(null);   // { name, role, teacherId }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        // Fetch role + name from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userProfile?.role === 'admin';
  const isTeacher = userProfile?.role === 'teacher';

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, isAdmin, isTeacher, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
