import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Download,
  Package,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/Api";
import { transporterAPI } from "../utils/Api";

// Utility function for parsing JSON
const parseJSON = (data, defaultValue) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || defaultValue;
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return defaultValue;
  }
};

const ContainerAssignmentDashboard = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shipaNo, setShipaNo] = useState("");
  const [requestId, setRequestId] = useState("");
  const [containerNo, setContainerNo] = useState("");
  const [date, setDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false); // Track if filters are applied

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Cache for transporter details
  const transporterCache = useMemo(() => new Map(), []);

  // Calculate total amount for a request
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

  // Fetch transaction data for a request
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

  // Fetch and process reports
  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      let response;
      const params = { page: currentPage, limit: itemsPerPage };

      if (isFiltered) {
        // Apply filters only if search is triggered
        if (
          !shipaNo &&
          !requestId &&
          !containerNo &&
          !date &&
          !fromDate &&
          !toDate
        ) {
          toast.info("Please enter at least one filter criterion to search.");
          setReports([]);
          setTotalItems(0);
          setTotalPages(0);
          setIsLoading(false);
          return;
        }
        if (shipaNo) params.shipa_no = shipaNo;
        if (requestId) params.request_id = requestId;
        if (containerNo) params.container_no = containerNo;
        if (date) params.date = date;
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        response = await api.get("/transport-requests/filtered", { params });
      } else {
        // Fetch all data on initial load
        response = await api.get("/transport-requests/all", { params });
      }

      const {
        requests: shipments,
        totalRequests,
        totalPages: newTotalPages,
      } = response.data;

      const reportsWithDetails = await Promise.all(
        shipments.map(async (shipment) => {
          let vehicleContainerMapping = {};
          let assignedContainers = 0;
          let transporterDetails = [];

          try {
            if (transporterCache.has(shipment.id)) {
              transporterDetails = transporterCache.get(shipment.id);
            } else {
              const transporterResponse =
                await transporterAPI.getTransporterByRequestId(shipment.id);
              if (transporterResponse.success) {
                transporterDetails = Array.isArray(transporterResponse.data)
                  ? transporterResponse.data
                  : [transporterResponse.data];
                transporterCache.set(shipment.id, transporterDetails);
              }
            }

            if (transporterDetails.length > 0) {
                vehicleContainerMapping = transporterDetails.reduce((acc, detail) => {
                  const vehicleNum = detail.vehicle_number || "Unknown";
                  if (!acc[vehicleNum]) {
                    acc[vehicleNum] = {
                      containers: [],
                      container_types: [],
                      container_sizes: [],
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
                  return acc;
                }, {});
                assignedContainers = Object.values(
                  vehicleContainerMapping
                ).reduce((sum, info) => sum + info.containers.length, 0);
            }
          } catch (error) {
            console.log(`No transporter details for shipment ${shipment.id}`);
          }

          const transactionData = await fetchTransactionData(shipment.id);

          const totalContainers =
            (shipment.containers_20ft || 0) + (shipment.containers_40ft || 0);
          const leftoverContainers = totalContainers - assignedContainers;
          const leftoverStatus =
            leftoverContainers === 0
              ? "Complete"
              : leftoverContainers > 0
              ? "Pending"
              : "Overassigned";

          const service_charge = parseFloat(shipment.requested_price || 0);
          const total_charge = calculateRequestTotalAmount(transporterDetails);
          const advance_paid = transactionData
            ? transactionData.reduce(
                (sum, tx) => sum + parseFloat(tx.total_paid || 0),
                0
              )
            : 0;
          const amount_remaining = total_charge - advance_paid;

          return {
            id: shipment.id,
            formatted_request_id:
              shipment.formatted_request_id || `Booking #${shipment.id}`,
            shipa_no: shipment.SHIPA_NO || "N/A",
            pickup_location: shipment.pickup_location || "N/A",
            delivery_location: shipment.delivery_location || "N/A",
            consigner: shipment.consigner || "N/A",
            total_containers: totalContainers,
            assigned_containers: assignedContainers,
            leftover_containers: leftoverContainers,
            leftover_status: leftoverStatus,
            vehicle_container_mapping: vehicleContainerMapping,
            service_charge,
            total_charge,
            advance_paid,
            amount_remaining,
          };
        })
      );

      setReports(reportsWithDetails);
      setTotalItems(totalRequests);
      setTotalPages(newTotalPages);
    } catch (error) {
      console.error("Error fetching container reports:", error);
      toast.error("Failed to fetch container reports");
      setReports([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    transporterCache,
    calculateRequestTotalAmount,
    fetchTransactionData,
    currentPage,
    shipaNo,
    requestId,
    containerNo,
    date,
    fromDate,
    toDate,
    isFiltered,
  ]);

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers for UI
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
    setIsFiltered(true); // Enable filtered mode
  };

  // Handle view report
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  // Export to Excel
  const exportToExcel = useCallback(() => {
    try {
      const loadingToast = toast.loading("Generating Excel report...");
      const data = reports.map((report) => ({
        "Request ID": report.id,
        "SHIPA Request ID": report.shipa_no,
        From: report.pickup_location,
        To: report.delivery_location,
        Consigner: report.consigner,
        "Total Containers": report.total_containers,
        "Assigned Containers": report.assigned_containers,
        "Leftover Containers": report.leftover_containers,
        Status: report.leftover_status,
        "Service Charge": report.service_charge,
        "Total Charge": report.total_charge,
        "Advance Paid": report.advance_paid,
        "Amount Remaining": report.amount_remaining,
        "Assigned Containers to Vehicles":
          Object.entries(report.vehicle_container_mapping)
            .map(
              ([vehicle, info]) => `${vehicle}: ${info.containers.join(", ")}`
            )
            .join("; ") || "N/A",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Container Assignments");
      XLSX.writeFile(
        wb,
        `container-assignments-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.dismiss(loadingToast);
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.dismiss();
      toast.error("Failed to export report");
    }
  }, [reports]);

  useEffect(() => {
    fetchReports();
  }, [currentPage, isFiltered]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading container assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Container Assignment Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View all container assignments or filter by SHIPA No, Request
                ID, Container No, Specific Date, From Date, or To Date
              </p>
            </div>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <input
              type="text"
              placeholder="SHIPA No"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={shipaNo}
              onChange={(e) => setShipaNo(e.target.value)}
            />
            <input
              type="text"
              placeholder="Request ID"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Container No"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={containerNo}
              onChange={(e) => setContainerNo(e.target.value)}
            />
            <input
              type="date"
              placeholder="Specific Date"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="date"
              placeholder="From Date"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              placeholder="To Date"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSearch}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              <Search className="h-5 w-5 mr-2" />
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Container Assignments Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SHIPA Request ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consigner
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Containers
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Containers
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leftover Containers
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Charge
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Charge
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advance Paid
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Remaining
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.formatted_request_id}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.shipa_no}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.pickup_location}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.delivery_location}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.consigner}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.total_containers}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.assigned_containers}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.leftover_containers}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          report.leftover_status === "Complete"
                            ? "bg-green-100 text-green-800"
                            : report.leftover_status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {report.leftover_status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.service_charge}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.total_charge}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.advance_paid}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.amount_remaining}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleViewReport(report)}
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
            {reports.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {isFiltered
                    ? "No container assignments found matching your criteria."
                    : "No container assignments found."}
                </p>
              </div>
            )}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t px-6">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                Prev
              </button>
              <div className="flex space-x-1">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-2 py-1 text-xs rounded ${
                      currentPage === page
                        ? "bg-blue-500 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    Container Assignment Details
                  </h3>
                  <p className="text-blue-100">
                    Request ID: {selectedReport.formatted_request_id}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Request Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    Request Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Request ID:</span>
                      <span className="font-medium">
                        {selectedReport.formatted_request_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">SHIPA Request ID:</span>
                      <span className="font-medium">
                        {selectedReport.shipa_no}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Route Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-green-600" />
                    Route & Consigner
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">From:</span>
                      <span className="font-medium">
                        {selectedReport.pickup_location}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">To:</span>
                      <span className="font-medium">
                        {selectedReport.delivery_location}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Consigner:</span>
                      <span className="font-medium">
                        {selectedReport.consigner}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Container Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-purple-600" />
                    Container Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Containers:</span>
                      <span className="font-medium">
                        {selectedReport.total_containers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Assigned Containers:
                      </span>
                      <span className="font-medium">
                        {selectedReport.assigned_containers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Leftover Containers:
                      </span>
                      <span className="font-medium">
                        {selectedReport.leftover_containers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          selectedReport.leftover_status === "Complete"
                            ? "bg-green-100 text-green-800"
                            : selectedReport.leftover_status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedReport.leftover_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle-Container Mapping */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    Vehicle-Container Mapping
                  </h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedReport.vehicle_container_mapping)
                      .length > 0 ? (
                      Object.entries(
                        selectedReport.vehicle_container_mapping
                      ).map(([vehicle, info], index) => (
                        <div
                          key={index}
                          className="space-y-2 border-b pb-2 last:border-b-0"
                        >
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Vehicle Number:
                            </span>
                            <span className="font-medium">{vehicle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Containers:</span>
                            <span className="font-medium">
                              {info.containers.join(", ") || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Container Types:
                            </span>
                            <span className="font-medium">
                              {info.container_types.join(", ") || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Container Sizes:
                            </span>
                            <span className="font-medium">
                              {info.container_sizes.join(", ") || "N/A"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">
                        No vehicle-container mappings available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainerAssignmentDashboard;
