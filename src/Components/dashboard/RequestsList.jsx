import React from "react";
import { Package, FileText, Settings } from "lucide-react";
import OrderProgress from "./OrderProgress";

const RequestsList = ({
  pastRequests,
  getStatusBadge,
  handleEditClick,
  handleDownloadInvoice,
  getFormattedServices,
}) => {
  return (
    <div className="lg:col-span-3 bg-white rounded-lg shadow mt-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Your Transport Requests
        </h3>
      </div>
      <div className="p-6">
        {pastRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>You haven't made any transport requests yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pastRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {request.vehicle_type} Transport -{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Request ID: {request.formatted_request_id}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    {getStatusBadge(request.status || "Pending")}
                  </div>
                </div>

                {/* Order Progress Tracking */}
                <OrderProgress status={request.status || "Pending"} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">From</p>
                    <p className="text-sm text-gray-900">
                      {request.pickup_location}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">To</p>
                    <p className="text-sm text-gray-900">
                      {request.delivery_location}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Consignee
                    </p>
                    <p className="text-sm text-gray-900">{request.consignee}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Consigner
                    </p>
                    <p className="text-sm text-gray-900">{request.consigner}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Services Required
                    </p>
                    <p className="text-sm text-gray-900">
                      {getFormattedServices(request.service_type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Amount
                    </p>
                    <p className="text-sm text-gray-900">
                      ₹{request.sale_amount || 0}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-4 space-x-3">
                  {request.status === "Pending" && (
                    <button
                      onClick={() => handleEditClick(request)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Settings className="h-4 w-4 mr-1" /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadInvoice(request)}
                    className="px-3 py-1.5 border border-blue-600 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-1" /> Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsList;
