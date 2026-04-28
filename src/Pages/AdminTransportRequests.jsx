import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../utils/Api";
import {
  Search,
  RefreshCw,
  Eye,
  Truck,
  MapPin,
  Package,
  Download,
} from "lucide-react";
import { generateInvoice } from "../utils/pdfGenerator";

import RequestModal from "../Components/Requestmodal";
import ManualInvoiceModal from "../Components/Manualinvoice";

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

const parseServicePrices = (servicePrices) => {
  if (!servicePrices) return {};
  try {
    return typeof servicePrices === "string"
      ? JSON.parse(servicePrices)
      : servicePrices;
  } catch (e) {
    console.error("Error parsing service prices:", e);
    return {};
  }
};

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return "Not specified";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export default function AdminTransportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [transporterDetails, setTransporterDetails] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showManualInvoiceModal, setShowManualInvoiceModal] = useState(false);
  const [manualInvoiceRequest, setManualInvoiceRequest] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [requestsPerPage] = useState(10);

  const fetchRequests = useCallback(
    async (page = 1, status = "all", search = "") => {
      setLoading(true);
      try {
        const response = await api.get("/transport-requests/all", {
          params: {
            page,
            limit: requestsPerPage,
            status: status === "all" ? "" : status,
            search,
          },
        });
        setRequests(response.data.requests || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
      } catch (error) {
        toast.error("Failed to fetch transport requests");
        setRequests([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [requestsPerPage]
  );

  const fetchTransporterDetails = async (requestId) => {
    try {
      const response = await api.get(
        `/transport-requests/${requestId}/transporter`
      );
      if (response.data.success) {
        console.log("transporter data", response.data);
        setTransporterDetails(
          Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data]
        );
      } else {
        setTransporterDetails(null);
      }
    } catch (error) {
      console.log("No transporter details found for request:", requestId);
      setTransporterDetails(null);
    }
  };

  useEffect(() => {
    fetchRequests(currentPage, statusFilter, searchTerm);
  }, [currentPage, statusFilter, searchTerm, fetchRequests]);

  const handleStatusUpdate = async (requestId, status) => {
    try {
      setUpdating(true);

      await api.put(`/transport-requests/${requestId}/status`, {
        status,
        adminComment: adminComment.trim(),
      });

      handleModalClose();
      fetchRequests(currentPage, statusFilter, searchTerm); // Refetch current page
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update request status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async (request) => {
    try {
      console.log("Starting invoice download for request:", request.id);
      const loadingToast = toast.loading("Generating invoice...");

      let transporterDetails = null;
      try {
        const response = await api.get(
          `/transport-requests/${request.id}/transporter`
        );
        if (response.data.success) {
          transporterDetails = response.data.data;
          console.log("response", response.data.data);
        }
      } catch (error) {
        console.log("No transporter details found");
      }

      const doc = generateInvoice(request, transporterDetails);
      if (!doc) {
        throw new Error("Failed to generate PDF document");
      }

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

  const handleManualInvoice = (request) => {
    setManualInvoiceRequest(request);
    setShowManualInvoiceModal(true);
  };

  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    setAdminComment(request.admin_comment || "");
    await fetchTransporterDetails(request.id);
  };

  const handleModalClose = () => {
    setSelectedRequest(null);
    setTransporterDetails(null);
    setAdminComment("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on status change
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading && requests.length === 0) {
    // Show loader only on initial load
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Transport Requests
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and review transport requests with detailed information
          </p>
        </div>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="Search requests..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => fetchRequests(currentPage, statusFilter, searchTerm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            <RefreshCw className="h-5 w-5 mr-2" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <table className="w-full min-w-[1300px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]">
                  Request Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[220px]">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[220px]">
                  Service & Vehicle
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[260px]">
                  Locations
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]">
                  Pricing & Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[120px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => {
                const serviceTypes = parseServiceType(request.service_type);
                const servicePrices = parseServicePrices(
                  request.service_prices
                );

                return (
                  <tr key={request.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-5 align-top">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.formatted_request_id ||
                              `Booking #${request.id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            Vehicles: {request.no_of_vehicles || 1}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top break-words">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.customer_email}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Consignee: {request.consignee || "Not specified"}
                        </div>
                        <div className="text-xs text-gray-400">
                          Consigner: {request.consigner || "Not specified"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <Truck className="h-4 w-4 mr-1" />
                          {request.vehicle_type}
                          {request.vehicle_size && ` (${request.vehicle_size})`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.commodity || "Not specified"}
                        </div>
                        <div className="text-xs text-gray-400">
                          Type: {request.cargo_type || "Not specified"}
                        </div>
                        {request.vehicle_status && (
                          <div className="text-xs text-blue-600 font-medium">
                            Status: {request.vehicle_status}
                          </div>
                        )}
                        <div className="mt-1">
                          {serviceTypes.length > 0 ? (
                            serviceTypes.map((service, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                              >
                                {service}
                              </span>
                            ))
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              No services specified
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <MapPin className="h-3 w-3 mr-1 text-green-600" />
                          <span className="font-medium">Pickup:</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2 ml-4 truncate max-w-xs">
                          {request.pickup_location || "Not specified"}
                        </div>
                        {request.stuffing_location && (
                          <>
                            <div className="flex items-center mb-1">
                              <MapPin className="h-3 w-3 mr-1 text-blue-600" />
                              <span className="font-medium text-xs">
                                Stuffing:
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mb-2 ml-4 truncate max-w-xs">
                              {request.stuffing_location}
                            </div>
                          </>
                        )}
                        <div className="flex items-center mb-1">
                          <MapPin className="h-3 w-3 mr-1 text-red-600" />
                          <span className="font-medium">Delivery:</span>
                        </div>
                        <div className="text-xs text-gray-600 ml-4 truncate max-w-xs">
                          {request.delivery_location || "Not specified"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top break-words">
                      <div className="text-sm">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(request.requested_price)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Weight:{" "}
                          {request.cargo_weight
                            ? `${request.cargo_weight}kg`
                            : "Not specified"}
                        </div>
                        {(request.containers_20ft > 0 ||
                          request.containers_40ft > 0) && (
                          <div className="text-xs text-gray-500">
                            Containers: {request.containers_20ft}×20ft,{" "}
                            {request.containers_40ft}×40ft
                          </div>
                        )}
                        {request.expected_pickup_date && (
                          <div className="text-xs text-gray-500">
                            Pickup:{" "}
                            {new Date(
                              request.expected_pickup_date
                            ).toLocaleDateString()}
                            {request.expected_pickup_time &&
                              ` ${request.expected_pickup_time}`}
                          </div>
                        )}
                        {request.expected_delivery_date && (
                          <div className="text-xs text-gray-500">
                            Delivery:{" "}
                            {new Date(
                              request.expected_delivery_date
                            ).toLocaleDateString()}
                            {request.expected_delivery_time &&
                              ` ${request.expected_delivery_time}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-5 align-top whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-1">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewRequest(request)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </div>
                        {request.status === "approved" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDownloadInvoice(request)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Download Invoice"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No requests found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No transport requests available at the moment."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      <RequestModal
        selectedRequest={selectedRequest}
        transporterDetails={transporterDetails}
        adminComment={adminComment}
        setAdminComment={setAdminComment}
        updating={updating}
        onClose={handleModalClose}
        onStatusUpdate={handleStatusUpdate}
        onManualInvoice={handleManualInvoice}
      />

      {/* Manual Invoice Modal */}
      <ManualInvoiceModal
        isOpen={showManualInvoiceModal}
        onClose={() => setShowManualInvoiceModal(false)}
        selectedRequest={manualInvoiceRequest}
        onGenerateInvoice={(invoicePayload) => {
          console.log("Generated manual invoice:", invoicePayload);
          // TODO: Implement invoice generation logic
          setShowManualInvoiceModal(false);
        }}
      />
    </div>
  );
}
