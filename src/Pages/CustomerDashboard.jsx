import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { generateInvoice } from "../utils/pdfGenerator";
import ServiceRequestForm from "../Components/dashboard/Servicerequest";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";
import api, { transporterAPI, alertAPI } from "../utils/Api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import StatsCards from "../Components/dashboard/StatCards";
import { TransporterDetails } from "./Transporterdetails";
import { transportRequestAPI } from "../utils/Api"; // Import the provided API

export default function CustomerDashboard({
  collapsed,
  toggleSidebar,
  activePage,
  setActivePage,
  mobileMenuOpen,
  toggleMobileMenu,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expiryAlerts, setExpiryAlerts] = useState({
    days: 10,
    vehicleExpiries: [],
    driverExpiries: [],
  });
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [requestData, setRequestData] = useState({
    id: null,
    SHIPA_NO: "",
    consignee: "",
    consigner: "",
    vehicle_type: "",
    vehicle_size: "",
    containers_20ft: 0,
    containers_40ft: 0,
    total_containers: 0,
    pickup_location: "",
    stuffing_location: "",
    delivery_location: "",
    commodity: "",
    cargo_type: "",
    cargo_weight: "",
    service_type: [],
    service_prices: {},
    expected_pickup_date: "",
    expected_pickup_time: "",
    expected_delivery_date: "",
    expected_delivery_time: "",
    requested_price: "",
    status: "Pending",
    admin_comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastRequests, setPastRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [requestsPerPage] = useState(10);
  const [transporterData, setTransporterData] = useState({
    transporterName: "",
    vehicleNumber: "",
    driverName: "",
    driverContact: "",
    vendorName: "",
    vendorContact: "",
  });

  // Filtering states
  const [requestId, setRequestId] = useState("");
  const [shipaNo, setShipaNo] = useState("");
  const [containerNo, setContainerNo] = useState("");
  const [consigner, setConsigner] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const transporterCache = useMemo(() => new Map(), []);

  const fetchRequests = useCallback(
    async (page, applyFilters = false) => {
      setLoading(true);
      try {
        const params = { page, limit: requestsPerPage, customer_id: user.id };
        let endpoint = "/transport-requests/all"; // Default endpoint

        if (applyFilters) {
          if (!requestId && !shipaNo && !containerNo && !consigner) {
            toast.info(
              "Please enter a Request ID, SHIPA No, Container No, or Consigner to search."
            );
            setPastRequests([]);
            setTotalPages(1);
            setLoading(false);
            return;
          }
          endpoint = "/transport-requests/filtered";
          if (requestId) params.request_id = requestId;
          if (shipaNo) params.shipa_no = shipaNo;
          if (containerNo) params.container_no = containerNo;
          if (consigner) params.consigner = consigner;
        }

        const response = await api.get(endpoint, { params });
        const {
          requests,
          totalPages: newTotalPages,
          currentPage: newCurrentPage,
        } = response.data;

        const requestsWithContainers = await Promise.all(
          (requests || []).map(async (request) => {
            try {
              const containerResponse =
                await transporterAPI.getContainersByRequestId(request.id);
              return {
                ...request,
                containerDetails:
                  containerResponse.success && containerResponse.data
                    ? containerResponse.data
                    : [],
              };
            } catch (error) {
              console.error(
                `Error fetching containers for request ${request.id}:`,
                error
              );
              return { ...request, containerDetails: [] };
            }
          })
        );

        setPastRequests(requestsWithContainers);
        setTotalPages(newTotalPages || 1);
        setCurrentPage(newCurrentPage || 1);
      } catch (error) {
        console.error("Fetch requests error:", error);
        toast.error(error.message || "Failed to fetch requests");
        setPastRequests([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [user.id, requestsPerPage, requestId, shipaNo, containerNo, consigner]
  );

  const fetchExpiryAlerts = useCallback(async () => {
    try {
      setExpiryLoading(true);
      const response = await alertAPI.getExpiryAlerts(10);
      if (response.success) {
        setExpiryAlerts(response.data || {});
      }
    } catch (error) {
      console.error("Expiry alerts error:", error);
      toast.error(error.message || "Failed to load expiry alerts");
    } finally {
      setExpiryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(currentPage, isFiltered);
  }, [currentPage, isFiltered]);

  useEffect(() => {
    fetchExpiryAlerts();
  }, [fetchExpiryAlerts]);

  const formatExpiryLabel = (type) => {
    const labels = {
      INSURANCE_VALIDITY: "Insurance",
      PERMIT_VALIDITY: "Permit",
      STATE_PERMIT_VALIDITY: "State Permit",
      POLLUTION_VALIDITY: "Pollution",
      ROAD_TAX_VALIDITY: "Road Tax",
      FITNESS_VALIDITY: "Fitness",
    };
    return labels[type] || type;
  };

  const formatExpiryDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "N/A";

  const handleSearch = () => {
    setCurrentPage(1);
    setIsFiltered(true);
    // fetchRequests will be called by the useEffect
  };

  const refreshData = () => {
    setRequestId("");
    setShipaNo("");
    setContainerNo("");
    setConsigner("");
    setIsFiltered(false);
    setCurrentPage(1);
    // fetchRequests will be called by the useEffect
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (
        !requestData.expected_pickup_date ||
        !requestData.expected_delivery_date
      ) {
        toast.error("Expected pickup and delivery dates are required");
        return;
      }
      const isValidDate = (dateString) =>
        !isNaN(new Date(dateString).getTime());
      if (
        !isValidDate(requestData.expected_pickup_date) ||
        !isValidDate(requestData.expected_delivery_date)
      ) {
        toast.error("Invalid date format");
        return;
      }
      const formatTimeForDatabase = (timeString) =>
        timeString ? `${timeString.trim()}:00` : null;
      const formData = {
        SHIPA_NO: requestData.SHIPA_NO?.trim() || "",
        consignee: requestData.consignee.trim(),
        consigner: requestData.consigner.trim(),
        vehicle_type: requestData.vehicle_type,
        vehicle_size: requestData.vehicle_size,
        vehicle_status: requestData.vehicle_status,
        no_of_vehicles: parseInt(requestData.no_of_vehicles) || 1,
        pickup_location: requestData.pickup_location.trim(),
        stuffing_location: requestData.stuffing_location.trim(),
        delivery_location: requestData.delivery_location.trim(),
        commodity: requestData.commodity.trim(),
        cargo_type: requestData.cargo_type,
        cargo_weight: parseFloat(requestData.cargo_weight) || 0,
        service_type: JSON.stringify(requestData.service_type),
        service_prices: JSON.stringify(requestData.service_prices),
        containers_20ft: parseInt(requestData.containers_20ft) || 0,
        containers_40ft: parseInt(requestData.containers_40ft) || 0,
        total_containers: parseInt(requestData.total_containers) || 0,
        expected_pickup_date: requestData.expected_pickup_date,
        expected_pickup_time: formatTimeForDatabase(
          requestData.expected_pickup_time
        ),
        expected_delivery_date: requestData.expected_delivery_date,
        expected_delivery_time: formatTimeForDatabase(
          requestData.expected_delivery_time
        ),
        requested_price: parseFloat(requestData.requested_price) || 0,
        status: "Pending",
      };
      const isUpdate = Boolean(requestData.id);
      const response = isUpdate
        ? await transportRequestAPI.updateRequest(requestData.id, formData)
        : await transportRequestAPI.createRequest(formData);
      if (response.success) {
        toast.success(
          isUpdate
            ? "Request updated successfully!"
            : "Request created successfully!"
        );
        const requestId = isUpdate ? requestData.id : response.request?.id;
        if (requestId && !isUpdate && response.request) {
          const newRequest = response.request;
          setRequestData({
            id: newRequest.id,
            SHIPA_NO: newRequest.SHIPA_NO || "",
            consignee: newRequest.consignee || "",
            consigner: newRequest.consigner || "",
            vehicle_type: newRequest.vehicle_type || "",
            vehicle_size: newRequest.vehicle_size || "",
            vehicle_status: newRequest.vehicle_status || "Empty",
            no_of_vehicles: newRequest.no_of_vehicles || "1",
            pickup_location: newRequest.pickup_location || "",
            stuffing_location: newRequest.stuffing_location || "",
            delivery_location: newRequest.delivery_location || "",
            commodity: newRequest.commodity || "",
            cargo_type: newRequest.cargo_type || "",
            cargo_weight: parseFloat(newRequest.cargo_weight) || 0,
            service_type: Array.isArray(newRequest.service_type)
              ? newRequest.service_type
              : JSON.parse(newRequest.service_type || "[]"),
            service_prices:
              typeof newRequest.service_prices === "string"
                ? JSON.parse(newRequest.service_prices)
                : newRequest.service_prices || {},
            containers_20ft: parseInt(newRequest.containers_20ft) || 0,
            containers_40ft: parseInt(newRequest.containers_40ft) || 0,
            total_containers: parseInt(newRequest.total_containers) || 0,
            expected_pickup_date: newRequest.expected_pickup_date
              ? newRequest.expected_pickup_date.split("T")[0]
              : "",
            expected_delivery_date: newRequest.expected_delivery_date
              ? newRequest.expected_delivery_date.split("T")[0]
              : "",
            expected_pickup_time: newRequest.expected_pickup_time
              ? newRequest.expected_pickup_time.slice(0, 5)
              : "",
            expected_delivery_time: newRequest.expected_delivery_time
              ? newRequest.expected_delivery_time.slice(0, 5)
              : "",
            requested_price: parseFloat(newRequest.requested_price) || 0,
            status: newRequest.status || "Pending",
            admin_comment: newRequest.admin_comment || "",
          });
          toast.info(`Booking #${requestId} is now loaded for editing`);
        }
        fetchRequests(currentPage, isFiltered); // Refresh current page
      } else {
        toast.error(response.message || "Failed to submit request");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error.message ||
          "Failed to submit request. Please check all fields and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setRequestData({
      id: null,
      SHIPA_NO: "",
      consignee: "",
      consigner: "",
      vehicle_type: "",
      vehicle_size: "",
      vehicle_status: "Empty",
      containers_20ft: 0,
      containers_40ft: 0,
      no_of_vehicles: "",
      total_containers: 0,
      pickup_location: "",
      stuffing_location: "",
      delivery_location: "",
      commodity: "",
      cargo_type: "",
      cargo_weight: "",
      service_type: [],
      service_prices: {},
      expected_pickup_date: "",
      expected_pickup_time: "",
      expected_delivery_date: "",
      expected_delivery_time: "",
      requested_price: "",
      status: "Pending",
      admin_comment: "",
    });
  };

  const canEditRequest = (status) => status.toLowerCase() !== "completed";

  const handleRequestClick = (request) => {
    if (canEditRequest(request.status)) {
      setRequestData({
        id: request.id,
        SHIPA_NO: request.SHIPA_NO || "",
        consignee: request.consignee || "",
        consigner: request.consigner || "",
        vehicle_type: request.vehicle_type || "",
        vehicle_size: request.vehicle_size || "",
        vehicle_status: request.vehicle_status || "Empty",
        no_of_vehicles: request.no_of_vehicles || "1",
        pickup_location: request.pickup_location || "",
        stuffing_location: request.stuffing_location || "",
        delivery_location: request.delivery_location || "",
        commodity: request.commodity || "",
        cargo_type: request.cargo_type || "",
        cargo_weight: parseFloat(request.cargo_weight) || 0,
        service_type: Array.isArray(request.service_type)
          ? request.service_type
          : JSON.parse(request.service_type || "[]"),
        service_prices:
          typeof request.service_prices === "string"
            ? JSON.parse(request.service_prices)
            : request.service_prices || {},
        containers_20ft: parseInt(request.containers_20ft) || 0,
        containers_40ft: parseInt(request.containers_40ft) || 0,
        total_containers: parseInt(request.total_containers) || 0,
        expected_pickup_date: request.expected_pickup_date
          ? request.expected_pickup_date.split("T")[0]
          : "",
        expected_delivery_date: request.expected_delivery_date
          ? new Date(request.expected_delivery_date).toISOString().split("T")[0]
          : "",
        requested_price: parseFloat(request.requested_price) || 0,
        status: request.status || "Pending",
        admin_comment: request.admin_comment || "",
      });
      document
        .querySelector(".request-form")
        ?.scrollIntoView({ behavior: "smooth" });
      toast.info("Request loaded for editing");
    } else {
      toast.info("Completed requests cannot be edited");
    }
  };

  const handleDownloadInvoice = (request) => {
    try {
      const loadingToast = toast.loading("Generating invoice...");
      const doc = generateInvoice(request);
      if (!doc) throw new Error("Failed to generate PDF document");
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `invoice-${request.id}-${timestamp}.pdf`;
      doc.save(filename);
      toast.dismiss(loadingToast);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Invoice download error:", error);
      toast.error("Failed to generate invoice. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Completed: {
        bg: "bg-green-100",
        text: "text-green-700",
        dot: "bg-green-500",
      },
      "In Progress": {
        bg: "bg-blue-100",
        text: "text-blue-700",
        dot: "bg-blue-500",
      },
      Pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        dot: "bg-yellow-500",
      },
    };
    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-500",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <span className={`w-2 h-2 rounded-full mr-1 ${config.dot}`}></span>
        {status}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 -m-6 p-6 font-inter">
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

      <main className="flex-1 overflow-auto rounded-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Welcome back to <span className="text-emerald-600 font-bold">{sessionStorage.getItem("selectedLocationName") || "Terminal"}</span>, <span className="text-blue-600">{user?.name || "Customer"}</span>! Request services and manage your shipments efficiently.
            </p>
          </div>
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
              <div className="p-1 border-b border-indigo-50/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>
              <ServiceRequestForm
                requestData={requestData}
                setRequestData={setRequestData}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                handleCancelEdit={handleCancelEdit}
              />
              <TransporterDetails
                transportRequestId={requestData.id}
                transporterData={transporterData}
                setTransporterData={setTransporterData}
                isEditMode={Boolean(requestData.id)}
                selectedServices={requestData.service_type}
                vehicleType={requestData.vehicle_type}
              />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-5 rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-400 to-orange-400"></div>
                <div className="ml-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 shrink-0">
                    Expiry Alerts
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Next {expiryAlerts.days || 10} Days</span>
                  </h3>
                  
                  {expiryLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Vehicles */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vehicles Alerts</p>
                        {expiryAlerts.vehicleExpiries?.length ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {expiryAlerts.vehicleExpiries.slice(0, 6).map((item, idx) => (
                              <div
                                key={`${item.EQUIPMENT_ID}-${item.EXPIRY_TYPE}-${idx}`}
                                className="group flex flex-col gap-1 text-[11px] bg-rose-50/50 border border-rose-100/50 p-2 rounded-xl hover:bg-rose-50 hover:border-rose-100 transition-all"
                              >
                                <div className="font-bold text-rose-900 flex items-center justify-between">
                                  {item.EQUIPMENT_NO || "Vehicle"}
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                                </div>
                                <div className="text-rose-600 font-medium">
                                  {formatExpiryLabel(item.EXPIRY_TYPE)} • {formatExpiryDate(item.EXPIRY_DATE)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                            No vehicle expiries found.
                          </div>
                        )}
                      </div>

                      {/* Drivers */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Driver Alerts</p>
                        {expiryAlerts.driverExpiries?.length ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {expiryAlerts.driverExpiries.slice(0, 6).map((item, idx) => (
                              <div
                                key={`${item.DRIVER_ID}-${idx}`}
                                className="group flex flex-col gap-1 text-[11px] bg-amber-50/50 border border-amber-100/50 p-2 rounded-xl hover:bg-amber-50 hover:border-amber-100 transition-all"
                              >
                                <div className="font-bold text-amber-900 flex items-center justify-between">
                                  {item.DRIVER_NAME || "Driver"}
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                </div>
                                <div className="text-amber-600 font-medium">
                                  License • {formatExpiryDate(item.EXPIRY_DATE)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                            No driver expiries found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                
                {/* Search Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                       <Search className="w-4 h-4 text-blue-600" />
                       Track Activity
                    </h3>
                    <button
                      onClick={refreshData}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Request / SHIPA</label>
                      <input
                        type="text"
                        value={requestId || shipaNo}
                        onChange={(e) => {
                          setRequestId(e.target.value);
                          setShipaNo(e.target.value);
                        }}
                        placeholder="Search ID or SHIPA..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Container</label>
                      <input
                        type="text"
                        value={containerNo}
                        onChange={(e) => setContainerNo(e.target.value)}
                        placeholder="Container No..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      className="w-full py-2.5 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-all shadow-sm flex items-center justify-center gap-2 mt-1 active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      Search Requests
                    </button>
                  </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 bg-white overflow-hidden flex flex-col min-h-0">
                  <div className="p-4 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pastRequests.length === 0 ? (
                          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                               <Search className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-xs font-semibold text-slate-400">
                              {isFiltered ? "No matching requests found" : "Your shipment history is empty"}
                            </p>
                          </div>
                        ) : (
                          pastRequests.map((request) => (
                            <div
                              key={request.id}
                              onClick={() => handleRequestClick(request)}
                              className={`group relative bg-white border border-slate-100 rounded-2xl p-4 transition-all duration-300 ${
                                canEditRequest(request.status)
                                  ? "cursor-pointer hover:border-blue-200 hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                                  : "cursor-not-allowed opacity-75"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-800 tracking-tight">#{request.id}</span>
                                    {getStatusBadge(request.status)}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                                    {new Date(request.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
                                  </p>
                                </div>
                                {request.status?.toLowerCase() === "approved" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadInvoice(request);
                                    }}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Route</span>
                                  <span className="text-[10px] font-semibold text-slate-700 truncate block">{request.vehicle_type}</span>
                                </div>
                                <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Service</span>
                                  <div className="truncate">
                                    {(() => {
                                      try {
                                        const services = JSON.parse(request.service_type || "[]");
                                        const serviceArray = Array.isArray(services) ? services : [String(services)];
                                        return <span className="text-[10px] font-bold text-blue-600 line-clamp-1">{serviceArray[0] || "Standard"}</span>;
                                      } catch (e) { return <span className="text-[10px] font-bold text-slate-400">N/A</span>; }
                                    })()}
                                  </div>
                                </div>
                              </div>

                              {request.containerDetails && request.containerDetails.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100/60 overflow-hidden">
                                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                    {request.containerDetails.slice(0, 3).map((container) => (
                                      <span
                                        key={container.id}
                                        className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap shadow-sm"
                                      >
                                        {container.container_no}
                                      </span>
                                    ))}
                                    {request.containerDetails.length > 3 && (
                                      <span className="text-[9px] font-bold text-slate-400 ml-1">+{request.containerDetails.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Footer Pagination */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage}/{totalPages}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || loading}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages || loading}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
