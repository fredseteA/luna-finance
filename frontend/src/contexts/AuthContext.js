import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // onIdTokenChanged fires on sign-in/out and when the ID token refreshes,
    // which is the mechanism custom claims rely on.
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      if (cancelled) return;

      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        setIsPremium(false);
        return;
      }

      // Do not block app rendering on claims fetch (prevents intermittent blank screens).
      getIdTokenResult(currentUser)
        .then((tokenResult) => {
          if (cancelled) return;
          setIsPremium(Boolean(tokenResult?.claims?.isPremium));
        })
        .catch(() => {
          if (cancelled) return;
          setIsPremium(false);
        });
    });

    return unsubscribe;
  }, []);

  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () =>
    signInWithPopup(auth, googleProvider);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        user,
        isPremium,
        loading,
        register,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);