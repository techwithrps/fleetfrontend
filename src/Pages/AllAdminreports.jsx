import React, { useState, useEffect } from "react";
import api from "../utils/Api";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  FileText,
  Calendar,
  MapPin,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Building,
  Package,
  Search,
  Filter,
  Eye,
  BarChart3,
  Users,
  ChevronRight,
  Info,
  Clock,
  Briefcase,
  X,
  Layers,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Scale
} from "lucide-react";

const AllReportsPage = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profitabilityFilter, setProfitabilityFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [sortBy, setSortBy] = useState("request_id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all transactions
      const transactionsResponse = await api.get("/transactions/all");
      const transactionsData = transactionsResponse.data;

      if (!transactionsData?.success) {
        throw new Error(
          transactionsData?.message || "Failed to fetch transactions"
        );
      }

      // Fetch all transport requests
      let requestsData = { data: [] };
      try {
        const requestsResponse = await api.get("/transport-requests/all");
        requestsData = requestsResponse.data || { data: [] };
      } catch (requestError) {
        console.warn("Failed to fetch transport requests:", requestError);
      }

      setAllTransactions(transactionsData.data || []);
      setAllRequests(requestsData.data || []);

      // Process and combine data
      processReportData(transactionsData.data || [], requestsData.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (transactions, requests) => {
    // Group transactions by request_id
    const transactionsByRequest = transactions.reduce((acc, transaction) => {
      const requestId = transaction.request_id;
      if (!acc[requestId]) {
        acc[requestId] = [];
      }
      acc[requestId].push(transaction);
      return acc;
    }, {});

    // Create a map of requests for quick lookup
    const requestsMap = requests.reduce((acc, request) => {
      acc[request.id] = request;
      return acc;
    }, {});

    // Generate report data
    const reports = Object.keys(transactionsByRequest).map((requestId) => {
      const requestTransactions = transactionsByRequest[requestId];
      const request = requestsMap[requestId] || {};

      // Calculate financial metrics
      const totalRevenue =
        request.requested_price || requestTransactions[0]?.requested_price || 0;
      const totalVehicleCharges = requestTransactions.reduce(
        (sum, tx) => sum + (tx.transporter_charge || 0),
        0
      );
      const totalPaid = requestTransactions.reduce(
        (sum, tx) => sum + (tx.total_paid || 0),
        0
      );
      const grossProfit = totalRevenue - totalVehicleCharges;
      const outstandingAmount = totalVehicleCharges - totalPaid;
      const profitMargin =
        totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Get the first transaction for basic info if request data is missing
      const firstTransaction = requestTransactions[0] || {};

      // Determine payment status
      const paymentStatus =
        totalPaid >= totalRevenue
          ? "Fully Paid"
          : totalPaid > 0
          ? "Partially Paid"
          : "Unpaid";

      return {
        request_id: parseInt(requestId),
        id: parseInt(requestId), // Add id for consistency
        formatted_request_id:
          request.formatted_request_id || `REQ-${requestId}`,
        tracking_id: request.tracking_id || `TR-${requestId}`,
        gr_no: `GR-${requestId}`,
        trip_no: `TRIP-${requestId}`,
        invoice_no: `INV-${new Date(
          request.created_at || Date.now()
        ).getFullYear()}-${String(requestId).padStart(4, "0")}`,
        SHIPA_NO: request.SHIPA_NO || `SHIPA-${requestId}`,
        customer_name:
          request.customer_name ||
          firstTransaction.consigner ||
          "Not specified",
        customer_id: request.customer_id || `CUST-${requestId}`,
        pickup_location:
          request.pickup_location ||
          firstTransaction.pickup_location ||
          "Not specified",
        delivery_location:
          request.delivery_location ||
          firstTransaction.delivery_location ||
          "Not specified",
        commodity:
          request.commodity || firstTransaction.commodity || "General Cargo",
        vehicle_type:
          request.vehicle_type || firstTransaction.vehicle_type || "Standard",
        status: request.status || "completed",
        created_at: request.created_at || firstTransaction.created_at,
        updated_at: request.updated_at,
        expected_pickup_date: request.expected_pickup_date,
        expected_delivery_date: request.expected_delivery_date,
        actual_delivery_date: request.actual_delivery_date,
        vehicle_count: requestTransactions.length,
        no_of_vehicles: request.no_of_vehicles || requestTransactions.length,
        containers_20ft: request.containers_20ft || 0,
        containers_40ft: request.containers_40ft || 0,
        total_containers:
          (request.containers_20ft || 0) + (request.containers_40ft || 0),
        cargo_weight: request.cargo_weight,
        special_instructions: request.special_instructions,
        total_revenue: totalRevenue,
        requested_price: totalRevenue, // For compatibility
        service_charges: totalRevenue,
        total_vehicle_charges: totalVehicleCharges,
        vehicle_charges: totalVehicleCharges,
        gross_profit: grossProfit,
        profit_loss: grossProfit,
        profit_margin: profitMargin,
        profit_loss_percentage: profitMargin,
        total_paid: totalPaid,
        outstanding_amount: outstandingAmount,
        payment_status: paymentStatus,
        is_profitable: grossProfit > 0,
        transactions: requestTransactions,
        request_details: request,
        transporter_details: requestTransactions.map((tx) => ({
          vehicle_number: tx.vehicle_number,
          driver_name: tx.driver_name,
          driver_phone: tx.driver_phone,
          total_charge: tx.transporter_charge,
          additional_charges: tx.additional_charges || 0,
        })),
        transaction_data: requestTransactions[0] || null,
      };
    });

    setReportData(reports);
    setFilteredReports(reports);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reportData, searchTerm, statusFilter, profitabilityFilter, dateRange, sortBy, sortOrder]);

  const filterReports = () => {
    let filtered = reportData.filter((report) => {
      const matchesSearch =
        String(report.request_id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.formatted_request_id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.tracking_id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.gr_no).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(report.customer_name)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.pickup_location)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.delivery_location)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(report.commodity)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;

      const matchesProfitability =
        profitabilityFilter === "all" ||
        (profitabilityFilter === "profitable" && report.is_profitable) ||
        (profitabilityFilter === "loss" && !report.is_profitable);

      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const reportDate = new Date(report.created_at);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        matchesDate = reportDate >= fromDate && reportDate <= toDate;
      }

      return (
        matchesSearch && matchesStatus && matchesProfitability && matchesDate
      );
    });

    // Sort filtered data
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredReports(filtered);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹0";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return "N/A";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-IN");
    } catch {
      return "N/A";
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-amber-100/80 text-amber-700 border-amber-200", icon: Clock },
      approved: { color: "bg-blue-100/80 text-blue-700 border-blue-200", icon: ShieldCheck },
      "in progress": { color: "bg-indigo-100/80 text-indigo-700 border-indigo-200", icon: Truck },
      "in transit": { color: "bg-indigo-100/80 text-indigo-700 border-indigo-200", icon: Truck },
      delivered: { color: "bg-emerald-100/80 text-emerald-700 border-emerald-200", icon: Package },
      completed: { color: "bg-emerald-100/80 text-emerald-700 border-emerald-200", icon: Package },
      cancelled: { color: "bg-rose-100/80 text-rose-700 border-rose-200", icon: X },
      rejected: { color: "bg-rose-100/80 text-rose-700 border-rose-200", icon: X },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${config.color} backdrop-blur-sm transition-all duration-300`}>
        <Icon size={12} strokeWidth={2.5} />
        <span className="uppercase tracking-wider">{status || "Pending"}</span>
      </span>
    );
  };

  const getProfitLossIndicator = (profitLoss) => {
    if (profitLoss > 0) {
      return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    } else if (profitLoss < 0) {
      return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
    }
    return <div className="w-3.5 h-3.5 bg-slate-300 rounded-full"></div>;
  };

  const refreshData = () => {
    fetchAllData();
  };

  const exportToCSV = () => {
    const headers = [
      "Request ID", "Tracking ID", "GR No", "Trip No", "Invoice No", "Customer Name",
      "Customer ID", "Pickup Location", "Delivery Location", "Vehicle Type",
      "Commodity", "Status", "Service Charges", "Vehicle Charges", "Profit/Loss",
      "Profit %", "Total Paid", "Outstanding", "Payment Status", "Created Date",
      "Delivery Date", "Containers 20ft", "Containers 40ft", "Total Containers",
      "Cargo Weight", "Vehicle Count",
    ];

    const csvData = filteredReports.map((report) => [
      report.request_id, report.tracking_id || "", report.gr_no, report.trip_no,
      report.invoice_no, report.customer_name, report.customer_id,
      report.pickup_location || "", report.delivery_location || "",
      report.vehicle_type || "", report.commodity || "", report.status,
      report.service_charges, report.vehicle_charges, report.profit_loss,
      report.profit_loss_percentage.toFixed(2), report.total_paid,
      report.outstanding_amount, report.payment_status, formatDate(report.created_at),
      formatDate(report.expected_delivery_date), report.containers_20ft || 0,
      report.containers_40ft || 0, report.total_containers, report.cargo_weight || 0,
      report.vehicle_count,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-reports-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const totalRequests = filteredReports.length;
  const profitableRequests = filteredReports.filter((r) => r.is_profitable).length;
  const totalRevenue = filteredReports.reduce((sum, r) => sum + r.total_revenue, 0);
  const totalCosts = filteredReports.reduce((sum, r) => sum + r.total_vehicle_charges, 0);
  const totalProfit = filteredReports.reduce((sum, r) => sum + r.gross_profit, 0);
  const totalOutstanding = filteredReports.reduce((sum, r) => sum + r.outstanding_amount, 0);
  const totalPaid = filteredReports.reduce((sum, r) => sum + r.total_paid, 0);
  const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const SummaryCard = ({ title, value, subtext, icon: Icon, trend, colorClass }) => (
    <div className="card-premium p-4 group hover:translate-y-[-2px] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className={`text-xl font-bold tracking-tight ${colorClass || "text-slate-900"}`}>{value}</p>
          {subtext && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider italic">
                {subtext}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colorClass ? colorClass.replace('text-', 'bg-').replace('-600', '-50') : 'bg-slate-50'} transition-colors group-hover:scale-110 duration-300`}>
          <Icon className={`w-5 h-5 ${colorClass || "text-slate-400"}`} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-16 h-16 border-t-4 border-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Initializing Data Stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* Refined Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 hidden sm:block">
                <Layers className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  Registry <span className="text-blue-600 tracking-tighter">Console</span>
                </h1>
                <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                  <Activity size={14} className="text-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Global Performance Audit</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={loading}
                className="btn-secondary h-11 px-5 flex items-center gap-2.5 font-bold text-[11px] uppercase tracking-wider"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} strokeWidth={2.5} />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="btn-action h-11 px-6 flex items-center gap-2.5 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-blue-300"
              >
                <Download size={18} strokeWidth={3} />
                Export Registry
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-8 flex items-start gap-4">
            <div className="p-2 bg-rose-100 rounded-xl">
              <AlertCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">System Error</p>
              <p className="text-sm font-medium text-rose-500">{error}</p>
            </div>
          </div>
        )}

        {/* Intelligence Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
          <SummaryCard 
            title="Total Requests" 
            value={totalRequests} 
            subtext={`${profitableRequests} PROFTABLE`}
            icon={FileText} 
            colorClass="text-slate-900"
          />
          <SummaryCard 
            title="Total Revenue" 
            value={formatCurrency(totalRevenue)} 
            subtext="GROSS INFLOW"
            icon={DollarSign} 
            colorClass="text-emerald-600"
          />
          <SummaryCard 
            title="Operating Costs" 
            value={formatCurrency(totalCosts)} 
            subtext="FLEET EXPENSES"
            icon={Truck} 
            colorClass="text-amber-600"
          />
          <SummaryCard 
            title="Net Performance" 
            value={formatCurrency(totalProfit)} 
            subtext={`${overallProfitMargin.toFixed(1)}% MARGIN`}
            icon={BarChart3} 
            colorClass={totalProfit >= 0 ? "text-blue-600" : "text-rose-600"}
          />
          <SummaryCard 
            title="Outstanding" 
            value={formatCurrency(totalOutstanding)} 
            subtext={`PAID: ${formatCurrency(totalPaid)}`}
            icon={CreditCard} 
            colorClass="text-rose-500"
          />
        </div>

        {/* Professional Controls */}
        <div className="card-premium p-5 mb-8 border-none bg-white shadow-xl shadow-slate-100/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} strokeWidth={2.5} />
              <input
                type="text"
                placeholder="REGISTRY LOOKUP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-clean pl-10 h-11 text-[11px] font-bold tracking-wider placeholder:text-slate-400 placeholder:uppercase"
              />
            </div>

            <div className="flex items-center gap-2 lg:col-span-1">
              <Filter size={14} className="text-slate-400 hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-clean h-11 text-[11px] font-bold uppercase tracking-wider"
              >
                <option value="all">ALL STATUS</option>
                <option value="pending">PENDING</option>
                <option value="approved">APPROVED</option>
                <option value="in progress">IN PROGRESS</option>
                <option value="completed">COMPLETED</option>
                <option value="rejected">REJECTED</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <select
                value={profitabilityFilter}
                onChange={(e) => setProfitabilityFilter(e.target.value)}
                className="input-clean h-11 text-[11px] font-bold uppercase tracking-wider"
              >
                <option value="all">PERFORMANCE: ALL</option>
                <option value="profitable">PROFITABLE ONLY</option>
                <option value="loss">LOSS MAKING ONLY</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex items-center gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="input-clean h-11 text-[11px] font-bold flex-1"
              />
              <span className="text-slate-300 font-bold px-1">TO</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="input-clean h-11 text-[11px] font-bold flex-1"
              />
            </div>

            <div className="lg:col-span-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-clean h-11 text-[11px] font-bold uppercase tracking-wider"
              >
                <option value="request_id">SORT BY: ID</option>
                <option value="created_at">SORT BY: DATE</option>
                <option value="total_revenue">SORT BY: REVENUE</option>
                <option value="gross_profit">SORT BY: PROFIT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Ledger Table */}
        <div className="bg-white rounded-[24px] shadow-2xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/60">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Entry Identity</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Stakeholder & Logistics</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Financial Intelligence</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Payment Liquidity</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Operational Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filteredReports.map((report) => (
                  <tr key={report.request_id} className="group hover:bg-slate-50/80 transition-all duration-300">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-slate-900 tracking-tight">{report.formatted_request_id}</span>
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-widest">#{report.request_id}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                            <Activity size={10} className="text-slate-300" /> GR: {report.gr_no}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                            <FileText size={10} className="text-slate-300" /> INV: {report.invoice_no}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Building size={12} className="text-slate-500" />
                          </div>
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px]">
                            {report.customer_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <MapPin size={10} className="text-blue-400" />
                            <span className="truncate max-w-[120px]">{report.pickup_location}</span>
                          </div>
                          <ChevronRight size={10} className="text-slate-300" />
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <MapPin size={10} className="text-emerald-400" />
                            <span className="truncate max-w-[120px]">{report.delivery_location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{report.vehicle_type}</span>
                          <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{report.vehicle_count} UNITS</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2 min-w-[160px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Inflow</span>
                          <span className="text-[11px] font-black text-emerald-600 tracking-tight">{formatCurrency(report.total_revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Outflow</span>
                          <span className="text-[11px] font-black text-amber-600 tracking-tight">{formatCurrency(report.total_vehicle_charges)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {getProfitLossIndicator(report.gross_profit)}
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Yield</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-[12px] font-black tracking-tight ${report.gross_profit >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                              {formatCurrency(report.gross_profit)}
                            </span>
                            <span className={`text-[9px] font-bold ${report.profit_margin >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              {report.profit_margin.toFixed(1)}% MARGIN
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Realized</span>
                          <span className="text-[11px] font-black text-blue-600">{formatCurrency(report.total_paid)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Exposure</span>
                          <span className="text-[11px] font-black text-rose-500">{formatCurrency(report.outstanding_amount)}</span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${
                            report.payment_status === "Fully Paid"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : report.payment_status === "Partially Paid"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}>
                            {report.payment_status}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDetailModal(true);
                        }}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-slate-200/50"
                      >
                        <Eye size={18} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="py-24 flex flex-col items-center gap-5">
              <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200">
                <Layers size={40} />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Zero Trace Found</p>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Adjust filters to re-calibrate audit parameters</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Metadata */}
        {filteredReports.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200"></div>
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Analyzed {filteredReports.length} of {reportData.length} Registry Entries
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 italic">SYSTEM STATUS: NOMINAL</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        )}
      </main>

      {/* Modern High-Density Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowDetailModal(false)}
          ></div>
          
          <div className="relative w-full max-w-7xl max-h-[95vh] bg-[#F8FAFC]/95 border border-white/40 shadow-2xl rounded-[32px] overflow-hidden flex flex-col backdrop-blur-xl animate-in zoom-in-95 duration-300">
            {/* Header: Audit Console Style */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <ShieldCheck size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-black tracking-tight tracking-tighter uppercase">Entry Deep Audit</h3>
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/20">
                        Registry Core
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-blue-100/70 text-[11px] font-bold tracking-widest uppercase">
                      <span className="flex items-center gap-1.5"><Layers size={14} /> ID: {selectedReport.formatted_request_id}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30"></span>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> Created: {formatDate(selectedReport.created_at)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 group"
                >
                  <X size={24} className="group-hover:rotate-90 duration-300" />
                </button>
              </div>
            </div>

            {/* Modal Body: Grid Based Audit Sections */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Left Column: Logistics & Payload */}
                <div className="md:col-span-4 space-y-6">
                  {/* Stakeholder Identity */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                      <Briefcase size={14} className="text-blue-500" /> Stakeholder Identity
                    </h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Principal</p>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                          {selectedReport.customer_name}
                        </p>
                        <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest">UID: {selectedReport.customer_id}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Tracking Key</p>
                          <p className="text-[10px] font-bold text-slate-700 tracking-tight font-mono">{selectedReport.tracking_id}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">GR Index</p>
                          <p className="text-[10px] font-bold text-slate-700 tracking-tight font-mono">{selectedReport.gr_no}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Intelligence */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500" /> Route Intelligence
                    </h4>
                    <div className="space-y-6 relative">
                      <div className="absolute left-[13px] top-[30px] bottom-[30px] w-px bg-slate-200 border-l border-dashed border-slate-300"></div>
                      
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center z-10">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Point of Origin</p>
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{selectedReport.pickup_location}</p>
                      </div>

                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center z-10">
                          <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Terminal Destination</p>
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{selectedReport.delivery_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational Status */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                      <Activity size={14} className="text-indigo-500" /> Current Trajectory
                    </h4>
                    <div className="flex flex-col items-center py-2">
                      {getStatusBadge(selectedReport.status)}
                      <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-[0.2em] text-center italic">
                        {selectedReport.status === 'completed' ? 'Registry Cycle Finalized' : 'Process Under Active Monitoring'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Financial & Detailed Ledger */}
                <div className="md:col-span-8 space-y-8">
                  
                  {/* Performance Matrix Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 group hover:border-emerald-200 transition-colors">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                          <ArrowUpRight className="text-emerald-600 w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Revenue Flow</span>
                      </div>
                      <p className="text-2xl font-black text-emerald-600 tracking-tighter">{formatCurrency(selectedReport.service_charges)}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest tracking-tighter">Gross Realization</p>
                    </div>
                    
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 group hover:border-amber-200 transition-colors">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-amber-50 rounded-xl">
                          <Truck className="text-amber-600 w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Vendor Cost</span>
                      </div>
                      <p className="text-2xl font-black text-amber-600 tracking-tighter">{formatCurrency(selectedReport.vehicle_charges)}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest tracking-tighter">Fleet Disbursements</p>
                    </div>
                    
                    <div className={`bg-white rounded-3xl p-6 shadow-sm border ${selectedReport.profit_loss >= 0 ? 'border-blue-200/60 bg-blue-50/20' : 'border-rose-200/60 bg-rose-50/20'} group transition-colors`}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`p-2 rounded-xl ${selectedReport.profit_loss >= 0 ? 'bg-blue-100' : 'bg-rose-100'}`}>
                          <Scale className={`${selectedReport.profit_loss >= 0 ? 'text-blue-600' : 'text-rose-600'} w-4 h-4`} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest italic ${selectedReport.profit_loss >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>Operational Yield</span>
                      </div>
                      <p className={`text-2xl font-black tracking-tighter ${selectedReport.profit_loss >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>{formatCurrency(selectedReport.profit_loss)}</p>
                      <p className={`text-[10px] font-black mt-1 uppercase tracking-widest ${selectedReport.profit_loss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {selectedReport.profit_loss_percentage.toFixed(2)}% MARGIN
                      </p>
                    </div>
                  </div>

                  {/* Asset Intelligence & Payload Details */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Layers size={14} className="text-indigo-500" /> Asset Intelligence
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fleet Count</span>
                        <div className="flex items-center gap-2">
                          <Truck size={16} className="text-slate-400" />
                          <span className="text-[13px] font-black text-slate-800 tracking-tight uppercase">{selectedReport.vehicle_count} ACTIVE UNITS</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 border-l border-slate-100 pl-8">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Configuration</span>
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-slate-400" />
                          <span className="text-[13px] font-black text-slate-800 tracking-tight uppercase">{selectedReport.total_containers} CONTAINERS</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 border-l border-slate-100 pl-8">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Weight</span>
                        <div className="flex items-center gap-2">
                          <Scale size={16} className="text-slate-400" />
                          <span className="text-[13px] font-black text-slate-800 tracking-tight uppercase">{selectedReport.cargo_weight || "0"} KG</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 border-l border-slate-100 pl-8">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cargo Segment</span>
                        <div className="flex items-center gap-2">
                          <Info size={16} className="text-slate-400" />
                          <span className="text-[13px] font-black text-slate-800 tracking-tight uppercase truncate">{selectedReport.commodity}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Disbursement Status Table */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={14} className="text-blue-500" /> Fleet Disbursement Ledger
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        selectedReport.payment_status === 'Fully Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        Status: {selectedReport.payment_status}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50/30">
                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset ID</th>
                            <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Driver Identity</th>
                            <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Liability</th>
                            <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Disbursed</th>
                            <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Outstanding</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedReport.transactions?.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span className="text-[11px] font-black text-slate-800 font-mono">{tx.vehicle_number || "N/A"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{tx.driver_name || "N/A"}</span>
                                  <span className="text-[9px] font-bold text-slate-400">{tx.driver_phone || "UNSPECIFIED"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-[11px] font-black text-slate-800">{formatCurrency(tx.transporter_charge)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-[11px] font-black text-emerald-600">{formatCurrency(tx.total_paid)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-[11px] font-black text-rose-500">{formatCurrency((tx.transporter_charge || 0) - (tx.total_paid || 0))}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer: Action Bar */}
            <div className="p-8 border-t border-slate-200/60 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-slate-400">
                <ShieldCheck size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Verified Entry</p>
                  <p className="text-[9px] font-bold italic">Audit finalized by System Protocol on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="btn-secondary flex-1 sm:flex-none h-12 px-8 text-[11px] font-black uppercase tracking-widest"
                >
                  Terminate View
                </button>
                <button
                  onClick={() => {
                    // Reuse the existing export logic for single report
                    const singleReportData = [selectedReport];
                    const headers = [
                      "Request ID", "Tracking ID", "GR No", "Trip No", "Invoice No", "Customer Name",
                      "Customer ID", "Pickup Location", "Delivery Location", "Vehicle Type",
                      "Commodity", "Status", "Service Charges", "Vehicle Charges", "Profit/Loss",
                      "Profit %", "Total Paid", "Outstanding", "Payment Status", "Created Date",
                      "Delivery Date", "Containers 20ft", "Containers 40ft", "Total Containers",
                      "Cargo Weight", "Vehicle Count",
                    ];

                    const csvData = singleReportData.map((report) => [
                      report.request_id, report.tracking_id, report.gr_no, report.trip_no,
                      report.invoice_no, report.customer_name, report.customer_id,
                      report.pickup_location, report.delivery_location, report.vehicle_type,
                      report.commodity, report.status, report.service_charges, report.vehicle_charges,
                      report.profit_loss, report.profit_loss_percentage.toFixed(2), report.total_paid,
                      report.outstanding_amount, report.payment_status, formatDate(report.created_at),
                      formatDate(report.expected_delivery_date), report.containers_20ft,
                      report.containers_40ft, report.total_containers, report.cargo_weight || 0,
                      report.vehicle_count,
                    ]);

                    const csvContent = [headers, ...csvData]
                      .map((row) => row.map((cell) => `"${cell}"`).join(","))
                      .join("\n");

                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `audit-report-${selectedReport.request_id}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="btn-action flex-1 sm:flex-none h-12 px-8 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Download size={18} strokeWidth={3} />
                  Download Entry Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal CSS for custom scrollbars and animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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
        .zoom-in-95 {
          animation-name: zoom-in-95;
        }
      `}} />
    </div>
  );
};

export default AllReportsPage;
