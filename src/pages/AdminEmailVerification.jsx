import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MailCheck,
  RefreshCw,
  LogOut,
  Shield,
} from "lucide-react";

import {
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

export default function AdminEmailVerification() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        // Firebase has no authenticated user
        if (!currentUser) {
          if (mounted) {
            setChecking(false);
            navigate("/admin/login", {
              replace: true,
            });
          }

          return;
        }

        try {
          // Refresh the Firebase user
          await reload(currentUser);

          // Check the refreshed user
          const refreshedUser = auth.currentUser;

          if (!refreshedUser) {
            if (mounted) {
              setChecking(false);
              navigate("/admin/login", {
                replace: true,
              });
            }

            return;
          }

          // Email is already verified
          if (refreshedUser.emailVerified) {
            if (mounted) {
              navigate("/admin/dashboard", {
                replace: true,
              });
            }

            return;
          }

          // User exists but email is not verified
          if (mounted) {
            setUser(refreshedUser);
            setChecking(false);
          }

        } catch (err) {
          console.error(
            "Error checking email verification:",
            err
          );

          if (mounted) {
            setError(
              "Unable to check your verification status."
            );
            setChecking(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [navigate]);

  const handleResend = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser || sending) {
      return;
    }

    setSending(true);
    setError("");
    setMessage("");

    try {
      await sendEmailVerification(currentUser);

      setMessage(
        "Verification email sent. Please check your inbox."
      );

    } catch (err) {
      console.error(
        "Error sending verification email:",
        err
      );

      if (err?.code === "auth/too-many-requests") {
        setError(
          "Too many requests. Please wait before trying again."
        );
      } else {
        setError(
          err?.message ||
          "Failed to send verification email."
        );
      }

    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      navigate("/admin/login", {
        replace: true,
      });

      return;
    }

    setChecking(true);
    setError("");
    setMessage("");

    try {
      await reload(currentUser);

      const refreshedUser = auth.currentUser;

      if (!refreshedUser) {
        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      if (refreshedUser.emailVerified) {
        navigate("/admin/dashboard", {
          replace: true,
        });

        return;
      }

      setMessage(
        "Your email is not verified yet. Please click the verification link in your email."
      );

    } catch (err) {
      console.error(
        "Error checking verification:",
        err
      );

      setError(
        "Unable to check your verification status."
      );

    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);

      navigate("/admin/login", {
        replace: true,
      });

    } catch (err) {
      console.error(
        "Logout failed:",
        err
      );
    }
  };

  // Loading screen
  if (checking && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">

        <RefreshCw
          className="animate-spin text-gray-500"
          size={24}
        />

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

          {/* Icon */}
          <div className="flex justify-center mb-6">

            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">

              <MailCheck
                size={32}
                className="text-gray-700"
              />

            </div>

          </div>

          {/* Heading */}
          <div className="text-center mb-7">

            <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 mb-4">

              <Shield
                size={13}
                className="text-gray-500"
              />

              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                Admin Verification
              </span>

            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Verify your email
            </h1>

            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Please verify your email address:
            </p>

            <p className="text-sm font-medium text-gray-900 mt-1 break-all">
              {user?.email}
            </p>

          </div>

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">

            <p className="text-xs text-gray-600 leading-relaxed">
              Open the verification email and click
              the verification link. After verifying,
              return here and click the button below.
            </p>

          </div>

          {/* Message */}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-xs mb-4">
              {message}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">

            {/* Check verification */}
            <button
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full bg-[#0a0f1a] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#1e293b] transition-colors disabled:opacity-50"
            >
              {checking
                ? "Checking..."
                : "I've Verified My Email"}
            </button>

            {/* Resend */}
            <button
              onClick={handleResend}
              disabled={sending}
              className="w-full border border-gray-300 text-gray-700 py-3.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >

              <RefreshCw
                size={15}
                className={
                  sending
                    ? "animate-spin"
                    : ""
                }
              />

              {sending
                ? "Sending..."
                : "Resend Verification Email"}

            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full text-gray-400 hover:text-gray-700 py-2.5 text-xs transition-colors flex items-center justify-center gap-2"
            >

              <LogOut size={14} />

              Sign Out

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}