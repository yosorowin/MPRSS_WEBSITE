import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

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
  Filter,
} from "lucide-react";

import { db } from "../firebase";

const POSITIONS = [
  "Mechanic",
  "Service Advisor",
  "Parts Specialist",
  "Cashier",
  "Shop Supervisor",
  "Detailer",
];

const EMPTY_FORM = {
  name: "",
  position: "Mechanic",
  status: "Active",
};

const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white";

const labelClass =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

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

function PositionBadge({ position }) {
  const colors = {
    Mechanic:
      "bg-blue-50 text-blue-700 border-blue-100",

    "Service Advisor":
      "bg-purple-50 text-purple-700 border-purple-100",

    "Parts Specialist":
      "bg-amber-50 text-amber-700 border-amber-100",

    Cashier:
      "bg-teal-50 text-teal-700 border-teal-100",

    "Shop Supervisor":
      "bg-gray-900 text-white border-gray-800",

    Detailer:
      "bg-pink-50 text-pink-700 border-pink-100",
  };

  const className =
    colors[position] ||
    "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {position}
    </span>
  );
}

export default function AdminStaffManagement() {
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [positionFilter, setPositionFilter] =
    useState("All");

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
   * FIRESTORE REAL-TIME STAFF
   * ============================================================
   */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "staff"),
      (snapshot) => {
        const data =
          snapshot.docs.map(
            (snapshotDoc) => {
              const item =
                snapshotDoc.data();

              return {
                id: snapshotDoc.id,
                ...item,
                status:
                  String(
                    item.status || "active"
                  ).toLowerCase() ===
                  "active"
                    ? "Active"
                    : "Inactive",
              };
            }
          );

        setStaff(data);
        setLoading(false);
        setError("");
      },
      (firebaseError) => {
        console.error(
          "Error loading staff:",
          firebaseError
        );

        setStaff([]);
        setLoading(false);

        setError(
          "Unable to load staff from Firestore."
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

  const totalActive = staff.filter(
    (member) =>
      member.status === "Active"
  ).length;

  const totalInactive = staff.filter(
    (member) =>
      member.status === "Inactive"
  ).length;

  const allPositions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          staff
            .map((member) =>
              member.position
            )
            .filter(Boolean)
        )
      ),
    ],
    [staff]
  );

  const filteredStaff = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return staff.filter((member) => {
      const matchesSearch =
        !searchValue ||
        String(member.name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(member.position || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesPosition =
        positionFilter === "All" ||
        member.position ===
          positionFilter;

      const matchesStatus =
        statusFilter === "All" ||
        member.status ===
          statusFilter;

      return (
        matchesSearch &&
        matchesPosition &&
        matchesStatus
      );
    });
  }, [
    staff,
    search,
    positionFilter,
    statusFilter,
  ]);

  /*
   * ============================================================
   * FORM
   * ============================================================
   */

  const openAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setError("");
    setShowFormModal(true);
  };

  const openEdit = (member) => {
    setModalMode("edit");
    setEditingId(member.id);

    setForm({
      name: member.name || "",
      position:
        member.position ||
        "Mechanic",
      status:
        member.status ||
        "Active",
    });

    setFormErrors({});
    setError("");
    setShowFormModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name =
        "Name is required";
    }

    if (!form.position) {
      errors.position =
        "Position is required";
    }

    setFormErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  };

  /*
   * ============================================================
   * SAVE STAFF
   * ============================================================
   */

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError("");

    try {
      if (modalMode === "add") {
        await addDoc(
          collection(db, "staff"),
          {
            name: form.name.trim(),

            position:
              form.position,

            status:
              form.status === "Active"
                ? "active"
                : "inactive",

            available:
              form.status ===
              "Active",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      } else {
        await updateDoc(
          doc(db, "staff", editingId),
          {
            name: form.name.trim(),

            position:
              form.position,

            status:
              form.status === "Active"
                ? "active"
                : "inactive",

            available:
              form.status ===
              "Active",

            updatedAt:
              serverTimestamp(),
          }
        );
      }

      closeModal();
    } catch (firebaseError) {
      console.error(
        "Error saving staff:",
        firebaseError
      );

      setError(
        firebaseError?.code ===
          "permission-denied"
          ? "Firestore permission denied. Check your Firebase Security Rules."
          : "Unable to save staff member."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================================================
   * TOGGLE STATUS
   * ============================================================
   */

  const handleToggleStatus =
    async (member) => {
      try {
        const nextStatus =
          member.status ===
          "Active"
            ? "inactive"
            : "active";

        await updateDoc(
          doc(db, "staff", member.id),
          {
            status: nextStatus,

            available:
              nextStatus ===
              "active",

            updatedAt:
              serverTimestamp(),
          }
        );

        setConfirmToggleId(null);
      } catch (firebaseError) {
        console.error(
          "Error updating staff status:",
          firebaseError
        );

        setError(
          "Unable to change staff status."
        );
      }
    };

  /*
   * ============================================================
   * REMOVE STAFF
   * ============================================================
   */

  const handleRemove =
    async (id) => {
      try {
        await deleteDoc(
          doc(db, "staff", id)
        );

        setConfirmRemoveId(null);
      } catch (firebaseError) {
        console.error(
          "Error removing staff:",
          firebaseError
        );

        setError(
          "Unable to remove staff member."
        );
      }
    };

  const confirmToggleTarget =
    staff.find(
      (member) =>
        member.id ===
        confirmToggleId
    );

  const confirmRemoveTarget =
    staff.find(
      (member) =>
        member.id ===
        confirmRemoveId
    );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <AdminLayout title="Staff Management">
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
              Manage mechanics and shop personnel.
            </p>

          </div>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700"
          >
            <Plus size={16} />
            Add Staff
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {[
            {
              label: "Total Staff",
              value: staff.length,
              color:
                "text-gray-900",
            },
            {
              label: "Active Staff",
              value: totalActive,
              color:
                "text-green-700",
            },
            {
              label: "Inactive Staff",
              value: totalInactive,
              color:
                "text-gray-500",
            },
          ].map(
            ({
              label,
              value,
              color,
            }) => (
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

        {/* Toolbar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

          <div className="p-4 flex flex-col lg:flex-row gap-3">

            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />

              <input
                type="text"
                placeholder="Search by name or position..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter
                size={14}
                className="text-gray-400"
              />

              <select
                value={positionFilter}
                onChange={(e) =>
                  setPositionFilter(
                    e.target.value
                  )
                }
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
              >
                {allPositions.map(
                  (position) => (
                    <option
                      key={position}
                      value={position}
                    >
                      {position}
                    </option>
                  )
                )}
              </select>
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
                  className={`px-3 py-2 text-xs font-medium rounded-md border ${
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

          {/* Table */}
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Position
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
                      Loading staff...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      No staff members match your search.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(
                    (member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-gray-50 transition-colors"
                      >

                        <td className="px-4 py-3.5 font-medium text-gray-900">
                          {member.name}
                        </td>

                        <td className="px-4 py-3.5">
                          <PositionBadge
                            position={
                              member.position
                            }
                          />
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge
                            status={
                              member.status
                            }
                          />
                        </td>

                        <td className="px-4 py-3.5 text-gray-500">
                          {formatDate(
                            member.createdAt ||
                              member.dateAdded
                          )}
                        </td>

                        <td className="px-4 py-3.5">

                          <div className="flex items-center justify-end gap-1">

                            <button
                              onClick={() =>
                                openEdit(
                                  member
                                )
                              }
                              title="Edit"
                              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              onClick={() =>
                                setConfirmToggleId(
                                  member.id
                                )
                              }
                              title={
                                member.status ===
                                "Active"
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              className={`p-1.5 rounded-md ${
                                member.status ===
                                "Active"
                                  ? "text-amber-500 hover:bg-amber-50"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                            >
                              {member.status ===
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
                                  member.id
                                )
                              }
                              title="Remove"
                              className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2
                                size={15}
                              />
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
            filteredStaff.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                Showing {filteredStaff.length} of{" "}
                {staff.length} staff member
                {staff.length !== 1
                  ? "s"
                  : ""}
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
                  ? "Add Staff Member"
                  : "Edit Staff Member"}
              </h3>

              <button
                onClick={closeModal}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>

            </div>

            <div className="px-6 py-5 space-y-4">

              <div>
                <label className={labelClass}>
                  Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      name:
                        e.target.value,
                    }))
                  }
                  placeholder="e.g. Juan Dela Cruz"
                  className={inputClass}
                />

                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Position
                </label>

                <select
                  value={form.position}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      position:
                        e.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  {POSITIONS.map(
                    (position) => (
                      <option
                        key={position}
                        value={position}
                      >
                        {position}
                      </option>
                    )
                  )}
                </select>
              </div>

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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-xs">
                  {error}
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">

              <button
                onClick={closeModal}
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
                  ? "Add Staff"
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
                      ? "Deactivate Staff"
                      : "Activate Staff"}
                  </h3>

                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {confirmToggleTarget.status ===
                  "Active"
                    ? `Are you sure you want to deactivate ${confirmToggleTarget.name}?`
                    : `Are you sure you want to activate ${confirmToggleTarget.name}?`}
                </p>

              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">

                <button
                  onClick={() =>
                    setConfirmToggleId(
                      null
                    )
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
                    Remove Staff Member
                  </h3>

                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <span className="font-medium text-gray-900">
                    {confirmRemoveTarget.name}
                  </span>
                  ?
                </p>

              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">

                <button
                  onClick={() =>
                    setConfirmRemoveId(
                      null
                    )
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