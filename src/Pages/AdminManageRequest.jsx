import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  FileText,
  Eye,
  RefreshCw,
  MapPin,
  FileSpreadsheet,
  Bell,
  User,
  LogOut,
  Settings,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api, { transporterAPI } from "../utils/Api";
import { generateInvoice } from "../utils/pdfGenerator";
import RequestModal from "../Components/Requestmodal";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { TransporterDetails } from "./Transporterdetails";
import ServiceRequestForm from "../Components/dashboard/Servicerequest";

// Utility functions
const parseJSON = (data, defaultValue) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || defaultValue;
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return defaultValue;
  }
};

const formatCurrency = (amount) =>
  amount || amount === 0
    ? `₹${Number(amount).toLocaleString("en-IN")}`
    : "Not specified";

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString() : "N/A";

// Component for Status Badge
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    approved: { color: "bg-green-100 text-green-800", icon: "✓" },
    "in progress": { color: "bg-blue-100 text-blue-800", icon: "🚛" },
    completed: { color: "bg-purple-100 text-purple-800", icon: "📦" },
    rejected: { color: "bg-red-100 text-red-800", icon: "✕" },
  };
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span>{config.icon}</span>
      {status}
    </span>
  );
};

// Component for Profit/Loss Indicator
const ProfitLossIndicator = ({ profitLoss }) => {
  if (profitLoss > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (profitLoss < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
};

const AdminManageRequest = ({
  collapsed,
  toggleSidebar,
  mobileMenuOpen,
  toggleMobileMenu,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestId, setRequestId] = useState("");
  const [shipaNo, setShipaNo] = useState("");
  const [containerNo, setContainerNo] = useState("");
  const [isFiltered, setIsFiltered] = useState(false); // Track if filters are applied
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [transporterDetails, setTransporterDetails] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [requestsPerPage] = useState(10);

  const [transporterData, setTransporterData] = useState({
    transporterName: "",
    vehicleNumber: "",
    driverName: "",
    driverContact: "",
    vendorName: "",
    vendorContact: "",
  });

  const transporterCache = useMemo(() => new Map(), []);

  const initializeNewRequest = () => ({
    customer_id: null,
    SHIPA_NO: "",
    consignee: "",
    consigner: "",
    vehicle_type: "",
    vehicle_size: "",
    vehicle_status: "Empty",
    no_of_vehicles: "1",
    pickup_location: "",
    stuffing_location: "",
    delivery_location: "",
    commodity: "",
    cargo_type: "",
    cargo_weight: 0,
    service_type: [],
    service_prices: {},
    containers_20ft: 0,
    containers_40ft: 0,
    total_containers: 0,
    expected_pickup_date: "",
    expected_pickup_time: "",
    expected_delivery_date: "",
    expected_delivery_time: "",
    requested_price: 0,
    status: "Pending",
    admin_comment: "",
  });

  const fetchReports = useCallback(
    async (page, applyFilters = false) => {
      setIsLoading(true);
      try {
        const params = { page, limit: requestsPerPage };
        let endpoint = "/transport-requests/all";

        if (applyFilters) {
          // Validate that at least one filter is provided
          if (!requestId && !shipaNo && !containerNo) {
            toast.info(
              "Please enter a Request ID, SHIPA No, or Container No to search."
            );
            setReports([]);
            setTotalPages(1);
            setIsLoading(false);
            return;
          }
          endpoint = "/transport-requests/filtered";
          if (requestId) params.request_id = requestId;
          if (shipaNo) params.shipa_no = shipaNo;
          if (containerNo) params.container_no = containerNo;
        }

        const response = await api.get(endpoint, { params });
        const {
          requests,
          totalPages: newTotalPages,
          currentPage: newCurrentPage,
        } = response.data;

        const reportsWithDetails = await Promise.all(
          (requests || []).map(async (shipment) => {
            let transporterDetails = [];
            let vehicleCharges = 0;
            let vehicleCount = 0;
            let vehicleContainerMapping = {};

            try {
              if (transporterCache.has(shipment.id)) {
                transporterDetails = transporterCache.get(shipment.id);
              } else {
                const transporterResponse =
                  await transporterAPI.getTransporterByRequestId(shipment.id);
                if (transporterResponse.success) {
                  const details = Array.isArray(transporterResponse.data)
                    ? transporterResponse.data
                    : [transporterResponse.data];
                  transporterDetails = details;
                  vehicleContainerMapping = details.reduce((acc, detail) => {
                    const vehicleNum = detail.vehicle_number || "Unknown";
                    if (!acc[vehicleNum]) {
                      acc[vehicleNum] = {
                        containers: [],
                        container_types: [],
                        container_sizes: [],
                        total_charge: 0,
                      };
                    }
                    if (detail.container_no) {
                      acc[vehicleNum].containers.push(detail.container_no);
                      acc[vehicleNum].container_types.push(
                        detail.container_type || "N/A"
                      );
                      acc[vehicleNum].container_sizes.push(
                        detail.container_size || "N/A"
                      );
                    }
                    acc[vehicleNum].total_charge += parseFloat(
                      detail.total_charge || 0
                    );
                    return acc;
                  }, {});
                  transporterCache.set(shipment.id, transporterDetails);
                }
              }
              vehicleCharges = transporterDetails.reduce(
                (sum, detail) => sum + parseFloat(detail.total_charge || 0),
                0
              );
              vehicleCount = [
                ...new Set(transporterDetails.map((d) => d.vehicle_number)),
              ].length;
            } catch (error) {
              console.log(`No transporter details for shipment ${shipment.id}`);
            }

            const transactionData = await fetchTransactionData(shipment.id);
            const totalPaid = transactionData
              ? parseFloat(transactionData.total_paid || 0)
              : 0;
            const grNumber = transactionData?.gr_no || `GR-${shipment.id}`;
            const serviceCharges = parseFloat(shipment.requested_price || 0);
            const profitLoss = serviceCharges - vehicleCharges;
            const profitLossPercentage =
              serviceCharges > 0 ? (profitLoss / serviceCharges) * 100 : 0;
            const paymentStatus =
              totalPaid >= serviceCharges
                ? "Fully Paid"
                : totalPaid > 0
                ? "Partially Paid"
                : "Unpaid";
            const outstandingAmount = Math.max(0, serviceCharges - totalPaid);

            return {
              ...shipment,
              gr_no: grNumber,
              trip_no: `TRIP-${shipment.id}`,
              invoice_no: `INV-${new Date(
                shipment.created_at
              ).getFullYear()}-${String(shipment.id).padStart(4, "0")}`,
              shipa_no: shipment.SHIPA_NO || "N/A",
              container_numbers: transporterDetails
                .map((t) => t.container_no || "N/A")
                .filter(Boolean)
                .join(", "),
              service_charges: serviceCharges,
              vehicle_charges: vehicleCharges,
              profit_loss: profitLoss,
              profit_loss_percentage: profitLossPercentage,
              total_paid: totalPaid,
              outstanding_amount: outstandingAmount,
              payment_status: paymentStatus,
              vehicle_count: vehicleCount,
              transporter_details: transporterDetails,
              vehicle_container_mapping: vehicleContainerMapping,
              transaction_data: transactionData,
              customer_name:
                shipment.customer_name || `Customer ${shipment.customer_id}`,
              total_containers:
                (shipment.containers_20ft || 0) +
                (shipment.containers_40ft || 0),
              service_types: parseJSON(shipment.service_type, []),
              service_prices: parseJSON(shipment.service_prices, {}),
              formatted_request_id:
                shipment.formatted_request_id || `Booking #${shipment.id}`,
            };
          })
        );

        setReports(reportsWithDetails);
        setTotalPages(newTotalPages || 1);
        setCurrentPage(newCurrentPage || 1);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to fetch admin reports");
        setReports([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [transporterCache, requestsPerPage, requestId, shipaNo, containerNo]
  );

  const fetchTransactionData = async (requestId) => {
    try {
      const transactionResponse = await api.get(
        `/transactions/request/${requestId}`
      );
      if (
        transactionResponse.data.success &&
        transactionResponse.data.data.length > 0
      ) {
        return transactionResponse.data.data[0];
      }
      return null;
    } catch (error) {
      console.log(`No transaction data for shipment ${requestId}`);
      return null;
    }
  };

  const fetchTransporterDetails = useCallback(
    async (requestId) => {
      try {
        if (transporterCache.has(requestId)) {
          setTransporterDetails(transporterCache.get(requestId));
          return;
        }
        const response = await api.get(
          `/transport-requests/${requestId}/transporter`
        );
        if (response.data.success) {
          const details = Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data];
          setTransporterDetails(details);
          transporterCache.set(requestId, details);
        } else {
          setTransporterDetails(null);
        }
      } catch (error) {
        console.log("No transporter details found for request:", requestId);
        setTransporterDetails(null);
      }
    },
    [transporterCache]
  );

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
    setIsFiltered(true); // Enable filtered mode
  };

  const refreshData = () => {
    setRequestId("");
    setShipaNo("");
    setContainerNo("");
    setIsFiltered(false); // Reset to unfiltered mode
    setCurrentPage(1);
    setReports([]);
    setTotalPages(1);
    toast.success("Reports data refreshed successfully");
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      setUpdating(true);
      await api.put(`/transport-requests/${requestId}/status`, {
        status,
        adminComment: adminComment.trim(),
      });
      setShowDetailModal(false);
      fetchReports(currentPage, isFiltered); // Maintain current page and filter state
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update request status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async (report) => {
    try {
      const loadingToast = toast.loading("Generating invoice...");
      const response = await api.get(
        `/transport-requests/${report.id}/transporter`
      );
      const transporterDetails = response.data.success
        ? response.data.data
        : null;
      const doc = generateInvoice(report, transporterDetails);
      if (!doc) throw new Error("Failed to generate PDF document");
      const timestamp = new Date().toISOString().split("T")[0];
      doc.save(`invoice-${report.id}-${timestamp}.pdf`);
      toast.dismiss(loadingToast);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Invoice download error:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const handleReportClick = (report) => {
    if (report.customer_id === user.id) {
      toast.info("You cannot edit your own requests");
      return;
    }
    setSelectedReport(report);
    setSelectedRequest({
      id: report.id,
      customer_id: report.customer_id,
      SHIPA_NO: report.shipa_no || "",
      consignee: report.consignee || "",
      consigner: report.consigner || "",
      vehicle_type: report.vehicle_type || "",
      vehicle_size: report.vehicle_size || "",
      vehicle_status: report.vehicle_status || "Empty",
      no_of_vehicles: report.vehicle_count || "1",
      pickup_location: report.pickup_location || "",
      stuffing_location: report.stuffing_location || "",
      delivery_location: report.delivery_location || "",
      commodity: report.commodity || "",
      cargo_type: report.cargo_type || "",
      cargo_weight: parseFloat(report.cargo_weight) || 0,
      service_type: report.service_types || [],
      service_prices: report.service_prices || {},
      containers_20ft: parseInt(report.containers_20ft) || 0,
      containers_40ft: parseInt(report.containers_40ft) || 0,
      total_containers: parseInt(report.total_containers) || 0,
      expected_pickup_date: report.expected_pickup_date
        ? report.expected_pickup_date.split("T")[0]
        : "",
      expected_pickup_time: report.expected_pickup_time
        ? report.expected_pickup_time.slice(0, 5)
        : "",
      expected_delivery_date: report.expected_delivery_date
        ? report.expected_delivery_date.split("T")[0]
        : "",
      expected_delivery_time: report.expected_delivery_time
        ? report.expected_delivery_time.slice(0, 5)
        : "",
      requested_price: parseFloat(report.service_charges) || 0,
      status: report.status || "Pending",
      admin_comment: report.admin_comment || "",
    });
    setAdminComment(report.admin_comment || "");
    setShowDetailModal(true);
    fetchTransporterDetails(report.id);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setIsSubmitting(true);

    try {
      if (
        !selectedRequest.expected_pickup_date ||
        !selectedRequest.expected_delivery_date
      ) {
        toast.error("Pickup and delivery dates are required");
        return;
      }

      const isValidDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      };

      if (
        !isValidDate(selectedRequest.expected_pickup_date) ||
        !isValidDate(selectedRequest.expected_delivery_date)
      ) {
        toast.error("Invalid date format");
        return;
      }

      const formatTimeForDatabase = (timeString) => {
        if (!timeString) return null;
        return `${timeString.trim()}:00`;
      };

      const formData = {
        customer_id: selectedRequest.customer_id,
        SHIPA_NO: selectedRequest.SHIPA_NO?.trim() || "",
        consignee: selectedRequest.consignee?.trim() || "",
        consigner: selectedRequest.consigner?.trim() || "",
        vehicle_type: selectedRequest.vehicle_type || "",
        vehicle_size: selectedRequest.vehicle_size || "",
        vehicle_status: selectedRequest.vehicle_status || "Empty",
        no_of_vehicles: parseInt(selectedRequest.no_of_vehicles) || 1,
        pickup_location: selectedRequest.pickup_location?.trim() || "",
        stuffing_location: selectedRequest.stuffing_location?.trim() || "",
        delivery_location: selectedRequest.delivery_location?.trim() || "",
        commodity: selectedRequest.commodity?.trim() || "",
        cargo_type: selectedRequest.cargo_type || "",
        cargo_weight: parseFloat(selectedRequest.cargo_weight) || 0,
        service_type: JSON.stringify(selectedRequest.service_type || []),
        service_prices: JSON.stringify(selectedRequest.service_prices || {}),
        containers_20ft: parseInt(selectedRequest.containers_20ft) || 0,
        containers_40ft: parseInt(selectedRequest.containers_40ft) || 0,
        total_containers: parseInt(selectedRequest.total_containers) || 0,
        expected_pickup_date: selectedRequest.expected_pickup_date,
        expected_pickup_time: formatTimeForDatabase(
          selectedRequest.expected_pickup_time
        ),
        expected_delivery_date: selectedRequest.expected_delivery_date,
        expected_delivery_time: formatTimeForDatabase(
          selectedRequest.expected_delivery_time
        ),
        requested_price: parseFloat(selectedRequest.requested_price) || 0,
        status: selectedRequest.status || "Pending",
        admin_comment: selectedRequest.admin_comment?.trim() || "",
      };

      let response;
      if (selectedRequest.id) {
        if (selectedRequest.customer_id === user.id) {
          toast.error("You cannot edit your own requests");
          return;
        }
        response = await api.put(
          `/transport-requests/update/${selectedRequest.id}`,
          formData
        );
      } else {
        if (!formData.customer_id) {
          toast.error("Please select a customer for the new trip");
          return;
        }
        if (formData.customer_id === user.id) {
          toast.error("You cannot create a trip for yourself");
          return;
        }
        response = await api.post("/transport-requests/create", formData);
      }

      if (response.data.success) {
        toast.success(
          selectedRequest.id
            ? "Request updated successfully!"
            : "Trip created successfully!"
        );
        setSelectedRequest(null);
        setTransporterData({
          transporterName: "",
          vehicleNumber: "",
          driverName: "",
          driverContact: "",
          vendorName: "",
          vendorContact: "",
        });
        fetchReports(currentPage, isFiltered); // Maintain current filter state
      } else {
        toast.error(
          response.data.message ||
            (selectedRequest.id
              ? "Failed to update request"
              : "Failed to create trip")
        );
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error.response?.data?.message ||
          (selectedRequest.id
            ? "Failed to update request"
            : "Failed to create trip")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedRequest(null);
    setShowDetailModal(false);
    setTransporterDetails(null);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    fetchReports(currentPage, isFiltered);
  }, [currentPage, isFiltered]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Header */}
      <header className="bg-white shadow-sm flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleMobileMenu}
            className="text-gray-600 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative text-gray-600 hover:text-gray-800"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
                <div className="p-3 border-b">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="p-4 text-sm text-gray-500">
                  No new notifications
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={toggleUserMenu}
              className="flex items-center text-gray-700 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0) || <User className="h-5 w-5" />}
              </div>
              <span className="ml-2 hidden md:block">
                {user?.name || "Admin"}
              </span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                <div className="py-2 px-4 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </button>
                  <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage all requests and reports
              </p>
            </div>
            <button
              onClick={() => setSelectedRequest(initializeNewRequest())}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Trip
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Form and Transporter Details */}
            <div className="lg:col-span-3">
              {selectedRequest ? (
                <>
                  <ServiceRequestForm
                    requestData={selectedRequest}
                    setRequestData={setSelectedRequest}
                    handleSubmit={handleEditSubmit}
                    isSubmitting={isSubmitting}
                    handleCancelEdit={handleCancelEdit}
                    isCreateMode={!selectedRequest.id}
                  />
                  <TransporterDetails
                    transportRequestId={selectedRequest.id || null}
                    numberOfVehicles={selectedRequest.no_of_vehicles}
                    transporterData={transporterData}
                    setTransporterData={setTransporterData}
                    isEditMode={!!selectedRequest.id}
                    selectedServices={selectedRequest.service_type}
                    vehicleType={selectedRequest.vehicle_type}
                  />
                </>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                  Select a request from the list to edit or create a new trip
                </div>
              )}
            </div>

            {/* Right: Request List */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow h-fit">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">
                  All Requests
                </h3>
                <div className="mt-2 space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={requestId}
                      onChange={(e) => setRequestId(e.target.value)}
                      placeholder="Search by Request ID"
                      className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div class="relative">
                    <input
                      type="text"
                      value={shipaNo}
                      onChange={(e) => setShipaNo(e.target.value)}
                      placeholder="Search by SHIPA No"
                      className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <Search class="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div class="relative">
                    <input
                      type="text"
                      value={containerNo}
                      onChange={(e) => setContainerNo(e.target.value)}
                      placeholder="Search by Container No"
                      className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <Search class="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSearch}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={isLoading}
                    >
                      <Search className="h-5 w-5 mr-2" />
                      {isLoading ? "Searching..." : "Search"}
                    </button>
                    <button
                      onClick={refreshData}
                      className="p-2 text-gray-600 hover:text-gray-800"
                      title="Refresh"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {isLoading && reports.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">
                      {isFiltered
                        ? "No requests found matching your criteria"
                        : "No requests found"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => handleReportClick(report)}
                        className={`border rounded-lg p-3 transition-all duration-200 ${
                          report.customer_id === user.id
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:border-blue-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Booking #{report.id} - {report.customer_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(report.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <StatusBadge status={report.status} />
                            {report.status === "approved" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadInvoice(report);
                                }}
                                className="text-green-600 hover:text-green-800 p-1 rounded"
                                title="Download Invoice"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Vehicle:</span>
                            <span className="font-medium">
                              {report.vehicle_type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Charges:</span>
                            <span className="font-medium">
                              {formatCurrency(report.service_charges)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Profit/Loss:</span>
                            <span className="font-medium flex items-center">
                              {formatCurrency(report.profit_loss)}
                              <ProfitLossIndicator
                                profitLoss={report.profit_loss}
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1 || isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages || isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <RequestModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Request Details - Booking #${selectedReport.id}`}
        >
          <div className="p-6">{/* ... modal content ... */}</div>
        </RequestModal>
      )}
    </div>
  );
};

export default AdminManageRequest;
