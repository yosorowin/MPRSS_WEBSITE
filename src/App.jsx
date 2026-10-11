import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import AdminLogin from "./pages/AdminLogin";
import AdminEmailVerification from "./pages/AdminEmailVerification";

import AdminDashboard from "./pages/AdminDashboard";
import AdminCustomers from "./pages/AdminCustomers";
import AdminServices from "./pages/AdminServices";
import AdminSchedule from "./pages/AdminSchedule";
import AdminInventory from "./pages/AdminInventory";
import AdminMotorcycleDeletions from "./pages/AdminMotorcycleDeletions";
import AdminAISafety from "./pages/AdminAISafety";
import AdminMessages from "./pages/AdminMessages";
import AdminFeedback from "./pages/AdminFeedback";

import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";

import AdminAdminManagement from "./pages/AdminAdminManagement";
import AdminStaffManagement from "./pages/AdminStaffManagement";

function App() {
  return (
    <Routes>

      {/* =========================
          PUBLIC ROUTES
      ========================== */}

      <Route path="/" element={<LandingPage />} />

      {/* Admin Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Email Verification */}
      <Route
        path="/admin/email-verification"
        element={<AdminEmailVerification />}
      />


      {/* =========================
          SUPER ADMIN ONLY ROUTES
      ========================== */}

      <Route
        path="/admin/admin-management"
        element={
          <SuperAdminRoute>
            <AdminAdminManagement />
          </SuperAdminRoute>
        }
      />

      <Route
        path="/admin/staff-management"
        element={
          <SuperAdminRoute>
            <AdminStaffManagement />
          </SuperAdminRoute>
        }
      />


      {/* =========================
          PROTECTED ADMIN ROUTES
          Admin + Super Admin
      ========================== */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/customers"
        element={
          <ProtectedAdminRoute>
            <AdminCustomers />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/services"
        element={
          <ProtectedAdminRoute>
            <AdminServices />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/schedule"
        element={
          <ProtectedAdminRoute>
            <AdminSchedule />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/inventory"
        element={
          <ProtectedAdminRoute>
            <AdminInventory />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/motorcycle-deletions"
        element={
          <ProtectedAdminRoute>
            <AdminMotorcycleDeletions />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/ai-safety"
        element={
          <ProtectedAdminRoute>
            <AdminAISafety />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/messages"
        element={
          <ProtectedAdminRoute>
            <AdminMessages />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin/feedback"
        element={
          <ProtectedAdminRoute>
            <AdminFeedback />
          </ProtectedAdminRoute>
        }
      />

    </Routes>
  );
}

export default App;