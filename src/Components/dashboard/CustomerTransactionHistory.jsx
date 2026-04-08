import React, { useState, useEffect } from "react";
import api from "../../utils/Api";
import { useAuth } from "../../contexts/AuthContext";
import TransactionHistory from "./TransactionHistory";

const CustomerTransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchTransactions();
    }
  }, [currentUser]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/transactions/customer/${currentUser.id}`);
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transaction history. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total amount from all transactions
  const totalAmount = transactions.reduce(
    (sum, transaction) => sum + parseFloat(transaction.transporter_charge || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading transaction history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button 
            onClick={fetchTransactions}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-center text-gray-600">No transaction history found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Transaction History</h2>
      <TransactionHistory transactions={transactions} totalAmount={totalAmount} />
    </div>
  );
};

export default CustomerTransactionHistory;