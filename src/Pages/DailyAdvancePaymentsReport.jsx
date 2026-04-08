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
} from "lucide-react";
import { toast } from "react-toastify";
import api, { transportRequestAPI } from "../utils/Api";

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return "Not specified";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString() : "N/A";

const formatDateTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleString() : "N/A";

const parseJSON = (data, defaultValue) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || defaultValue;
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return defaultValue;
  }
};

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
      const response = await api.get("/transactions/daily-advances", {
        params,
      });
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
                const requestResponse = await api.get(
                  "/transport-requests/filtered",
                  {
                    params: { request_id: transaction.request_id },
                  }
                );
                if (
                  requestResponse.data.success &&
                  requestResponse.data.requests.length > 0
                ) {
                  const request = requestResponse.data.requests[0];
                  requested_price = request.requested_price || 0;
                  request_details = {
                    consigner: request.consigner,
                    consignee: request.consignee,
                  };

                  // Calculate total containers for this request
                  const total_containers =
                    (request.containers_20ft || 0) +
                    (request.containers_40ft || 0);

                  // Fetch vehicle charges for this request
                  try {
                    const transporterResponse = await api.get(
                      `/transport-requests/${request.id}/transporter`
                    );
                    if (transporterResponse.data.success) {
                      const transporterDetails = Array.isArray(
                        transporterResponse.data.data
                      )
                        ? transporterResponse.data.data
                        : [transporterResponse.data.data];

                      vehicle_charges = transporterDetails;
                      total_vehicle_charges = transporterDetails.reduce(
                        (total, detail) =>
                          total + parseFloat(detail.total_charge || 0),
                        0
                      );
                    }
                  } catch (transporterError) {
                    console.log(
                      `No transporter details for request ${transaction.request_id}`
                    );
                  }

                  // Store total containers for service charge calculation
                  transaction.total_containers = total_containers;
                }
              } catch (e) {
                console.error(
                  `Failed to fetch details for request ${transaction.request_id}`,
                  e
                );
              }
              return {
                ...transaction,
                requested_price,
                request_details,
                vehicle_charges,
                total_vehicle_charges,
              };
            })
          );
          updatedData[date] = transactionsWithDetails;
        }
        setAdvanceData(updatedData);
      }
    } catch (error) {
      toast.error("Failed to fetch advance payments");
      console.error("Error fetching advance payments:", error);
      setAdvanceData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvancePayments();
  }, [singleDate, fromDate, toDate, filterType]);

  const handleViewDetails = async (requestId) => {
    if (!requestId) {
      toast.error("Request ID is not available.");
      return;
    }
    setIsFetchingDetails(true);
    setShowDetailsModal(true);
    try {
      const requestResponse = await api.get("/transport-requests/filtered", {
        params: { request_id: requestId },
      });

      if (
        requestResponse.data.success &&
        requestResponse.data.requests.length > 0
      ) {
        const report = requestResponse.data.requests[0];
        const transporterResponse = await api.get(
          `/transport-requests/${report.id}/transporter`
        );
        const transporterDetails = transporterResponse.data.success
          ? Array.isArray(transporterResponse.data.data)
            ? transporterResponse.data.data
            : [transporterResponse.data.data]
          : [];
        const transactionResponse = await api.get(
          `/transactions/request/${report.id}`
        );
        const transactionData = transactionResponse.data.success
          ? transactionResponse.data.data
          : null;

        const vehicleContainerMapping = (transporterDetails || []).reduce(
          (acc, detail) => {
            const vehicleNum = detail.vehicle_number || "Unknown";
            if (!acc[vehicleNum]) {
              acc[vehicleNum] = {
                containers: [],
                container_types: [],
                container_sizes: [],
                total_charge: parseFloat(detail.total_charge || 0),
                additional_charges: parseFloat(detail.additional_charges || 0),
                driver_name: detail.driver_name || "N/A",
                driver_phone: detail.driver_phone || "N/A",
                transporter_name: detail.transporter_name || "N/A",
              };
            }
            if (detail.container_no) {
              if (!acc[vehicleNum].containers.includes(detail.container_no)) {
                acc[vehicleNum].containers.push(detail.container_no);
                acc[vehicleNum].container_types.push(
                  detail.container_type || "N/A"
                );
                acc[vehicleNum].container_sizes.push(
                  detail.container_size || "N/A"
                );
              }
            }
            return acc;
          },
          {}
        );

        const containerNumbers = (transporterDetails || [])
          .map((t) => t.container_no || "N/A")
          .filter(Boolean)
          .join(", ");
        const vehicleCount = [
          ...new Set((transporterDetails || []).map((d) => d.vehicle_number)),
        ].length;

        const calculateRequestTotalAmount = (details) => {
          if (!Array.isArray(details) || details.length === 0) return 0;
          const vehicleChargesMap = new Map();
          details.forEach((detail) => {
            if (detail.vehicle_number) {
              vehicleChargesMap.set(
                detail.vehicle_number,
                parseFloat(detail.total_charge || 0)
              );
            }
          });
          return Array.from(vehicleChargesMap.values()).reduce(
            (total, charge) => total + charge,
            0
          );
        };

        const vehicleCharges = calculateRequestTotalAmount(transporterDetails);
        const totalPaid = transactionData
          ? transactionData.reduce(
              (sum, tx) => sum + parseFloat(tx.total_paid || 0),
              0
            )
          : 0;
        const grNumber = transactionData?.[0]?.gr_no || `GR-${report.id}`;
        const serviceCharges = parseFloat(report.requested_price || 0);
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

        const processedReport = {
          ...report,
          gr_no: grNumber,
          trip_no: `TRIP-${report.id}`,
          invoice_no: `INV-${new Date(
            report.created_at
          ).getFullYear()}-${String(report.id).padStart(4, "0")}`,
          shipa_no: report.SHIPA_NO || "N/A",
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
          transaction_data: transactionData,
          customer_name:
            report.customer_name || `Customer ${report.customer_id}`,
          total_containers:
            (report.containers_20ft || 0) + (report.containers_40ft || 0),
          service_types: parseJSON(report.service_type, []),
          service_prices: parseJSON(report.service_prices, {}),
          formatted_request_id:
            report.formatted_request_id || `Booking #${report.id}`,
        };

        setAdminComment(report.admin_comment || "");
        setSelectedRequestDetails(processedReport);
      } else {
        toast.error("Could not fetch report details.");
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error("Error fetching report details:", error);
      toast.error("Failed to fetch report details.");
      setShowDetailsModal(false);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      setUpdating(true);
      await transportRequestAPI.updateRequestStatus(
        requestId,
        status,
        adminComment.trim()
      );
      setShowDetailsModal(false);
      fetchAdvancePayments();
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update request status");
    } finally {
      setUpdating(false);
    }
  };

  const exportToExcel = () => {
    try {
      const loadingToast = toast.loading("Generating Excel report...");
      const data = [];
      Object.entries(advanceData).forEach(([date, transactions]) => {
        transactions.forEach((transaction) => {
          const containerInfo =
            transaction.containers && transaction.containers.length > 0
              ? transaction.containers
                  .map((c) => `${c.number} (${c.type}/${c.size})`)
                  .join(", ")
              : "N/A";
          const chargeBreakdown =
            transaction.vehicle_charges
              ?.map(
                (charge) =>
                  `${charge.container_no}: ₹${charge.net_charge} (₹${charge.total_charge} + ₹${charge.additional_charges} addl)`
              )
              .join(" | ") || "N/A";
          const vehicleTotalCharge = (transaction.vehicle_charges || [])
            .filter(
              (charge) => charge.vehicle_number === transaction.vehicle_number
            )
            .reduce((sum, charge) => sum + charge.net_charge, 0);
          const vehicleOutstanding =
            vehicleTotalCharge - (transaction.advance_amount || 0);
          const remainingAmount =
            (transaction.total_vehicle_charges || 0) -
            (transaction.advance_amount || 0);
          data.push({
            Date: formatDate(date),
            "Request ID": transaction.request_id || "N/A",
            "Vehicle Number": transaction.vehicle_number || "N/A",
            "Transporter Name": transaction.transporter_name || "N/A",
            "Customer Name": transaction.customer_name || "N/A",
            "Service Charge": transaction.requested_price || 0,
            "Total Vehicle Charges": transaction.total_vehicle_charges || 0,
            "Advance Amount": transaction.advance_amount || 0,
            "Remaining Amount (Request)": remainingAmount,
            "Vehicle Outstanding": vehicleOutstanding,
            "Payment Mode": transaction.payment_mode || "N/A",
            "Payment Date": formatDate(transaction.last_payment_date),
            "GR No": transaction.gr_no || "N/A",
            Status: transaction.status || "N/A",
            "Vehicle Payment Status":
              transaction.vehicle_payment_status || "pending",
            "NEFT Reference": transaction.neft_reference || "N/A",
            "Transaction Time": formatDateTime(transaction.created_at),
            "Container Numbers": containerInfo,
            "Charge Breakdown": chargeBreakdown,
          });
        });
      });
      const sheetName = "Daily Advance Payments";
      const fileNameSuffix = `${
        singleDate || fromDate || toDate ? "filtered" : "today"
      }`;
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(
        wb,
        `daily-advance-payments-detailed-${fileNameSuffix}-${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );
      toast.dismiss(loadingToast);
      toast.success("Detailed report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.dismiss();
      toast.error("Failed to export report");
    }
  };

  const handleSearch = () => {
    fetchAdvancePayments();
  };

  const handleMarkAsPaid = async () => {
    if (!selectedTransaction) {
      toast.error(
        "No transaction selected. Please select a transaction first."
      );
      return;
    }
    if (!selectedTransaction.id) {
      toast.error("Invalid transaction data. Transaction ID is missing.");
      return;
    }

    setUpdatingPayment(true);
    try {
      const updateData = { payment_status: "completed" };
      const transactionId = selectedTransaction.id;

      // Validate transaction ID before making the API call
      if (!transactionId || isNaN(transactionId)) {
        toast.error("Invalid transaction ID. Please contact support.");
        return;
      }

      const response = await api.put(
        `/transactions/${transactionId}/vehicle-payment-status`,
        {
          ...updateData,
          neft_reference: neftReference.trim() || undefined,
        }
      );

      if (response.data.success) {
        toast.success("Payment status updated successfully to completed!");
        setShowPaymentModal(false);
        setSelectedTransaction(null);
        await fetchAdvancePayments();
      } else {
        toast.error(response.data.message || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      if (error.response?.status === 404) {
        toast.error(
          "Transaction not found. It may have been deleted or modified."
        );
      } else if (error.response?.status === 400) {
        toast.error(
          error.response.data.message ||
            "Invalid request. Please check the transaction data."
        );
      } else if (error.response?.status === 500) {
        toast.error("Server error occurred. Please try again later.");
      } else {
        toast.error(
          "Failed to update payment status. Please check your connection and try again."
        );
      }
    } finally {
      setUpdatingPayment(false);
    }
  };

  const totalTransactions = Object.values(advanceData).reduce(
    (sum, transactions) => sum + transactions.length,
    0
  );
  const totalAdvanceAmount = Object.values(advanceData).reduce(
    (sum, transactions) =>
      sum +
      transactions.reduce((daySum, t) => daySum + (t.advance_amount || 0), 0),
    0
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Daily Advance Payments Report
        </h2>
        <p className="text-gray-600 mt-1">
          Report showing daily advance payments and newly assigned vehicles with
          date filters.
        </p>
      </div>

      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="singleDate"
                checked={filterType === "singleDate"}
                onChange={(e) => setFilterType(e.target.value)}
                className="mr-2"
              />
              Single Date
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="dateRange"
                checked={filterType === "dateRange"}
                onChange={(e) => setFilterType(e.target.value)}
                className="mr-2"
              />
              Date Range
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filterType === "singleDate" ? (
            <div className="col-span-1">
              <input
                type="date"
                placeholder="Select Date"
                className="px-4 py-2 border rounded-lg w-full"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
              />
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {totalTransactions} transactions, Total Advance:{" "}
            {formatCurrency(totalAdvanceAmount)}
          </div>
          <div className="flex space-x-3">
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
              disabled={totalTransactions === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {Object.keys(advanceData).length === 0 && !loading ? (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No advance payments found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No advance payments data available for the selected date range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {Object.entries(advanceData)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, transactions]) => (
                <div key={date} className="mb-6">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatDate(date)} - {transactions.length} Transaction
                      {transactions.length !== 1 ? "s" : ""}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Total Advance:{" "}
                      {formatCurrency(
                        transactions.reduce(
                          (sum, t) => sum + (t.advance_amount || 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer & Route
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SERVICE CHARGE
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VEHICLE CHARGE
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ADVANCE
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          OUTSTANDING
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {transactions.map((transaction, transactionIndex) => {
                        // Get specific vehicle charge like PaymentModal does
                        const specificVehicleCharge =
                          transaction.vehicle_charges?.find(
                            (charge) =>
                              charge.vehicle_number ===
                              transaction.vehicle_number
                          );

                        const vehicleCharge = specificVehicleCharge
                          ? parseFloat(specificVehicleCharge.total_charge || 0)
                          : 0;

                        const advancePaid = parseFloat(
                          transaction.advance_amount || 0
                        );
                        const outstanding = Math.max(
                          0,
                          vehicleCharge - advancePaid
                        );

                        return (
                          <tr
                            key={transactionIndex}
                            className="hover:bg-gray-50 border-b border-gray-200"
                          >
                            {/* Vehicle Details */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.vehicle_number || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transaction.transporter_name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                GR: {transaction.gr_no || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                Req ID: #{transaction.request_id || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Mode: {transaction.payment_mode || "N/A"}
                              </div>
                            </td>

                            {/* Customer & Route */}
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.customer_name || "N/A"}
                              </div>
                              {transaction.request_details?.consigner && (
                                <div className="text-sm text-blue-600">
                                  Consigner:{" "}
                                  {transaction.request_details.consigner}
                                </div>
                              )}
                              {transaction.request_details?.consignee && (
                                <div className="text-sm text-purple-600">
                                  Consignee:{" "}
                                  {transaction.request_details.consignee}
                                </div>
                              )}
                              <div className="text-sm text-gray-500 mt-1">
                                {transaction.pickup_location || "N/A"} →{" "}
                                {transaction.delivery_location || "N/A"}
                              </div>
                              {transaction.containers &&
                                transaction.containers.length > 0 && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    {transaction.containers.map((c, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded mr-1"
                                      >
                                        {c.number}
                                      </span>
                                    ))}
                                  </div>
                                )}
                            </td>

                            {/* SERVICE CHARGE Column */}
                            <td className="px-6 py-4 whitespace-nowrap bg-gray-50 border-l-2 border-gray-300">
                              <div className="text-sm font-bold text-gray-900">
                                {formatCurrency(
                                  transaction.total_containers > 0
                                    ? (transaction.requested_price || 0) /
                                        transaction.total_containers
                                    : transaction.requested_price || 0
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Per container (
                                {transaction.total_containers || 0} total)
                              </div>
                              {transaction.containers &&
                                transaction.containers.length > 0 && (
                                  <div className="text-xs text-gray-400 mt-2">
                                    {transaction.containers
                                      .map((c) => c.size)
                                      .filter((size) => size)
                                      .join(", ") || "N/A"}
                                  </div>
                                )}
                            </td>

                            {/* VEHICLE CHARGE Column */}
                            <td
                              className={`px-6 py-4 whitespace-nowrap border-l-2 border-gray-300 ${
                                vehicleCharge > 0
                                  ? "bg-orange-50"
                                  : "bg-gray-50"
                              }`}
                            >
                              <div
                                className={`text-sm font-bold ${
                                  vehicleCharge > 0
                                    ? "text-orange-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {vehicleCharge > 0
                                  ? formatCurrency(vehicleCharge)
                                  : "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                For {transaction.vehicle_number}
                              </div>
                            </td>

                            {/* ADVANCE Column */}
                            <td className="px-6 py-4 whitespace-nowrap bg-green-50 border-l-2 border-gray-300">
                              <div className="text-sm font-bold text-green-600">
                                {formatCurrency(
                                  transaction.advance_amount || 0
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Paid to transporter
                              </div>
                            </td>

                            {/* OUTSTANDING Column */}
                            <td
                              className={`px-6 py-4 whitespace-nowrap border-l-2 border-gray-300 ${
                                outstanding > 0 ? "bg-red-50" : "bg-gray-50"
                              }`}
                            >
                              <div
                                className={`text-sm font-bold ${
                                  outstanding > 0
                                    ? "text-red-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {outstanding > 0
                                  ? formatCurrency(outstanding)
                                  : "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {outstanding > 0 ? "Due payment" : "Fully paid"}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  transaction.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "in progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {transaction.status || "pending"}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                              <div className="space-x-1">
                                <button
                                  onClick={() =>
                                    handleViewDetails(transaction.request_id)
                                  }
                                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                  title="View Full Report"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Details
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setShowPaymentModal(true);
                                  }}
                                  className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                  title="Mark Payment as Complete"
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Mark Paid
                                </button>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                NEFT: {transaction.neft_reference || "N/A"}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {showPaymentModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6">
              <div className="flex items-center">
                <DollarSign className="w-6 h-6 mr-3" />
                <div>
                  <h3 className="text-lg font-bold">
                    Mark Payment as Complete
                  </h3>
                  <p className="text-green-100 text-sm">
                    Confirm payment update for vehicle
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Number:</span>
                      <span className="font-medium">
                        {selectedTransaction.vehicle_number || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transporter:</span>
                      <span className="font-medium">
                        {selectedTransaction.transporter_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request ID:</span>
                      <span className="font-medium">
                        #{selectedTransaction.request_id || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance Amount:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(selectedTransaction.advance_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedTransaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : selectedTransaction.status === "in progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedTransaction.status || "pending"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-yellow-800 mb-2">
                      NEFT/UPI/Reference No (Optional)
                    </label>
                    <input
                      type="text"
                      value={neftReference}
                      onChange={(e) => setNeftReference(e.target.value)}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                      placeholder="Enter NEFT/UPI/Reference number"
                      maxLength="50"
                    />
                    <p className="text-xs text-yellow-700 mt-1">
                      Add transaction reference for record keeping
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedTransaction(null);
                    setNeftReference("");
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updatingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={updatingPayment}
                >
                  {updatingPayment ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2 inline" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {isFetchingDetails || !selectedRequestDetails ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Loading details...</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">
                        Detailed Admin Report
                      </h3>
                      <p className="text-blue-100">
                        Request ID: {selectedRequestDetails.id}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(false)}
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
                          <span className="font-medium">
                            {selectedRequestDetails.formatted_request_id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">SHIPA No:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.shipa_no}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tracking ID:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.tracking_id || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">GR Number:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.gr_no}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Trip Number:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.trip_no}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Invoice Number:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.invoice_no}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span>
                            <StatusBadge
                              status={selectedRequestDetails.status}
                            />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created Date:</span>
                          <span className="font-medium">
                            {formatDate(selectedRequestDetails.created_at)}
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
                            {selectedRequestDetails.customer_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Customer Email:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.customer_email || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Consignee:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.consignee || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Consigner:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.consigner || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Pickup Location:
                          </span>
                          <span className="font-medium">
                            {selectedRequestDetails.pickup_location || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Delivery Location:
                          </span>
                          <span className="font-medium">
                            {selectedRequestDetails.delivery_location || "N/A"}
                          </span>
                        </div>
                        {selectedRequestDetails.stuffing_location && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Stuffing Location:
                            </span>
                            <span className="font-medium">
                              {selectedRequestDetails.stuffing_location}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Truck className="w-5 h-5 mr-2 text-blue-600" />
                        Service & Vehicle
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vehicle Type:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.vehicle_type || "N/A"}{" "}
                            {selectedRequestDetails.vehicle_size &&
                              `(${selectedRequestDetails.vehicle_size})`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Commodity:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.commodity || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cargo Type:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.cargo_type || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Services:</span>
                          <div>
                            {selectedRequestDetails.service_types.length > 0 ? (
                              selectedRequestDetails.service_types.map(
                                (service, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                                  >
                                    {service}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-gray-500">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Financial Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Service Charges:
                          </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(
                              selectedRequestDetails.service_charges
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Vehicle Charges:
                          </span>
                          <span className="font-medium text-orange-600">
                            {formatCurrency(
                              selectedRequestDetails.vehicle_charges
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-500 font-medium">
                            Profit/Loss:
                          </span>
                          <span
                            className={`font-bold ${
                              selectedRequestDetails.profit_loss >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(selectedRequestDetails.profit_loss)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Profit Margin:</span>
                          <span
                            className={`font-medium ${
                              selectedRequestDetails.profit_loss_percentage >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {selectedRequestDetails.profit_loss_percentage.toFixed(
                              2
                            )}
                            %
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
                            {formatCurrency(selectedRequestDetails.total_paid)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Outstanding:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(
                              selectedRequestDetails.outstanding_amount
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment Status:</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedRequestDetails.payment_status ===
                              "Fully Paid"
                                ? "bg-green-100 text-green-800"
                                : selectedRequestDetails.payment_status ===
                                  "Partially Paid"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedRequestDetails.payment_status}
                          </span>
                        </div>
                        {selectedRequestDetails.transaction_data && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Transaction ID:
                              </span>
                              <span className="font-medium">
                                {selectedRequestDetails.transaction_data.id}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Payment Method:
                              </span>
                              <span className="font-medium">
                                {selectedRequestDetails.transaction_data
                                  .payment_method || "N/A"}
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
                          <span className="text-gray-500">
                            Container Numbers:
                          </span>
                          <span className="font-medium">
                            {selectedRequestDetails.container_numbers || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            20ft Containers:
                          </span>
                          <span className="font-medium">
                            {selectedRequestDetails.containers_20ft || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            40ft Containers:
                          </span>
                          <span className="font-medium">
                            {selectedRequestDetails.containers_40ft || 0}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-500 font-medium">
                            Total Containers:
                          </span>
                          <span className="font-bold">
                            {selectedRequestDetails.total_containers}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cargo Weight:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.cargo_weight || "N/A"}{" "}
                            {selectedRequestDetails.cargo_weight ? "kg" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vehicle Count:</span>
                          <span className="font-medium">
                            {selectedRequestDetails.vehicle_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transporter Details */}
                  {Object.keys(selectedRequestDetails.vehicle_container_mapping)
                    .length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Truck className="w-5 h-5 mr-2 text-green-600" />
                        Transporter Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(
                          selectedRequestDetails.vehicle_container_mapping
                        ).map(([vehicle, info], index) => (
                          <div
                            key={index}
                            className="bg-gray-50 border rounded-lg p-4"
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
                                <span className="text-gray-500">
                                  Driver Name:
                                </span>
                                <span className="font-medium">
                                  {info.driver_name || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Driver Phone:
                                </span>
                                <span className="font-medium">
                                  {info.driver_phone || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Total Charge:
                                </span>
                                <span className="font-medium text-orange-600">
                                  {formatCurrency(info.total_charge)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                        {[
                          "approved",
                          "rejected",
                          "in progress",
                          "completed",
                        ].map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusUpdate(
                                selectedRequestDetails.id,
                                status
                              )
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
                            } ${
                              updating ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
