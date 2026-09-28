import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function ProtectedAdminRoute({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setRole(null);
        setChecking(false);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();

          setUser(currentUser);
          setRole(userData.role);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setUser(null);
        setRole(null);
      }

      setChecking(false);
    });

    return unsubscribe;
  }, []);

  if (checking) {
    return null;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (role !== "super_admin" && role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}