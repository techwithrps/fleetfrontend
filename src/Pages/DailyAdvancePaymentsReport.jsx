import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Truck,
  FileText,
  RefreshCw,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Activity,
  Layers,
  ShieldCheck
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import api from "../utils/Api";

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) : "N/A";

const StatusBadge = ({ status }) => {
  const STATUS_STYLES = {
    pending: "bg-amber-100/80 text-amber-700 border-amber-200",
    approved: "bg-blue-100/80 text-blue-700 border-blue-200",
    "in progress": "bg-indigo-100/80 text-indigo-700 border-indigo-200",
    completed: "bg-emerald-100/80 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100/80 text-rose-700 border-rose-200",
  };
  const style = STATUS_STYLES[status?.toLowerCase()] || STATUS_STYLES.pending;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${style} backdrop-blur-sm`}>
      {status || "Pending"}
    </span>
  );
};

export default function DailyAdvancePaymentsReport() {
  const [advanceData, setAdvanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [singleDate, setSingleDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterType, setFilterType] = useState("singleDate");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [neftReference, setNeftReference] = useState("");

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchAdvancePayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType === "singleDate" && singleDate) params.date = singleDate;
      else if (filterType === "dateRange") {
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
      }
      const response = await api.get("/transactions/daily-advances", { params });
      if (response.data.success) {
        const fetchedData = response.data.data;
        const updatedData = {};
        for (const date in fetchedData) {
          const transactions = fetchedData[date];
          const transactionsWithDetails = await Promise.all(
            transactions.map(async (transaction) => {
              let requested_price = 0;
              let request_details = null;
              let vehicle_charges = [];
              let total_vehicle_charges = 0;
              try {
                const requestResponse = await api.get("/transport-requests/filtered", {
                  params: { request_id: transaction.request_id },
                });
                if (requestResponse.data.success && requestResponse.data.requests.length > 0) {
                  const request = requestResponse.data.requests[0];
                  requested_price = request.requested_price || 0;
                  request_details = { 
                    consigner: request.consigner, 
                    consignee: request.consignee,
                    customer_name: request.customer_name,
                    pickup_location: request.pickup_location,
                    delivery_location: request.delivery_location,
                    status: request.status,
                    formatted_id: request.formatted_request_id
                  };
                  try {
                    const transporterResponse = await api.get(`/transport-requests/${request.id}/transporter`);
                    if (transporterResponse.data.success) {
                      const details = Array.isArray(transporterResponse.data.data) ? transporterResponse.data.data : [transporterResponse.data.data];
                      vehicle_charges = details;
                      total_vehicle_charges = details.reduce((t, d) => t + parseFloat(d.total_charge || 0), 0);
                    }
                  } catch (e) {}
                }
              } catch (e) {}
              return { ...transaction, requested_price, request_details, vehicle_charges, total_vehicle_charges };
            })
          );
          updatedData[date] = transactionsWithDetails;
        }
        setAdvanceData(updatedData);
      }
    } catch (error) {
      toast.error("Audit Stream Interrupted");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvancePayments();
  }, [singleDate, fromDate, toDate, filterType]);

  const handleViewDetails = async (requestId) => {
    setIsFetchingDetails(true);
    setShowDetailsModal(true);
    try {
      const response = await api.get("/transport-requests/filtered", { params: { request_id: requestId } });
      if (response.data.success && response.data.requests.length > 0) {
        const shipment = response.data.requests[0];
        const transRes = await api.get(`/transport-requests/${requestId}/transporter`);
        const transData = transRes.data.success ? (Array.isArray(transRes.data.data) ? transRes.data.data : [transRes.data.data]) : [];
        
        const vehicleMapping = transData.reduce((acc, detail) => {
          const vNum = detail.vehicle_number || "Unknown";
          if (!acc[vNum]) {
            acc[vNum] = { containers: [], total_charge: 0, driver_name: detail.driver_name, transporter_name: detail.transporter_name };
          }
          if (detail.container_no) acc[vNum].containers.push(detail.container_no);
          acc[vNum].total_charge += parseFloat(detail.total_charge || 0);
          return acc;
        }, {});

        setSelectedRequestDetails({
          ...shipment,
          vehicle_container_mapping: vehicleMapping,
          vehicle_charges: transData.reduce((s, d) => s + parseFloat(d.total_charge || 0), 0),
          service_charges: shipment.requested_price || 0,
          profit_loss: (shipment.requested_price || 0) - transData.reduce((s, d) => s + parseFloat(d.total_charge || 0), 0),
        });
        setAdminComment(shipment.admin_comment || "");
      }
    } catch (error) {
      toast.error("Deep Audit Failed");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    setUpdating(true);
    try {
      const res = await api.put(`/transport-requests/update/${requestId}`, { status, admin_comment: adminComment });
      if (res.data.success) {
        toast.success("Protocol Updated");
        fetchAdvancePayments();
        setShowDetailsModal(false);
      }
    } catch (error) {
      toast.error("Update Failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!neftReference) return toast.warning("Reference Required");
    setUpdatingPayment(true);
    try {
      const res = await api.put(`/transactions/update/${selectedTransaction.id}`, { 
        status: "completed", 
        neft_reference: neftReference 
      });
      if (res.data.success) {
        toast.success("Disbursement Authorized");
        setShowPaymentModal(false);
        setNeftReference("");
        fetchAdvancePayments();
      }
    } catch (error) {
      toast.error("Authorization Failed");
    } finally {
      setUpdatingPayment(false);
    }
  };

  const exportToExcel = () => {
    const data = [];
    Object.entries(advanceData).forEach(([date, txs]) => {
      txs.forEach(t => {
        data.push({
          Date: date,
          "Booking ID": t.request_id,
          "Vehicle Number": t.vehicle_number,
          "Transporter": t.transporter_name,
          "Customer": t.customer_name,
          "Advance Amount": t.advance_amount,
          "Status": t.status
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Advances");
    XLSX.writeFile(wb, `Advance_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalAdvanceAmount = Object.values(advanceData).reduce((sum, txs) => sum + txs.reduce((s, t) => s + (t.advance_amount || 0), 0), 0);
  const totalTransactions = Object.values(advanceData).reduce((sum, txs) => sum + txs.length, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 selection:bg-indigo-100 selection:text-indigo-700">
      <ToastContainer position="top-right" autoClose={2000} />
      
      {/* Registry Header */}
      <header className="bg-white border-b border-slate-200 mb-8">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <ShieldCheck className="text-white w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Advance <span className="text-indigo-600 tracking-tighter">Report</span>
              </h1>
              <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                <Activity size={14} className="text-emerald-500 animate-pulse" />
                <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Daily Advance Payments to Transporters</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFilterType("singleDate")}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === "singleDate" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                Single Date
              </button>
              <button
                onClick={() => setFilterType("dateRange")}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === "dateRange" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                Date Range
              </button>
            </div>
            <button onClick={exportToExcel} className="h-11 px-6 rounded-xl bg-slate-900 text-white flex items-center gap-2.5 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all">
              <Download size={18} strokeWidth={3} />
              Export Excel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-10">
        {/* KPI Intelligence Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-[32px] p-6 border border-slate-200/60 shadow-xl shadow-slate-100/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Advance Paid</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalAdvanceAmount)}</p>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-6 border border-slate-200/60 shadow-xl shadow-slate-100/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Requests</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalTransactions}</p>
            <div className="flex items-center gap-2 mt-2">
              <Truck size={14} className="text-indigo-500" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Number of Bookings</span>
            </div>
          </div>
          <div className="md:col-span-2 bg-white rounded-[32px] p-6 border border-slate-200/60 shadow-xl shadow-slate-100/50 flex flex-col justify-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Select Dates</label>
            <div className="flex gap-4">
              {filterType === "singleDate" ? (
                <input type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
              ) : (
                <>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                </>
              )}
              <button onClick={fetchAdvancePayments} className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-105 transition-transform">
                <Search size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Groups */}
        <div className="space-y-10">
          {Object.entries(advanceData)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, transactions]) => (
              <div key={date} className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-100/50 overflow-hidden">
                <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <Calendar size={16} />
                    </div>
                    <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">
                      Report: {formatDate(date)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units: <span className="text-slate-900">{transactions.length}</span></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: <span className="text-indigo-600">{formatCurrency(transactions.reduce((s, t) => s + (t.advance_amount || 0), 0))}</span></span>
                  </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/20 border-b border-slate-100">
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Vehicle & Transporter</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer & Route</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Advance Paid</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map((t, idx) => {
                        const specificVehicleCharge = t.vehicle_charges?.find(c => c.vehicle_number === t.vehicle_number);
                        const vehicleCharge = specificVehicleCharge ? parseFloat(specificVehicleCharge.total_charge || 0) : 0;
                        const advancePaid = parseFloat(t.advance_amount || 0);
                        const outstanding = Math.max(0, vehicleCharge - advancePaid);
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-all group">
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="text-[13px] font-black text-slate-900 tracking-tight uppercase">{t.vehicle_number || "NO_UNIT"}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{t.transporter_name || "N/A"}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-widest">#{t.request_id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[180px]">{t.customer_name || "PRIVATE_CLIENT"}</span>
                                <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                  <MapPin size={10} className="text-indigo-400" />
                                  <span className="truncate max-w-[80px]">{t.pickup_location || "N/A"}</span>
                                  <ChevronRight size={8} />
                                  <span className="truncate max-w-[80px]">{t.delivery_location || "N/A"}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex flex-col">
                                <span className="text-[12px] font-black text-slate-700">{formatCurrency(t.requested_price)}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Contract Value</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right bg-emerald-50/10">
                              <div className="flex flex-col">
                                <span className="text-[12px] font-black text-emerald-600">{formatCurrency(advancePaid)}</span>
                                <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest mt-0.5">{t.payment_mode || "LIQUID"}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <StatusBadge status={t.status} />
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <button onClick={() => handleViewDetails(t.request_id)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                                  <Eye size={16} strokeWidth={2.5} />
                                </button>
                                <button onClick={() => { setSelectedTransaction(t); setShowPaymentModal(true); }} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                                  <DollarSign size={16} strokeWidth={2.5} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

          {Object.keys(advanceData).length === 0 && !loading && (
            <div className="bg-white rounded-[32px] p-24 border border-dashed border-slate-200 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 mb-6">
                <Package size={40} />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">No Data Found</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest italic">No records found for the selected dates</p>
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && selectedTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowPaymentModal(false)}></div>
          <div className="relative bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-white/40 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-slate-800 to-slate-950 p-8 text-white">
              <h3 className="text-xl font-black uppercase tracking-widest">Confirm Payment</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Vehicle: {selectedTransaction.vehicle_number}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Remaining Balance</span>
                <span className="text-2xl font-black text-emerald-700">{formatCurrency(selectedTransaction.total_vehicle_charges - (selectedTransaction.advance_amount || 0))}</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reference Number (NEFT)</label>
                <input
                  type="text"
                  value={neftReference}
                  onChange={(e) => setNeftReference(e.target.value)}
                  placeholder="ENTER NEFT NO"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleMarkAsPaid} disabled={updatingPayment} className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                  {updatingPayment ? "UPDATING..." : "CONFIRM PAYMENT"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDetailsModal(false)}></div>
          <div className="relative bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] shadow-2xl border border-white/40 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-slate-800 to-slate-950 p-8 text-white flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-widest">Request Details</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">ID: {selectedRequestDetails?.formatted_request_id}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-slate-50/50">
              {isFetchingDetails ? (
                <div className="py-20 flex flex-col items-center">
                  <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Loading Details...</p>
                </div>
              ) : selectedRequestDetails && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Customer Name</span>
                      <span className="text-sm font-black text-slate-900 uppercase">{selectedRequestDetails.customer_name}</span>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Route (From - To)</span>
                      <span className="text-sm font-black text-indigo-600 uppercase truncate block">{selectedRequestDetails.pickup_location} → {selectedRequestDetails.delivery_location}</span>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</span>
                      <StatusBadge status={selectedRequestDetails.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Payment Summary</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[11px] font-black uppercase text-slate-500"><span>Total Revenue</span><span className="text-slate-900">{formatCurrency(selectedRequestDetails.service_charges)}</span></div>
                        <div className="flex justify-between items-center text-[11px] font-black uppercase text-slate-500"><span>Transporter Cost</span><span className="text-rose-600">{formatCurrency(selectedRequestDetails.vehicle_charges)}</span></div>
                        <div className="pt-4 mt-4 border-t-2 border-slate-50 flex justify-between items-center">
                          <span className="text-[12px] font-black text-slate-900 uppercase">Net Profit</span>
                          <span className={`text-xl font-black ${selectedRequestDetails.profit_loss >= 0 ? "text-indigo-600" : "text-rose-600"}`}>{formatCurrency(selectedRequestDetails.profit_loss)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Admin Notes</h4>
                       <textarea
                         value={adminComment}
                         onChange={(e) => setAdminComment(e.target.value)}
                         className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-[11px] font-black uppercase tracking-widest text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                         placeholder="ADD YOUR COMMENTS HERE..."
                       />
                       <div className="mt-6 flex flex-wrap gap-2">
                         {["approved", "in progress", "completed", "rejected"].map(s => (
                           <button key={s} onClick={() => handleStatusUpdate(selectedRequestDetails.id, s)} className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-indigo-600 transition-all border border-white/5">{s}</button>
                         ))}
                       </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Vehicle & Container Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(selectedRequestDetails.vehicle_container_mapping || {}).map(([v, info], i) => (
                        <div key={i} className="p-6 bg-white border border-slate-200 rounded-[32px] shadow-sm group hover:border-indigo-200 transition-all">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{v}</span>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">{info.transporter_name}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {info.containers.map((c, ci) => (
                              <span key={ci} className="px-2 py-1 bg-slate-100 text-[9px] font-black text-slate-500 rounded-lg border border-slate-200 uppercase tracking-widest">{c}</span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span>Pilot: {info.driver_name || "N/A"}</span>
                             <span className="text-emerald-600">{formatCurrency(info.total_charge)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-10 border-t border-slate-200 bg-white flex justify-end">
              <button onClick={() => setShowDetailsModal(false)} className="h-12 px-10 rounded-2xl border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">Close Window</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        @keyframes zoom-in-95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation-fill-mode: forwards; }
      `}} />
    </div>
  );
}
