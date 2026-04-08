import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/Api";
import { toast } from "react-toastify";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import ShipmentDetailsModal from "../Components/dashboard/Shipmentsmodal";
import ShipmentSummary from "../Components/ShipmentSummary";
import ShipmentTable from "../Components/Shipmentstable";
import {
  transporterAPI,
  transporterListAPI,
  transportRequestAPI,
} from "../utils/Api";

const ShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  // New filter states matching Admindashboard
  const [shipaNo, setShipaNo] = useState("");
  const [requestId, setRequestId] = useState("");
  const [containerNo, setContainerNo] = useState("");
  const [specificDate, setSpecificDate] = useState("");

  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [containerDetails, setContainerDetails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContainerDetails, setIsLoadingContainerDetails] =
    useState(false);
  const { user } = useAuth();
  const [vehicleDataList, setVehicleDataList] = useState([]);
  const [services, setServices] = useState([]);
  const [numberOfVehicles, setNumberOfVehicles] = useState(1);
  const [transportRequestId, setTransportRequestId] = useState(null);

  // New state for tracking filtered mode
  const [isFiltered, setIsFiltered] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Enhanced Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isChangingPage, setIsChangingPage] = useState(false);

  // Pagination options
  const itemsPerPageOptions = [10, 25, 50, 100];

  useEffect(() => {
    fetchShipments();
  }, [currentPage, itemsPerPage]);

  const initializeVehicleData = (count) => {
    return Array(count)
      .fill()
      .map((_, index) => ({
        id: null,
        vehicleIndex: index + 1,
        transporterName: "",
        vehicleNumber: "",
        driverName: "",
        driverContact: "",
        licenseNumber: "",
        licenseExpiry: "",
        baseCharge: "",
        additionalCharges: "",
        totalCharge: 0,
        serviceCharges: {},
        containerNo: "",
        line: "",
        sealNo: "",
        numberOfContainers: "",
        seal1: "",
        seal2: "",
        containerTotalWeight: "",
        cargoTotalWeight: "",
        containerType: "",
        containerSize: "",
      }));
  };

  // Helper function to calculate total amount for a request
  const calculateRequestTotalAmount = (containerDetails) => {
    if (!Array.isArray(containerDetails) || containerDetails.length === 0) {
      return 0;
    }

    return containerDetails.reduce((total, detail) => {
      const vehicleTotal = parseFloat(detail.total_charge || 0);
      return total + vehicleTotal;
    }, 0);
  };

  const loadTransporterDetails = async (requestId) => {
    if (!requestId) return [];

    setIsLoadingContainerDetails(true);
    try {
      const response = await transporterAPI.getTransporterByRequestId(
        requestId
      );

      if (response.success) {
        console.log("Container details response:", response);
        const details = Array.isArray(response.data)
          ? response.data
          : [response.data];

        // Map the API response to match the expected format for the modal
        const mappedContainerDetails = details.map((detail, index) => ({
          id: detail.id,
          driver_name: detail.driver_name || "",
          driver_contact: detail.driver_contact || "",
          vehicle_number: detail.vehicle_number || "",
          transporter_name: detail.transporter_name || "",
          container_no: detail.container_no || "",
          container_size: detail.container_size || "",
          container_type: detail.container_type || "",
          number_of_containers: detail.number_of_containers || "",
          container_total_weight: detail.container_total_weight || 0,
          license_number: detail.license_number || "",
          license_expiry: detail.license_expiry || "",
          seal1: detail.seal1 || "",
          seal2: detail.seal2 || "",
          line: detail.line || "",
          base_charge: detail.base_charge || 0,
          additional_charges: detail.additional_charges || 0,
          total_charge: detail.total_charge || 0,
          service_charges: detail.service_charges || "{}",
        }));

        // Filter unique vehicles based on vehicle_number
        const uniqueVehicles = [];
        const vehicleMap = new Map();

        mappedContainerDetails.forEach((detail) => {
          if (detail.vehicle_number && !vehicleMap.has(detail.vehicle_number)) {
            vehicleMap.set(detail.vehicle_number, detail);
            uniqueVehicles.push(detail);
          }
        });

        // Calculate the total amount for this request (using only unique vehicles)
        const requestTotalAmount = calculateRequestTotalAmount(uniqueVehicles);
        console.log(
          `Total amount for request ${requestId} (unique vehicles):`,
          requestTotalAmount
        );

        // Fetch transaction data for this request
        try {
          const transactionResponse = await api.get(
            `/transactions/request/${requestId}`
          );
          if (
            transactionResponse.data.success &&
            transactionResponse.data.data.length > 0
          ) {
            // Add transaction data to the first container detail
            const transaction = transactionResponse.data.data[0];
            if (uniqueVehicles.length > 0) {
              uniqueVehicles[0].transaction = transaction;

              // Compare transaction amount with calculated total
              const transactionAmount = parseFloat(
                transaction.transporter_charge || 0
              );
              if (transactionAmount !== requestTotalAmount) {
                console.warn(
                  `Amount mismatch for request ${requestId}: Transaction amount: ${transactionAmount}, Calculated total: ${requestTotalAmount}`
                );
              }
            }
          }
        } catch (transactionError) {
          console.log("No transaction data found for request:", requestId);
        }

        // Add the calculated total amount to each detail for reference
        uniqueVehicles.forEach((detail) => {
          detail.request_total_amount = requestTotalAmount;
          detail.individual_vehicle_charge = detail.total_charge; // Keep individual charge separate
        });

        return uniqueVehicles;
      }
      return [];
    } catch (error) {
      if (error.status === 404 || error.message?.includes("not found")) {
        console.log(
          "No existing transporter details found for request:",
          requestId
        );
        return [];
      } else {
        console.error("Error loading transporter details:", error);
        toast.error(error.message || "Error loading container details");
        return [];
      }
    } finally {
      setIsLoadingContainerDetails(false);
    }
  };

  // Updated fetchShipments function to support filtered vs all data
  const fetchShipments = async () => {
    setIsChangingPage(true);
    try {
      let response;

      if (isFiltered) {
        // Use filtered endpoint when filters are applied
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          shipa_no: shipaNo || undefined,
          request_id: requestId || undefined,
          container_no: containerNo || undefined,
          date: specificDate || undefined,
          from_date: dateRange.from || undefined,
          to_date: dateRange.to || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        };

        // Remove undefined values
        Object.keys(params).forEach((key) => {
          if (params[key] === undefined) delete params[key];
        });

        response = await api.get("/transport-requests/filtered", { params });
      } else {
        // Use all data endpoint when no filters
        const params = { page: currentPage, limit: itemsPerPage };
        response = await api.get("/transport-requests/all", { params });
      }

      const {
        requests,
        totalRequests,
        totalPages: resTotalPages,
        currentPage: resPage,
      } = response.data;

      // Process shipments to include calculated total amounts
      const shipmentsWithTotals = await Promise.all(
        requests.map(async (shipment) => {
          try {
            // Fetch transporter details for each shipment to calculate total
            const transporterResponse =
              await transporterAPI.getTransporterByRequestId(shipment.id);
            if (transporterResponse.success) {
              const details = Array.isArray(transporterResponse.data)
                ? transporterResponse.data
                : [transporterResponse.data];

              // Filter unique vehicles based on vehicle_number
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

              const calculatedTotal =
                calculateRequestTotalAmount(uniqueVehicles);

              return {
                ...shipment,
                requested_price: calculatedTotal, // Override requested_price with calculated total
                original_requested_price: shipment.requested_price, // Keep original for reference
                vehicle_count: uniqueVehicles.length, // Use unique vehicle count
              };
            }
          } catch (error) {
            console.log(
              `No transporter details found for shipment ${shipment.id}`
            );
          }

          return {
            ...shipment,
            requested_price: parseFloat(shipment.requested_price || 0),
            original_requested_price: shipment.requested_price,
            vehicle_count: shipment.no_of_vehicles || 1,
          };
        })
      );

      setShipments(shipmentsWithTotals);
      setFilteredShipments(shipmentsWithTotals);
      setTotalItems(totalRequests);
      setTotalPages(resTotalPages);
      setCurrentPage(resPage);
      console.log(
        "Fetched shipments with calculated totals (unique vehicles):",
        shipmentsWithTotals
      );
    } catch (error) {
      console.error("Error fetching shipments:", error);
      toast.error("Failed to fetch shipments");
      setShipments([]);
      setFilteredShipments([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
      setIsChangingPage(false);
      setIsSearching(false);
    }
  };

  const handleViewDetails = async (shipment) => {
    setSelectedShipment(shipment);
    setTransportRequestId(shipment.id);
    setNumberOfVehicles(shipment.no_of_vehicles || 1);

    // Load container details before showing modal
    const containerData = await loadTransporterDetails(shipment.id);

    // Calculate the total amount from container details
    const requestTotalAmount = calculateRequestTotalAmount(containerData);

    // Ensure each container detail has the correct total amount
    const updatedContainerData = containerData.map((detail) => ({
      ...detail,
      request_total_amount: requestTotalAmount, // Use the calculated requestTotalAmount
      total_charge: detail.total_charge || 0,
    }));

    setContainerDetails(updatedContainerData);

    // Update the selected shipment with the calculated total amount
    const updatedShipment = {
      ...shipment,
      total_amount: requestTotalAmount, // Pass requestTotalAmount as total_amount
      vehicle_total_amount: requestTotalAmount,
      requested_price: requestTotalAmount, // Also update requested_price if needed
    };

    setSelectedShipment(updatedShipment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedShipment(null);
    setContainerDetails([]);
    setTransportRequestId(null);
  };

  const handleDownloadInvoice = (shipment) => {
    alert(`Downloading invoice for shipment ${shipment.id}`);
  };

  // Updated refresh function to clear all filters
  const refreshData = () => {
    setIsLoading(true);
    setIsFiltered(false); // Reset to show all data
    setCurrentPage(1);

    // Clear all filter fields
    setShipaNo("");
    setRequestId("");
    setContainerNo("");
    setSpecificDate("");
    setStatusFilter("all");
    setDateRange({ from: "", to: "" });

    fetchShipments();
    toast.success("Shipments data refreshed successfully");
  };

  // Handle search button click
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
    setIsFiltered(true); // Enable filtered mode
    setIsSearching(true); // Show loading state
    fetchShipments();

    // Show info toast if no filters applied
    if (
      !shipaNo &&
      !requestId &&
      !containerNo &&
      !specificDate &&
      !dateRange.from &&
      !dateRange.to &&
      statusFilter === "all"
    ) {
      toast.info("Please enter at least one filter criterion to search.");
    }
  };

  // Enhanced pagination functions
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate page numbers for pagination
  const getVisiblePages = () => {
    const delta = 2; // Show 2 pages before and after current page
    const range = [];
    const rangeWithDots = [];

    // Always show first page
    range.push(1);

    // Calculate start and end of middle range
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    // Add dots after first page if needed
    if (start > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        rangeWithDots.push(i);
      }
    }

    // Add dots before last page if needed
    if (end < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Shipments Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track and manage all your shipments in one place
                </p>
              </div>
              <button
                onClick={refreshData}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Filters Component matching Admindashboard */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-4">
            <input
              type="text"
              placeholder="SHIPA No"
              value={shipaNo}
              onChange={(e) => setShipaNo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Request ID"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Container No"
              value={containerNo}
              onChange={(e) => setContainerNo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              placeholder="Specific Date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              placeholder="From Date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              placeholder="To Date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSearching}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Summary Component */}
        <ShipmentSummary shipments={shipments} />

        {/* Table Component with loading overlay */}
        <div className="relative">
          {isChangingPage && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Loading page...</span>
              </div>
            </div>
          )}
          <ShipmentTable
            filteredShipments={filteredShipments}
            onViewDetails={handleViewDetails}
            onDownloadInvoice={handleDownloadInvoice}
          />
        </div>

        {/* Enhanced Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between">
              {/* Results info and items per page selector */}
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {totalItems.toLocaleString()}
                  </span>{" "}
                  results
                </div>

                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="itemsPerPage"
                    className="text-sm text-gray-700"
                  >
                    Show:
                  </label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) =>
                      handleItemsPerPageChange(Number(e.target.value))
                    }
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {itemsPerPageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700">per page</span>
                </div>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center space-x-2">
                {/* First page button */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous page button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                <div className="flex space-x-1">
                  {getVisiblePages().map((page, index) => (
                    <div key={index}>
                      {page === "..." ? (
                        <span className="px-3 py-2 text-gray-500">...</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-md border text-sm font-medium ${
                            currentPage === page
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Next page button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last page button */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick jump to page */}
            {totalPages > 10 && (
              <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <label htmlFor="jumpToPage" className="text-sm text-gray-700">
                    Go to page:
                  </label>
                  <input
                    id="jumpToPage"
                    type="number"
                    min="1"
                    max={totalPages}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          handlePageChange(page);
                          e.target.value = "";
                        }
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">of {totalPages}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for shipment details */}
      {showModal && selectedShipment && (
        <ShipmentDetailsModal
          shipment={{
            ...selectedShipment,
            total_amount: selectedShipment.requested_price, // Ensure total amount is available
            vehicle_total_amount: selectedShipment.requested_price,
          }}
          containerDetails={containerDetails}
          onClose={handleCloseModal}
          onDownloadInvoice={handleDownloadInvoice}
        />
      )}

      {/* Loading overlay for container details */}
      {isLoadingContainerDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading container details...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentsPage;
