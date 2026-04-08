import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AdminDashboard from "./Pages/Admindashboard";
import Login from "./Pages/Login";
import AdminUsers from "./Pages/AdminUsers";
import CustomerDashboard from "./Pages/CustomerDashboard";
import { ProtectedRoute } from "./Components/ProtectedRoute";
import { RoleSidebar } from "./Components/RoleSidebar";
import { useAuth } from "./contexts/AuthContext";
import AdminTransportRequests from "./Pages/AdminTransportRequests"; // Import the new component
import AdminFilteredTransportRequests from "./Pages/AdminFilteredTransportRequests";
import EditRequestModal from "./Components/EditRequestModal"; // Import the new component
import AdminLayout from "./Pages/AdminLayout";
import ShipmentsPage from "./Pages/Myshipments";
import ContainerDetailsPage from "./Pages/Containerdetailspage";
import VendorDetails from "./Pages/VendorDetails";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DriverDetails from "./Pages/DriverDetails";
import EquipmentDetails from "./Pages/EquipmentDetails";
import Vindetails from "./Pages/VinDetailsPage";
import ASNManagement from "./Pages/ASNupload";
import TransportReports from "./Pages/Reports";
import VendorController from "./Pages/Vendorcontroller";
import AllReportsPage from "./Pages/AllAdminreports";
import AdminManageRequest from "./Pages/AdminManageRequest";
import ContainerAssignmentDashboard from "./Pages/Containeradminpage";
import DailyAdvancePaymentsReport from "./Pages/DailyAdvancePaymentsReport";
import ContainerMarginReport from "./Pages/ContainerMarginReport";
import PaymentReceipts from "./Pages/PaymentReceipts";
import RateCardManagement from "./Pages/RateCardManagement";
import RateCardApproval from "./Pages/RateCardApproval";
import TireMaster from "./Pages/TireMaster";
import BedMaster from "./Pages/BedMaster";
import BedAttachment from "./Pages/BedAttachment";
import TirePositionMaster from "./Pages/TirePositionMaster";
import TireAttachment from "./Pages/TireAttachment";
import JobOrder from "./Pages/JobOrder";
import JobOrderClose from "./Pages/JobOrderClose";

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const sidebarProps = {
    collapsed,
    toggleSidebar,
    activePage,
    setActivePage,
    mobileMenuOpen,
    toggleMobileMenu,
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <RoleSidebar {...sidebarProps} />

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${
          collapsed ? "md:ml-16" : "md:ml-64"
        } md:min-w-0`}
      >
        <div className="p-6">{React.cloneElement(children, sidebarProps)}</div>
      </main>
    </div>
  );
};

// Component to redirect based on user role
const RoleRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  const role = user.role?.toLowerCase();
  switch (role) {
    case "admin":
      return <Navigate to="/admin-dashboard" />;
    case "customer":
      return <Navigate to="/customer-dashboard" />;
    case "driver":
      return <Navigate to="/driver-dashboard" />;
    default:
      return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Admin routes - AdminLayout handles its own sidebar */}
          <Route
            path="/admin-dashboard/*"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendor-controller"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <VendorController />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/editrequests"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <VendorController />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <AdminUsers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/editrequest"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <AdminManageRequest />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/allreports"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <AllReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />{" "}
          <Route
            path="/admin/admincontainerpage"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <ContainerAssignmentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/transport-requests"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <AdminTransportRequests />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/filtered-transport-requests"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <AdminFilteredTransportRequests />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/daily-advance-payments"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <DailyAdvancePaymentsReport />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/container-margin-report"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <ContainerMarginReport />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payment-receipts"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminLayout>
                  <PaymentReceipts />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fleet-equipment"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <EquipmentDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/drivers"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <DriverDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tire-master"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <TireMaster />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tire-position-master"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <TirePositionMaster />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bed-master"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <BedMaster />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bed-attachment"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <BedAttachment />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tire-attachment"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <TireAttachment />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/job-order"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <JobOrder />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/job-order-close"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <JobOrderClose />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rate-approvals"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <RateCardApproval />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Customer route */}
          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <CustomerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/ASN"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <ASNManagement></ASNManagement>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/my-shipments" // Changed from "/my-shipments"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <ShipmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/container-page" // Changed from "/my-shipments"
            element={
              <ProtectedRoute allowedRoles={["Customer", "Admin"]}>
                <DashboardLayout>
                  <ContainerDetailsPage></ContainerDetailsPage>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-modal"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <EditRequestModal></EditRequestModal>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/vendors"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <VendorDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/equipments"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <EquipmentDetails></EquipmentDetails>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/vehicle-master"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <EquipmentDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/drivers"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <DriverDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/driver-master"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <DriverDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tire-master"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <TireMaster />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tire-position-master"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <TirePositionMaster />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bed-master"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <BedMaster />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bed-attachment"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <BedAttachment />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tire-attachment"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <TireAttachment />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/job-order"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <JobOrder />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/job-order-close"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <JobOrderClose />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/reports"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <TransportReports></TransportReports>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/rate-management"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <RateCardManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/vinpage"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <Vindetails></Vindetails>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Driver route */}
          <Route
            path="/driver-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Driver"]}>
                <DashboardLayout>
                  <div>Driver Dashboard (To be implemented)</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Root redirect */}
          <Route path="/" element={<RoleRedirect />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
}

export default App;
