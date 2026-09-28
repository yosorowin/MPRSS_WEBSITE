import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  LayoutDashboard,
  Users,
  Wrench,
  Package,
  AlertTriangle,
  MessageSquare,
  Star,
  Bike,
  LogOut,
  Bell,
  X,
  Menu,
  Calendar,
} from "lucide-react";

import logo from "../assets/logo.png";
import { auth, db } from "../firebase";

function AdminLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUserName("");
        setUserRole("");
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();

          setUserName(
            userData.fullName || currentUser.email || "Admin User"
          );

          setUserRole(userData.role || "admin");
        } else {
          setUserName(currentUser.email || "Admin User");
          setUserRole("admin");
        }
      } catch (error) {
        console.error("Error loading admin profile:", error);
        setUserName(currentUser.email || "Admin User");
        setUserRole("admin");
      }
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/admin/login");
    } catch {
      console.error("Logout failed.");
    }
  };

  const getRoleLabel = () => {
    if (userRole === "super_admin") {
      return "Super Admin";
    }

    return "Admin";
  };

  const menuItems = [
    {
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/admin/customers",
      icon: Users,
      label: "Customers",
    },
    {
      path: "/admin/services",
      icon: Wrench,
      label: "Services",
    },
    {
      path: "/admin/schedule",
      icon: Calendar,
      label: "Schedules",
    },
    {
      path: "/admin/inventory",
      icon: Package,
      label: "Inventory",
    },
    {
      path: "/admin/motorcycle-deletions",
      icon: Bike,
      label: "Motorcycle Deletions",
    },
    {
      path: "/admin/ai-safety",
      icon: AlertTriangle,
      label: "AI Safety Alerts",
    },
    {
      path: "/admin/messages",
      icon: MessageSquare,
      label: "Messages",
    },
    {
      path: "/admin/feedback",
      icon: Star,
      label: "Feedback & Community",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Mobile Responsive with Overlay */}
      {isSidebarOpen && (
        <div
            className="fixed inset-0 bg-transparent z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
  className={`
    ${isSidebarOpen ? "w-64" : "w-0"}
    relative z-50
    bg-gray-900 text-white flex flex-col shrink-0
    transition-all duration-300 ease-in-out
    overflow-hidden
  `}
>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="MPRSS Logo"
              className="w-24 h-auto brightness-0 invert"
            />

            <div>
              <h1 className="text-xl font-semibold"></h1>
              <p className="text-xs text-gray-400"></p>
            </div>
          </div>

          <p className="text-sm text-gray-300 mt-2 truncate">
            {userName || "Loading..."}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {getRoleLabel()}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                  isActive
                    ? "bg-white text-black"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header - Mobile Optimized */}
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

          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-black rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-medium">Notifications</h3>

                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <div
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                    onClick={() => {
                      navigate("/admin/ai-safety");
                      setShowNotifications(false);
                    }}
                  >
                    <p className="text-sm font-medium text-black">
                      ⚠ High Risk Alert
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Dangerous modification detected on Honda CBR1000RR
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      2 hours ago
                    </p>
                  </div>

                  <div
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                    onClick={() => {
                      navigate("/admin/services");
                      setShowNotifications(false);
                    }}
                  >
                    <p className="text-sm font-medium">
                      New Service Request
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Juan Dela Cruz requested an Engine Tune-up
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      3 hours ago
                    </p>
                  </div>

                  <div
                    className="p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                    onClick={() => {
                      navigate("/admin/inventory");
                      setShowNotifications(false);
                    }}
                  >
                    <p className="text-sm font-medium text-black">
                      Low Stock Warning
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Brake pads are below minimum threshold
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      5 hours ago
                    </p>
                  </div>
                </div>

                <div className="p-3 border-t border-gray-200 text-center">
                  <button className="text-sm text-black hover:text-gray-700 active:text-gray-900 transition-colors">
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-behavior-contain">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;