import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  CheckCircle,
  XCircle,
  Clock,
  Bike,
} from "lucide-react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";

function AdminMotorcycleDeletions() {
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] =
    useState(false);
  const [approvalAction, setApprovalAction] =
    useState("approve");

  /*
   * ============================================================
   * FIRESTORE REAL-TIME DATA
   * ============================================================
   */

  useEffect(() => {
    const unsubscribeDeletionRequests = onSnapshot(
      collection(db, "motorcycleDeletionRequests"),
      (snapshot) => {
        const data = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
        }));

        setDeletionRequests(data);
        setLoading(false);
        setFirestoreError("");
      },
      (error) => {
        console.error(
          "DELETION REQUESTS FIRESTORE ERROR:",
          error
        );

        setDeletionRequests([]);
        setLoading(false);
        setFirestoreError(error.message);
      }
    );

    const unsubscribeMotorcycles = onSnapshot(
      collection(db, "motorcycles"),
      (snapshot) => {
        const data = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
        }));

        setMotorcycles(data);
      },
      (error) => {
        console.error(
          "MOTORCYCLES FIRESTORE ERROR:",
          error
        );
      }
    );

    return () => {
      unsubscribeDeletionRequests();
      unsubscribeMotorcycles();
    };
  }, []);

  /*
   * ============================================================
   * HELPER FUNCTIONS
   * ============================================================
   */

  const getCustomerIdFromRequest = (request) => {
    return (
      request.customerId ||
      request.userId ||
      request.userUid ||
      request.customerUid ||
      ""
    );
  };

  const getCustomerEmailFromRequest = (request) => {
    return (
      request.customerEmail ||
      request.userEmail ||
      ""
    );
  };

  /*
   * ============================================================
   * FIND MOTORCYCLE TO DELETE
   * ============================================================
   */

  const findMotorcycleForRequest = (request) => {
    if (!request) {
      return null;
    }

    /*
     * BEST CASE:
     * The deletion request already contains motorcycleId.
     */
    if (request.motorcycleId) {
      const byId = motorcycles.find(
        (motorcycle) =>
          motorcycle.id === request.motorcycleId
      );

      if (byId) {
        return byId;
      }
    }

    const requestCustomerId =
      getCustomerIdFromRequest(request);

    const requestCustomerEmail =
      getCustomerEmailFromRequest(request);

    const requestPlate = String(
      request.plate || ""
    )
      .trim()
      .toLowerCase();

    /*
     * Try to find by plate + customer.
     */
    const matchingMotorcycle =
      motorcycles.find((motorcycle) => {
        const motorcyclePlate = String(
          motorcycle.plateNumber ||
            motorcycle.plate ||
            ""
        )
          .trim()
          .toLowerCase();

        if (
          requestPlate &&
          motorcyclePlate !== requestPlate
        ) {
          return false;
        }

        const motorcycleCustomerId =
          motorcycle.customerId ||
          motorcycle.userId ||
          motorcycle.ownerId ||
          motorcycle.userUid ||
          motorcycle.customerUid ||
          "";

        const motorcycleCustomerEmail =
          motorcycle.customerEmail ||
          motorcycle.email ||
          "";

        if (requestCustomerId) {
          return (
            motorcycleCustomerId ===
            requestCustomerId
          );
        }

        if (requestCustomerEmail) {
          return (
            String(
              motorcycleCustomerEmail
            ).toLowerCase() ===
            String(
              requestCustomerEmail
            ).toLowerCase()
          );
        }

        return true;
      });

    if (matchingMotorcycle) {
      return matchingMotorcycle;
    }

    /*
     * Final fallback:
     * match motorcycle name/model + plate.
     */
    const requestMotorcycleName = String(
      request.motorcycle ||
        request.motorcycleName ||
        ""
    )
      .trim()
      .toLowerCase();

    return (
      motorcycles.find((motorcycle) => {
        const motorcycleName = String(
          motorcycle.name ||
            motorcycle.motorcycleName ||
            `${motorcycle.brand || ""} ${
              motorcycle.model || ""
            }`.trim()
        )
          .trim()
          .toLowerCase();

        const motorcyclePlate = String(
          motorcycle.plateNumber ||
            motorcycle.plate ||
            ""
        )
          .trim()
          .toLowerCase();

        return (
          requestMotorcycleName &&
          motorcycleName === requestMotorcycleName &&
          (!requestPlate ||
            motorcyclePlate === requestPlate)
        );
      }) || null
    );
  };

  /*
   * ============================================================
   * APPROVAL CLICK
   * ============================================================
   */

  const handleApprovalClick = (
    request,
    action
  ) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  /*
   * ============================================================
   * CONFIRM APPROVAL / REJECTION
   * ============================================================
   */

  const handleConfirmApproval = async () => {
    if (!selectedRequest) {
      return;
    }

    try {
      const requestRef = doc(
        db,
        "motorcycleDeletionRequests",
        selectedRequest.id
      );

      /*
       * ========================================================
       * REJECT
       * ========================================================
       */

      if (approvalAction === "reject") {
        const batch = writeBatch(db);

        batch.update(requestRef, {
          status: "rejected",
          reviewDate:
            new Date()
              .toISOString()
              .split("T")[0],
          reviewedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await batch.commit();

        setShowApprovalModal(false);
        setSelectedRequest(null);

        return;
      }

      /*
       * ========================================================
       * APPROVE
       * ========================================================
       *
       * Approval means:
       * 1. Mark deletion request as approved.
       * 2. Remove motorcycle from motorcycles collection.
       */

      const motorcycleToDelete =
        findMotorcycleForRequest(
          selectedRequest
        );

      const batch = writeBatch(db);

      /*
       * Update deletion request.
       */
      batch.update(requestRef, {
        status: "approved",
        reviewDate:
          new Date()
            .toISOString()
            .split("T")[0],
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      /*
       * Delete motorcycle if found.
       */
      if (motorcycleToDelete) {
        const motorcycleRef = doc(
          db,
          "motorcycles",
          motorcycleToDelete.id
        );

        batch.delete(motorcycleRef);
      } else {
        console.warn(
          "No matching motorcycle found for deletion request:",
          selectedRequest
        );
      }

      await batch.commit();

      setShowApprovalModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error(
        "Error processing motorcycle deletion request:",
        error
      );

      alert(
        "Failed to process the deletion request. Check the browser console for details."
      );
    }
  };

  /*
   * ============================================================
   * DERIVED DATA
   * ============================================================
   */

  const pendingRequests =
    deletionRequests.filter(
      (req) =>
        String(req.status || "").toLowerCase() ===
        "pending"
    );

  const approvedCount =
    deletionRequests.filter(
      (request) =>
        String(request.status || "").toLowerCase() ===
        "approved"
    ).length;

  const rejectedCount =
    deletionRequests.filter(
      (request) =>
        String(request.status || "").toLowerCase() ===
        "rejected"
    ).length;

  const reviewedRequests =
    deletionRequests.filter(
      (request) =>
        String(request.status || "").toLowerCase() !==
        "pending"
    );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <AdminLayout title="Motorcycle Deletion Requests">

      {/* ======================================================
          FIRESTORE ERROR
      ======================================================= */}

      {firestoreError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          <strong>Firestore Error:</strong>{" "}
          {firestoreError}
        </div>
      )}

      {/* ======================================================
          LOADING
      ======================================================= */}

      {loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 text-sm text-gray-500">
          Loading deletion requests...
        </div>
      )}

      {/* ======================================================
          STATUS OVERVIEW
      ======================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Pending */}
        <div
          className={`lg:col-span-2 rounded-xl p-6 flex items-end justify-between ${
            pendingRequests.length > 0
              ? "bg-[#0a0f1a] text-white"
              : "bg-white border border-gray-100 shadow-sm"
          }`}
        >
          <div>

            <p
              className={`text-[10px] tracking-[0.15em] uppercase mb-3 font-semibold ${
                pendingRequests.length > 0
                  ? "text-slate-400"
                  : "text-gray-400"
              }`}
            >
              Pending Approval
            </p>

            <p
              className={`text-5xl font-bold leading-none mb-1.5 ${
                pendingRequests.length > 0
                  ? "text-white"
                  : "text-gray-900"
              }`}
            >
              {pendingRequests.length}
            </p>

            <p
              className={`text-sm ${
                pendingRequests.length > 0
                  ? "text-slate-400"
                  : "text-gray-400"
              }`}
            >
              {pendingRequests.length === 0
                ? "No pending requests"
                : pendingRequests.length === 1
                ? "Request awaiting your decision"
                : "Requests awaiting your decision"}
            </p>

          </div>

          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              pendingRequests.length > 0
                ? "bg-white/10"
                : "bg-gray-100"
            }`}
          >
            <Bike
              size={20}
              className={
                pendingRequests.length > 0
                  ? "text-white"
                  : "text-gray-400"
              }
            />
          </div>
        </div>

        {/* Reviewed counts */}
        <div className="flex flex-col gap-3">

          {/* Approved */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">

            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Approved
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {approvedCount}
              </p>
            </div>

            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle
                size={14}
                className="text-gray-500"
              />
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">

            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Rejected
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {rejectedCount}
              </p>
            </div>

            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle
                size={14}
                className="text-gray-500"
              />
            </div>

          </div>
        </div>
      </div>

      {/* ======================================================
          PENDING REQUESTS
      ======================================================= */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-5">

        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">

          <Clock
            size={15}
            className="text-gray-500"
          />

          <h3 className="text-sm font-semibold text-gray-800">
            Pending Requests
          </h3>

          {pendingRequests.length > 0 && (
            <span className="ml-auto text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">
              {pendingRequests.length}
            </span>
          )}

        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-12">

            <CheckCircle
              size={32}
              className="text-gray-200 mx-auto mb-2"
            />

            <p className="text-sm text-gray-400">
              No pending deletion requests
            </p>

          </div>
        ) : (
          <div className="divide-y divide-gray-50">

            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="p-5"
              >

                <div className="flex items-start justify-between gap-4 mb-3">

                  <div className="flex items-start gap-3 flex-1 min-w-0">

                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Bike
                        size={16}
                        className="text-gray-600"
                      />
                    </div>

                    <div className="min-w-0">

                      <p className="font-semibold text-sm text-gray-900">
                        {request.motorcycle ||
                          request.motorcycleName ||
                          "Motorcycle"}
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Plate:{" "}
                        {request.plate ||
                          request.plateNumber ||
                          "N/A"}{" "}
                        · Customer:{" "}
                        {request.customerName ||
                          "Unknown"}
                      </p>

                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Requested:{" "}
                        {request.requestDate ||
                          request.createdDate ||
                          "N/A"}
                      </p>

                    </div>
                  </div>

                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full shrink-0">
                    Pending
                  </span>

                </div>

                <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">

                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                    Reason for Deletion
                  </p>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {request.reason ||
                      "No reason provided."}
                  </p>

                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      handleApprovalClick(
                        request,
                        "approve"
                      )
                    }
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0a0f1a] text-white rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors"
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      handleApprovalClick(
                        request,
                        "reject"
                      )
                    }
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}

      </div>

      {/* ======================================================
          REVIEWED REQUESTS
      ======================================================= */}

      {reviewedRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">
              Reviewed Requests
            </h3>
          </div>

          <div className="divide-y divide-gray-50">

            {reviewedRequests.map((request) => {

              const status =
                String(
                  request.status || ""
                ).toLowerCase();

              return (
                <div
                  key={request.id}
                  className="px-5 py-4 flex items-start justify-between gap-3"
                >

                  <div className="flex items-start gap-3 flex-1 min-w-0">

                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">

                      <Bike
                        size={14}
                        className="text-gray-500"
                      />

                    </div>

                    <div className="min-w-0">

                      <p className="font-medium text-sm text-gray-900">
                        {request.motorcycle ||
                          request.motorcycleName ||
                          "Motorcycle"}
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {request.plate ||
                          request.plateNumber ||
                          "N/A"}{" "}
                        ·{" "}
                        {request.customerName ||
                          "Unknown"}
                      </p>

                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Requested{" "}
                        {request.requestDate ||
                          request.createdDate ||
                          "N/A"}

                        {request.reviewDate
                          ? ` · Reviewed ${request.reviewDate}`
                          : ""}
                      </p>

                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-semibold shrink-0 ${
                      status === "approved"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {status === "approved"
                      ? "Approved"
                      : "Rejected"}
                  </span>

                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* ======================================================
          CONFIRMATION MODAL
      ======================================================= */}

      {showApprovalModal &&
        selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">

              <h3 className="text-base font-semibold text-gray-900 mb-4">
                {approvalAction === "approve"
                  ? "Approve"
                  : "Reject"}{" "}
                Deletion Request
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">

                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">
                  Motorcycle
                </p>

                <p className="font-medium text-sm text-gray-900">
                  {selectedRequest.motorcycle ||
                    selectedRequest.motorcycleName ||
                    "Motorcycle"}
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  Customer:{" "}
                  {selectedRequest.customerName ||
                    "Unknown"}
                </p>

              </div>

              <p className="text-sm text-gray-600 mb-5 leading-relaxed">

                {approvalAction === "approve"
                  ? "This will permanently remove the motorcycle from the customer's account."
                  : "The motorcycle will remain in the customer's account."}

              </p>

              <div className="flex gap-3">

                <button
                  onClick={
                    handleConfirmApproval
                  }
                  className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
                    approvalAction === "approve"
                      ? "bg-[#0a0f1a] hover:bg-[#1e293b]"
                      : "bg-gray-700 hover:bg-gray-800"
                  }`}
                >
                  Confirm{" "}
                  {approvalAction === "approve"
                    ? "Approval"
                    : "Rejection"}
                </button>

                <button
                  onClick={() => {
                    setShowApprovalModal(
                      false
                    );
                    setSelectedRequest(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>

              </div>
            </div>
          </div>
        )}

    </AdminLayout>
  );
}

export default AdminMotorcycleDeletions;