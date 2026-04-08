import React, { useState, useEffect } from "react";
import api from "../../utils/Api";

const TransactionHistory = ({ transactions, totalAmount }) => {
  const [paymentDetails, setPaymentDetails] = useState({});
  const [loading, setLoading] = useState({}); 

  // Calculate total paid amount from all transactions
  const totalPaid = transactions.reduce(
    (sum, transaction) => sum + parseFloat(transaction.total_paid || 0),
    0
  );

  // Calculate remaining balance
  const remainingBalance = Math.max(0, parseFloat(totalAmount || 0) - totalPaid);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  // Fetch payment details for a transaction
  const fetchPaymentDetails = async (transactionId) => {
    if (paymentDetails[transactionId]) return; // Already fetched
    
    setLoading(prev => ({ ...prev, [transactionId]: true }));
    try {
      const response = await api.get(`/transactions/${transactionId}/payments`);
      if (response.data.success) {
        setPaymentDetails(prev => ({
          ...prev,
          [transactionId]: response.data.data
        }));
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
    } finally {
      setLoading(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  // Group transactions by vehicle
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const vehicleKey = transaction.vehicle_number || 'unknown';
    if (!acc[vehicleKey]) {
      acc[vehicleKey] = [];
    }
    acc[vehicleKey].push(transaction);
    return acc;
  }, {});

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 text-lg">💰</div>
        <h4 className="font-semibold text-gray-900 text-lg">Payment History</h4>
      </div>

      {/* Overall Summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-500">Total Amount</div>
          <div className="font-semibold text-blue-600">₹{parseFloat(totalAmount || 0).toLocaleString()}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-500">Total Paid</div>
          <div className="font-semibold text-green-600">₹{totalPaid.toLocaleString()}</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-500">Remaining</div>
          <div className="font-semibold text-red-600">₹{remainingBalance.toLocaleString()}</div>
        </div>
      </div>

      {Object.entries(groupedTransactions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([vehicleNumber, vehicleTransactions]) => (
            <div key={vehicleNumber} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3">
                <span className="font-medium text-gray-900">Vehicle: {vehicleNumber}</span>
              </div>
              
              {vehicleTransactions.map((transaction, index) => (
                <div key={transaction.id || index} className="border-t border-gray-200">
                  <div className="p-3 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900">Transaction #{transaction.id}</span>
                      <span className="ml-2 text-sm text-gray-500">GR: {transaction.gr_no || 'N/A'}</span>
                    </div>
                    <button 
                      onClick={() => fetchPaymentDetails(transaction.id)}
                      className="text-blue-600 text-sm hover:underline flex items-center"
                    >
                      {loading[transaction.id] ? (
                        <span className="animate-spin mr-1">⏳</span>
                      ) : (
                        <span>{paymentDetails[transaction.id] ? 'Hide Details' : 'View Payments'}</span>
                      )}
                    </button>
                  </div>
                  
                  {paymentDetails[transaction.id] && (
                    <div className="p-3">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h6>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice ID
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mode
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Remarks
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paymentDetails[transaction.id].map((payment, idx) => (
                              <tr key={payment.id || idx} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {payment.invoice_id}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(payment.payment_date)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 font-medium">
                                  ₹{parseFloat(payment.amount || 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {payment.payment_mode || "N/A"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {payment.remarks || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between">
                    <div className="text-sm text-gray-500">
                      Last payment: {formatDate(transaction.last_payment_date)}
                    </div>
                    <div className="text-sm font-medium">
                      Total paid: <span className="text-green-600">₹{parseFloat(transaction.total_paid || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No payment records found
        </div>
      )}

      {remainingBalance > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Note:</span> There is a remaining balance of{" "}
            <span className="font-semibold">₹{remainingBalance.toLocaleString()}</span> to be paid.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;