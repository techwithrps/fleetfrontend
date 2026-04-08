import React, { useState, useEffect } from "react";
import api from "../../utils/Api";
import { toast } from "react-toastify";

const PaymentModal = ({
  shipment,
  vehicleData,
  onClose,
  onPaymentComplete,
  mode = "add", // "add" or "edit"
}) => {
  const [formData, setFormData] = useState({
    payment_amount: "",
    payment_mode: "Cash",
    payment_date: new Date().toISOString().split("T")[0],
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingTransaction, setExistingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // Inside the PaymentModal component, add a new state for payment history
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Add this function to fetch payment history
  const fetchPaymentHistory = async (transactionId) => {
    try {
      const response = await api.get(`/transactions/${transactionId}/payments`);
      if (response.data.success) {
        setPaymentHistory(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  // Update the useEffect to also fetch payment history
  useEffect(() => {
    if (vehicleData && vehicleData.id) {
      // Check if it's a vehicle ID (starts with 'vehicle-')
      if (vehicleData.id.toString().startsWith("vehicle-")) {
        // For vehicle IDs, use the vehicle number to fetch transactions
        fetchTransactionsByVehicleNumber(vehicleData.vehicle_number);
      } else {
        // For container IDs (legacy behavior), use the ID directly
        fetchExistingTransaction(vehicleData.id);
      }
    }
  }, [vehicleData]);

  // Add this useEffect to fetch payment history when we have a transaction
  useEffect(() => {
    if (existingTransaction && existingTransaction.id) {
      fetchPaymentHistory(existingTransaction.id);
    }
  }, [existingTransaction]);

  // Initialize modal based on mode prop
  useEffect(() => {
    if (mode === "edit" && !isEditing) {
      setIsEditing(true);
      // Set default empty form data for edit mode - will be populated when paymentHistory loads
      setFormData({
        payment_amount: "",
        payment_mode: "Cash",
        payment_date: new Date().toISOString().split("T")[0],
        remarks: "",
      });
    }
  }, [mode]);

  // When payment history loads and we're in edit mode, populate with latest payment
  useEffect(() => {
    if (
      mode === "edit" &&
      isEditing &&
      paymentHistory.length > 0 &&
      !editingPayment
    ) {
      // Auto-select the most recent payment for editing
      const latestPayment = paymentHistory[0]; // Assuming they're ordered by date desc
      handleEditPayment(latestPayment);
    }
  }, [mode, isEditing, paymentHistory, editingPayment]);

  // Add this section to the form to display payment history
  // Add this after the form fields but before the buttons
  {
    paymentHistory.length > 0 && (
      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium text-gray-700 mb-2">Payment History</h4>
        <div className="max-h-40 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Mode
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentHistory.map((payment, idx) => (
                <tr key={payment.id || idx}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 font-medium">
                    ₹{parseFloat(payment.amount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {payment.payment_mode}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEditPayment(payment)}
                      className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                      disabled={isEditing}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  const fetchTransactionsByVehicleNumber = async (vehicleNumber) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/transactions/vehicle/${vehicleNumber}`);
      if (
        response.data.success &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        setExistingTransaction(response.data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching transaction by vehicle number:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingTransaction = async (transporterId) => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/transactions/transporter/${transporterId}`
      );
      if (
        response.data.success &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        setExistingTransaction(response.data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditPayment = (payment) => {
    setIsEditing(true);
    setEditingPayment(payment);
    setFormData({
      payment_amount: payment.amount || payment.payment_amount || "",
      payment_mode: payment.payment_mode || "Cash",
      payment_date: payment.payment_date
        ? new Date(payment.payment_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      remarks: payment.remarks || "",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPayment(null);
    setFormData({
      payment_amount: "",
      payment_mode: "Cash",
      payment_date: new Date().toISOString().split("T")[0],
      remarks: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.payment_amount || parseFloat(formData.payment_amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setIsSubmitting(true);

    try {
      let response;

      if (isEditing && editingPayment) {
        // Update existing payment
        response = await api.put(
          `/transactions/payment/${editingPayment.id}`,
          formData
        );
      } else {
        // Determine if we're using a vehicle ID or container ID
        const isVehicleId = vehicleData.id.toString().startsWith("vehicle-");
        let transactionsResponse;

        if (isVehicleId) {
          // For vehicle IDs, use the vehicle number to fetch transactions
          transactionsResponse = await api.get(
            `/transactions/vehicle/${vehicleData.vehicle_number}`
          );
        } else {
          // For container IDs (legacy behavior), use the ID directly
          transactionsResponse = await api.get(
            `/transactions/transporter/${vehicleData.id}`
          );
        }

        if (
          transactionsResponse.data.data &&
          transactionsResponse.data.data.length > 0
        ) {
          // If transaction exists, add new payment to it
          const transactionId = transactionsResponse.data.data[0].id;
          response = await api.put(
            `/transactions/${transactionId}/payment`,
            formData
          );
        } else {
          // If no transaction exists, create a new one
          const transactionData = {
            request_id: shipment.id,
            transporter_id: vehicleData.id,
            gr_no: `GR-${shipment.id}-${vehicleData.id}-${Date.now()
              .toString()
              .slice(-6)}`, // Generate a unique GR number
            transporter_name: vehicleData.transporter_name || "",
            vehicle_number: vehicleData.vehicle_number || "",
            driver_name: vehicleData.driver_name || "",
            pickup_location: shipment.pickup_location || "",
            delivery_location: shipment.delivery_location || "",
            consigner: shipment.consigner || "",
            consignee: shipment.consignee || "",
            service_type: shipment.service_type || "",
            requested_price: vehicleData.total_charge || 0,
            transporter_charge: vehicleData.total_charge || 0,
            payment_amount: formData.payment_amount,
            payment_mode: formData.payment_mode,
            payment_date: formData.payment_date,
            remarks: formData.remarks,
          };

          response = await api.post("/transactions/create", transactionData);
        }
      }

      if (response.data.success) {
        toast.success(
          isEditing
            ? "Payment updated successfully"
            : "Payment processed successfully"
        );
        onPaymentComplete(response.data.data);

        // Reset edit state and close modal
        setIsEditing(false);
        setEditingPayment(null);
        onClose();
      } else {
        toast.error(
          response.data.message ||
            `Failed to ${isEditing ? "update" : "process"} payment`
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      // Check if it's an authentication error
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        toast.error("Your session has expired. Please log in again.");
        // Don't close the modal yet - let the interceptor handle the redirect
      } else {
        toast.error(
          error.response?.data?.message ||
            `An error occurred while ${
              isEditing ? "updating" : "processing"
            } payment`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total amount - use the vehicle's total_charge
  const getTotalAmount = () => {
    // First priority: Use the total_charge from vehicle data
    if (vehicleData && vehicleData.total_charge) {
      return parseFloat(vehicleData.total_charge);
    }

    // Second priority: Use transporter_charge from existing transaction
    if (existingTransaction && existingTransaction.transporter_charge) {
      return parseFloat(existingTransaction.transporter_charge);
    }

    return 0;
  };

  const totalAmount = getTotalAmount();
  const totalPaid = existingTransaction
    ? parseFloat(existingTransaction.total_paid || 0)
    : 0;
  const remainingAmount = Math.max(0, totalAmount - totalPaid);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div
          className={`text-white p-6 rounded-t-lg ${
            isEditing
              ? "bg-gradient-to-r from-orange-600 to-orange-700"
              : "bg-gradient-to-r from-blue-600 to-blue-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">
              {isEditing ? "Edit Payment" : "Add Payment"}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-blue-100 mt-1">
            Vehicle: {vehicleData.vehicle_number}
            {isEditing && (
              <span className="ml-2 text-yellow-200 text-sm">
                (Editing existing payment)
              </span>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading payment details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500">Total Amount</div>
                <div className="font-semibold text-blue-600">
                  ₹{totalAmount.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500">Remaining</div>
                <div className="font-semibold text-green-600">
                  ₹{remainingAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  name="payment_amount"
                  value={formData.payment_amount}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                  required
                  min="1"
                  max={isEditing ? undefined : remainingAmount}
                />
                {isEditing ? (
                  <p className="text-blue-500 text-xs mt-1">
                    Editing existing payment amount
                  </p>
                ) : (
                  parseFloat(formData.payment_amount) > remainingAmount && (
                    <p className="text-red-500 text-xs mt-1">
                      Amount exceeds the remaining balance
                    </p>
                  )
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes"
                  rows="3"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel Edit
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center"
                    disabled={
                      isSubmitting ||
                      !formData.payment_amount ||
                      parseFloat(formData.payment_amount) <= 0
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Updating...
                      </>
                    ) : (
                      "Update Payment"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    disabled={
                      isSubmitting ||
                      !formData.payment_amount ||
                      parseFloat(formData.payment_amount) <= 0 ||
                      parseFloat(formData.payment_amount) > remainingAmount
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Processing...
                      </>
                    ) : (
                      "Process Payment"
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
