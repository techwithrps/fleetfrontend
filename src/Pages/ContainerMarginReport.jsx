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
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/Api";
import { transporterAPI, transportRequestAPI } from "../utils/Api";

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
  if (!amount || amount === 0) return "Not specified";
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
  dateString ? new Date(dateString).toLocaleDateString() : "N/A";

const formatDateTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleString() : "N/A";

const StatusBadge = ({ status }) => {
  const STATUS_STYLES = {
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    approved: "bg-blue-50 text-blue-600 border-blue-100",
    "in progress": "bg-indigo-50 text-indigo-600 border-indigo-100",
    completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rejected: "bg-rose-50 text-rose-600 border-rose-100",
  };
  const style = STATUS_STYLES[status?.toLowerCase()] || STATUS_STYLES.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm ${style}`}>
      {status}
    </span>
  );
};

export default function ContainerMarginReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shipaNo, setShipaNo] = useState("");
  const [requestId, setRequestId] = useState("");
  const [containerNo, setContainerNo] = useState("");
  const [date, setDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const transporterCache = useMemo(() => new Map(), []);

  const calculateRequestTotalAmount = useCallback((containerDetails) => {
    if (!Array.isArray(containerDetails) || containerDetails.length === 0) return 0;
    const vehicleCharges = new Map();
    containerDetails.forEach((detail) => {
      if (detail.vehicle_number) vehicleCharges.set(detail.vehicle_number, parseFloat(detail.total_charge || 0));
    });
    return Array.from(vehicleCharges.values()).reduce((total, charge) => total + charge, 0);
  }, []);

  const fetchTransactionData = useCallback(async (requestId) => {
    try {
      const response = await api.get(`/transactions/request/${requestId}`);
      return (response.data.success && response.data.data.length > 0) ? response.data.data : null;
    } catch (error) { return null; }
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

      const response = await api.get("/transport-requests/filtered", { params });
      if (!response?.data?.success) {
        setReports([]);
        toast.error("Failed to load container margin report");
        return;
      }
      const containerReports = [];

      await Promise.all(
        (response.data.requests || []).map(async (shipment) => {
          let transporterDetails = [];
          let vehicleCharges = 0;
          let containerNumbers = [];

          try {
            if (transporterCache.has(shipment.id)) {
              transporterDetails = transporterCache.get(shipment.id);
              containerNumbers = transporterDetails
                .map((t) => t.container_no || t.CONTAINER_NO)
                .filter(Boolean);
            } else {
              const transporterResponse = await transporterAPI.getTransporterByRequestId(shipment.id);
              if (transporterResponse.success) {
                const details = Array.isArray(transporterResponse.data) ? transporterResponse.data : [transporterResponse.data];
                containerNumbers = details
                  .map((t) => t.container_no || t.CONTAINER_NO)
                  .filter(Boolean);
                const vehicleMap = new Map();
                const uniqueVehicles = [];
                details.forEach((detail) => {
                  if (detail.vehicle_number && !vehicleMap.has(detail.vehicle_number)) {
                    vehicleMap.set(detail.vehicle_number, detail);
                    uniqueVehicles.push(detail);
                  }
                });
                transporterDetails = uniqueVehicles;
                transporterCache.set(shipment.id, transporterDetails);
              }
            }
            vehicleCharges = calculateRequestTotalAmount(transporterDetails);
          } catch (error) {}

          if (containerNumbers.length === 0) {
            const fallbackContainer =
              shipment.container_no ||
              shipment.CONTAINER_NO ||
              shipment.container_number ||
              shipment.CONTAINER_NUMBER;
            containerNumbers = fallbackContainer ? [fallbackContainer] : ["N/A"];
          }

          const transactionData = await fetchTransactionData(shipment.id);
          const totalPaid = transactionData ? transactionData.reduce((sum, tx) => sum + parseFloat(tx.total_paid || 0), 0) : 0;
          const serviceCharges = parseFloat(shipment.requested_price || 0);
          const totalContainers = (shipment.containers_20ft || 0) + (shipment.containers_40ft || 0);

          const serviceChargePerContainer = totalContainers > 0 ? serviceCharges / totalContainers : serviceCharges;
          const vehicleChargePerContainer = totalContainers > 0 ? vehicleCharges / totalContainers : vehicleCharges;
          const marginPerContainer = serviceChargePerContainer - vehicleChargePerContainer;
          const marginPercentage = serviceChargePerContainer > 0 ? (marginPerContainer / serviceChargePerContainer) * 100 : 0;

          containerNumbers.forEach((containerNo) => {
            containerReports.push({
              ...shipment,
              sr_no: containerReports.length + 1,
              container_no: containerNo,
              service_charges: serviceChargePerContainer,
              vehicle_charges: vehicleChargePerContainer,
              margin: marginPerContainer,
              margin_percentage: marginPercentage,
              total_paid: totalPaid,
              assigner_name: transporterDetails[0]?.driver_name || transporterDetails[0]?.transporter_name || "N/A",
              customer_name: shipment.customer_name || `Customer ${shipment.customer_id}`,
            });
          });
        })
      );
      setReports(containerReports);
    } catch (error) {
      toast.error("Audit failed");
    } finally {
      setLoading(false);
    }
  }, [shipaNo, requestId, containerNo, date, fromDate, toDate, transporterCache, calculateRequestTotalAmount, fetchTransactionData]);

  useEffect(() => {
    fetchFilteredRequests();
  }, []);

  const exportToExcel = useCallback(() => {
    try {
      const data = reports.map((r, i) => ({
        "Sr. No.": i + 1,
        "Container No": r.container_no,
        From: r.pickup_location || "N/A",
        To: r.delivery_location || "N/A",
        "Assigner": r.assigner_name,
        "Rate": r.service_charges,
        "Margin %": r.margin_percentage.toFixed(2),
        "Cost": r.vehicle_charges,
        "Margin": r.margin,
        "Status": r.status,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "MarginAudit");
      XLSX.writeFile(wb, `MarginAudit_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Audit Exported");
    } catch (e) { toast.error("Export failure"); }
  }, [reports]);

  const totalMargin = reports.reduce((sum, r) => sum + (r.margin || 0), 0);
  const totalServiceCharges = reports.reduce((sum, r) => sum + (r.service_charges || 0), 0);
  const totalVendorCosts = reports.reduce((sum, r) => sum + (r.vehicle_charges || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                Yield Intelligence Audit
              </h1>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">
                Container-level Margin Analysis & Resource Profitability
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => exportToExcel()} className="btn-action px-6 py-2 flex items-center gap-2 bg-emerald-600 border-emerald-600 hover:bg-emerald-700">
                <Download className="w-3.5 h-3.5" />
                Strategic Export
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card-premium p-5 border-l-4 border-l-primary bg-blue-50/30">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 text-primary/80">Operational Revenue</p>
            <p className="text-2xl font-display font-bold text-primary">₹{totalServiceCharges.toLocaleString()}</p>
          </div>
          <div className="card-premium p-5 border-l-4 border-l-orange-500 bg-orange-50/30">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 text-orange-700/80">Asset Expenditure</p>
            <p className="text-2xl font-display font-bold text-orange-700">₹{totalVendorCosts.toLocaleString()}</p>
          </div>
          <div className="card-premium p-5 border-l-4 border-l-emerald-500 bg-emerald-50/30">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 text-emerald-700/80">Net Yield</p>
            <p className="text-2xl font-display font-bold text-emerald-700">₹{totalMargin.toLocaleString()}</p>
          </div>
          <div className="card-premium p-5 bg-indigo-50/30 border-l-4 border-l-indigo-500">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 text-indigo-700/80">Efficiency Ratio</p>
            <p className="text-2xl font-display font-bold text-indigo-700">{totalServiceCharges > 0 ? ((totalMargin / totalServiceCharges) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>

        <div className="card-premium p-6 bg-white/80 backdrop-blur-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Shipa No</label>
              <input type="text" value={shipaNo} onChange={(e) => setShipaNo(e.target.value)} className="input-clean w-full py-2 text-[11px]" placeholder="Analyze SHIPA..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Request ID</label>
              <input type="text" value={requestId} onChange={(e) => setRequestId(e.target.value)} className="input-clean w-full py-2 text-[11px]" placeholder="ID lookup..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Container</label>
              <input type="text" value={containerNo} onChange={(e) => setContainerNo(e.target.value)} className="input-clean w-full py-2 text-[11px]" placeholder="Unit identification..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Snapshot</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-clean w-full py-2 text-[11px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Interval Start</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-clean w-full py-2 text-[11px]" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Interval End</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-clean w-full py-2 text-[11px]" />
              </div>
              <button onClick={() => fetchFilteredRequests()} className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-lg shadow-primary/20">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="card-premium overflow-hidden bg-white shadow-xl shadow-slate-200/40">
          <div className="bg-slate-50/80 px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-primary/60" />
              <h3 className="text-[12px] font-bold text-foreground uppercase tracking-widest">Margin Ledger</h3>
            </div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">Audit Stream: <span className="text-foreground">{reports.length} Verified Entries</span></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-border">
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">Unit Fingerprint</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">Logistics Path</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">Assigner</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest text-right">Service Value</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest text-right">Asset Cost</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest text-right">Yield (%)</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest text-right">Net Margin</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {reports.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-400">{(i + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-foreground uppercase tracking-tight">{r.container_no}</span>
                        <span className="text-[9px] font-bold text-primary/70 uppercase">REF: {r.shipa_no}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                        <span className="truncate max-w-[80px]">{r.pickup_location || "N/A"}</span>
                        <ChevronRight className="w-3 h-3 opacity-30" />
                        <span className="truncate max-w-[80px]">{r.delivery_location || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate max-w-[120px] block">{r.assigner_name}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[11px] font-bold text-slate-700">₹{r.service_charges.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[11px] font-bold text-orange-600">₹{r.vehicle_charges.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[11px] font-bold ${r.margin_percentage >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {r.margin_percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right bg-slate-50/30">
                      <span className={`text-[11px] font-bold ${r.margin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        ₹{r.margin.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reports.length === 0 && !loading && (
            <div className="p-20 flex flex-col items-center justify-center opacity-30">
              <Package className="w-12 h-12 mb-4" />
              <p className="text-[11px] font-bold uppercase tracking-widest">Null Audit State</p>
            </div>
          )}
          {loading && (
            <div className="p-20 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Aggregating Financial Dimensions...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
