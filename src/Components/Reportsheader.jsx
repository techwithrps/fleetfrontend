import React from "react";
import { Download, RefreshCw, FileText } from "lucide-react";

const ReportsHeader = ({
  loading,
  refreshData,
  exportToCSV,
  exportPaymentSheet,
}) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                All Transport Reports
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive P&L analysis for all transport requests
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Reports
              </button>
              <button
                onClick={exportPaymentSheet}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Payment Sheet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsHeader;
