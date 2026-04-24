import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Filter,
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
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Scale,
  X,
  Clock,
  Briefcase,
  Info,
  User,
  Phone,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/Api";
import { transporterAPI, transportRequestAPI } from "../utils/Api";
import { generateInvoice } from "../utils/pdfGenerator";
import InvoicePreviewModal from "../Components/InvoicePreviewModal";

const parseServiceType = (serviceType) => {
  if (!serviceType) return [];
  try {
    const parsed =
      typeof serviceType === "string" ? JSON.parse(serviceType) : serviceType;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error parsing service type:", e);
    return [];
  }
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const parseJSON = (data, defaultValue) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || defaultValue;
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return defaultValue;
  }
};

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) : "N/A";

const formatDateTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleString("en-IN") : "N/A";

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-amber-100/80 text-amber-700 border-amber-200", icon: Clock },
    approved: { color: "bg-blue-100/80 text-blue-700 border-blue-200", icon: ShieldCheck },
    "in progress": { color: "bg-indigo-100/80 text-indigo-700 border-indigo-200", icon: Truck },
    completed: { color: "bg-emerald-100/80 text-emerald-700 border-emerald-200", icon: Package },
    rejected: { color: "bg-rose-100/80 text-rose-700 border-rose-200", icon: X },
  };
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${config.color} backdrop-blur-sm`}>
      <Icon size={12} strokeWidth={2.5} />
      <span className="uppercase tracking-wider">{status || "Pending"}</span>
    </span>
  );
};

export default function AdminFilteredTransportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shipaNo, setShipaNo] = useState("");
  const [requestId, setRequestId] = useState("");
  const [containerNo, setContainerNo] = useState("");
  const [date, setDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [transporterDetails, setTransporterDetails] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [isInvoicePreviewModalOpen, setInvoicePreviewModalOpen] =
    useState(false);
  const [selectedReportForInvoice, setSelectedReportForInvoice] =
    useState(null);

  const exportToExcel = useCallback(() => {
    try {
      const loadingToast = toast.loading("Generating Excel report...");
      const data = requests.map((report) => ({
        "Request ID": report.id,
        "Tracking ID": report.tracking_id || "N/A",
        "GR No": report.gr_no,
        "Trip No": report.trip_no,
        "Invoice No": report.invoice_no,
        "SHIPA No": report.shipa_no,
        "Container Numbers": report.container_numbers,
        "Vehicle-Container Mapping":
          Object.entries(report.vehicle_container_mapping || {})
            .map(
              ([vehicle, info]) =>
                `${vehicle} (${info.transporter_name}): ${info.containers.join(
                  ", "
                )} [${info.container_types.join(
                  ", "
                )}/${info.container_sizes.join(", ")}]`
            )
            .join("; ") || "N/A",
        "Transporter Payments":
          report.transporter_payments &&
          Object.entries(report.transporter_payments)
            .map(([name, amount]) => `${name}: ${formatCurrency(amount)}`)
            .join("; "),
        "Customer Name": report.customer_name,
        "Customer Email": report.customer_email || "N/A",
        "Pickup Location": report.pickup_location || "N/A",
        "Delivery Location": report.delivery_location || "N/A",
        "Vehicle Type": report.vehicle_type || "N/A",
        Commodity: report.commodity || "N/A",
        Status: report.status,
        "Service Charges": report.service_charges,
        "Vehicle Charges": report.vehicle_charges,
        "Profit/Loss": report.profit_loss,
        "Profit %": report.profit_loss_percentage.toFixed(2),
        "Total Paid": report.total_paid,
        Outstanding: report.outstanding_amount,
        "Payment Status": report.payment_status,
        "Created Date": formatDate(report.created_at),
        "Delivery Date": formatDate(report.expected_delivery_date),
        "Containers 20ft": report.containers_20ft || 0,
        "Containers 40ft": report.containers_40ft || 0,
        "Total Containers": report.total_containers,
        "Cargo Weight": report.cargo_weight || 0,
        "Vehicle Count": report.vehicle_count,
      }));
      const sheetName = "Detailed Reports";
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(
        wb,
        `admin-reports-detailed-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.dismiss(loadingToast);
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.dismiss();
      toast.error("Failed to export report");
    }
  }, [requests]);

  const exportVehicleWiseExcel = useCallback(() => {
    try {
      const loadingToast = toast.loading(
        "Generating vehicle-wise Excel report..."
      );
      const data = [];
      requests.forEach((report) => {
        if (report.vehicle_container_mapping) {
          Object.entries(report.vehicle_container_mapping).forEach(
            ([vehicle, info]) => {
              data.push({
                "Request ID": report.id,
                "GR No": report.gr_no,
                "Trip No": report.trip_no,
                "Customer Name": report.customer_name,
                "Pickup Location": report.pickup_location,
                "Delivery Location": report.delivery_location,
                "Service Charge": report.service_charges,
                "Vehicle Number": vehicle,
                "Transporter Name": info.transporter_name,
                "Driver Name": info.driver_name,
                "Driver Phone": info.driver_phone,
                "Container Numbers": info.containers.join(", "),
                "Container Types": info.container_types.join(", "),
                "Container Sizes": info.container_sizes.join(", "),
                "Vehicle Charge": info.total_charge,
                "Additional Charges": info.additional_charges,
                "Advance Paid": info.vehicle_paid,
                Outstanding: info.vehicle_outstanding,
              });
            }
          );
        }
      });

      const sheetName = "Vehicle-wise Reports";
      const fileName = `admin-reports-vehicle-wise-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, fileName);
      toast.dismiss(loadingToast);
      toast.success("Vehicle-wise report exported successfully!");
    } catch (error) {
      console.error("Error exporting vehicle-wise report:", error);
      toast.dismiss();
      toast.error("Failed to export vehicle-wise report");
    }
  }, [requests]);

  const transporterCache = useMemo(() => new Map(), []);

  const calculateRequestTotalAmount = useCallback((containerDetails) => {
    if (!Array.isArray(containerDetails) || containerDetails.length === 0) {
      return 0;
    }
    const vehicleCharges = new Map();
    containerDetails.forEach((detail) => {
      if (detail.vehicle_number) {
        vehicleCharges.set(
          detail.vehicle_number,
          parseFloat(detail.total_charge || 0)
        );
      }
    });
    return Array.from(vehicleCharges.values()).reduce(
      (total, charge) => total + charge,
      0
    );
  }, []);

  const fetchTransactionData = useCallback(async (requestId) => {
    try {
      const response = await api.get(`/transactions/request/${requestId}`);
      if (response.data.success && response.data.data.length > 0) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.log(`No transaction data for shipment ${requestId}`);
      return null;
    }
  }, []);

  const fetchVehicleTransactions = useCallback(async (vehicleNumber) => {
    try {
      const response = await api.get(`/transactions/vehicle/${vehicleNumber}`);
      if (response.data.success && response.data.data.length > 0) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.log(`No transaction data for vehicle ${vehicleNumber}`);
      return [];
    }
  }, []);

  const fetchFilteredRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (shipaNo) params.shipa_no = shipaNo;
      if (requestId) params.request_id = requestId;
      if (containerNo) params.container_no = containerNo;
      if (date) params.date = date;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const response = await api.get("/transport-requests/filtered", {
        params,
      });

      const processedRequests = await Promise.all(
        (response.data.requests || []).map(async (shipment) => {
          let transporterDetails = [];
          let vehicleCharges = 0;
          let vehicleCount = 0;
          let vehicleContainerMapping = {};
          let containerNumbers = "";

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
                vehicleContainerMapping = details.reduce((acc, detail) => {
                  const vehicleNum = detail.vehicle_number || "Unknown";
                  if (!acc[vehicleNum]) {
                    acc[vehicleNum] = {
                      containers: [],
                      container_types: [],
                      container_sizes: [],
                      total_charge: parseFloat(detail.total_charge || 0),
                      additional_charges: parseFloat(
                        detail.additional_charges || 0
                      ),
                      driver_name: detail.driver_name || "N/A",
                      driver_phone: detail.driver_phone || "N/A",
                      transporter_name: detail.transporter_name || "N/A",
                    };
                  }

                  if (detail.container_no) {
                    if (
                      !acc[vehicleNum].containers.includes(detail.container_no)
                    ) {
                      acc[vehicleNum].containers.push(detail.container_no);
                      acc[vehicleNum].container_types.push(
                        detail.container_type || "N/A"
                      );
                      acc[vehicleNum].container_sizes.push(
                        detail.container_size || "N/A"
                      );
                    }
                  }

                  if (
                    detail.driver_name &&
                    acc[vehicleNum].driver_name === "N/A"
                  ) {
                    acc[vehicleNum].driver_name = detail.driver_name || "N/A";
                  }
                  if (
                    detail.driver_phone &&
                    acc[vehicleNum].driver_phone === "N/A"
                  ) {
                    acc[vehicleNum].driver_phone = detail.driver_phone || "N/A";
                  }
                  if (
                    detail.transporter_name &&
                    acc[vehicleNum].transporter_name === "N/A"
                  ) {
                    acc[vehicleNum].transporter_name =
                      detail.transporter_name || "N/A";
                  }
                  return acc;
                }, {});

                if (vehicleContainerMapping) {
                  for (const vehicle in vehicleContainerMapping) {
                    const info = vehicleContainerMapping[vehicle];
                    const vehicleTransactions = await fetchVehicleTransactions(
                      vehicle
                    );
                    let totalPaidForVehicle = 0;
                    if (vehicleTransactions.length > 0) {
                      totalPaidForVehicle = parseFloat(
                        vehicleTransactions[0].total_paid || 0
                      );
                    }
                    info.vehicle_paid = totalPaidForVehicle;
                    info.vehicle_outstanding =
                      info.total_charge - totalPaidForVehicle;
                  }
                }

                containerNumbers = details
                  .map((t) => t.container_no || "N/A")
                  .filter(Boolean)
                  .join(", ");
                const uniqueVehicles = [];
                const vehicleMap = new Map();
                details.forEach((detail) => {
                  if (
                    detail.vehicle_number &&
                    !vehicleMap.has(detail.vehicle_number)
                  ) {
                    vehicleMap.set(detail.vehicle_number, detail);
                    uniqueVehicles.push(detail);
                  }
                });
                transporterDetails = uniqueVehicles;
                transporterCache.set(shipment.id, transporterDetails);
              }
            }
            vehicleCharges = calculateRequestTotalAmount(transporterDetails);
            vehicleCount = [
              ...new Set(transporterDetails.map((d) => d.vehicle_number)),
            ].length;
          } catch (error) {
            console.log(`No transporter details for shipment ${shipment.id}`);
          }

          const transactionData = await fetchTransactionData(shipment.id);
          const totalPaid = transactionData
            ? transactionData.reduce(
                (sum, tx) => sum + parseFloat(tx.total_paid || 0),
                0
              )
            : 0;
          const grNumber = transactionData?.[0]?.gr_no || `GR-${shipment.id}`;
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
          const outstandingAmount = Math.max(0, vehicleCharges - totalPaid);

          const transporterPayments = {};
          if (vehicleContainerMapping) {
            Object.values(vehicleContainerMapping).forEach((info) => {
              const transporterName = info.transporter_name || "Unknown";
              if (!transporterPayments[transporterName]) {
                transporterPayments[transporterName] = 0;
              }
              transporterPayments[transporterName] += info.total_charge;
            });
          }

          return {
            ...shipment,
            gr_no: grNumber,
            trip_no: `TRIP-${shipment.id}`,
            invoice_no: `INV-${new Date(
              shipment.created_at
            ).getFullYear()}-${String(shipment.id).padStart(4, "0")}`,
            shipa_no: shipment.SHIPA_NO || "N/A",
            container_numbers: containerNumbers,
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
            transporter_payments: transporterPayments,
            transaction_data: transactionData,
            customer_name:
              shipment.customer_name || `Customer ${shipment.customer_id}`,
            total_containers:
              (shipment.containers_20ft || 0) + (shipment.containers_40ft || 0),
            service_types: parseJSON(shipment.service_type, []),
            service_prices: parseJSON(shipment.service_prices, {}),
            formatted_request_id:
              shipment.formatted_request_id || `Booking #${shipment.id}`,
          };
        })
      );
      setRequests(processedRequests);
    } catch (error) {
      toast.error("Failed to fetch transport requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [
    shipaNo,
    requestId,
    containerNo,
    date,
    fromDate,
    toDate,
    transporterCache,
    calculateRequestTotalAmount,
    fetchTransactionData,
    fetchVehicleTransactions,
  ]);

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
    if (
      !shipaNo &&
      !requestId &&
      !containerNo &&
      !date &&
      !fromDate &&
      !toDate
    ) {
      toast.info("Please enter at least one filter criterion to search.");
      setRequests([]);
      return;
    }
    fetchFilteredRequests();
  };

  const handleViewReport = async (report) => {
    setSelectedReport(report);
    setAdminComment(report.admin_comment || "");
    await fetchTransporterDetails(report.id);
    setShowDetailModal(true);
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      setUpdating(true);
      await api.put(`/transport-requests/${requestId}/status`, {
        status,
        adminComment: adminComment.trim(),
      });
      setShowDetailModal(false);
      fetchFilteredRequests();
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update request status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* Header Section */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <Filter className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  Parametric <span className="text-indigo-600 tracking-tighter">Filter</span>
                </h1>
                <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                  <Activity size={14} className="text-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Global Registry Lookup</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportToExcel}
                disabled={requests.length === 0}
                className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 font-bold text-[11px] uppercase tracking-wider disabled:opacity-50 transition-all duration-300"
              >
                <Download size={16} strokeWidth={2.5} />
                Detailed XLSX
              </button>
              <button
                onClick={exportVehicleWiseExcel}
                disabled={requests.length === 0}
                className="h-11 px-6 rounded-xl bg-indigo-600 text-white flex items-center gap-2.5 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-50 transition-all duration-300"
              >
                <Truck size={18} strokeWidth={3} />
                Vehicle-Wise XLSX
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Search Matrix */}
        <div className="bg-white rounded-[32px] p-8 mb-8 border border-slate-200/60 shadow-xl shadow-slate-100/50">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Layers size={14} className="text-indigo-500" /> Search Matrix
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative group">
              <input
                type="text"
                placeholder="SHIPA NO"
                value={shipaNo}
                onChange={(e) => setShipaNo(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 placeholder:text-slate-300"
              />
            </div>
            <div className="relative group">
              <input
                type="text"
                placeholder="REQUEST ID"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 placeholder:text-slate-300"
              />
            </div>
            <div className="relative group">
              <input
                type="text"
                placeholder="CONTAINER NO"
                value={containerNo}
                onChange={(e) => setContainerNo(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 placeholder:text-slate-300"
              />
            </div>
            <div className="relative group">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="flex items-center gap-2 lg:col-span-1">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-2xl px-3 text-[10px] font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300"
              />
              <span className="text-slate-300 font-bold text-[9px] uppercase tracking-tighter">TO</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-2xl px-3 text-[10px] font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="h-12 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Search size={16} strokeWidth={3} />
              )}
              Execute Search
            </button>
          </div>
        </div>

        {/* Filtered Registry Ledger */}
        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/60">
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entry Identity</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stakeholder Principal</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Configuration</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Path</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Yield Projection</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Audit</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {requests.map((request) => {
                  const serviceTypes = parseServiceType(request.service_type);
                  return (
                    <tr key={request.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px] font-black text-slate-900 tracking-tight uppercase">{request.formatted_request_id}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{formatDate(request.created_at)}</span>
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase self-start mt-2 tracking-tighter border border-indigo-100">SHIPA: {request.SHIPA_NO}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[180px]">{request.customer_name}</span>
                          <span className="text-[9px] font-bold text-slate-400 truncate max-w-[180px] italic underline">{request.customer_email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                            <Truck size={14} className="text-slate-400" /> {request.vehicle_type}
                            {request.vehicle_size && <span className="text-slate-400">/ {request.vehicle_size}</span>}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {serviceTypes.length > 0 ? (
                              serviceTypes.map((service, idx) => (
                                <span key={idx} className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase border border-blue-100">
                                  {service}
                                </span>
                              ))
                            ) : (
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Standard Service</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                            <span className="truncate max-w-[150px] uppercase tracking-tight">{request.pickup_location || "Source"}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                            <span className="truncate max-w-[150px] uppercase tracking-tight">{request.delivery_location || "Destination"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-[13px] font-black text-slate-900 tracking-tighter uppercase">{formatCurrency(request.requested_price)}</span>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-6 text-center">
                        <button
                          onClick={() => handleViewReport(request)}
                          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300 group-hover:shadow-xl shadow-slate-100"
                        >
                          <Eye size={20} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {requests.length === 0 && !loading && (
            <div className="py-32 flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
                <Search size={48} />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Registry Latent</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Initialize parametric search to retrieve entries</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Deep Audit Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowDetailModal(false)}
          ></div>
          
          <div className="relative w-full max-w-7xl max-h-[95vh] bg-[#F8FAFC]/95 border border-white/40 shadow-2xl rounded-[40px] overflow-hidden flex flex-col backdrop-blur-xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-950 p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
                    <ShieldCheck size={36} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-3xl font-black tracking-tight tracking-tighter uppercase">Registry Audit</h3>
                      <span className="px-4 py-1.5 bg-indigo-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-indigo-500/20">CORE ENTRY</span>
                    </div>
                    <div className="flex items-center gap-5 text-slate-400 text-[11px] font-bold tracking-widest uppercase">
                      <span className="flex items-center gap-2"><Layers size={16} /> ID: {selectedReport.formatted_request_id}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                      <span className="flex items-center gap-2"><Clock size={16} /> Logged: {formatDate(selectedReport.created_at)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 border border-white/10"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Information Columns */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Principal & Route */}
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                      <Briefcase size={16} className="text-indigo-500" /> Principal Intelligence
                    </h4>
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Authorized Entity</p>
                        <p className="text-[15px] font-black text-slate-900 uppercase tracking-tight leading-tight mb-3">{selectedReport.customer_name}</p>
                        <div className="flex flex-col gap-2">
                          <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 italic"><User size={12} className="text-slate-400" /> ID: {selectedReport.customer_id}</span>
                          <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 italic"><Phone size={12} className="text-slate-400" /> {selectedReport.customer_phone || "UNSPECIFIED"}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-6 pt-2">
                        <div className="relative pl-8">
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full shadow-sm shadow-blue-200"></div>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Origin Node</p>
                          <p className="text-[12px] font-black text-slate-800 uppercase leading-relaxed">{selectedReport.pickup_location}</p>
                        </div>
                        <div className="relative pl-8">
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full shadow-sm shadow-emerald-200"></div>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Terminal Node</p>
                          <p className="text-[12px] font-black text-slate-800 uppercase leading-relaxed">{selectedReport.delivery_location}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Metrics */}
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                      <Scale size={16} className="text-indigo-500" /> Operational Matrix
                    </h4>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="p-5 bg-slate-50 rounded-2xl flex flex-col gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fleet Unit</span>
                        <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{selectedReport.vehicle_type}</span>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl flex flex-col gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset Count</span>
                        <span className="text-[12px] font-black text-slate-900 tracking-tight">{selectedReport.vehicle_count} ACTIVE</span>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl flex flex-col gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cargo Payload</span>
                        <span className="text-[12px] font-black text-slate-900 tracking-tight">{selectedReport.cargo_weight || "0"} KG</span>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl flex flex-col gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Units</span>
                        <span className="text-[12px] font-black text-slate-900 tracking-tight">{selectedReport.total_containers} UNIT(S)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Controls & Details */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Financial Status Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Revenue Flow</span>
                        <div className="p-2 bg-emerald-50 rounded-xl"><ArrowUpRight className="text-emerald-500" size={18} /></div>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-emerald-600 tracking-tighter uppercase">{formatCurrency(selectedReport.requested_price)}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] italic underline">Gross Service Fee</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Fleet Cost</span>
                        <div className="p-2 bg-amber-50 rounded-xl"><Truck className="text-amber-500" size={18} /></div>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-amber-600 tracking-tighter uppercase">{formatCurrency(selectedReport.vehicle_charges)}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] italic underline">Operational Expenditure</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200/60 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Yield Delta</span>
                        <div className={`p-2 rounded-xl ${selectedReport.profit_loss >= 0 ? "bg-blue-50" : "bg-rose-50"}`}>
                          <Activity className={selectedReport.profit_loss >= 0 ? "text-blue-500" : "text-rose-500"} size={18} />
                        </div>
                      </div>
                      <div>
                        <p className={`text-3xl font-black tracking-tighter uppercase ${selectedReport.profit_loss >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                          {formatCurrency(selectedReport.profit_loss)}
                        </p>
                        <p className={`text-[10px] font-black uppercase mt-2 tracking-widest ${selectedReport.profit_loss >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {selectedReport.profit_loss_percentage.toFixed(2)}% MARGIN
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Administrative Comment Ledger */}
                  <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-200/60">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" /> Administrative Audit Commentary
                    </h4>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="ENTER AUDIT NOTES FOR THIS ENTRY..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-6 text-[12px] font-bold tracking-wider placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 min-h-[160px] uppercase leading-relaxed"
                    />
                  </div>

                  {/* Status Decision Terminal */}
                  <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-200/60">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-indigo-500" /> Registry Decision Terminal
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                      <button
                        onClick={() => handleStatusUpdate(selectedReport.id, 'approved')}
                        disabled={updating}
                        className="h-16 rounded-2xl bg-blue-50 text-blue-700 font-black text-[11px] uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm shadow-blue-100 active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 size={18} /> AUTHORIZE
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedReport.id, 'rejected')}
                        disabled={updating}
                        className="h-16 rounded-2xl bg-rose-50 text-rose-700 font-black text-[11px] uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm shadow-rose-100 active:scale-95 disabled:opacity-50"
                      >
                        <X size={18} /> REJECT
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedReport.id, 'in progress')}
                        disabled={updating}
                        className="h-16 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-[11px] uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm shadow-indigo-100 active:scale-95 disabled:opacity-50"
                      >
                        <Truck size={18} /> EXECUTE
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedReport.id, 'completed')}
                        disabled={updating}
                        className="h-16 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-[11px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm shadow-emerald-100 active:scale-95 disabled:opacity-50"
                      >
                        <Package size={18} /> FINALIZE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-10 border-t border-slate-200/60 bg-white flex items-center justify-between">
              <div className="flex items-center gap-4 text-slate-400">
                <ShieldCheck size={24} />
                <span className="text-[11px] font-black uppercase tracking-widest">Entry State Verified by Admin Protocol</span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="h-14 px-10 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95"
              >
                TERMINATE AUDIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        @keyframes zoom-in-95 {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
        .zoom-in-95 {
          animation-name: zoom-in-95;
        }
      `}} />

      {/* Reused Components */}
      {isInvoicePreviewModalOpen && selectedReportForInvoice && (
        <InvoicePreviewModal
          isOpen={isInvoicePreviewModalOpen}
          onClose={() => setInvoicePreviewModalOpen(false)}
          reportData={selectedReportForInvoice.report}
          transporterDetails={selectedReportForInvoice.transporterDetails}
        />
      )}
    </div>
  );
}
