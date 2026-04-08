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

      const containerReports = [];

      await Promise.all(
        (response.data.requests || []).map(async (shipment) => {
          let transporterDetails = [];
          let vehicleCharges = 0;
          let vehicleCount = 0;
          let containerNumbers = [];

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

                containerNumbers = details
                  .map((t) => t.container_no || "N/A")
                  .filter(Boolean);
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
          const totalContainers =
            (shipment.containers_20ft || 0) + (shipment.containers_40ft || 0);

          // Calculate per container values
          const serviceChargePerContainer =
            totalContainers > 0
              ? serviceCharges / totalContainers
              : serviceCharges;
          const vehicleChargePerContainer =
            totalContainers > 0
              ? vehicleCharges / totalContainers
              : vehicleCharges;
          const marginPerContainer =
            serviceChargePerContainer - vehicleChargePerContainer;
          const marginPercentage =
            serviceChargePerContainer > 0
              ? (marginPerContainer / serviceChargePerContainer) * 100
              : 0;

          // Create a report entry for each container
          containerNumbers.forEach((containerNo, index) => {
            // Get the driver name - use the first driver from transporter details
            let assigner_name = "Not Assigned";
            if (transporterDetails && transporterDetails.length > 0) {
              assigner_name =
                transporterDetails[0].driver_name ||
                transporterDetails[0].transporter_name ||
                "Not Assigned";
            }

            containerReports.push({
              ...shipment,
              sr_no: containerReports.length + 1,
              gr_no: grNumber,
              trip_no: `TRIP-${shipment.id}`,
              invoice_no: `INV-${new Date(
                shipment.created_at
              ).getFullYear()}-${String(shipment.id).padStart(4, "0")}`,
              shipa_no: shipment.SHIPA_NO || "N/A",
              container_no: containerNo,
              service_charges: serviceChargePerContainer,
              vehicle_charges: vehicleChargePerContainer,
              margin: marginPerContainer,
              margin_percentage: marginPercentage,
              total_paid: totalPaid,
              assigner_name: assigner_name,
              customer_name:
                shipment.customer_name || `Customer ${shipment.customer_id}`,
              total_containers: totalContainers,
              service_types: parseJSON(shipment.service_type, []),
              service_prices: parseJSON(shipment.service_prices, {}),
              formatted_request_id:
                shipment.formatted_request_id || `Booking #${shipment.id}`,
              transporter_details: transporterDetails,
              transaction_data: transactionData,
            });
          });
        })
      );
      setReports(containerReports);
    } catch (error) {
      toast.error("Failed to fetch transport requests");
      setReports([]);
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
  ]);

  const exportToExcel = useCallback(() => {
    try {
      const loadingToast = toast.loading("Generating Excel report...");
      const data = reports.map((report, index) => ({
        "Sr. No.": index + 1,
        "Container No": report.container_no,
        From: report.pickup_location || "N/A",
        To: report.delivery_location || "N/A",
        "Assigner Name": report.assigner_name,
        "Rate (Service Charge)": report.service_charges,
        "Incentive (%)": report.margin_percentage.toFixed(2),
        "Vendor Cost": report.vehicle_charges,
        Margin: report.margin,
        "SHIPA No": report.shipa_no,
        "Request ID": report.id,
        Status: report.status,
        "Created Date": formatDate(report.created_at),
      }));
      const sheetName = "Container Margin Report";
      const fileNameSuffix = "container-margin";

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(
        wb,
        `container-margin-report-${fileNameSuffix}-${
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
  }, [reports]);

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
      setReports([]); // Clear previous results if any
      return;
    }
    fetchFilteredRequests();
  };

  const totalMargin = reports.reduce(
    (sum, report) => sum + (report.margin || 0),
    0
  );
  const totalServiceCharges = reports.reduce(
    (sum, report) => sum + (report.service_charges || 0),
    0
  );
  const totalVendorCosts = reports.reduce(
    (sum, report) => sum + (report.vehicle_charges || 0),
    0
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Container Margin Report
        </h2>
        <p className="text-gray-600 mt-1">
          Report showing container details, customer information, and margin
          analysis with SHIPA No, Request ID, Container No, Date, or Date Range
          filters.
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
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600 space-y-1">
            <div>Total Records: {reports.length}</div>
            <div>
              Total Service Charges: {formatCurrency(totalServiceCharges)}
            </div>
            <div>Total Vendor Costs: {formatCurrency(totalVendorCosts)}</div>
            <div
              className={`font-semibold ${
                totalMargin >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              Total Margin: {formatCurrency(totalMargin)}
            </div>
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
              disabled={reports.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr. No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Container No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigner Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate (Service Charge)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incentive (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr
                  key={`${report.id}-${report.container_no}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {report.container_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.pickup_location || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.delivery_location || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {report.assigner_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {formatCurrency(report.service_charges)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-medium ${
                        report.margin_percentage >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {report.margin_percentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                    {formatCurrency(report.vehicle_charges)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-bold ${
                        report.margin >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(report.margin)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={report.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No reports found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Use the filters above to search for container margin reports.
            </p>
          </div>
        )}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
