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
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    approved: { color: "bg-green-100 text-green-800", icon: "✓" },
    "in progress": { color: "bg-blue-100 text-blue-800", icon: "🚛" },
    completed: { color: "bg-purple-100 text-purple-800", icon: "📦" },
    rejected: { color: "bg-red-100 text-red-800", icon: "✕" },
  };
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <span>{config.icon}</span>
      {status}
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
  const [exportType, setExportType] = useState("detailed");
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
          Object.entries(report.vehicle_container_mapping)
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
      const fileNameSuffix = "detailed";

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(
        wb,
        `admin-reports-${fileNameSuffix}-${
          new Date().toISOString().split("T")[0]
        }.xlsx`
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
      setRequests([]); // Clear previous results if any
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

  const handleModalClose = () => {
    setSelectedReport(null);
    setTransporterDetails(null);
    setAdminComment("");
    setShowDetailModal(false);
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      setUpdating(true);

      await api.put(`/transport-requests/${requestId}/status`, {
        status,
        adminComment: adminComment.trim(),
      });

      handleModalClose();
      fetchFilteredRequests(); // Refetch current page
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update request status");
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenInvoicePreviewModal = async (report) => {
    try {
      const loadingToast = toast.loading("Loading invoice preview...");
      const response = await api.get(
        `/transport-requests/${report.id}/transporter`
      );
      const transporterDetails = response.data.success
        ? response.data.data
        : null;
      setSelectedReportForInvoice({ report, transporterDetails });
      setInvoicePreviewModalOpen(true);
      toast.dismiss(loadingToast);
    } catch (error) {
      console.error("Error loading invoice preview:", error);
      toast.error("Failed to load invoice preview. Please try again.");
    }
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Filtered Transport Requests
        </h2>
        <p className="text-gray-600 mt-1">
          Filter transport requests by SHIPA No, Request ID, Container No, Date,
          or Date Range.
        </p>
      </div>

      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="SHIPA No"
            className="px-4 py-2 border rounded-lg"
            value={shipaNo}
            onChange={(e) => setShipaNo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Request ID"
            className="px-4 py-2 border rounded-lg"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Container No"
            className="px-4 py-2 border rounded-lg"
            value={containerNo}
            onChange={(e) => setContainerNo(e.target.value)}
          />
          <input
            type="date"
            placeholder="Specific Date"
            className="px-4 py-2 border rounded-lg"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="date"
            placeholder="From Date"
            className="px-4 py-2 border rounded-lg"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="date"
            placeholder="To Date"
            className="px-4 py-2 border rounded-lg"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={handleSearch}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            <Search className="h-5 w-5 mr-2" />
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </button>
          <button
            onClick={exportVehicleWiseExcel}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Vehicle-wise
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service & Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing & Details
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
              {requests.map((request) => {
                const serviceTypes = parseServiceType(request.service_type);

                return (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {`Booking #${request.id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            SHIPA No: {request.SHIPA_NO}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.vehicle_type}
                          {request.vehicle_size && ` (${request.vehicle_size})`}
                        </div>
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
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>
                          Pickup: {request.pickup_location || "Not specified"}
                        </div>
                        <div>
                          Delivery:{" "}
                          {request.delivery_location || "Not specified"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(request.requested_price)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewReport(request)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
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
              Use the filters above to search for transport requests.
            </p>
          </div>
        )}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Detailed Admin Report</h3>
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
                {/* Request Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
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

                {/* Customer & Route Information */}
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
                      <span className="text-gray-500">Customer Email:</span>
                      <span className="font-medium">
                        {selectedReport.customer_email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Consignee:</span>
                      <span className="font-medium">
                        {selectedReport.consignee || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Consigner:</span>
                      <span className="font-medium">
                        {selectedReport.consigner || "N/A"}
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
                    {selectedReport.stuffing_location && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Stuffing Location:
                        </span>
                        <span className="font-medium">
                          {selectedReport.stuffing_location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service & Vehicle Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-blue-600" />
                    Service & Vehicle
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle Type:</span>
                      <span className="font-medium">
                        {selectedReport.vehicle_type || "N/A"}{" "}
                        {selectedReport.vehicle_size &&
                          `(${selectedReport.vehicle_size})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commodity:</span>
                      <span className="font-medium">
                        {selectedReport.commodity || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cargo Type:</span>
                      <span className="font-medium">
                        {selectedReport.cargo_type || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Services:</span>
                      <div>
                        {selectedReport.service_types.length > 0 ? (
                          selectedReport.service_types.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
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

                {/* Payment Information */}
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

                {/* Cargo Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-purple-600" />
                    Cargo Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Container Numbers:</span>
                      <span className="font-medium">
                        {selectedReport.container_numbers || "N/A"}
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

                {/* Timeline */}
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
                        {formatDate(selectedReport.expected_pickup_date)}{" "}
                        {selectedReport.expected_pickup_time || ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected Delivery:</span>
                      <span className="font-medium">
                        {formatDate(selectedReport.expected_delivery_date)}{" "}
                        {selectedReport.expected_delivery_time || ""}
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

                {/* Vehicle-Container Mapping */}
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
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-red-600" />
                  Admin Actions
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Admin Comment
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      placeholder="Enter comments or notes..."
                    />
                  </div>
                  <div className="flex space-x-4">
                    {["approved", "rejected", "in progress", "completed"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            handleStatusUpdate(selectedReport.id, status)
                          }
                          disabled={updating}
                          className={`px-4 py-2 rounded-lg text-white font-medium ${
                            status === "approved"
                              ? "bg-green-600 hover:bg-green-700"
                              : status === "rejected"
                              ? "bg-red-600 hover:bg-red-700"
                              : status === "in progress"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-purple-600 hover:bg-purple-700"
                          } ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Transporter Details */}
              {Object.keys(selectedReport.vehicle_container_mapping).length >
                0 && (
                <div className="mt-8">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-green-600" />
                    Transporter Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(
                      selectedReport.vehicle_container_mapping
                    ).map(([vehicle, info], index) => (
                      <div
                        key={index}
                        className="bg-white border rounded-lg p-4"
                      >
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Vehicle Number:
                            </span>
                            <span className="font-medium">{vehicle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Container Numbers:
                            </span>
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
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Transporter Name:
                            </span>
                            <span className="font-medium">
                              {info.transporter_name || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Driver Name:</span>
                            <span className="font-medium">
                              {info.driver_name || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Driver Phone:</span>
                            <span className="font-medium">
                              {info.driver_phone || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total Charge:</span>
                            <span className="font-medium text-orange-600">
                              {formatCurrency(info.total_charge)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Additional Charge:
                            </span>
                            <span className="font-medium text-orange-600">
                              {formatCurrency(info.additional_charges)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
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
                  const data = [
                    {
                      "Request ID": selectedReport.id,
                      "Tracking ID": selectedReport.tracking_id || "N/A",
                      "GR No": selectedReport.gr_no,
                      "Trip No": selectedReport.trip_no,
                      "Invoice No": selectedReport.invoice_no,
                      "SHIPA No": selectedReport.shipa_no,
                      "Container Numbers": selectedReport.container_numbers,
                      "Vehicle-Container Mapping":
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
                      "Customer Name": selectedReport.customer_name,
                      "Customer Email": selectedReport.customer_email || "N/A",
                      Consignee: selectedReport.consignee || "N/A",
                      Consigner: selectedReport.consigner || "N/A",
                      "Pickup Location":
                        selectedReport.pickup_location || "N/A",
                      "Delivery Location":
                        selectedReport.delivery_location || "N/A",
                      "Vehicle Type": selectedReport.vehicle_type || "N/A",
                      Commodity: selectedReport.commodity || "N/A",
                      Status: selectedReport.status,
                      "Service Charges": selectedReport.service_charges,
                      "Vehicle Charges": selectedReport.vehicle_charges,
                      "Profit/Loss": selectedReport.profit_loss,
                      "Profit %":
                        selectedReport.profit_loss_percentage.toFixed(2),
                      "Total Paid": selectedReport.total_paid,
                      Outstanding: selectedReport.outstanding_amount,
                      "Payment Status": selectedReport.payment_status,
                      "Created Date": formatDate(selectedReport.created_at),
                      "Delivery Date": formatDate(
                        selectedReport.expected_delivery_date
                      ),
                      "Containers 20ft": selectedReport.containers_20ft || 0,
                      "Containers 40ft": selectedReport.containers_40ft || 0,
                      "Total Containers": selectedReport.total_containers,
                      "Cargo Weight": selectedReport.cargo_weight || 0,
                      "Vehicle Count": selectedReport.vehicle_count,
                    },
                  ];
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Report");
                  XLSX.writeFile(
                    wb,
                    `admin-report-${selectedReport.id}-${
                      new Date().toISOString().split("T")[0]
                    }.xlsx`
                  );
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

      {/* Invoice Preview Modal */}
      {isInvoicePreviewModalOpen && selectedReportForInvoice && (
        <InvoicePreviewModal
          isOpen={isInvoicePreviewModalOpen}
          onClose={() => setInvoicePreviewModalOpen(false)}
          report={selectedReportForInvoice.report}
          transporterDetails={selectedReportForInvoice.transporterDetails}
        />
      )}
    </div>
  );
}
