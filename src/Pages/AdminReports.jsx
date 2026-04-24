import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/Api";
import { transporterAPI } from "../utils/Api";

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter, customerFilter, dateRange]);

  const calculateRequestTotalAmount = (containerDetails) => {
    if (!Array.isArray(containerDetails) || containerDetails.length === 0) {
      return 0;
    }
    return containerDetails.reduce((total, detail) => {
      const vehicleTotal = parseFloat(detail.total_charge || 0);
      return total + vehicleTotal;
    }, 0);
  };

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const shipmentsResponse = await api.get("/transport-requests/all");

      if (shipmentsResponse.data?.success) {
        const shipments = shipmentsResponse.data.requests;

        const reportsWithDetails = await Promise.all(
          shipments.map(async (shipment) => {
            try {
              let transporterDetails = [];
              let vehicleCharges = 0;
              let vehicleCount = 0;

              try {
                const transporterResponse =
                  await transporterAPI.getTransporterByRequestId(shipment.id);
                if (transporterResponse.success) {
                  const details = Array.isArray(transporterResponse.data)
                    ? transporterResponse.data
                    : [transporterResponse.data];

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
                  vehicleCharges = calculateRequestTotalAmount(uniqueVehicles);
                  vehicleCount = uniqueVehicles.length;
                }
              } catch (error) {
                console.log(`No transporter details for shipment ${shipment.id}`);
              }

              let transactionData = null;
              let totalPaid = 0;
              let grNumber = `GR-${shipment.id}`;

              try {
                const transactionResponse = await api.get(`/transactions/request/${shipment.id}`);
                if (transactionResponse.data.success && transactionResponse.data.data.length > 0) {
                  transactionData = transactionResponse.data.data[0];
                  totalPaid = parseFloat(transactionData.total_paid || 0);
                  grNumber = transactionData.gr_no || grNumber;
                }
              } catch (error) {
                console.log(`No transaction data for shipment ${shipment.id}`);
              }

              const serviceCharges = parseFloat(shipment.requested_price || 0);
              const profitLoss = serviceCharges - vehicleCharges;
              const profitLossPercentage = serviceCharges > 0 ? (profitLoss / serviceCharges) * 100 : 0;

              const paymentStatus = totalPaid >= serviceCharges ? "Fully Paid" : totalPaid > 0 ? "Partially Paid" : "Unpaid";
              const outstandingAmount = Math.max(0, serviceCharges - totalPaid);

              return {
                ...shipment,
                gr_no: grNumber,
                trip_no: `TRIP-${shipment.id}`,
                invoice_no: `INV-${new Date(shipment.created_at).getFullYear()}-${String(shipment.id).padStart(4, "0")}`,
                service_charges: serviceCharges,
                vehicle_charges: vehicleCharges,
                profit_loss: profitLoss,
                profit_loss_percentage: profitLossPercentage,
                total_paid: totalPaid,
                outstanding_amount: outstandingAmount,
                payment_status: paymentStatus,
                vehicle_count: vehicleCount,
                transporter_details: transporterDetails,
                transaction_data: transactionData,
                customer_name: shipment.customer_name || `Customer ${shipment.customer_id}`,
                total_containers: (shipment.containers_20ft || 0) + (shipment.containers_40ft || 0),
              };
            } catch (error) {
              const serviceCharges = parseFloat(shipment.requested_price || 0);
              return {
                ...shipment,
                gr_no: `GR-${shipment.id}`,
                trip_no: `TRIP-${shipment.id}`,
                invoice_no: `INV-${new Date(shipment.created_at).getFullYear()}-${String(shipment.id).padStart(4, "0")}`,
                service_charges: serviceCharges,
                vehicle_charges: 0,
                profit_loss: serviceCharges,
                profit_loss_percentage: 100,
                total_paid: 0,
                outstanding_amount: serviceCharges,
                payment_status: "Unpaid",
                vehicle_count: shipment.no_of_vehicles || 1,
                transporter_details: [],
                transaction_data: null,
                customer_name: shipment.customer_name || `Customer ${shipment.customer_id}`,
                total_containers: (shipment.containers_20ft || 0) + (shipment.containers_40ft || 0),
              };
            }
          })
        );

        setReports(reportsWithDetails);
        setFilteredReports(reportsWithDetails);
      }
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setIsLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports.filter((report) => {
      const matchesSearch =
        String(report.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(report.gr_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(report.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || report.status === statusFilter;
      const matchesCustomer = customerFilter === "all" || String(report.customer_id) === String(customerFilter);

      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const reportDate = new Date(report.created_at);
        matchesDate = reportDate >= new Date(dateRange.from) && reportDate <= new Date(dateRange.to);
      }

      return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
    });

    setFilteredReports(filtered);
  };

  const STATUS_STYLES = {
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
    Approved: "bg-blue-50 text-blue-600 border-blue-100",
    "In Transit": "bg-indigo-50 text-indigo-600 border-indigo-100",
    Delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Cancelled: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const { totalRevenue, totalCosts, totalProfit, totalOutstanding, totalPaid } = (() => {
    return filteredReports.reduce((acc, r) => ({
      totalRevenue: acc.totalRevenue + (r.service_charges || 0),
      totalCosts: acc.totalCosts + (r.vehicle_charges || 0),
      totalProfit: acc.totalProfit + (r.profit_loss || 0),
      totalOutstanding: acc.totalOutstanding + (r.outstanding_amount || 0),
      totalPaid: acc.totalPaid + (r.total_paid || 0),
    }), { totalRevenue: 0, totalCosts: 0, totalProfit: 0, totalOutstanding: 0, totalPaid: 0 });
  })();

  const customerOptions = ["all", ...Array.from(new Set(reports.map((r) => r.customer_id))).filter(Boolean)];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Compiling Analytics Architecture...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Strategic Intelligence Reports
            </h1>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">
              Cross-organizational Logistics & Financial Audit
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchReports} className="px-4 py-2 bg-slate-50 text-text-muted hover:text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-border">
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Data
            </button>
            <button className="btn-action px-6 py-2 flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Gross Revenue", value: totalRevenue, color: "text-primary", bg: "bg-blue-50/50" },
            { label: "Operational Costs", value: totalCosts, color: "text-amber-600", bg: "bg-amber-50/50" },
            { label: "Net Yield", value: totalProfit, color: totalProfit >= 0 ? "text-emerald-600" : "text-rose-600", bg: "bg-slate-50/50" },
            { label: "Total Liquidity", value: totalPaid, color: "text-indigo-600", bg: "bg-indigo-50/50" },
            { label: "Outstanding Risk", value: totalOutstanding, color: "text-rose-600", bg: "bg-rose-50/50" },
          ].map((stat, i) => (
            <div key={i} className={`card-premium p-5 border-l-4 ${stat.bg} ${stat.color === 'text-primary' ? 'border-l-primary' : stat.color === 'text-emerald-600' ? 'border-l-emerald-500' : 'border-l-slate-200'}`}>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`text-2xl font-display font-bold ${stat.color}`}>₹{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="card-premium p-6 mb-8 bg-white/80 backdrop-blur-sm sticky top-[80px] z-[5]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ID, GR NO, CUSTOMER..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-clean pl-10 py-2.5"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="md:col-span-2 input-clean py-2.5">
              <option value="all">All Status</option>
              {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="md:col-span-2 input-clean py-2.5">
              <option value="all">All Customers</option>
              {customerOptions.slice(1).map(c => <option key={c} value={c}>Customer #{c}</option>)}
            </select>
            <div className="md:col-span-4 flex gap-2">
              <input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="input-clean py-2.5 text-[11px]" />
              <input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="input-clean py-2.5 text-[11px]" />
            </div>
          </div>
        </div>

        <div className="card-premium overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Shipment Identity</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Route Intelligence</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Financial audit</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Liquidity</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-bold text-foreground">#{report.id}</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-slate-200">GR: {report.gr_no}</span>
                          <span className="text-[9px] font-bold bg-blue-50 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter border border-blue-100">INV: {report.invoice_no}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-foreground uppercase tracking-tight">{report.customer_name}</span>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          <span className="text-primary/70">{report.pickup_location || "Source"}</span>
                          <Truck className="w-3 h-3 text-slate-300" />
                          <span className="text-emerald-600/70">{report.delivery_location || "Destination"}</span>
                        </div>
                        <span className="text-[9px] font-bold text-primary mt-1 uppercase tracking-tighter bg-primary/5 self-start px-2 py-0.5 rounded border border-primary/10">
                          {report.vehicle_count} Deployment Units
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-3 w-full justify-end">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Margin</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${report.profit_loss >= 0 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"}`}>
                            {report.profit_loss >= 0 ? "+" : ""}₹{report.profit_loss.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 w-full justify-end">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Yield %</span>
                          <span className={`text-[10px] font-bold ${report.profit_loss_percentage >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {report.profit_loss_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          report.payment_status === "Fully Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                          report.payment_status === "Partially Paid" ? "bg-amber-50 text-amber-600 border-amber-100" : 
                          "bg-rose-50 text-rose-600 border-rose-100"
                        }`}>
                          {report.payment_status}
                        </span>
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] font-bold text-primary">₹{report.total_paid.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Collected</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${STATUS_STYLES[report.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { setSelectedReport(report); setShowDetailModal(true); }}
                        className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-95 border border-transparent hover:border-primary/10"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
