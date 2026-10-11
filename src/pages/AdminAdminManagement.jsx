import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Navigate } from "react-router-dom";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as signOutSecondary,
} from "firebase/auth";

import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";

import {
  Search,
  Plus,
  Edit2,
  UserCheck,
  UserX,
  Trash2,
  X,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import { auth, db } from "../firebase";

const SECONDARY_APP_NAME = "mprss-admin-account-creation";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  password: "",
  status: "Active",
};

const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white";

const labelClass =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

function getSecondaryAuth() {
  const existingApp = getApps().find(
    (app) => app.name === SECONDARY_APP_NAME
  );

  const secondaryApp =
    existingApp ||
    initializeApp(getApp().options, SECONDARY_APP_NAME);

  return getAuth(secondaryApp);
}

function formatDate(value) {
  if (!value) return "—";

  try {
    let date;

    if (typeof value.toDate === "function") {
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function StatusBadge({ status }) {
  const active =
    String(status).toLowerCase() === "active";

  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Inactive
    </span>
  );
}

export default function AdminAdminManagement() {
  const [admins, setAdmins] = useState([]);

  const [accessChecking, setAccessChecking] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [modalMode, setModalMode] =
    useState("add");

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [formErrors, setFormErrors] =
    useState({});

  const [saving, setSaving] =
    useState(false);

  const [confirmRemoveId, setConfirmRemoveId] =
    useState(null);

  const [confirmToggleId, setConfirmToggleId] =
    useState(null);

  /*
   * ============================================================
   * SUPER ADMIN ACCESS CHECK
   * ============================================================
   */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setIsSuperAdmin(false);
        setAccessChecking(false);
        return;
      }

      try {
        const userSnapshot = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        const role = String(
          userSnapshot.data()?.role || ""
        ).toLowerCase();

        setIsSuperAdmin(role === "super_admin");
      } catch (error) {
        console.error("Error checking admin-management access:", error);
        setIsSuperAdmin(false);
      } finally {
        setAccessChecking(false);
      }
    });

    return unsubscribe;
  }, []);

  /*
   * ============================================================
   * FIRESTORE REAL-TIME ADMIN LIST
   * ============================================================
   */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs
          .map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...snapshotDoc.data(),
          }))
          .filter(
            (user) =>
              String(user.role || "").toLowerCase() ===
              "admin"
          )
          .map((user) => ({
            ...user,
            status:
              String(user.status || "active").toLowerCase() ===
              "active"
                ? "Active"
                : "Inactive",
          }));

        setAdmins(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Error loading admin accounts:",
          error
        );

        setAdmins([]);
        setLoading(false);
        setSaveError(
          "Unable to load admin accounts."
        );
      }
    );

    return unsubscribe;
  }, []);

  /*
   * ============================================================
   * DERIVED DATA
   * ============================================================
   */

  const totalActive = admins.filter(
    (admin) => admin.status === "Active"
  ).length;

  const totalInactive = admins.filter(
    (admin) => admin.status === "Inactive"
  ).length;

  const filteredAdmins = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        !searchValue ||
        String(admin.fullName || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(admin.email || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        admin.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [admins, search, statusFilter]);

  /*
   * ============================================================
   * MODAL HANDLERS
   * ============================================================
   */

  const openAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError("");
    setShowFormModal(true);
  };

  const openEdit = (admin) => {
    setModalMode("edit");
    setEditingId(admin.id);

    setForm({
      fullName: admin.fullName || "",
      email: admin.email || "",
      password: "",
      status: admin.status || "Active",
    });

    setFormErrors({});
    setSaveError("");
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setFormErrors({});
    setSaveError("");
  };

  /*
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  const validateForm = () => {
    const errors = {};

    if (!form.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      errors.email = "Invalid email format";
    }

    if (modalMode === "add") {
      if (!form.password) {
        errors.password =
          "Password is required";
      } else if (form.password.length < 6) {
        errors.password =
          "Password must be at least 6 characters";
      }
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  /*
   * ============================================================
   * SAVE ADMIN
   * ============================================================
   */

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setSaveError("");

    try {
      if (modalMode === "add") {
        /*
         * Use a SECONDARY Firebase Auth instance.
         * This prevents the current Super Admin from
         * being logged out when creating a new account.
         */

        const secondaryAuth =
          getSecondaryAuth();

        const credential =
          await createUserWithEmailAndPassword(
            secondaryAuth,
            form.email.trim(),
            form.password
          );

          await sendEmailVerification(credential.user);

        const newUid = credential.user.uid;

        try {
          await setDoc(
            doc(db, "users", newUid),
            {
              fullName: form.fullName.trim(),
              email: form.email.trim(),
              mobileNumber: "",
              role: "admin",
              status:
                form.status === "Active"
                  ? "active"
                  : "inactive",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }
          );
        } catch (firestoreError) {
          try {
            await credential.user.delete();
          } catch (deleteError) {
            console.error(
              "Could not remove the new Firebase Auth account after Firestore failed:",
              deleteError
            );
          }
          throw firestoreError;
        } finally {
          await signOutSecondary(secondaryAuth);
        }
      } else {
        /*
         * Email editing is intentionally disabled.
         * Firebase Authentication owns the real email.
         */

        await updateDoc(
          doc(db, "users", editingId),
          {
            fullName: form.fullName.trim(),
            status:
              form.status === "Active"
                ? "active"
                : "inactive",
            updatedAt: serverTimestamp(),
          }
        );
      }

      closeFormModal();
    } catch (error) {
      console.error(
        "Error saving admin:",
        error
      );

      let message =
        "Unable to save admin account.";

      if (
        error?.code ===
        "auth/email-already-in-use"
      ) {
        message =
          "That email is already registered in Firebase Authentication.";
      } else if (
        error?.code ===
        "auth/invalid-email"
      ) {
        message = "Invalid email address.";
      } else if (
        error?.code ===
        "auth/weak-password"
      ) {
        message =
          "Password is too weak.";
      } else if (
        error?.code ===
        "permission-denied"
      ) {
        message =
          "Firestore permission denied. Check your Firebase Security Rules.";
      }

      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================================================
   * TOGGLE STATUS
   * ============================================================
   */

  const handleToggleStatus = async (admin) => {
    try {
      const nextStatus =
        admin.status === "Active"
          ? "inactive"
          : "active";

      await updateDoc(
        doc(db, "users", admin.id),
        {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        }
      );

      setConfirmToggleId(null);
    } catch (error) {
      console.error(
        "Error changing admin status:",
        error
      );

      setSaveError(
        "Unable to change admin status."
      );
    }
  };

  /*
   * ============================================================
   * REMOVE ADMIN
   * ============================================================
   */

  const handleRemove = async (id) => {
    try {
      /*
       * This removes the authorized users/{uid} record.
       * Firebase Authentication itself remains.
       *
       * Because ProtectedAdminRoute checks Firestore,
       * the removed account can no longer access
       * the admin website.
       */

      await deleteDoc(
        doc(db, "users", id)
      );

      setConfirmRemoveId(null);
    } catch (error) {
      console.error(
        "Error removing admin:",
        error
      );

      setSaveError(
        "Unable to remove admin."
      );
    }
  };

  const confirmToggleTarget =
    admins.find(
      (admin) =>
        admin.id === confirmToggleId
    );

  const confirmRemoveTarget =
    admins.find(
      (admin) =>
        admin.id === confirmRemoveId
    );

  /*
   * ============================================================
   * ACCESS GATE
   * ============================================================
   */

  if (accessChecking) {
    return null;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <AdminLayout title="Admin Management">
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck
                size={18}
                className="text-amber-500"
              />

              <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                Super Admin
              </span>
            </div>

            <p className="text-sm text-gray-500">
              Manage administrator accounts and access.
            </p>
          </div>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            <Plus size={16} />
            Add Admin
          </button>
        </div>

        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {saveError}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Admins",
              value: admins.length,
              color: "text-gray-900",
            },
            {
              label: "Active Admins",
              value: totalActive,
              color: "text-green-700",
            },
            {
              label: "Inactive Admins",
              value: totalInactive,
              color: "text-gray-500",
            },
          ].map(
            ({ label, value, color }) => (
              <div
                key={label}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-5"
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {label}
                </p>

                <p
                  className={`text-3xl font-bold ${color}`}
                >
                  {value}
                </p>
              </div>
            )
          )}
        </div>

        {/* Toolbar / Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />

              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>

            <div className="flex gap-2">
              {[
                "All",
                "Active",
                "Inactive",
              ].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setStatusFilter(status)
                  }
                  className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                    statusFilter === status
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>

                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      Loading admin accounts...
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      No admin accounts match your search.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map(
                    (admin) => (
                      <tr
                        key={admin.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-medium text-gray-900">
                          {admin.fullName ||
                            "Unnamed Admin"}
                        </td>

                        <td className="px-4 py-3.5 text-gray-600">
                          {admin.email}
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge
                            status={admin.status}
                          />
                        </td>

                        <td className="px-4 py-3.5 text-gray-500">
                          {formatDate(
                            admin.createdAt ||
                              admin.dateAdded
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">

                            <button
                              onClick={() =>
                                openEdit(admin)
                              }
                              title="Edit"
                              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              onClick={() =>
                                setConfirmToggleId(
                                  admin.id
                                )
                              }
                              title={
                                admin.status ===
                                "Active"
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              className={`p-1.5 rounded-md ${
                                admin.status ===
                                "Active"
                                  ? "text-amber-500 hover:bg-amber-50"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                            >
                              {admin.status ===
                              "Active" ? (
                                <UserX
                                  size={15}
                                />
                              ) : (
                                <UserCheck
                                  size={15}
                                />
                              )}
                            </button>

                            <button
                              onClick={() =>
                                setConfirmRemoveId(
                                  admin.id
                                )
                              }
                              title="Remove"
                              className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>

                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}

              </tbody>
            </table>
          </div>

          {!loading &&
            filteredAdmins.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                Showing {filteredAdmins.length} of{" "}
                {admins.length} admin account
                {admins.length !== 1 ? "s" : ""}
              </div>
            )}
        </div>
      </div>

      {/* ========================================================
          ADD / EDIT MODAL
      ======================================================== */}

      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {modalMode === "add"
                  ? "Add Admin"
                  : "Edit Admin"}
              </h3>

              <button
                onClick={closeFormModal}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              <div>
                <label className={labelClass}>
                  Full Name
                </label>

                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      fullName:
                        e.target.value,
                    }))
                  }
                  placeholder="e.g. Maria Santos"
                  className={inputClass}
                />

                {formErrors.fullName && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Email Address
                </label>

                <input
                  type="email"
                  value={form.email}
                  disabled={modalMode === "edit"}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      email:
                        e.target.value,
                    }))
                  }
                  placeholder="e.g. admin@mprss.com"
                  className={`${inputClass} ${
                    modalMode === "edit"
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                />

                {modalMode === "edit" && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Firebase Authentication controls this email.
                  </p>
                )}

                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {modalMode === "add" && (
                <div>
                  <label className={labelClass}>
                    Password
                  </label>

                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        password:
                          e.target.value,
                      }))
                    }
                    placeholder="Minimum 6 characters"
                    className={inputClass}
                  />

                  {formErrors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.password}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className={labelClass}>
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      status:
                        e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-xs">
                  {saveError}
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeFormModal}
                disabled={saving}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : modalMode === "add"
                  ? "Add Admin"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TOGGLE MODAL
      ======================================================== */}

      {confirmToggleId &&
        confirmToggleTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm">

              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-3">

                  <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center">
                    <AlertTriangle
                      size={18}
                      className="text-amber-500"
                    />
                  </div>

                  <h3 className="font-semibold text-gray-900">
                    {confirmToggleTarget.status ===
                    "Active"
                      ? "Deactivate Admin"
                      : "Activate Admin"}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {confirmToggleTarget.status ===
                  "Active"
                    ? `Are you sure you want to deactivate ${confirmToggleTarget.fullName}?`
                    : `Are you sure you want to activate ${confirmToggleTarget.fullName}?`}
                </p>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">

                <button
                  onClick={() =>
                    setConfirmToggleId(null)
                  }
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() =>
                    handleToggleStatus(
                      confirmToggleTarget
                    )
                  }
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    confirmToggleTarget.status ===
                    "Active"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {confirmToggleTarget.status ===
                  "Active"
                    ? "Deactivate"
                    : "Activate"}
                </button>

              </div>
            </div>
          </div>
        )}

      {/* ========================================================
          REMOVE MODAL
      ======================================================== */}

      {confirmRemoveId &&
        confirmRemoveTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm">

              <div className="px-6 py-5">

                <div className="flex items-center gap-3 mb-3">

                  <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center">
                    <Trash2
                      size={18}
                      className="text-red-500"
                    />
                  </div>

                  <h3 className="font-semibold text-gray-900">
                    Remove Admin
                  </h3>

                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <span className="font-medium text-gray-900">
                    {confirmRemoveTarget.fullName}
                  </span>
                  ?
                </p>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">

                <button
                  onClick={() =>
                    setConfirmRemoveId(null)
                  }
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() =>
                    handleRemove(
                      confirmRemoveTarget.id
                    )
                  }
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Remove
                </button>

              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}