import AdminLayout from "./AdminLayout";
import {
  Users,
  Wrench,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function AdminDashboard() {
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [users, setUsers] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [aiSafetyAlerts, setAiSafetyAlerts] = useState([]);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(data);
      },
      (error) => {
        console.error("Error loading users:", error);
        setUsers([]);
      }
    );

    const unsubscribeMotorcycles = onSnapshot(
      collection(db, "motorcycles"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMotorcycles(data);
      },
      (error) => {
        console.error("Error loading motorcycles:", error);
        setMotorcycles([]);
      }
    );

    const unsubscribeServices = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setServiceRequests(data);
      },
      (error) => {
        console.error("Error loading services:", error);
        setServiceRequests([]);
      }
    );

    const unsubscribeInventory = onSnapshot(
      collection(db, "inventory"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setInventory(data);
      },
      (error) => {
        console.error("Error loading inventory:", error);
        setInventory([]);
      }
    );

    const unsubscribeAlerts = onSnapshot(
      collection(db, "aiAlerts"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAiSafetyAlerts(data);
      },
      (error) => {
        console.error("Error loading AI alerts:", error);
        setAiSafetyAlerts([]);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeMotorcycles();
      unsubscribeServices();
      unsubscribeInventory();
      unsubscribeAlerts();
    };
  }, []);

  const normalizeStatus = (value) => {
    return String(value || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .trim();
  };

  const formatDate = (value) => {
    if (!value) return "";

    try {
      if (typeof value?.toDate === "function") {
        return value.toDate().toISOString().split("T")[0];
      }

      if (value instanceof Date) {
        return value.toISOString().split("T")[0];
      }

      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }

      return String(value);
    } catch {
      return String(value);
    }
  };

  const getTimestamp = (value) => {
    if (!value) return 0;

    try {
      if (typeof value?.toDate === "function") {
        return value.toDate().getTime();
      }

      if (value instanceof Date) {
        return value.getTime();
      }

      const parsed = new Date(value).getTime();

      return Number.isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  };

  const formatMotorcycle = (motorcycle) => {
    if (!motorcycle) {
      return "";
    }

    if (typeof motorcycle === "string") {
      return motorcycle;
    }

    if (typeof motorcycle === "object") {
      const parts = [
        motorcycle.brand,
        motorcycle.model,
        motorcycle.year ? `(${motorcycle.year})` : "",
      ].filter(Boolean);

      return parts.join(" ");
    }

    return String(motorcycle);
  };

  const usersById = users.reduce((result, user) => {
    result[user.id] = user;
    return result;
  }, {});

  const motorcyclesById = motorcycles.reduce((result, motorcycle) => {
    result[motorcycle.id] = motorcycle;
    return result;
  }, {});

  const totalCustomers = users.filter((user) => {
    const role = String(user.role || "").toLowerCase();

    return role === "customer";
  }).length;

  const servicesWithDisplayData = serviceRequests.map((service) => {
    const customer =
      usersById[service.customerId] ||
      usersById[service.userId] ||
      usersById[service.userUid] ||
      usersById[service.uid];

    const motorcycleData =
      service.motorcycle ||
      motorcyclesById[service.motorcycleId] ||
      null;

    const customerName =
      service.customerName ||
      service.fullName ||
      service.customerFullName ||
      customer?.fullName ||
      customer?.name ||
      "Customer";

    const motorcycle =
      service.motorcycleName ||
      (typeof service.motorcycle === "string"
        ? service.motorcycle
        : formatMotorcycle(motorcycleData));

    const requestDate =
      service.requestDate ||
      service.createdDate ||
      formatDate(service.createdAt);

    const preferredDate =
      service.preferredDate ||
      service.date ||
      service.scheduleDate ||
      "";

    const preferredTime =
      service.preferredTime ||
      service.time ||
      service.scheduleTime ||
      "";

    const cost = Number(
      service.cost ??
        service.finalCost ??
        service.estimatedCost ??
        service.amount ??
        0
    );

    const rating = Number(service.rating || 0);

    return {
      ...service,
      customerName,
      motorcycle,
      requestDate,
      preferredDate,
      preferredTime,
      cost,
      rating,
    };
  });

  const activeServices = servicesWithDisplayData.filter((service) => {
    const status = normalizeStatus(service.status);

    return [
      "active",
      "in progress",
      "waiting for parts",
      "waiting for part",
      "quality check",
    ].includes(status);
  });

  const pendingRequests = servicesWithDisplayData.filter((service) => {
    const status = normalizeStatus(service.status);

    return [
      "pending",
      "pending approval",
      "pending approval request",
    ].includes(status);
  });

  const completedServices = servicesWithDisplayData.filter((service) => {
    const status = normalizeStatus(service.status);

    return status === "completed";
  });

  const recentServices = [...completedServices]
    .sort((a, b) => {
      const dateA =
        getTimestamp(a.completedAt) ||
        getTimestamp(a.completedDate) ||
        getTimestamp(a.createdAt) ||
        getTimestamp(a.requestDate);

      const dateB =
        getTimestamp(b.completedAt) ||
        getTimestamp(b.completedDate) ||
        getTimestamp(b.createdAt) ||
        getTimestamp(b.requestDate);

      return dateB - dateA;
    })
    .slice(0, 5);

  const lowStockItems = inventory.filter((item) => {
    const quantity = Number(item.quantity || 0);
    const minStock = Number(item.minStock || 0);

    return quantity < minStock;
  });

  const newAlerts = aiSafetyAlerts
    .map((alert) => {
      const customer =
        usersById[alert.customerId] ||
        usersById[alert.userId] ||
        usersById[alert.userUid];

      const motorcycleData =
        alert.motorcycle ||
        motorcyclesById[alert.motorcycleId] ||
        null;

      return {
        ...alert,

        customerName:
          alert.customerName ||
          alert.fullName ||
          customer?.fullName ||
          customer?.name ||
          "Customer",

        motorcycle:
          typeof alert.motorcycle === "string"
            ? alert.motorcycle
            : alert.motorcycleName ||
              formatMotorcycle(motorcycleData),

        riskLevel:
          alert.riskLevel ||
          alert.risk ||
          "WARNING",

        status: alert.status || "New",

        modification:
          alert.modification ||
          alert.configuration ||
          alert.selectedModification ||
          "Motorcycle modification",

        issue:
          alert.issue ||
          alert.detectedIssue ||
          alert.description ||
          "No issue details available.",

        recommendation:
          alert.recommendation ||
          alert.aiRecommendation ||
          alert.recommendedAction ||
          "No recommendation available.",
      };
    })
    .filter((alert) => {
      return normalizeStatus(alert.status) === "new";
    });

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
            <p className="text-3xl font-bold text-gray-900 leading-none">{totalCustomers}</p>
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
                  <span className="text-xs text-gray-600 font-medium">₱{Number(service.cost || 0).toLocaleString()}</span>
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
            {newAlerts.slice(0, 3).map(alert => (
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