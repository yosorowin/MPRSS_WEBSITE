import { useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { mockAISafetyAlerts } from "./mockData";

export default function AdminAISafety() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSendAlert = () => {
    console.log(
      "Sending alert message:",
      alertMessage,
      "to:",
      selectedAlert?.customerName
    );

    setSelectedAlert(null);
    setAlertMessage("");
    setShowSuccessToast(true);

    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const statusCounts = {
    New: mockAISafetyAlerts.filter((a) => a.status === "New").length,
    "Under Review": mockAISafetyAlerts.filter(
      (a) => a.status === "Under Review"
    ).length,
    Resolved: mockAISafetyAlerts.filter((a) => a.status === "Resolved").length,
  };

  const filteredAlerts =
    statusFilter === "All"
      ? mockAISafetyAlerts
      : mockAISafetyAlerts.filter((a) => a.status === statusFilter);

  const newAlerts = mockAISafetyAlerts.filter((a) => a.status === "New");

  return (
    <AdminLayout title="AI Safety Alerts">
      {/* STATUS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Action Required */}
        <div
          className={`lg:col-span-2 rounded-xl p-6 flex items-end justify-between ${
            statusCounts.New > 0
              ? "bg-[#0a0f1a] text-white"
              : "bg-white border border-gray-100 shadow-sm"
          }`}
        >
          <div>
            <p
              className={`text-[10px] tracking-[0.15em] uppercase mb-3 font-semibold ${
                statusCounts.New > 0 ? "text-slate-400" : "text-gray-400"
              }`}
            >
              Action Required
            </p>

            <p
              className={`text-5xl font-bold leading-none mb-1.5 ${
                statusCounts.New > 0 ? "text-white" : "text-gray-900"
              }`}
            >
              {statusCounts.New}
            </p>

            <p
              className={`text-sm ${
                statusCounts.New > 0
                  ? "text-slate-400"
                  : "text-gray-400"
              }`}
            >
              {statusCounts.New === 0
                ? "No new alerts"
                : statusCounts.New === 1
                ? "New alert requires review"
                : "New alerts require review"}
            </p>
          </div>

          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              statusCounts.New > 0 ? "bg-white/10" : "bg-gray-100"
            }`}
          >
            <AlertTriangle
              size={20}
              className={
                statusCounts.New > 0 ? "text-white" : "text-gray-400"
              }
            />
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Under Review
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {statusCounts["Under Review"]}
              </p>
            </div>

            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-gray-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Resolved
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {statusCounts.Resolved}
              </p>
            </div>

            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={14} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* NEW ALERTS */}
      {newAlerts.length > 0 && statusFilter === "All" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <AlertTriangle size={15} className="text-gray-700" />

            <h3 className="text-sm font-semibold text-gray-800">
              New — Needs Review
            </h3>

            <span className="ml-auto text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">
              {newAlerts.length}
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {newAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                expanded={expandedAlert === alert.id}
                onToggle={() =>
                  setExpandedAlert(
                    expandedAlert === alert.id ? null : alert.id
                  )
                }
                onSendAlert={setSelectedAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {["All", "New", "Under Review", "Resolved"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === status
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {status}

            {status !== "All" && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter === status
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {
                  mockAISafetyAlerts.filter(
                    (a) => a.status === status
                  ).length
                }
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ALL ALERTS */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle
              size={32}
              className="text-gray-200 mx-auto mb-2"
            />

            <p className="text-sm text-gray-400">
              No alerts in this category
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                expanded={expandedAlert === alert.id}
                onToggle={() =>
                  setExpandedAlert(
                    expandedAlert === alert.id ? null : alert.id
                  )
                }
                onSendAlert={setSelectedAlert}
              />
            ))}
          </div>
        )}
      </div>

      {/* SEND ALERT MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Send Safety Alert
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              To:{" "}
              <span className="font-medium text-gray-800">
                {selectedAlert.customerName}
              </span>{" "}
              —{" "}
              <span className="text-gray-600">
                {selectedAlert.motorcycle}
              </span>
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                AI Recommendation Context
              </p>

              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedAlert.aiRecommendation}
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Message to Customer
              </label>

              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                rows={5}
                placeholder="Type your warning or recommendation..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSendAlert}
                className="flex-1 bg-[#0a0f1a] text-white py-2.5 rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Send size={15} />
                Send Alert
              </button>

              <button
                onClick={() => {
                  setSelectedAlert(null);
                  setAlertMessage("");
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS TOAST */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-[#0a0f1a] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50">
          <CheckCircle size={16} />

          <span className="text-sm font-medium">
            Alert sent to customer
          </span>
        </div>
      )}
    </AdminLayout>
  );
}

function AlertRow({
  alert,
  expanded,
  onToggle,
  onSendAlert,
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900">
                {alert.customerName}
              </p>

              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  alert.riskLevel === "DANGEROUS"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {alert.riskLevel}
              </span>

              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  alert.status === "New"
                    ? "bg-gray-900 text-white"
                    : alert.status === "Under Review"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {alert.status}
              </span>
            </div>

            <p className="text-xs text-gray-500 truncate">
              {alert.motorcycle} · {alert.modification}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-gray-400">
              {alert.createdDate}
            </span>

            {expanded ? (
              <ChevronUp size={15} className="text-gray-400" />
            ) : (
              <ChevronDown size={15} className="text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50">
          <div className="pt-4 space-y-3">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
                Modification
              </p>

              <p className="text-sm font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                {alert.modification}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
                AI Recommendation
              </p>

              <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg leading-relaxed">
                {alert.aiRecommendation}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <select className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white">
                  <option>Update Status</option>
                  <option>Under Review</option>
                  <option>Resolved</option>
                </select>

                {alert.autoNotified && (
                  <span className="text-xs text-gray-400">
                    Auto-notified
                  </span>
                )}
              </div>

              {!alert.autoNotified && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendAlert(alert);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#0a0f1a] text-white rounded-lg hover:bg-[#1e293b] text-xs font-medium transition-colors"
                >
                  <Send size={13} />
                  Send Alert
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}