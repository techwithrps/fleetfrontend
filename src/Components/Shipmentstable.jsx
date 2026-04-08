import React from "react";
import { Truck, Package, Download, Eye } from "lucide-react";

const ShipmentTable = ({
  filteredShipments,
  onViewDetails,
  onDownloadInvoice,
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      in_transit: { color: "bg-blue-100 text-blue-800", label: "In Transit" },
      delivered: { color: "bg-green-100 text-green-800", label: "Delivered" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return "✓";
      case "in_transit":
        return "🚛";
      case "delivered":
        return "📦";
      case "cancelled":
        return "✗";
      default:
        return "⏳";
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          All Shipments ({filteredShipments.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shipment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle & Services
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
            {filteredShipments.map((shipment) => (
              <tr key={shipment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {shipment.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(shipment.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {shipment.tracking_id}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">
                      From: {shipment.pickup_location}
                    </div>
                    <div className="text-gray-500">
                      To: {shipment.delivery_location}
                    </div>
                    {shipment.driver_name && (
                      <div className="text-xs text-blue-600 mt-1">
                        Driver: {shipment.driver_name}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center mb-2">
                    <Truck className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium">
                      {shipment.vehicle_type} ({shipment.vehicle_size} ft) ×{" "}
                      {shipment.no_of_vehicles}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {shipment.total_containers > 0 && (
                      <div>
                        Containers:{" "}
                        {shipment.containers_20ft > 0 &&
                          `${shipment.containers_20ft}×20ft`}
                        {shipment.containers_20ft > 0 &&
                          shipment.containers_40ft > 0 &&
                          ", "}
                        {shipment.containers_40ft > 0 &&
                          `${shipment.containers_40ft}×40ft`}
                      </div>
                    )}
                  </div>
                </td>


                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="mr-2">
                      {getStatusIcon(shipment.status)}
                    </span>
                    {getStatusBadge(shipment.status)}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetails(shipment)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {shipment.status === "delivered" && (
                      <button
                        onClick={() => onDownloadInvoice(shipment)}
                        className="text-green-600 hover:text-green-900"
                        title="Download Invoice"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredShipments.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No shipments found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShipmentTable;

const calculateTotalCharges = (transporterDetails) => {
  // First check if any transporter detail has transaction data
  const transactionDetail = transporterDetails.find(detail => detail.transaction);
  
  if (transactionDetail && transactionDetail.transaction.transporter_charge) {
    // If we have transaction data, use the transporter_charge from there
    return parseFloat(transactionDetail.transaction.transporter_charge);
  }
  
  // Otherwise fall back to the old calculation method
  return transporterDetails.reduce((sum, detail) => sum + (detail.total_charge || 0), 0);
};
