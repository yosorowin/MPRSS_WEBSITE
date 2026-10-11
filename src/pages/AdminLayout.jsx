import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  LayoutDashboard,
  Users,
  Wrench,
  Package,
  AlertTriangle,
  MessageSquare,
  Star,
  Trash2,
  LogOut,
  Bell,
  X,
  Menu,
  Calendar,
  Check,
  Clock,
  CircleCheck,
} from "lucide-react";

import logo from "../assets/logo.png";
import { auth, db } from "../firebase";

/*
 * Create a notification in Firestore.
 * Import and call this function from other admin features
 * when a real service, message, inventory, or safety event occurs.
 */
export const createAdminNotification = async ({
  title,
  message,
  type = "general",
  route = "/admin/dashboard",
  relatedId = null,
}) => {
  if (!title || !message) {
    throw new Error("Notification title and message are required.");
  }

  const notification = {
    recipientRole: "admin",
    title,
    message,
    type,
    route,
    read: false,
    createdAt: serverTimestamp(),
  };

  if (relatedId) {
    notification.relatedId = relatedId;
  }

  const result = await addDoc(
    collection(db, "notifications"),
    notification
  );

  return result.id;
};

function AdminLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [toast, setToast] = useState(null);
  const seenNotificationIds = useRef(new Set());
  const initialSnapshotReceived = useRef(false);
  const toastTimeoutRef = useRef(null);

  /*
   * ==========================================
   * ADMIN PROFILE
   * ==========================================
   */

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;

      if (!currentUser) {
        setUserName("");
        setUserRole("");
        return;
      }

      try {
        const userSnapshot = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        if (!active) return;

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();

          setUserName(
            userData.fullName || currentUser.email || "Admin User"
          );

          setUserRole(
            String(userData.role || "admin").toLowerCase()
          );
        } else {
          setUserName(currentUser.email || "Admin User");
          setUserRole("admin");
        }
      } catch (error) {
        console.error("Error loading admin profile:", error);

        if (active) {
          setUserName(currentUser.email || "Admin User");
          setUserRole("admin");
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  /*
   * ==========================================
   * REAL-TIME NOTIFICATIONS AND POPUP
   * ==========================================
   */

  useEffect(() => {
    let active = true;
    let unsubscribeNotifications = null;
    let unsubscribeAIAlerts = null;

    let generalNotifications = [];
    let aiAlertNotifications = [];

    let notificationsLoaded = false;
    let aiAlertsLoaded = false;

    const getTimestamp = (timestamp) => {
      if (!timestamp) return 0;

      if (typeof timestamp.toMillis === "function") {
        return timestamp.toMillis();
      }

      if (typeof timestamp.toDate === "function") {
        return timestamp.toDate().getTime();
      }

      if (timestamp instanceof Date) {
        return timestamp.getTime();
      }

      if (typeof timestamp === "number") {
        return timestamp;
      }

      return 0;
    };

    const showToast = (notification) => {
      if (!active) return;

      setToast(notification);

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = setTimeout(() => {
        if (active) setToast(null);
      }, 5000);
    };

    const combineNotifications = () => {
      if (!active) return;

      // AI alerts that already have an admin notification should appear only once.
      const adminAlertIds = new Set(
        generalNotifications
          .map((item) => item.alertId || item.relatedId)
          .filter(Boolean)
      );
      const unrepresentedAIAlerts = aiAlertNotifications.filter(
        (item) => !adminAlertIds.has(item.id)
      );

      const combined = [
        ...generalNotifications,
        ...unrepresentedAIAlerts,
      ].sort(
        (a, b) =>
          getTimestamp(b.createdAt) - getTimestamp(a.createdAt)
      );

      setNotifications(combined);
      setNotificationsLoading(
        !(notificationsLoaded && aiAlertsLoaded)
      );
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }

      if (unsubscribeAIAlerts) {
        unsubscribeAIAlerts();
        unsubscribeAIAlerts = null;
      }

      generalNotifications = [];
      aiAlertNotifications = [];
      notificationsLoaded = false;
      aiAlertsLoaded = false;

      seenNotificationIds.current = new Set();
      initialSnapshotReceived.current = false;

      setNotifications([]);
      setNotificationsLoading(true);
      setToast(null);

      if (!currentUser) {
        setNotificationsLoading(false);
        return;
      }

      /*
       * GENERAL ADMIN NOTIFICATIONS
       */

      const notificationQuery = query(
        collection(db, "notifications"),
        where("recipientRole", "==", "admin")
      );

      unsubscribeNotifications = onSnapshot(
        notificationQuery,
        (snapshot) => {
          if (!active) return;

          const currentItems = snapshot.docs.map((item) => {
            const data = item.data();

            return {
              id: item.id,
              collectionName: "notifications",
              title: data.title || "Notification",
              message: data.message || "",
              type: data.type || "general",
              route: data.route || "/admin/dashboard",
              read: data.read === true,
              createdAt: data.createdAt || null,
              alertId: data.alertId || null,
              relatedId: data.relatedId || null,
            };
          });

          /*
           * Skip old documents on the first snapshot.
           * Only newly added documents trigger a popup.
           */
          if (!initialSnapshotReceived.current) {
            currentItems.forEach((item) => {
              seenNotificationIds.current.add(
                `${item.collectionName}:${item.id}`
              );
            });

            initialSnapshotReceived.current = true;
          } else {
            snapshot.docChanges().forEach((change) => {
              if (change.type !== "added") return;

              const data = change.doc.data();
              const key = `notifications:${change.doc.id}`;

              if (seenNotificationIds.current.has(key)) return;

              seenNotificationIds.current.add(key);

              const newNotification = {
                id: change.doc.id,
                collectionName: "notifications",
                title: data.title || "Notification",
                message: data.message || "",
                type: data.type || "general",
                route: data.route || "/admin/dashboard",
                read: data.read === true,
                createdAt: data.createdAt || null,
                alertId: data.alertId || null,
                relatedId: data.relatedId || null,
              };

              showToast(newNotification);
            });
          }

          generalNotifications = currentItems;
          notificationsLoaded = true;
          combineNotifications();
        },
        (error) => {
          console.error(
            "Admin notifications listener error:",
            error
          );

          notificationsLoaded = true;
          combineNotifications();
        }
      );

      /*
       * AI SAFETY ALERTS
       */

      unsubscribeAIAlerts = onSnapshot(
        collection(db, "aiAlerts"),
        (snapshot) => {
          if (!active) return;

          aiAlertNotifications = snapshot.docs
            .map((item) => {
              const data = item.data();
              const status = String(data.status || "").toLowerCase();

              return {
                id: item.id,
                collectionName: "aiAlerts",
                title:
                  data.title ||
                  data.alertTitle ||
                  "AI Safety Alert",
                message:
                  data.message ||
                  data.adminMessage ||
                  data.description ||
                  data.reason ||
                  "An AI safety alert requires attention.",
                type: "safety",
                route: "/admin/ai-safety",
                read:
                  data.read === true ||
                  status === "resolved" ||
                  status === "closed",
                createdAt: data.createdAt || data.timestamp || null,
                status,
              };
            })
            .filter(
              (item) =>
                item.status !== "resolved" &&
                item.status !== "closed"
            );

          aiAlertsLoaded = true;
          combineNotifications();
        },
        (error) => {
          console.error("AI safety alerts listener error:", error);

          aiAlertsLoaded = true;
          combineNotifications();
        }
      );
    });

    return () => {
      active = false;
      unsubscribeAuth();

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }

      if (unsubscribeAIAlerts) {
        unsubscribeAIAlerts();
      }

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  /*
   * ==========================================
   * NOTIFICATION HELPERS
   * ==========================================
   */

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return "Recently";

    let date;

    if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp);
    } else {
      return "Recently";
    }

    if (Number.isNaN(date.getTime())) return "Recently";

    return date.toLocaleString();
  };

  const getNotificationIcon = (type) => {
    switch (String(type).toLowerCase()) {
      case "ai":
      case "safety":
        return AlertTriangle;
      case "service":
      case "schedule":
        return Wrench;
      case "inventory":
        return Package;
      case "message":
        return MessageSquare;
      case "feedback":
        return Star;
      case "customer":
        return Users;
      default:
        return Bell;
    }
  };

  /*
   * ==========================================
   * MARK ONE AS READ
   * ==========================================
   */

  const markNotificationAsRead = async (notification) => {
    if (notification.read) return;

    try {
      await updateDoc(
        doc(
          db,
          notification.collectionName || "notifications",
          notification.id
        ),
        { read: true }
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    setShowNotifications(false);
    setToast(null);

    await markNotificationAsRead(notification);

    const allowedRoutes = [
      "/admin/dashboard",
      "/admin/customers",
      "/admin/services",
      "/admin/schedule",
      "/admin/inventory",
      "/admin/motorcycle-deletions",
      "/admin/ai-safety",
      "/admin/messages",
      "/admin/feedback",
      "/admin/admin-management",
      "/admin/staff-management",
    ];

    navigate(
      allowedRoutes.includes(notification.route)
        ? notification.route
        : "/admin/dashboard"
    );
  };

  /*
   * ==========================================
   * MARK ALL AS READ
   * ==========================================
   */

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((item) => !item.read);

    if (!unread.length || markingAllRead) return;

    setMarkingAllRead(true);

    try {
      const results = await Promise.allSettled(
        unread.map((item) =>
          updateDoc(
            doc(
              db,
              item.collectionName || "notifications",
              item.id
            ),
            { read: true }
          )
        )
      );

      const failures = results.filter(
        (result) => result.status === "rejected"
      );

      if (failures.length) {
        console.error("Some notifications could not be updated:", failures);
      }
    } finally {
      setMarkingAllRead(false);
    }
  };

  /*
   * ==========================================
   * LOGOUT
   * ==========================================
   */

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getRoleLabel = () => {
    if (userRole === "super_admin") return "Super Admin";
    if (userRole === "admin") return "Admin";
    return "Administrator";
  };

  /*
   * ==========================================
   * SIDEBAR NAVIGATION
   * ==========================================
   */

  const menuItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/customers", icon: Users, label: "Customers" },
    { path: "/admin/services", icon: Wrench, label: "Services" },
    { path: "/admin/schedule", icon: Calendar, label: "Schedules" },
    { path: "/admin/inventory", icon: Package, label: "Inventory" },
    {
      path: "/admin/motorcycle-deletions",
      icon: Trash2,
      label: "Deletion Requests",
    },
    {
      path: "/admin/ai-safety",
      icon: AlertTriangle,
      label: "AI Safety Alerts",
    },
    { path: "/admin/messages", icon: MessageSquare, label: "Messages" },
    { path: "/admin/feedback", icon: Star, label: "Feedback & Community" },
  ];

  const managementItems =
    userRole === "super_admin"
      ? [
          {
            path: "/admin/admin-management",
            icon: Users,
            label: "Admin Management",
          },
          {
            path: "/admin/staff-management",
            icon: Wrench,
            label: "Staff Management",
          },
        ]
      : [];

  const renderMenuItem = (item) => {
    const Icon = item.icon;

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
          location.pathname === item.path
            ? "bg-white text-black"
            : "text-gray-300 hover:bg-gray-800"
        }`}
      >
        <Icon size={20} />
        <span className="text-sm">{item.label}</span>
      </Link>
    );
  };

  /*
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          ${isSidebarOpen ? "w-64" : "w-0"}
          relative z-50 bg-gray-900 text-white flex flex-col shrink-0
          transition-all duration-300 ease-in-out overflow-hidden
        `}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="MPRSS Logo"
              className="w-24 h-auto brightness-0 invert"
            />
          </div>

          <p className="text-sm text-gray-300 mt-2 truncate">
            {userName || "Loading..."}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {getRoleLabel()}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map(renderMenuItem)}

          {managementItems.length > 0 && (
            <>
              <div className="pt-5 pb-2 px-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                  Management
                </p>
              </div>
              {managementItems.map(renderMenuItem)}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 w-full transition"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors shrink-0"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-lg sm:text-2xl font-medium truncate">
              {title}
            </h2>
          </div>

          {/* NOTIFICATIONS */}
          <div className="relative shrink-0">
            <button
              onClick={() =>
                setShowNotifications((previous) => !previous)
              }
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell size={20} />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Notifications
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {unreadCount} unread
                    </p>
                  </div>

                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-black rounded-full mx-auto" />
                      <p className="text-sm text-gray-500 mt-3">
                        Loading notifications...
                      </p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell
                        size={28}
                        className="mx-auto text-gray-300"
                      />
                      <p className="text-sm font-medium text-gray-700 mt-3">
                        No notifications
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        You're all caught up.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const NotificationIcon = getNotificationIcon(
                        notification.type
                      );

                      return (
                        <button
                          key={`${notification.collectionName}:${notification.id}`}
                          type="button"
                          onClick={() =>
                            handleNotificationClick(notification)
                          }
                          className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex gap-3 ${
                            !notification.read ? "bg-gray-50" : "bg-white"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              notification.type === "safety"
                                ? "bg-amber-100 text-amber-700"
                                : notification.type === "service"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : notification.type === "inventory"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <NotificationIcon size={17} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 justify-between">
                              <p
                                className={`text-sm ${
                                  notification.read
                                    ? "font-medium text-gray-700"
                                    : "font-bold text-black"
                                }`}
                              >
                                {notification.title}
                              </p>

                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                              )}
                            </div>

                            <p className="text-xs text-gray-600 mt-1 break-words">
                              {notification.message}
                            </p>

                            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                              <Clock size={11} />
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="p-3 border-t border-gray-200 space-y-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={markingAllRead}
                      className="text-sm text-black hover:text-gray-600 disabled:opacity-50 flex items-center justify-center gap-2 w-full"
                    >
                      <Check size={15} />
                      {markingAllRead
                        ? "Marking as read..."
                        : "Mark all as read"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-behavior-contain">
          {children}
        </main>
      </div>

      {/* AUTOMATIC TOAST POPUP */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] w-[calc(100vw-2.5rem)] max-w-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-800">
              <Bell size={20} />
            </div>

            <button
              type="button"
              onClick={() => handleNotificationClick(toast)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="text-sm font-semibold text-gray-900">
                {toast.title}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {toast.message}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Click to view
              </p>
            </button>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Dismiss popup"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;