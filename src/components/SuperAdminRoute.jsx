import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  reload,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

export default function SuperAdminRoute({
  children
}) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {

        // No Firebase user
        if (!currentUser) {

          setUser(null);
          setRole(null);
          setEmailVerified(false);
          setChecking(false);

          return;
        }

        try {

          // Refresh Firebase user information
          await reload(currentUser);

          // Require email verification
          if (!currentUser.emailVerified) {

            setUser(currentUser);
            setRole(null);
            setEmailVerified(false);
            setChecking(false);

            return;
          }

          setEmailVerified(true);

          // Get Firestore user profile
          const userRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const userSnapshot = await getDoc(
            userRef
          );

          if (userSnapshot.exists()) {

            const userData =
              userSnapshot.data();

            setUser(currentUser);
            setRole(
              userData.role || null
            );

          } else {

            setUser(null);
            setRole(null);
            setEmailVerified(false);

          }

        } catch (error) {

          console.error(
            "Error checking super admin:",
            error
          );

          setUser(null);
          setRole(null);
          setEmailVerified(false);

        }

        setChecking(false);
      }
    );

    return unsubscribe;

  }, []);

  // Wait until Firebase finishes checking
  if (checking) {
    return null;
  }

  // Not logged in
  if (!user) {

    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );

  }

  // Email is not verified
  if (!emailVerified) {

    return (
      <Navigate
        to="/admin/email-verification"
        replace
      />
    );

  }

  // Only Super Admin can access this route
  if (role !== "super_admin") {

    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );

  }

  return children;
}