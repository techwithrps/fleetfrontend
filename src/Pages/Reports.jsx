import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { transportRequestAPI, transporterAPI } from "../utils/Api";
import api from "../utils/Api";

// Utility function to format currency
const formatCurrency = (amount) =>
  amount || amount === 0 ? `₹${Number(amount).toLocaleString("en-IN")}` : "N/A";

// Utility function to format dates
const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString() : "N/A";

const formatDateTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleString() : "N/A";

// Component for Summary Card
const SummaryCard = ({ title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border">
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{formatCurrency(value)}</p>
  </div>
);

// Component for Status Badge
const StatusBadge = ({ status }) => {
  const statusConfig = {
    Pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    Approved: { color: "bg-blue-100 text-blue-800", icon: "✓" },
    "In Transit": { color: "bg-purple-100 text-purple-800", icon: "🚛" },
    Delivered: { color: "bg-green-100 text-green-800", icon: "📦" },
    Cancelled: { color: "bg-red-100 text-red-800", icon: "✕" },
  };
  const config = statusConfig[status] || statusConfig.Pending;
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

const ShipmentReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 50; // Updated to 50 as per requirement

  // Cache for transporter details
  const transporterCache = useMemo(() => new Map(), []);

  // Helper function to calculate total amount for a request
  const calculateRequestTotalAmount = useCallback((containerDetails) => {
    if (!Array.isArray(containerDetails) || containerDetails.length === 0) {
      return 0;
    }
    return containerDetails.reduce(
      (total, detail) => total + parseFloat(detail.total_charge || 0),
      0
    );
  }, []);

  // Fetch and process reports
  const fetchReports = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        // Construct query parameters for filtering
        const params = new URLSearchParams({
          page,
          limit: recordsPerPage,
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(dateRange.from && { from_date: dateRange.from }),
          ...(dateRange.to && { to_date: dateRange.to }),
        });

        const shipmentsResponse = await transportRequestAPI.getCustomerRequests(
          page,
          recordsPerPage,
          params.toString()
        );
        if (!shipmentsResponse.success) {
          throw new Error("No shipments data found or unsuccessful response");
        }

        const { requests: shipments, total } = shipmentsResponse;
        setTotalPages(Math.ceil(total / recordsPerPage));

        const reportsWithDetails = await Promise.all(
          shipments.map(async (shipment) => {
            try {
              let transporterDetails = [];
              let vehicleCharges = 0;
              let vehicleCount = 0;
              let vehicleContainerMapping = {};
              let containerNumbers = "";

              // Fetch transporter details
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
                vehicleCharges =
                  calculateRequestTotalAmount(transporterDetails);
                vehicleCount = [
                  ...new Set(transporterDetails.map((d) => d.vehicle_number)),
                ].length;
              } catch (error) {
                console.log(
                  `No transporter details for shipment ${shipment.id}`
                );
              }

              // Fetch transaction data
              let transactionData = null;
              let totalPaid = 0;
              let grNumber = `GR-${shipment.id}`;
              try {
                const transactionResponse = await api.get(
                  `/transactions/request/${shipment.id}`
                );
                if (
                  transactionResponse.data.success &&
                  transactionResponse.data.data.length > 0
                ) {
                  transactionData = transactionResponse.data.data[0];
                  totalPaid = parseFloat(transactionData.total_paid || 0);
                  grNumber = transactionData.gr_no || grNumber;
                }
              } catch (error) {
                console.log(`No transaction data for shipment ${shipment.id}`);
              }

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
                container_numbers: containerNumbers,
                vehicle_container_mapping: vehicleContainerMapping,
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
                customer_name:
                  shipment.customer_name || `Customer ${shipment.customer_id}`,
                total_containers:
                  (shipment.containers_20ft || 0) +
                  (shipment.containers_40ft || 0),
              };
            } catch (error) {
              console.error(`Error processing shipment ${shipment.id}:`, error);
              const serviceCharges = parseFloat(shipment.requested_price || 0);
              return {
                ...shipment,
                gr_no: `GR-${shipment.id}`,
                trip_no: `TRIP-${shipment.id}`,
                invoice_no: `INV-${new Date(
                  shipment.created_at
                ).getFullYear()}-${String(shipment.id).padStart(4, "0")}`,
                shipa_no: shipment.SHIPA_NO || "N/A",
                container_numbers: "N/A",
                vehicle_container_mapping: {},
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
                customer_name:
                  shipment.customer_name || `Customer ${shipment.customer_id}`,
                total_containers:
                  (shipment.containers_20ft || 0) +
                  (shipment.containers_40ft || 0),
              };
            }
          })
        );

        setReports(reportsWithDetails);
        setFilteredReports(reportsWithDetails); // Since filtering is done server-side
        console.log("Processed reports with real data:", reportsWithDetails);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to fetch shipment reports");
        setReports([]);
        setFilteredReports([]);
      } finally {
        setIsLoading(false);
      }
    },
    [transporterCache, calculateRequestTotalAmount]
  );

  // Refresh data
  const refreshData = useCallback(() => {
    setIsLoading(true);
    setCurrentPage(1);
    fetchReports(1);
    toast.success("Reports data refreshed successfully");
  }, [fetchReports]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      "Request ID",
      "Tracking ID",
      "GR No",
      "Trip No",
      "Invoice No",
      "SHIPA No",
      "Container Numbers",
      "Vehicle-Container Mapping",
      "Customer Name",
      "Customer ID",
      "Pickup Location",
      "Delivery Location",
      "Vehicle Type",
      "Commodity",
      "Status",
      "Service Charges",
      "Vehicle Charges",
      "Profit/Loss",
      "Profit %",
      "Total Paid",
      "Outstanding",
      "Payment Status",
      "Created Date",
      "Delivery Date",
      "Containers 20ft",
      "Containers 40ft",
      "Total Containers",
      "Cargo Weight",
      "Vehicle Count",
    ];

    const csvData = filteredReports.map((report) => [
      report.id,
      report.tracking_id || "N/A",
      report.gr_no,
      report.trip_no,
      report.invoice_no,
      report.shipa_no,
      report.container_numbers,
      Object.entries(report.vehicle_container_mapping)
        .map(
          ([vehicle, info]) =>
            `${vehicle}: ${info.containers.join(
              ", "
            )} [${info.container_types.join(", ")}/${info.container_sizes.join(
              ", "
            )}]`
        )
        .join("; ") || "N/A",
      report.customer_name,
      report.customer_id,
      report.pickup_location || "N/A",
      report.delivery_location || "N/A",
      report.vehicle_type || "N/A",
      report.commodity || "N/A",
      report.status,
      report.service_charges,
      report.vehicle_charges,
      report.profit_loss,
      report.profit_loss_percentage.toFixed(2),
      report.total_paid,
      report.outstanding_amount,
      report.payment_status,
      formatDate(report.created_at),
      formatDate(report.expected_delivery_date),
      report.containers_20ft || 0,
      report.containers_40ft || 0,
      report.total_containers,
      report.cargo_weight || 0,
      report.vehicle_count,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipment-reports-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Reports exported successfully!");
  }, [filteredReports]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    return filteredReports.reduce(
      (acc, report) => ({
        totalRevenue: acc.totalRevenue + (report.service_charges || 0),
        totalCosts: acc.totalCosts + (report.vehicle_charges || 0),
        totalPaid: acc.totalPaid + (report.total_paid || 0),
        totalOutstanding:
          acc.totalOutstanding + (report.outstanding_amount || 0),
      }),
      { totalRevenue: 0, totalCosts: 0, totalPaid: 0, totalOutstanding: 0 }
    );
  }, [filteredReports]);
  summaryStats.totalProfit =
    summaryStats.totalRevenue - summaryStats.totalCosts;

  // Fetch reports on mount and when filters/page change
  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage, searchTerm, statusFilter, dateRange, fetchReports]);

  // Pagination UI
  const renderPagination = () => {
    const maxVisiblePages = 5;
    const pageNumbers = [];
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4 pt-3 border-t">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3 h-3 mr-1" />
          Prev
        </button>
        <div className="flex items-center space-x-1">
          {startPage > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="text-xs text-gray-500">...</span>
              )}
            </>
          )}
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-2 py-1 text-xs ${
                currentPage === page
                  ? "bg-blue-500 text-white rounded"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {page}
            </button>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="text-xs text-gray-500">...</span>
              )}
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shipment Reports
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive view of all shipments with profit/loss analysis
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshData}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <SummaryCard
            title="Total Revenue"
            value={summaryStats.totalRevenue}
            color="text-green-600"
          />
          <SummaryCard
            title="Total Costs"
            value={summaryStats.totalCosts}
            color="text-orange-600"
          />
          <SummaryCard
            title="Net Profit"
            value={summaryStats.totalProfit}
            color={
              summaryStats.totalProfit >= 0 ? "text-green-600" : "text-red-600"
            }
          />
          <SummaryCard
            title="Total Paid"
            value={summaryStats.totalPaid}
            color="text-blue-600"
          />
          <SummaryCard
            title="Outstanding"
            value={summaryStats.totalOutstanding}
            color="text-red-600"
          />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, GR No, Customer, Location, SHIPA No..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => {
                  setDateRange((prev) => ({ ...prev, from: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="From Date"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => {
                  setDateRange((prev) => ({ ...prev, to: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="To Date"
              />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer & Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle-Container Mapping
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          ID: {report.id}
                        </div>
                        <div className="text-xs text-gray-500">
                          SHIPA No: {report.shipa_no}
                        </div>
                        <div className="text-xs text-gray-500">
                          Tracking: {report.tracking_id || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          GR: {report.gr_no}
                        </div>
                        <div className="text-xs text-gray-500">
                          Trip: {report.trip_no}
                        </div>
                        <div className="text-xs text-gray-500">
                          Invoice: {report.invoice_no}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {report.customer_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          From: {report.pickup_location || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          To: {report.delivery_location || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {report.commodity || "N/A"}
                        </div>
                        <div className="text-xs text-blue-600">
                          {report.vehicle_count} vehicles
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs text-gray-600">
                        {Object.entries(report.vehicle_container_mapping).map(
                          ([vehicle, info]) => (
                            <div key={vehicle}>
                              {vehicle}: {info.containers.join(", ")} [
                              {info.container_types.join(", ")}/
                              {info.container_sizes.join(", ")}]
                            </div>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Revenue:
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(report.service_charges)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Costs:</span>
                          <span className="text-sm font-medium text-orange-600">
                            {formatCurrency(report.vehicle_charges)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2">
                          <div className="flex items-center gap-1">
                            <ProfitLossIndicator
                              profitLoss={report.profit_loss || 0}
                            />
                            <span className="text-xs text-gray-500">P&L:</span>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              report.profit_loss >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(report.profit_loss)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Margin:</span>
                          <span
                            className={`text-xs font-medium ${
                              report.profit_loss_percentage >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {report.profit_loss_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Paid:</span>
                          <span className="text-sm font-medium text-blue-600">
                            {formatCurrency(report.total_paid)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Outstanding:
                          </span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(report.outstanding_amount)}
                          </span>
                        </div>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            report.payment_status === "Fully Paid"
                              ? "bg-green-100 text-green-800"
                              : report.payment_status === "Partially Paid"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDetailModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No reports found matching your criteria.
              </p>
            </div>
          )}
          {totalPages > 1 && renderPagination()}
        </div>
      </div>
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Detailed Report</h3>
                  <p className="text-blue-100">
                    Request ID: {selectedReport.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Request Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Request ID:</span>
                      <span className="font-medium">{selectedReport.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">SHIPA No:</span>
                      <span className="font-medium">
                        {selectedReport.shipa_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tracking ID:</span>
                      <span className="font-medium">
                        {selectedReport.tracking_id || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">GR Number:</span>
                      <span className="font-medium">
                        {selectedReport.gr_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Trip Number:</span>
                      <span className="font-medium">
                        {selectedReport.trip_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Invoice Number:</span>
                      <span className="font-medium">
                        {selectedReport.invoice_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span>
                        <StatusBadge status={selectedReport.status} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-green-600" />
                    Customer & Route
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer:</span>
                      <span className="font-medium">
                        {selectedReport.customer_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer ID:</span>
                      <span className="font-medium">
                        {selectedReport.customer_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">SHIPA No:</span>
                      <span className="font-medium">
                        {selectedReport.shipa_no}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pickup Location:</span>
                      <span className="font-medium">
                        {selectedReport.pickup_location || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Location:</span>
                      <span className="font-medium">
                        {selectedReport.delivery_location || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commodity:</span>
                      <span className="font-medium">
                        {selectedReport.commodity || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Type:</span>
                      <span className="font-medium">
                        {selectedReport.vehicle_type || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-green-600" />
                    Vehicle-Container Mapping
                  </h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(
                      selectedReport.vehicle_container_mapping
                    ).map(([vehicle, info]) => (
                      <div key={vehicle} className="flex justify-between">
                        <span className="text-gray-500">{vehicle}:</span>
                        <span className="font-medium">
                          {info.containers.join(", ")} [
                          {info.container_types.join(", ")}/
                          {info.container_sizes.join(", ")}]
                        </span>
                      </div>
                    ))}
                    {Object.keys(selectedReport.vehicle_container_mapping)
                      .length === 0 && <div className="text-gray-500">N/A</div>}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Financial Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service Charges:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(selectedReport.service_charges)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Charges:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(selectedReport.vehicle_charges)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-500 font-medium">
                        Profit/Loss:
                      </span>
                      <span
                        className={`font-bold ${
                          selectedReport.profit_loss >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(selectedReport.profit_loss)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profit Margin:</span>
                      <span
                        className={`font-medium ${
                          selectedReport.profit_loss_percentage >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedReport.profit_loss_percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                    Payment Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Paid:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(selectedReport.total_paid)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Outstanding:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(selectedReport.outstanding_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedReport.payment_status === "Fully Paid"
                            ? "bg-green-100 text-green-800"
                            : selectedReport.payment_status === "Partially Paid"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedReport.payment_status}
                      </span>
                    </div>
                    {selectedReport.transaction_data && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Transaction ID:</span>
                          <span className="font-medium">
                            {selectedReport.transaction_data.id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment Method:</span>
                          <span className="font-medium">
                            {selectedReport.transaction_data.payment_method ||
                              "N/A"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-purple-600" />
                    Cargo Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Container Numbers:</span>
                      <span className="font-medium">
                        {selectedReport.container_numbers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">20ft Containers:</span>
                      <span className="font-medium">
                        {selectedReport.containers_20ft || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">40ft Containers:</span>
                      <span className="font-medium">
                        {selectedReport.containers_40ft || 0}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-500 font-medium">
                        Total Containers:
                      </span>
                      <span className="font-bold">
                        {selectedReport.total_containers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cargo Weight:</span>
                      <span className="font-medium">
                        {selectedReport.cargo_weight || "N/A"}{" "}
                        {selectedReport.cargo_weight ? "kg" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Count:</span>
                      <span className="font-medium">
                        {selectedReport.vehicle_count}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">
                        {formatDateTime(selectedReport.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Updated:</span>
                      <span className="font-medium">
                        {formatDateTime(selectedReport.updated_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected Pickup:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.expected_pickup_date) ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected Delivery:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.expected_delivery_date) ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Actual Delivery:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.actual_delivery_date) ||
                          "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {selectedReport.transporter_details &&
                selectedReport.transporter_details.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-green-600" />
                      Transporter Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedReport.transporter_details.map(
                        (transporter, index) => (
                          <div
                            key={index}
                            className="bg-white border rounded-lg p-4"
                          >
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Vehicle Number:
                                </span>
                                <span className="font-medium">
                                  {transporter.vehicle_number}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Container Number:
                                </span>
                                <span className="font-medium">
                                  {transporter.container_no || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Container Type:
                                </span>
                                <span className="font-medium">
                                  {transporter.container_type || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Container Size:
                                </span>
                                <span className="font-medium">
                                  {transporter.container_size || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Assigner Name:
                                </span>
                                <span className="font-medium">
                                  {transporter.driver_name || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Driver Phone:
                                </span>
                                <span className="font-medium">
                                  {transporter.driver_phone || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Total Charge:
                                </span>
                                <span className="font-medium text-orange-600">
                                  {formatCurrency(transporter.total_charge)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Additional Charge:
                                </span>
                                <span className="font-medium text-orange-600">
                                  {formatCurrency(
                                    transporter.additional_charges
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              {selectedReport.special_instructions && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Special Instructions:
                  </h4>
                  <p className="text-sm text-gray-700">
                    {selectedReport.special_instructions}
                  </p>
                </div>
              )}
            </div>
            <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const headers = [
                    "Request ID",
                    "Tracking ID",
                    "GR No",
                    "Trip No",
                    "Invoice No",
                    "SHIPA No",
                    "Container Numbers",
                    "Vehicle-Container Mapping",
                    "Customer Name",
                    "Customer ID",
                    "Pickup Location",
                    "Delivery Location",
                    "Vehicle Type",
                    "Commodity",
                    "Status",
                    "Service Charges",
                    "Vehicle Charges",
                    "Profit/Loss",
                    "Profit %",
                    "Total Paid",
                    "Outstanding",
                    "Payment Status",
                    "Created Date",
                    "Delivery Date",
                    "Containers 20ft",
                    "Containers 40ft",
                    "Total Containers",
                    "Cargo Weight",
                    "Vehicle Count",
                  ];
                  const csvData = [
                    [
                      selectedReport.id,
                      selectedReport.tracking_id || "N/A",
                      selectedReport.gr_no,
                      selectedReport.trip_no,
                      selectedReport.invoice_no,
                      selectedReport.shipa_no,
                      selectedReport.container_numbers,
                      Object.entries(selectedReport.vehicle_container_mapping)
                        .map(
                          ([vehicle, info]) =>
                            `${vehicle}: ${info.containers.join(
                              ", "
                            )} [${info.container_types.join(
                              ", "
                            )}/${info.container_sizes.join(", ")}]`
                        )
                        .join("; ") || "N/A",
                      selectedReport.customer_name,
                      selectedReport.customer_id,
                      selectedReport.pickup_location || "N/A",
                      selectedReport.delivery_location || "N/A",
                      selectedReport.vehicle_type || "N/A",
                      selectedReport.commodity || "N/A",
                      selectedReport.status,
                      selectedReport.service_charges,
                      selectedReport.vehicle_charges,
                      selectedReport.profit_loss,
                      selectedReport.profit_loss_percentage.toFixed(2),
                      selectedReport.total_paid,
                      selectedReport.outstanding_amount,
                      selectedReport.payment_status,
                      formatDate(selectedReport.created_at),
                      formatDate(selectedReport.expected_delivery_date),
                      selectedReport.containers_20ft || 0,
                      selectedReport.containers_40ft || 0,
                      selectedReport.total_containers,
                      selectedReport.cargo_weight || 0,
                      selectedReport.vehicle_count,
                    ],
                  ];
                  const csvContent = [headers, ...csvData]
                    .map((row) => row.map((cell) => `"${cell}"`).join(","))
                    .join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `shipment-report-${selectedReport.id}-${
                    new Date().toISOString().split("T")[0]
                  }.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success("Report exported successfully!");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentReports;
