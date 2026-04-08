import React from "react";
import NewServiceModal from "./NewServiceModal";

const ServicesSelection = ({
  services,
  setServices,
  loadingServices,
  selectedServices,
  servicePrices,
  onServiceToggle,
  onServicePriceChange,
  isNewServiceModalOpen,
  setIsNewServiceModalOpen,
  onServiceAdded,
}) => {
  const handleServiceClick = (service) => {
    const isSelected = selectedServices.includes(service.SERVICE_NAME);
    onServiceToggle(service.SERVICE_NAME, isSelected);
  };

  const handlePriceChange = (serviceName, price) => {
    onServicePriceChange(serviceName, price);
  };

  // Handle new service addition
  const handleAddService = async (newServiceName) => {
    // Simulate API call to add service to the database
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ SERVICE_NAME: newServiceName }),
      });

      if (!response.ok) {
        throw new Error("Failed to add service to database");
      }

      const newService = await response.json(); // Assume API returns the new service
      // Update services list with the new service
      setServices((prevServices) => [
        ...prevServices,
        {
          SERVICE_ID: newService.SERVICE_ID || Date.now(), // Use a temporary ID if API doesn't provide one
          SERVICE_NAME: newServiceName,
        },
      ]);

      // Call the parent handler if provided
      if (onServiceAdded) {
        onServiceAdded(newServiceName);
      }
    } catch (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <label className="block text-sm font-medium">
          Services Required with Selling Price
        </label>
        {/* <button
          type="button"
          onClick={() => setIsNewServiceModalOpen(true)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New Service
        </button> */}
      </div>

      {loadingServices ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.SERVICE_ID}
              className={`border rounded-lg p-4 transition-all ${
                selectedServices.includes(service.SERVICE_NAME)
                  ? "bg-blue-50 border-blue-500"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div
                className="cursor-pointer"
                onClick={() => handleServiceClick(service)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={selectedServices.includes(service.SERVICE_NAME)}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="ml-2 font-medium text-gray-900">
                      {service.SERVICE_NAME}
                    </span>
                  </div>
                </div>
              </div>

              {selectedServices.includes(service.SERVICE_NAME) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={servicePrices[service.SERVICE_NAME] || ""}
                      onChange={(e) =>
                        handlePriceChange(service.SERVICE_NAME, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesSelection;
