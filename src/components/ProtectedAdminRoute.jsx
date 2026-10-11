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

export default function ProtectedAdminRoute({
  children,
  allowedRoles = ["super_admin", "admin"],
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

          // Refresh the Firebase user
          // so emailVerified has the latest value
          await reload(currentUser);

          // Email verification is required
          if (!currentUser.emailVerified) {

            setUser(currentUser);
            setRole(null);
            setEmailVerified(false);
            setChecking(false);

            return;
          }

          setEmailVerified(true);

          // Get the logged-in user's Firestore profile
          const userRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const userSnapshot = await getDoc(
            userRef
          );

          // User document does not exist
          if (!userSnapshot.exists()) {

            setUser(null);
            setRole(null);
            setEmailVerified(false);
            setChecking(false);

            return;
          }

          const userData =
            userSnapshot.data();

          // Get role from Firestore
          const userRole =
            userData.role || null;

          // Account status check
          if (
            userData.status &&
            String(userData.status).toLowerCase() !==
              "active"
          ) {

            setUser(null);
            setRole(null);
            setEmailVerified(false);
            setChecking(false);

            return;
          }

          setUser(currentUser);
          setRole(userRole);

        } catch (error) {

          console.error(
            "Error checking Firebase user:",
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

  // Still checking Firebase authentication
  // and Firestore data
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

  // Logged in but email is not verified
  if (!emailVerified) {

    return (
      <Navigate
        to="/admin/email-verification"
        replace
      />
    );

  }

  // Logged in but role is not allowed
  if (!allowedRoles.includes(role)) {

    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );

  }

  // Authorized
  return children;
}