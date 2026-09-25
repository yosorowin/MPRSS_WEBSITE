import { useState } from 'react';
import AdminLayout from "./AdminLayout";
import { CheckCircle, XCircle, Clock, Bike } from "lucide-react";

const sampleDeletionRequests = [
  {
    id: 'del-001',
    customerName: 'Ramon Villanueva',
    motorcycle: 'Honda Click 125i',
    plate: 'NCR-4821',
    requestDate: '2026-07-28',
    reason: 'Motorcycle was sold to a private buyer. New owner will register it under their name. I no longer have possession of the unit.',
    status: 'pending'
  },
  {
    id: 'del-002',
    customerName: 'Sheila Mae Aquino',
    motorcycle: 'Yamaha NMAX 155',
    plate: 'CAR-7743',
    requestDate: '2026-07-15',
    reviewDate: '2026-07-17',
    reason: 'Unit was stolen last month. Already filed a police report (Blotter No. 2026-07-0041). Requesting removal from my account as I am no longer the owner.',
    status: 'approved'
  },
  {
    id: 'del-003',
    customerName: 'Jose Miguel Reyes',
    motorcycle: 'Kawasaki Barako II 175',
    plate: 'IVB-3301',
    requestDate: '2026-07-10',
    reviewDate: '2026-07-12',
    reason: 'Motorcycle is totaled after an accident. Already declared a total loss by insurance. No longer roadworthy.',
    status: 'rejected'
  },
  {
    id: 'del-004',
    customerName: 'Kristine Bautista',
    motorcycle: 'Suzuki Raider R150',
    plate: 'NCR-9954',
    requestDate: '2026-08-01',
    reason: 'I am migrating abroad and permanently leaving the Philippines. The motorcycle has been transferred to a family member who will register it separately.',
    status: 'pending'
  },
  {
    id: 'del-005',
    customerName: 'Andrei Lim',
    motorcycle: 'Honda ADV 160',
    plate: 'ROP-1120',
    requestDate: '2026-06-30',
    reviewDate: '2026-07-02',
    reason: 'Duplicate entry — this motorcycle was accidentally registered twice under my account. Please remove the duplicate.',
    status: 'approved'
  }
];

function AdminMotorcycleDeletions() {
  const [deletionRequests, setDeletionRequests] = useState(() => {
    const saved = localStorage.getItem('motorcycle_deletion_requests');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
    }
    localStorage.setItem('motorcycle_deletion_requests', JSON.stringify(sampleDeletionRequests));
    return sampleDeletionRequests;
  });

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve');

  const handleApprovalClick = (request, action) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedRequest) return;
    const updatedRequests = deletionRequests.map((req) =>
      req.id === selectedRequest.id
        ? { ...req, status: approvalAction === 'approve' ? 'approved' : 'rejected', reviewDate: new Date().toISOString().split('T')[0] }
        : req
    );
    setDeletionRequests(updatedRequests);
    localStorage.setItem('motorcycle_deletion_requests', JSON.stringify(updatedRequests));
    setShowApprovalModal(false);
    setSelectedRequest(null);
  };

  const pendingRequests = deletionRequests.filter((req) => req.status === 'pending');
  const approvedCount = deletionRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = deletionRequests.filter((r) => r.status === 'rejected').length;
  const reviewedRequests = deletionRequests.filter((req) => req.status !== 'pending');

  return (
    <AdminLayout title="Motorcycle Deletion Requests">

      {/* ── STATUS OVERVIEW ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Featured: Pending — primary actionable */}
        <div className={`lg:col-span-2 rounded-xl p-6 flex items-end justify-between ${
          pendingRequests.length > 0
            ? 'bg-[#0a0f1a] text-white'
            : 'bg-white border border-gray-100 shadow-sm'
        }`}>
          <div>
            <p className={`text-[10px] tracking-[0.15em] uppercase mb-3 font-semibold ${
              pendingRequests.length > 0 ? 'text-slate-400' : 'text-gray-400'
            }`}>
              Pending Approval
            </p>
            <p className={`text-5xl font-bold leading-none mb-1.5 ${
              pendingRequests.length > 0 ? 'text-white' : 'text-gray-900'
            }`}>
              {pendingRequests.length}
            </p>
            <p className={`text-sm ${pendingRequests.length > 0 ? 'text-slate-400' : 'text-gray-400'}`}>
              {pendingRequests.length === 0
                ? 'No pending requests'
                : pendingRequests.length === 1
                ? 'Request awaiting your decision'
                : 'Requests awaiting your decision'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            pendingRequests.length > 0 ? 'bg-white/10' : 'bg-gray-100'
          }`}>
            <Bike size={20} className={pendingRequests.length > 0 ? 'text-white' : 'text-gray-400'} />
          </div>
        </div>

        {/* Reviewed counts */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={14} className="text-gray-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle size={14} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── PENDING REQUESTS ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-5">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <Clock size={15} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Pending Requests</h3>
          {pendingRequests.length > 0 && (
            <span className="ml-auto text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">
              {pendingRequests.length}
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No pending deletion requests</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Bike size={16} className="text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{request.motorcycle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Plate: {request.plate} · Customer: {request.customerName}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Requested: {request.requestDate}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full shrink-0">
                    Pending
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Reason for Deletion</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{request.reason}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprovalClick(request, 'approve')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0a0f1a] text-white rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors"
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprovalClick(request, 'reject')}
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

      {/* ── REVIEWED REQUESTS ───────────────────────────────────────────── */}
      {reviewedRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Reviewed Requests</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {reviewedRequests.map((request) => (
              <div key={request.id} className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Bike size={14} className="text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900">{request.motorcycle}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {request.plate} · {request.customerName}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Requested {request.requestDate}
                      {request.reviewDate ? ` · Reviewed ${request.reviewDate}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold shrink-0 ${
                  request.status === 'approved'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {request.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL ──────────────────────────────────────────── */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Deletion Request
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Motorcycle</p>
              <p className="font-medium text-sm text-gray-900">{selectedRequest.motorcycle}</p>
              <p className="text-xs text-gray-500 mt-0.5">Customer: {selectedRequest.customerName}</p>
            </div>

            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {approvalAction === 'approve'
                ? "This will permanently remove the motorcycle from the customer's account."
                : "The motorcycle will remain in the customer's account."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmApproval}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
                  approvalAction === 'approve'
                    ? 'bg-[#0a0f1a] hover:bg-[#1e293b]'
                    : 'bg-gray-700 hover:bg-gray-800'
                }`}
              >
                Confirm {approvalAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
              <button
                onClick={() => { setShowApprovalModal(false); setSelectedRequest(null); }}
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
