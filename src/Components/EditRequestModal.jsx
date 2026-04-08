import React, { useState, useEffect } from "react";
import api from "../utils/Api";
import { toast } from "react-toastify";

export default function EditRequestModal({ request, onClose, onUpdate }) {
  const services = ["Transport", "Freight Forwarding", "Customer Clearance"];

  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  // Helper function to get current datetime in YYYY-MM-DDTHH:MM format
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    consignee: "",
    consigner: "",
    vehicleType: "",
    trailerSize: "",
    truckSize: "",
    pickupLocation: "",
    stuffingLocation: "",
    handoverLocation: "",
    commodity: "",
    cargoType: "",
    cargoWeight: "",
    expectedPickupDate: getCurrentDate(), // Default to current date
    expectedDeliveryDate: getCurrentDate(), // Default to current date
    serviceType: [],
    servicePrices: {},
    saleAmount: 0,
    containers: {
      "20ft": "",
      "40ft": "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const safeJSONParse = (value, fallback) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (e) {
            return fallback;
          }
        }
        return value || fallback;
      };

      setFormData({
        consignee: request.consignee || "",
        consigner: request.consigner || "",
        vehicleType: request.vehicleType || request.vehicle_type || "",
        trailerSize:
          request.trailerSize ||
          (request.vehicle_type === "Trailer" ? request.vehicle_size : ""),
        truckSize:
          request.truckSize ||
          (request.vehicle_type === "Truck" ? request.vehicle_size : ""),
        pickupLocation: request.pickupLocation || request.pickup_location || "",
        stuffingLocation:
          request.stuffingLocation || request.stuffing_location || "",
        handoverLocation:
          request.handoverLocation || request.delivery_location || "",
        commodity: request.commodity || "",
        cargoType: request.cargoType || request.cargo_type || "",
        cargoWeight: request.cargoWeight || request.cargo_weight || "",
        expectedPickupDate:
          request.expectedPickupDate ||
          request.expected_pickup_date?.split("T")[0] ||
          getCurrentDate(), // Always show current date if no existing value
        expectedDeliveryDate:
          request.expectedDeliveryDate ||
          request.expected_delivery_date?.split("T")[0] ||
          getCurrentDate(), // Always show current date if no existing value
        serviceType: safeJSONParse(request.service_type, []),
        servicePrices: safeJSONParse(request.service_prices, {}),
        saleAmount: request.saleAmount || request.requested_price || 0,
        containers: safeJSONParse(request.containers, {
          "20ft": "",
          "40ft": "",
        }),
      });
    } catch (error) {
      console.error("Error setting form data:", error);
      toast.error("Error loading request details");
    }
  }, [request]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleServiceSelection = (service) => {
    const isSelected = formData.serviceType.includes(service);
    const updatedServices = isSelected
      ? formData.serviceType.filter((s) => s !== service)
      : [...formData.serviceType, service];

    // Update service prices
    const updatedPrices = { ...formData.servicePrices };
    if (!isSelected) {
      updatedPrices[service] = "0"; // Initialize with zero
    } else {
      delete updatedPrices[service]; // Remove price if service is deselected
    }

    // Calculate total
    const total = Object.values(updatedPrices).reduce(
      (sum, price) => sum + (Number(price) || 0),
      0
    );

    setFormData((prev) => ({
      ...prev,
      serviceType: updatedServices,
      servicePrices: updatedPrices,
      saleAmount: total,
    }));
  };

  const handleServicePriceChange = (service, price) => {
    const updatedPrices = {
      ...formData.servicePrices,
      [service]: price,
    };

    // Calculate total
    const total = Object.values(updatedPrices).reduce(
      (sum, price) => sum + (Number(price) || 0),
      0
    );

    setFormData((prev) => ({
      ...prev,
      servicePrices: updatedPrices,
      saleAmount: total,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const submitData = {
        consignee: formData.consignee,
        consigner: formData.consigner,
        vehicle_type: formData.vehicleType,
        vehicle_size:
          formData.vehicleType === "Truck"
            ? formData.truckSize
            : formData.trailerSize,
        pickup_location: formData.pickupLocation,
        stuffing_location: formData.stuffingLocation,
        delivery_location: formData.handoverLocation,
        commodity: formData.commodity,
        cargo_type: formData.cargoType,
        cargo_weight: formData.cargoWeight,
        service_type: JSON.stringify(formData.serviceType),
        service_prices: JSON.stringify(formData.servicePrices),
        containers: JSON.stringify({
          "20ft": Number(formData.containers["20ft"]) || 0,
          "40ft": Number(formData.containers["40ft"]) || 0,
        }),
        total_containers:
          Number(formData.containers["20ft"] || 0) +
          Number(formData.containers["40ft"] || 0),
        expected_pickup_date: formData.expectedPickupDate,
        expected_delivery_date: formData.expectedDeliveryDate,
        requested_price: Number(formData.saleAmount) || 0,
      };

      // Update using the correct endpoint from transportRequestRoutes.js
      const response = await api.put(`/update/${request.id}`, submitData);

      if (response.data.success) {
        toast.success("Request updated successfully!");
        onUpdate(); // Refresh the requests list
        onClose(); // Close the modal
      } else {
        throw new Error(response.data.message || "Failed to update request");
      }
    } catch (error) {
      console.error("Update error:", error);
      // Show more detailed error message
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update request";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">Edit Request #{request.id}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Consignee
              </label>
              <input
                type="text"
                name="consignee"
                value={formData.consignee}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Consigner
              </label>
              <input
                type="text"
                name="consigner"
                value={formData.consigner}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              />
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Vehicle Type
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              >
                <option value="">Select Vehicle Type</option>
                <option value="Trailer">Trailer</option>
                <option value="Truck">Truck</option>
              </select>
            </div>
            {formData.vehicleType === "Trailer" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Trailer Size
                </label>
                <input
                  type="text"
                  name="trailerSize"
                  value={formData.trailerSize}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>
            )}
            {formData.vehicleType === "Truck" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Truck Size
                </label>
                <input
                  type="text"
                  name="truckSize"
                  value={formData.truckSize}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>
            )}
          </div>

          {/* Container Details */}
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-2">
              Container Details
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <label className="text-sm font-medium block">
                  20 feet Containers
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.containers["20ft"]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      containers: {
                        ...prev.containers,
                        "20ft": e.target.value,
                      },
                    }))
                  }
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div className="p-4 border rounded-lg">
                <label className="text-sm font-medium block">
                  40 feet Containers
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.containers["40ft"]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      containers: {
                        ...prev.containers,
                        "40ft": e.target.value,
                      },
                    }))
                  }
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pickup Location
              </label>
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Stuffing Location
              </label>
              <input
                type="text"
                name="stuffingLocation"
                value={formData.stuffingLocation}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Handover Location
              </label>
              <input
                type="text"
                name="handoverLocation"
                value={formData.handoverLocation}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              />
            </div>
          </div>

          {/* Cargo Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Commodity/Cargo
              </label>
              <input
                type="text"
                name="commodity"
                value={formData.commodity}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Cargo Type
              </label>
              <select
                name="cargoType"
                value={formData.cargoType}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              >
                <option value="">Select Type</option>
                <option value="General">General</option>
                <option value="Hazardous">Hazardous</option>
                <option value="Perishable">Perishable</option>
                <option value="Fragile">Fragile</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Total Weight (KG)
              </label>
              <input
                type="number"
                name="cargoWeight"
                value={formData.cargoWeight}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              />
            </div>
          </div>

          {/* Services Required */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Services Required
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {services.map((service) => (
                <div
                  key={service}
                  className={`border rounded-lg p-3 cursor-pointer ${
                    formData.serviceType.includes(service)
                      ? "bg-blue-50 border-blue-500"
                      : "border-gray-300"
                  }`}
                  onClick={() => handleServiceSelection(service)}
                >
                  <div className="flex items-center justify-between">
                    <span>{service}</span>
                    <input
                      type="checkbox"
                      checked={formData.serviceType.includes(service)}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600"
                    />
                  </div>
                  {formData.serviceType.includes(service) && (
                    <div className="mt-2">
                      <input
                        type="number"
                        placeholder="Price (INR)"
                        value={formData.servicePrices[service] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            servicePrices: {
                              ...prev.servicePrices,
                              [service]: e.target.value,
                            },
                          }))
                        }
                        className="w-full border rounded-md p-2 mt-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Pickup Date
              </label>
              <input
                type="date"
                name="expectedPickupDate"
                value={formData.expectedPickupDate}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              />
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Total Amount
            </label>
            <div className="relative">
              <input
                type="number"
                name="saleAmount"
                value={formData.saleAmount}
                onChange={handleChange}
                className="w-full border rounded-md p-2 pl-8"
                required
              />
              <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md text-white ${
                isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Updating..." : "Update Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
