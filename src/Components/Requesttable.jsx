import { Package, MapPin, Truck, Eye, Download } from "lucide-react";

const parseServiceType = (serviceType) => {
  if (!serviceType) return [];
  try {
    return typeof serviceType === "string"
      ? JSON.parse(serviceType)
      : serviceType;
  } catch (e) {
    console.error("Error parsing service type:", e);
    return [];
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

export default function RequestsTable({
  requests,
  onViewRequest,
  onDownloadInvoice,
  onDownloadGR,
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No requests found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No transport requests available.
        </p>
      </div>
    );
  }

  return (
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
                Pricing
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
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        Booking #{request.formatted_request_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
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
                    <div className="text-xs text-gray-400 mt-1">
                      Consignee: {request.consignee}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      {request.vehicle_type} ({request.vehicle_size})
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.commodity}
                    </div>
                    <div className="mt-1">
                      {parseServiceType(request.service_type).map(
                        (service, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                          >
                            {service}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-3 w-3 mr-1 text-green-600" />
                      <span className="font-medium">From:</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2 ml-4">
                      {request.pickup_location}
                    </div>
                    <div className="flex items-center mb-1">
                      <MapPin className="h-3 w-3 mr-1 text-red-600" />
                      <span className="font-medium">To:</span>
                    </div>
                    <div className="text-xs text-gray-600 ml-4">
                      {request.delivery_location}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="text-xs text-gray-500 mt-1">
                      Weight: {request.cargo_weight}kg
                    </div>
                    {(request.containers_20ft > 0 ||
                      request.containers_40ft > 0) && (
                      <div className="text-xs text-gray-500">
                        Containers: {request.containers_20ft}×20ft,{" "}
                        {request.containers_40ft}×40ft
                      </div>
                    )}
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
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewRequest(request)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    {request.status === "approved" && (
                      <>
                        <button
                          onClick={() => onDownloadInvoice(request)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Download Invoice"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Invoice
                        </button>
                        <button
                          onClick={() => onDownloadGR(request)}
                          className="text-green-600 hover:text-green-900 flex items-center ml-2"
                          title="Download GR"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          GR
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
