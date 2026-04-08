import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Download,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  History,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/Api";

// Utility functions for formatting
const formatCurrency = (amount) =>
  amount || amount === 0
    ? `₹${Number(amount).toLocaleString("en-IN")}`
    : "Not specified";

const formatDate = (dateString) => {
  try {
    if (!dateString || dateString === "undefined" || dateString === null) {
      return "N/A";
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    return date.toLocaleDateString("en-GB");
  } catch {
    return "N/A";
  }
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    Paid: { color: "bg-green-100 text-green-800", icon: "✓" },
    Partial: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    Pending: { color: "bg-red-100 text-red-800", icon: "✕" },
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

const PaymentReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [consignerSearch, setConsignerSearch] = useState("");
  const [requestIdSearch, setRequestIdSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  // Fetch payment receipts
  const fetchReceipts = async () => {
    try {
      setIsLoading(true);
      const params = { page: currentPage, limit: itemsPerPage };

      if (invoiceNo) params.invoice_no = invoiceNo;
      if (statusFilter !== "all") params.payment_status = statusFilter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (consignerSearch) params.consigner = consignerSearch;
      if (requestIdSearch) params.request_id = requestIdSearch;

      const response = await api.get("/payment-receipts/all", { params });
      const {
        data,
        pagination: { totalItems: newTotalItems, totalPages: newTotalPages },
      } = response.data;

      // Remove duplicates based on request_id and invoice_no to ensure single row per invoice
      const uniqueReceipts = data.filter(
        (receipt, index, self) =>
          index ===
          self.findIndex(
            (r) =>
              r.request_id === receipt.request_id &&
              r.invoice_no === receipt.invoice_no
          )
      );

      setReceipts(uniqueReceipts);
      setTotalItems(newTotalItems);
      setTotalPages(newTotalPages);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to fetch payment receipts");
      setReceipts([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch summary stats
  const fetchSummary = async () => {
    try {
      const response = await api.get("/payment-receipts/summary");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching summary:", error);
      return null;
    }
  };

  // Initialize component - only call once and handle all fetching
  const initializeComponent = async () => {
    try {
      // Try to initialize receipts if none exist
      await api.post("/payment-receipts/initialize");
      console.log("Payment receipts initialized");
    } catch (error) {
      console.log("Receipts already initialized or error:", error);
    }

    // Always fetch receipts after initialization attempt - this replaces the separate useEffect
    await fetchReceipts();
  };

  useEffect(() => {
    initializeComponent();
  }, []);

  // Filters are now only applied when "Search" button is clicked

  // Handle pagination changes separately
  useEffect(() => {
    if (isLoading === false && currentPage !== 1) {
      fetchReceipts();
    }
  }, [currentPage]);

  // Handle search - trigger filtering only when button is clicked
  const handleSearch = () => {
    setCurrentPage(1);
    fetchReceipts(); // Manually trigger search
  };

  // Refresh data
  const refreshData = () => {
    setInvoiceNo("");
    setRequestIdSearch("");
    setConsignerSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    fetchReceipts();
    toast.success("Data refreshed successfully");
  };

  // Handle payment addition
  const handleAddPayment = async () => {
    if (!selectedReceipt) return;

    try {
      const response = await api.put(
        `/payment-receipts/${selectedReceipt.id}/payment`,
        {
          received_amount: parseFloat(paymentAmount),
          voucher_no: voucherNo,
          voucher_date: new Date(),
          payment_mode: paymentMode,
          remarks: paymentRemarks,
        }
      );

      toast.success("Payment added successfully");
      setShowPaymentModal(false);
      setSelectedReceipt(null);
      setPaymentAmount("");
      setVoucherNo("");
      setPaymentMode("");
      setPaymentRemarks("");
      fetchReceipts();
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment");
    }
  };

  // Handle payment history view
  const handleViewHistory = async (receipt) => {
    setSelectedReceipt(receipt);
    setLoadingHistory(true);
    setShowHistoryModal(true);

    try {
      const response = await api.get(`/payment-receipts/${receipt.id}/history`);
      setPaymentHistory(response.data.data);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error("Failed to load payment history");
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Calculate summary stats
  const summaryStats = receipts.reduce(
    (acc, receipt) => ({
      totalInvoices: acc.totalInvoices + 1,
      totalInvoiceAmount:
        acc.totalInvoiceAmount + parseFloat(receipt.invoice_amount || 0),
      totalReceived:
        acc.totalReceived + parseFloat(receipt.received_amount || 0),
      totalOutstanding: acc.totalOutstanding + parseFloat(receipt.balance || 0),
      paidCount: acc.paidCount + (receipt.payment_status === "Paid" ? 1 : 0),
      partialCount:
        acc.partialCount + (receipt.payment_status === "Partial" ? 1 : 0),
      pendingCount:
        acc.pendingCount + (receipt.payment_status === "Pending" ? 1 : 0),
    }),
    {
      totalInvoices: 0,
      totalInvoiceAmount: 0,
      totalReceived: 0,
      totalOutstanding: 0,
      paidCount: 0,
      partialCount: 0,
      pendingCount: 0,
    }
  );

  // Export to Excel
  const exportToExcel = () => {
    try {
      const data = receipts.map((receipt) => ({
        "Invoice No": receipt.invoice_no,
        "Invoice Date": formatDate(receipt.invoice_date),
        "Invoice Amount": receipt.invoice_amount,
        "Received Amount": receipt.received_amount,
        Balance: receipt.balance,
        "Payment Status": receipt.payment_status,
        "Voucher No": receipt.voucher_no || "N/A",
        "Voucher Date": formatDate(receipt.voucher_date),
        Customer: receipt.customer_name,
        Consigner: receipt.consigner,
        Consignee: receipt.consignee,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payment Receipts");
      XLSX.writeFile(
        wb,
        `payment-receipts-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment receipts...</p>
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
                Payment Receipts
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Track customer payments against invoices
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
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500 font-medium">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-600">
              {summaryStats.totalInvoices}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500 font-medium">Total Amount</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryStats.totalInvoiceAmount)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500 font-medium">Total Received</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(summaryStats.totalReceived)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500 font-medium">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(summaryStats.totalOutstanding)}
            </p>
          </div>
        </div>

        {/* Filters */}
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Invoice No"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Request ID (e.g. 123)"
              value={requestIdSearch}
              onChange={(e) => setRequestIdSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Consigner Name"
              value={consignerSearch}
              onChange={(e) => setConsignerSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex space-x-2">
              <label className="flex-1">
                <span className="text-sm font-medium text-gray-700 block mb-1">
                  From Date
                </span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="flex-1">
                <span className="text-sm font-medium text-gray-700 block mb-1">
                  To Date
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
            <div className="flex justify-between items-end">
              <button
                onClick={() => {
                  setInvoiceNo("");
                  setRequestIdSearch("");
                  setConsignerSearch("");
                  setStatusFilter("all");
                  setFromDate("");
                  setToDate("");
                  setCurrentPage(1);
                }}
                className="text-gray-600 hover:text-gray-800 text-sm underline px-4 py-2"
              >
                Clear Filters
              </button>
              <button
                onClick={handleSearch}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {receipt.invoice_no}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(receipt.invoice_date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">
                          {receipt.customer_name}
                        </div>
                        <div className="text-gray-500">
                          {receipt.consigner} → {receipt.consignee}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(receipt.invoice_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {formatCurrency(receipt.received_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(receipt.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={receipt.payment_status} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => {
                            setSelectedReceipt(receipt);
                            setShowPaymentModal(true);
                          }}
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Payment
                        </button>
                        <button
                          onClick={() => handleViewHistory(receipt)}
                          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <History className="w-3 h-3 mr-1" />
                          Payment History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {receipts.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payment receipts found.</p>
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
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Add Payment</h3>
                  <p className="text-green-100">
                    Invoice: {selectedReceipt.invoice_no}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter payment amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher No
                </label>
                <input
                  type="text"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter voucher number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select payment mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks (Optional)
                </label>
                <textarea
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter remarks"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddPayment}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Payment
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Payment History</h3>
                  <p className="text-blue-100">
                    Invoice: {selectedReceipt.invoice_no} -{" "}
                    {selectedReceipt.customer_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedReceipt(null);
                    setPaymentHistory([]);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">
                    Loading payment history...
                  </span>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No payment history found for this invoice.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Paid
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Voucher No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Mode
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Voucher Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentHistory.map((payment, index) => (
                        <tr
                          key={payment.id || index}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(payment.payment_amount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.voucher_no || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.payment_mode || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.voucher_date)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.remarks || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">
                    Total Payments: {paymentHistory.length}
                  </span>
                  <span className="ml-4 text-sm font-medium text-blue-600">
                    Total Received:{" "}
                    {formatCurrency(
                      paymentHistory.reduce(
                        (sum, payment) =>
                          sum + parseFloat(payment.payment_amount || 0),
                        0
                      )
                    )}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedReceipt(null);
                    setPaymentHistory([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentReceipts;
