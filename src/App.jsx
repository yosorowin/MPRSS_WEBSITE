import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCustomers from "./pages/AdminCustomers";
import AdminServices from "./pages/AdminServices";
import AdminSchedule from "./pages/AdminSchedule";
import AdminInventory from "./pages/AdminInventory";
import AdminMotorcycleDeletions from "./pages/AdminMotorcycleDeletions";
import AdminAISafety from "./pages/AdminAISafety";
import AdminMessages from "./pages/AdminMessages";
import AdminFeedback from "./pages/AdminFeedback";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/customers" element={<AdminCustomers />} />
      <Route path="/admin/services" element={<AdminServices />} />
      <Route path="/admin/schedule" element={<AdminSchedule />} />
      <Route path="/admin/inventory" element={<AdminInventory />} />
      <Route path="/admin/motorcycle-deletions" element={<AdminMotorcycleDeletions />}/>
      <Route path="/admin/ai-safety" element={<AdminAISafety />} />
      <Route path="/admin/messages" element={<AdminMessages />}/>
      <Route path="/admin/feedback" element={<AdminFeedback />} />


    </Routes>
  );
}

export default App;