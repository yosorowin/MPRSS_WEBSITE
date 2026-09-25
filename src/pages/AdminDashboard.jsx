import AdminLayout from './AdminLayout';
import { Users, Wrench, Package, AlertTriangle, Clock, CheckCircle, X, TrendingUp } from 'lucide-react';
import { mockAISafetyAlerts, mockCompletedServices, mockInventory, mockActiveServices, mockServiceRequests } from './mockData';
import { useState } from 'react';

function AdminDashboard() {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const getStoredData = (key, fallback) => {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const [inventory] = useState(() =>
  getStoredData('umes_inventory', mockInventory)
);

const [activeServices] = useState(() =>
  getStoredData('umes_active_services', mockActiveServices)
);

const [serviceRequests] = useState(() =>
  getStoredData('umes_service_requests', mockServiceRequests)
);

  const lowStockItems = inventory.filter(item => item.quantity < item.minStock);
  const newAlerts = mockAISafetyAlerts.filter(alert => alert.status === 'New');
  const pendingRequests = serviceRequests.filter(req => req.status === 'pending');
  const recentServices = mockCompletedServices.slice(0, 5);

  return (
    <AdminLayout title="Dashboard">

      {/* ── OPERATIONS OVERVIEW ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

        {/* Featured: Active Services — spans full height on left */}
        <div className="bg-[#0a0f1a] text-white rounded-xl p-6 flex flex-col justify-between lg:row-span-1">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-4 font-semibold">
              Active Services
            </p>
            <p className="text-5xl font-bold leading-none mb-2">{activeServices.length}</p>
            <p className="text-sm text-slate-400">Currently in workshop</p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold">{pendingRequests.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Pending requests</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Wrench size={18} className="text-white" />
            </div>
          </div>
        </div>

        {/* Secondary metrics — stacked in one panel */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Total Customers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Users size={16} className="text-gray-600" />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <TrendingUp size={11} />
                <span>Active</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 leading-none">156</p>
            <p className="text-xs text-gray-400 mt-1.5">Registered customers</p>
          </div>

          {/* Low Stock */}
          <div className={`bg-white rounded-xl border shadow-sm p-5 ${lowStockItems.length > 0 ? 'border-amber-200' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-amber-50' : 'bg-gray-100'}`}>
                <Package size={16} className={lowStockItems.length > 0 ? 'text-amber-600' : 'text-gray-600'} />
              </div>
              {lowStockItems.length > 0 && (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Alert
                </span>
              )}
            </div>
            <p className={`text-3xl font-bold leading-none ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {lowStockItems.length}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">Items need reorder</p>
          </div>

          {/* AI Safety Alerts */}
          <div className={`bg-white rounded-xl border shadow-sm p-5 ${newAlerts.length > 0 ? 'border-gray-300' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <AlertTriangle size={16} className="text-gray-600" />
              </div>
              {newAlerts.length > 0 && (
                <span className="text-[10px] font-semibold bg-gray-800 text-white px-2 py-0.5 rounded-full">
                  New
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 leading-none">{newAlerts.length}</p>
            <p className="text-xs text-gray-400 mt-1.5">Safety alerts</p>
          </div>
        </div>
      </div>

      {/* ── SERVICE ACTIVITY ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Pending Service Requests */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <Clock size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Pending Requests</h3>
            <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {pendingRequests.length}
            </span>
          </div>
          <div className="p-4 space-y-2 max-h-80 overflow-y-auto mobile-hide-scrollbar">
            {pendingRequests.map(request => (
              <div key={request.id} className="rounded-lg border border-gray-100 p-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{request.customerName}</p>
                    <p className="text-xs text-gray-500 truncate">{request.motorcycle}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{request.requestDate}</span>
                </div>
                <p className="text-xs text-gray-700">{request.serviceType}</p>
                <p className="text-[11px] text-gray-400 mt-1">Preferred: {request.preferredDate} at {request.preferredTime}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Service Records */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <CheckCircle size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Recent Completed</h3>
          </div>
          <div className="p-4 space-y-2 max-h-80 overflow-y-auto mobile-hide-scrollbar">
            {recentServices.map(service => (
              <div key={service.id} className="rounded-lg border border-gray-100 p-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{service.customerName}</p>
                    <p className="text-xs text-gray-500 truncate">{service.motorcycle}</p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0 font-medium">
                    Done
                  </span>
                </div>
                <p className="text-xs text-gray-700">{service.serviceType}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-amber-500">{'★'.repeat(service.rating)}</span>
                  <span className="text-xs text-gray-600 font-medium">₱{(service.cost * 50).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ALERTS & INVENTORY ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* AI Safety Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">AI Safety Alerts</h3>
          </div>
          <div className="p-4 space-y-2">
            {mockAISafetyAlerts.slice(0, 3).map(alert => (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className="w-full text-left rounded-lg border border-gray-100 p-3.5 hover:bg-gray-50 hover:border-gray-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{alert.customerName}</p>
                    <p className="text-xs text-gray-500 truncate">{alert.motorcycle}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                    alert.riskLevel === 'DANGEROUS'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {alert.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{alert.modification}</p>
                <p className="text-[11px] text-gray-400 mt-1">Status: {alert.status}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <Package size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Low Stock Items</h3>
            <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {lowStockItems.length}
            </span>
          </div>
          <div className="p-4">
            {lowStockItems.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.category}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-amber-600">{item.quantity} left</p>
                      <p className="text-[11px] text-gray-400">Min: {item.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All items well stocked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ALERT DETAIL MODAL ─────────────────────────────────────────── */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">AI Safety Alert</h3>
                <p className="text-sm text-gray-500 mt-0.5">{selectedAlert.customerName} &bull; {selectedAlert.motorcycle}</p>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-700 p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Risk Level</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedAlert.riskLevel === 'DANGEROUS'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {selectedAlert.riskLevel}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <p className="font-medium text-sm text-gray-800">{selectedAlert.status}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">Modification</p>
                <p className="font-medium text-sm text-gray-800">{selectedAlert.modification}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">Detected Issue</p>
                <p className="text-sm bg-gray-50 text-gray-700 p-3 rounded-lg leading-relaxed">{selectedAlert.issue}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">AI Recommendation</p>
                <p className="text-sm bg-gray-50 text-gray-700 p-3 rounded-lg leading-relaxed">{selectedAlert.recommendation}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="flex-1 bg-white text-gray-800 border border-gray-200 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Approve Modification
                </button>
                <button className="flex-1 bg-[#0a0f1a] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#1e293b] transition-colors">
                  Reject &amp; Notify Customer
                </button>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDashboard;
