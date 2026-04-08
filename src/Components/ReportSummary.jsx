import React from "react";
import {
  FileText,
  DollarSign,
  Truck,
  BarChart3,
  CreditCard,
} from "lucide-react";

const ReportsSummary = ({
  totalRequests,
  profitableRequests,
  totalRevenue,
  totalCosts,
  totalProfit,
  totalOutstanding,
  totalPaid,
  overallProfitMargin,
  formatCurrency,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
            <p className="text-xs text-gray-500">
              {profitableRequests} profitable (
              {totalRequests > 0
                ? ((profitableRequests / totalRequests) * 100).toFixed(1)
                : 0}
              %)
            </p>
          </div>
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Costs</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalCosts)}
            </p>
          </div>
          <Truck className="h-8 w-8 text-orange-600" />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Net Profit</p>
            <p
              className={`text-2xl font-bold ${
                totalProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(totalProfit)}
            </p>
            <p className="text-xs text-gray-500">
              {overallProfitMargin.toFixed(1)}% margin
            </p>
          </div>
          <BarChart3
            className={`h-8 w-8 ${
              totalProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-xs text-gray-500">
              Paid: {formatCurrency(totalPaid)}
            </p>
          </div>
          <CreditCard className="h-8 w-8 text-red-600" />
        </div>
      </div>
    </div>
  );
};

export default ReportsSummary;
