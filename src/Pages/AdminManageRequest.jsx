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
  ShieldCheck,
  Activity,
  Layers,
  X,
  Briefcase,
  AlertCircle
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
    : "₹0";

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) : "N/A";

// Component for Status Badge
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-amber-100/80 text-amber-700 border-amber-200", label: "Pending" },
    approved: { color: "bg-emerald-100/80 text-emerald-700 border-emerald-200", label: "Approved" },
    "in progress": { color: "bg-blue-100/80 text-blue-700 border-blue-200", label: "In Progress" },
    completed: { color: "bg-indigo-100/80 text-indigo-700 border-indigo-200", label: "Completed" },
    rejected: { color: "bg-rose-100/80 text-rose-700 border-rose-200", label: "Rejected" },
  };
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${config.color} shadow-sm backdrop-blur-sm`}
    >
      {config.label}
    </span>
  );
};

const AdminManageRequest = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestId, setRequestId] = useState("");
  const [shipaNo, setShipaNo] = useState("");
  const [containerNo, setContainerNo] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [transporterDetails, setTransporterDetails] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [updating, setUpdating] = useState(false);
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
        const params = { page: page, limit: requestsPerPage };
        let endpoint = "/transport-requests/all";

        if (applyFilters) {
          if (!requestId && !shipaNo && !containerNo) {
            toast.info("Please enter search parameters.");
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
          requests = [],
          totalPages: newTotalPages = 1,
          currentPage: newCurrentPage = 1,
        } = response.data;

        const reportsWithDetails = await Promise.all(
          requests.map(async (shipment) => {
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
              payment_status: paymentStatus,
              vehicle_count: vehicleCount,
              transporter_details: transporterDetails,
              vehicle_container_mapping: vehicleContainerMapping,
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
        setTotalPages(newTotalPages);
        setCurrentPage(newCurrentPage);
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
      return null;
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setIsFiltered(true);
  };

  const refreshData = () => {
    setRequestId("");
    setShipaNo("");
    setContainerNo("");
    setIsFiltered(false);
    setCurrentPage(1);
    toast.success("Reports data refreshed successfully");
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
  };

  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      const pickupLocation = String(selectedRequest.pickup_location || "").trim();
      const deliveryLocation = String(selectedRequest.delivery_location || "").trim();
      if (!pickupLocation || !deliveryLocation) {
        toast.error("Pickup and delivery location are required.");
        return;
      }
      if (pickupLocation.toLowerCase() === deliveryLocation.toLowerCase()) {
        toast.error("Pickup and delivery location cannot be same.");
        return;
      }
      const formatTimeForDatabase = (timeString) => {
        if (!timeString) return null;
        return `${timeString.trim()}:00`;
      };
      const formData = {
        ...selectedRequest,
        pickup_location: pickupLocation,
        delivery_location: deliveryLocation,
        service_type: JSON.stringify(selectedRequest.service_type || []),
        service_prices: JSON.stringify(selectedRequest.service_prices || {}),
        expected_pickup_time: formatTimeForDatabase(selectedRequest.expected_pickup_time),
        expected_delivery_time: formatTimeForDatabase(selectedRequest.expected_delivery_time),
      };
      let response;
      if (selectedRequest.id) {
        response = await api.put(`/transport-requests/update/${selectedRequest.id}`, formData);
      } else {
        response = await api.post("/transport-requests/create", formData);
      }
      if (response.data.success) {
        toast.success("Saved successfully!");
        setSelectedRequest(null);
        fetchReports(currentPage, isFiltered);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedRequest(null);
  };

  useEffect(() => {
    fetchReports(currentPage, isFiltered);
  }, [currentPage, isFiltered, fetchReports]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      <ToastContainer position="top-right" autoClose={2000} />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 mb-8">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <ShieldCheck className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  Request <span className="text-indigo-600 tracking-tighter">Manager</span>
                </h1>
                <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                  <Activity size={14} className="text-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Track and Manage Requests</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRequest(initializeNewRequest())}
                className="h-11 px-6 rounded-xl bg-indigo-600 text-white flex items-center gap-2.5 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-300"
              >
                <Plus size={18} strokeWidth={3} />
                New Booking
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Area - Appears first on mobile */}
          <div className="lg:col-span-3 lg:order-2 space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-slate-200/60 shadow-xl shadow-slate-100/50 sticky top-[100px]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                  <Layers size={14} className="text-indigo-500" /> Request List
                </h4>
                <button onClick={refreshData} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                  <RefreshCw size={14} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Mini Filters */}
              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  placeholder="BOOKING ID"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                />
                <input
                  type="text"
                  placeholder="SHIPA NO"
                  value={shipaNo}
                  onChange={(e) => setShipaNo(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                />
                <button
                  onClick={handleSearch}
                  className="w-full h-10 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-lg shadow-slate-100"
                >
                  Apply Search
                </button>
              </div>

              {/* Request List */}
              <div className="space-y-3 max-h-[40vh] lg:max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => handleReportClick(report)}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                      selectedRequest?.id === report.id
                        ? "bg-indigo-50 border-indigo-200 shadow-md ring-4 ring-indigo-500/5"
                        : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                          #{report.id} • {report.customer_name}
                        </h4>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50/50 pt-3">
                      <StatusBadge status={report.status} />
                      <span className="text-[10px] font-black text-slate-900 tracking-tighter">
                        {formatCurrency(report.service_charges)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || isLoading}
                    className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 lg:order-1 space-y-8">
            {selectedRequest ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-xl shadow-slate-100/50">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                          {selectedRequest.id ? `Edit Request #${selectedRequest.id}` : 'New Request Form'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fill in the details for the request</p>
                      </div>
                    </div>
                    <button onClick={handleCancelEdit} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <ServiceRequestForm
                    requestData={selectedRequest}
                    setRequestData={setSelectedRequest}
                    handleSubmit={handleEditSubmit}
                    isSubmitting={isSubmitting}
                    handleCancelEdit={handleCancelEdit}
                  />
                </div>

                {selectedRequest.id && (
                  <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-xl shadow-slate-100/50">
                    <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                      <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                        <Truck size={24} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Assign Transporter & Vehicle</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Add transporter details for this request</p>
                      </div>
                    </div>
                    <TransporterDetails
                      transportRequestId={selectedRequest.id}
                      numberOfVehicles={selectedRequest.no_of_vehicles}
                      transporterData={transporterData}
                      setTransporterData={setTransporterData}
                      isEditMode={true}
                      selectedServices={selectedRequest.service_type}
                      vehicleType={selectedRequest.vehicle_type}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[32px] border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 mb-6">
                  <Briefcase size={40} />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">No Request Selected</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest italic max-w-xs text-center leading-relaxed">
                  Please select a request from the list or click 'New Booking' to start
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
        @keyframes zoom-in-95 {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
      `}} />
    </div>
  );
};

export default AdminManageRequest;
