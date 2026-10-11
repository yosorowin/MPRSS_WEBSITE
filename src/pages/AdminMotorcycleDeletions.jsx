import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  CheckCircle,
  XCircle,
  Clock,
  Bike,
  UserRoundX,
  UserRound,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";

function AdminMotorcycleDeletions() {
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [accountDeletionRequests, setAccountDeletionRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("motorcycle");

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
          requestType: "motorcycle",
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

    const unsubscribeCustomers = onSnapshot(
      collection(db, "customers"),
      (snapshot) => {
        const requests = snapshot.docs
          .map((customerDoc) => {
            const customer = customerDoc.data();
            const request = customer.accountDeletionRequest;
            if (!request || !request.status) return null;

            return {
              ...request,
              id: customerDoc.id,
              customerId: customerDoc.id,
              requestType: "account",
              customerName: customer.fullName || customer.name || "",
              customerEmail: customer.email || "",
              customerMobile: customer.mobileNumber || customer.mobile || "",
            };
          })
          .filter(Boolean);
        setAccountDeletionRequests(requests);
      },
      (error) => {
        console.error("ACCOUNT DELETION REQUESTS FIRESTORE ERROR:", error);
        setFirestoreError((current) =>
          current ? `${current}\n${error.message}` : error.message
        );
      }
    );

    return () => {
      unsubscribeDeletionRequests();
      unsubscribeMotorcycles();
      unsubscribeCustomers();
    };
  }, []);

  /*
   * ============================================================
   * FIND MOTORCYCLE
   * ============================================================
   */

  const findMotorcycleForRequest = (request) => {
    if (!request?.motorcycleId) {
      return null;
    }

    return (
      motorcycles.find(
        (motorcycle) =>
          motorcycle.id === request.motorcycleId
      ) || null
    );
  };

  /*
   * ============================================================
   * MOTORCYCLE DATA HELPERS
   * ============================================================
   */

  const getMotorcycleName = (request) => {
    if (
      request?.motorcycleBrand ||
      request?.motorcycleModel
    ) {
      return [
        request.motorcycleBrand,
        request.motorcycleModel,
      ]
        .filter(Boolean)
        .join(" ");
    }

    const motorcycle =
      findMotorcycleForRequest(request);

    if (motorcycle) {
      return [
        motorcycle.brand,
        motorcycle.model,
      ]
        .filter(Boolean)
        .join(" ");
    }

    return "Motorcycle";
  };

  const getPlate = (request) => {
    if (request?.motorcyclePlate) {
      return request.motorcyclePlate;
    }

    const motorcycle =
      findMotorcycleForRequest(request);

    return (
      motorcycle?.plate ||
      motorcycle?.plateNumber ||
      "N/A"
    );
  };

  const getCustomer = (request) => {
    return (
      request?.customerName ||
      request?.customerEmail ||
      "Unknown"
    );
  };

  /*
   * ============================================================
   * PHILIPPINE DATE AND TIME
   * ============================================================
   *
   * Firebase serverTimestamp() is stored as a Firestore
   * Timestamp. We explicitly convert it to Philippine time
   * instead of depending on the computer/browser timezone.
   */

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      return "N/A";
    }

    let date;

    if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return "N/A";
    }

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
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
    setSelectedRequest({
      ...request,
      requestType: request.requestType || "motorcycle",
    });
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  /*
   * ============================================================
   * CONFIRM APPROVAL / REJECTION
   * ============================================================
   */

  const notifyCustomerOfDeletionDecision = async (request, requestType, action) => {
    const customerId = request?.customerId || request?.userId || request?.customerUid || "";
    if (!customerId) {
      console.warn("Deletion decision saved, but no customer UID was available for notification.", request?.id);
      return;
    }

    const approved = action === "approve";
    const isAccount = requestType === "account";
    const title = isAccount
      ? `Account Deletion Request ${approved ? "Approved" : "Rejected"}`
      : `Motorcycle Deletion Request ${approved ? "Approved" : "Rejected"}`;
    const subject = isAccount
      ? "your account deletion request"
      : `the deletion request for ${request?.motorcycleName || request?.motorcycle || "your motorcycle"}`;
    const message = approved
      ? `Your ${subject} has been approved.`
      : `Your ${subject} was not approved. Please contact the admin if you need more information.`;

    try {
      await addDoc(collection(db, "notifications"), {
        customerId,
        recipientRole: "customer",
        type: isAccount ? "account_deletion_decision" : "motorcycle_deletion_decision",
        title,
        message,
        route: isAccount ? "/profile" : "/motorcycles",
        requestId: request?.id || "",
        requestType,
        status: approved ? "approved" : "rejected",
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (notificationError) {
      console.error("Deletion decision was saved, but customer notification failed:", notificationError);
    }
  };

  const handleConfirmApproval = async () => {
    if (!selectedRequest) {
      return;
    }

    try {
      if (selectedRequest.requestType === "account") {
        const customerRef = doc(
          db,
          "customers",
          selectedRequest.customerId || selectedRequest.id
        );
        const reviewDate = new Date().toLocaleDateString("en-PH", {
          timeZone: "Asia/Manila",
          year: "numeric",
          month: "numeric",
          day: "numeric",
        });

        await updateDoc(customerRef, {
          "accountDeletionRequest.status":
            approvalAction === "approve" ? "approved" : "rejected",
          "accountDeletionRequest.reviewDate": reviewDate,
          "accountDeletionRequest.reviewedAt": serverTimestamp(),
          "accountDeletionRequest.updatedAt": serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await notifyCustomerOfDeletionDecision(
          selectedRequest,
          "account",
          approvalAction
        );

        setShowApprovalModal(false);
        setSelectedRequest(null);
        return;
      }

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
          reviewDate: new Date()
            .toLocaleDateString("en-PH", {
              timeZone: "Asia/Manila",
              year: "numeric",
              month: "numeric",
              day: "numeric",
            }),
          reviewedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await batch.commit();

        await notifyCustomerOfDeletionDecision(
          selectedRequest,
          "motorcycle",
          "reject"
        );

        setShowApprovalModal(false);
        setSelectedRequest(null);

        return;
      }

      /*
       * ========================================================
       * APPROVE
       * ========================================================
       *
       * 1. Mark deletion request as approved.
       * 2. Delete the exact motorcycle referenced by motorcycleId.
       */

      const batch = writeBatch(db);

      batch.update(requestRef, {
        status: "approved",
        reviewDate: new Date()
          .toLocaleDateString("en-PH", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "numeric",
            day: "numeric",
          }),
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      /*
       * Delete the exact motorcycle from the request.
       */

      if (selectedRequest.motorcycleId) {
        const motorcycleRef = doc(
          db,
          "motorcycles",
          selectedRequest.motorcycleId
        );

        batch.delete(motorcycleRef);
      } else {
        console.warn(
          "Deletion request does not contain motorcycleId:",
          selectedRequest
        );
      }

      await batch.commit();

      await notifyCustomerOfDeletionDecision(
        selectedRequest,
        "motorcycle",
        "approve"
      );

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
      (request) =>
        String(request.status || "").toLowerCase() ===
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
    <AdminLayout title="Deletion Requests">
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        <button type="button" onClick={() => setActiveTab("motorcycle")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "motorcycle" ? "border-[#0a0f1a] text-[#0a0f1a]" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          <span className="inline-flex items-center gap-2"><Bike size={16} /> Motorcycle Deletion
            <span className={`rounded-full px-2 py-0.5 text-xs ${deletionRequests.filter((item) => String(item.status || "").toLowerCase() === "pending").length ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
              {deletionRequests.filter((item) => String(item.status || "").toLowerCase() === "pending").length}
            </span>
          </span>
        </button>
        <button type="button" onClick={() => setActiveTab("account")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "account" ? "border-[#0a0f1a] text-[#0a0f1a]" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          <span className="inline-flex items-center gap-2"><UserRoundX size={16} /> Account Deletion
            <span className={`rounded-full px-2 py-0.5 text-xs ${accountDeletionRequests.filter((item) => String(item.status || "").toLowerCase() === "pending").length ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
              {accountDeletionRequests.filter((item) => String(item.status || "").toLowerCase() === "pending").length}
            </span>
          </span>
        </button>
      </div>

      {activeTab === "motorcycle" && (
        <>


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
                        {getMotorcycleName(request)}
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Plate:{" "}
                        {getPlate(request)}
                        {" · "}
                        Customer:{" "}
                        {getCustomer(request)}
                      </p>

                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Requested:{" "}
                        {formatTimestamp(
                          request.requestedAt
                        )}
                      </p>

                    </div>
                  </div>

                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full shrink-0">
                    Pending
                  </span>

                </div>

                {/* MOTORCYCLE DETAILS */}

                <div className="bg-gray-50 rounded-lg px-4 py-3 mb-3">

                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    Motorcycle Details
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                    <div>
                      <p className="text-[10px] text-gray-400">
                        Brand
                      </p>

                      <p className="text-sm text-gray-700">
                        {request.motorcycleBrand ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400">
                        Model
                      </p>

                      <p className="text-sm text-gray-700">
                        {request.motorcycleModel ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400">
                        Year
                      </p>

                      <p className="text-sm text-gray-700">
                        {request.motorcycleYear ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400">
                        Color
                      </p>

                      <p className="text-sm text-gray-700">
                        {request.motorcycleColor ||
                          "N/A"}
                      </p>
                    </div>

                  </div>
                </div>

                {/* REASON */}

                <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">

                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                    Reason for Deletion
                  </p>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {request.reason ||
                      "No reason provided."}
                  </p>

                </div>

                {/* ACTIONS */}

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
                        {getMotorcycleName(request)}
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {getPlate(request)}
                        {" · "}
                        {getCustomer(request)}
                      </p>

                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Requested{" "}
                        {formatTimestamp(
                          request.requestedAt
                        )}

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
        selectedRequest &&
        selectedRequest.requestType !== "account" && (
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
                  {getMotorcycleName(
                    selectedRequest
                  )}
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  Plate:{" "}
                  {getPlate(selectedRequest)}
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  Customer:{" "}
                  {getCustomer(selectedRequest)}
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


        </>
      )}

      {activeTab === "account" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0a0f1a] text-white rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Pending Approval</p>
              <p className="text-4xl font-bold mt-2">{accountDeletionRequests.filter((item) => String(item.status || "").toLowerCase() === "pending").length}</p>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Approved</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{accountDeletionRequests.filter((item) => String(item.status || "").toLowerCase() === "approved").length}</p>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Rejected</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{accountDeletionRequests.filter((item) => String(item.status || "").toLowerCase() === "rejected").length}</p>
            </div>
          </div>

          {firestoreError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm"><strong>Firestore Error:</strong> {firestoreError}</div>}

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-500">Loading account deletion requests...</div>
          ) : accountDeletionRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
              <UserRound size={30} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-900">No account deletion requests</h3>
              <p className="text-sm text-gray-500 mt-1">Account deletion requests submitted by customers will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accountDeletionRequests.slice().sort((a, b) => {
                const time = (value) => value?.toDate ? value.toDate().getTime() : 0;
                return time(b.requestedAt) - time(a.requestedAt);
              }).map((request) => {
                const status = String(request.status || "pending").toLowerCase();
                const pending = status === "pending";
                return (
                  <div key={request.customerId || request.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><UserRoundX size={17} className="text-gray-600" /></div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900">{request.customerName || "Customer"}</h3>
                          <p className="text-sm text-gray-500 break-all">{request.customerEmail || "No email available"}</p>
                          {request.customerMobile ? <p className="text-xs text-gray-500 mt-1">{request.customerMobile}</p> : null}
                          <p className="text-xs text-gray-400 mt-1">Requested {formatTimestamp(request.requestedAt)}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${pending ? "bg-amber-100 text-amber-800" : status === "approved" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 mt-4">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Reason for Account Deletion</p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{request.reason || "No reason provided."}</p>
                    </div>
                    {pending && (
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleApprovalClick({ ...request, requestType: "account" }, "approve")} className="flex items-center gap-1.5 px-4 py-2 bg-[#0a0f1a] text-white rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors"><CheckCircle size={14} /> Approve</button>
                        <button onClick={() => handleApprovalClick({ ...request, requestType: "account" }, "reject")} className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"><XCircle size={14} /> Reject</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showApprovalModal && selectedRequest?.requestType === "account" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{approvalAction === "approve" ? "Approve" : "Reject"} Account Deletion Request</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Customer</p>
              <p className="font-medium text-sm text-gray-900">{selectedRequest.customerName || "Customer"}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedRequest.customerEmail || "No email available"}</p>
            </div>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {approvalAction === "approve" ? "This marks the account deletion request as approved. It does not delete the Firebase Authentication account; that requires a trusted server-side admin process." : "This will reject the request and leave the customer's account active."}
            </p>
            <div className="flex gap-3">
              <button onClick={handleConfirmApproval} className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${approvalAction === "approve" ? "bg-[#0a0f1a] hover:bg-[#1e293b]" : "bg-gray-700 hover:bg-gray-800"}`}>Confirm {approvalAction === "approve" ? "Approval" : "Rejection"}</button>
              <button onClick={() => { setShowApprovalModal(false); setSelectedRequest(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminMotorcycleDeletions;