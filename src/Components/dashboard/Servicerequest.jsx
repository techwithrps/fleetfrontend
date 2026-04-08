import React, { useState, useEffect } from "react";
import { servicesAPI } from "../../utils/Api";
import VehicleDetailsSection from "./Vehicledetailssection";
import LocationsCargoSection from "./LocationCargosection";
import PricingScheduleSection from "./PricingSchedulesection";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ServiceRequestForm = ({
  requestData,
  setRequestData,
  handleSubmit,
  isSubmitting,
  handleCancelEdit,
}) => {
  const submitButtonText = requestData.id ? "Update Request" : "Submit Request";
  const loadingButtonText = requestData.id ? "Updating..." : "Submitting...";

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const safeRequestData = {
    id: "",
    consignee: "",
    consigner: "",
    vehicle_type: "",
    vehicle_size: "",
    trailerSize: "",
    truckSize: "",
    no_of_vehicles: 1,
    containers_20ft: 0,
    containers_40ft: 0,
    total_containers: 0,
    pickup_location: "",
    stuffing_location: "",
    delivery_location: "",
    commodity: "",
    cargo_type: "",
    cargo_weight: 0,
    service_type: [],
    service_prices: {},
    requested_price: 0,
    expected_pickup_date: today,
    expected_pickup_time: currentTime,
    expected_delivery_date: today,
    expected_delivery_time: currentTime,
    transporterDetails: [],
    vehicle_status: "Empty",
    SHIPA_NO: "",
    ...requestData,
  };

  const currentNoOfVehicles = parseInt(safeRequestData.no_of_vehicles) || 1;
  const totalContainers = parseInt(safeRequestData.total_containers) || 0;

  // Calculate total charge from service prices
  const calculateTotalCharge = () => {
    const servicePrices = safeRequestData.service_prices || {};
    const totalServiceCharge = Object.values(servicePrices).reduce(
      (sum, price) => sum + (parseFloat(price) || 0),
      0
    );
    
    // If it's a Trailer with containers, the prices are typically per vehicle trip total or per unit.
    // However, as requested, we multiply the total sum by the number of containers to get the grand total.
    const multiplier = totalContainers > 0 ? totalContainers : 1;
    return totalServiceCharge * multiplier * currentNoOfVehicles;
  };

  // Update requested_price whenever service prices or number of vehicles change
  useEffect(() => {
    const newRequestedPrice = calculateTotalCharge();
    if (newRequestedPrice !== safeRequestData.requested_price) {
      setRequestData((prev) => ({
        ...prev,
        requested_price: newRequestedPrice,
      }));
    }
  }, [safeRequestData.service_prices, currentNoOfVehicles]);

  // Helper function to create transporter details array based on number of vehicles
  const createTransporterDetailsArray = (numVehicles, existingDetails = []) => {
    const defaultDetail = {
      id: null,
      transporterName: "",
      vehicleNumber: "",
      driverName: "",
      driverContact: "",
      licenseNumber: "",
      licenseExpiry: "",
    };

    const newArray = [];
    for (let i = 0; i < numVehicles; i++) {
      newArray.push({
        ...defaultDetail,
        ...(existingDetails[i] || {}),
      });
    }
    return newArray;
  };

  // Services state
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [useOpenStreetMap, setUseOpenStreetMap] = useState(false);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const data = await servicesAPI.getAllServices();
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceAdded = async (newService) => {
    await fetchServices();
  };

  const handleServiceToggle = (serviceName, isSelected) => {
    const updatedServices = isSelected
      ? safeRequestData.service_type.filter((s) => s !== serviceName)
      : [...safeRequestData.service_type, serviceName];

    const updatedPrices = { ...safeRequestData.service_prices };
    if (isSelected) {
      delete updatedPrices[serviceName];
    } else {
      updatedPrices[serviceName] = "0";
    }

    setRequestData({
      ...safeRequestData,
      service_type: updatedServices,
      service_prices: updatedPrices,
    });
  };

  const handleServicePriceChange = (serviceName, price) => {
    setRequestData({
      ...safeRequestData,
      service_prices: {
        ...safeRequestData.service_prices,
        [serviceName]: price,
      },
    });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow mt-8 pt-4">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {safeRequestData.id ? "Edit Trip Request" : "Create New Trip"}
        </h3>
        {safeRequestData.id && (
          <p className="text-sm text-gray-600 mt-1">
            Request ID: {safeRequestData.id}
          </p>
        )}
      </div>
      <div className="p-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-lg shadow request-form"
        >
          {/* Vehicle Details Section */}
          <VehicleDetailsSection
            safeRequestData={safeRequestData}
            setRequestData={setRequestData}
            createTransporterDetailsArray={createTransporterDetailsArray}
          />

          {/* Locations and Cargo Section */}
          <LocationsCargoSection
            safeRequestData={safeRequestData}
            setRequestData={setRequestData}
            useOpenStreetMap={useOpenStreetMap}
            setUseOpenStreetMap={setUseOpenStreetMap}
          />

          {/* Pricing and Schedule Section */}
          <PricingScheduleSection
            safeRequestData={safeRequestData}
            setRequestData={setRequestData}
            services={services}
            loadingServices={loadingServices}
            handleServiceToggle={handleServiceToggle}
            handleServicePriceChange={handleServicePriceChange}
            isNewServiceModalOpen={isNewServiceModalOpen}
            setIsNewServiceModalOpen={setIsNewServiceModalOpen}
            handleServiceAdded={handleServiceAdded}
            today={today}
            currentTime={currentTime}
          />

          {/* Form Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 ${
                isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  {loadingButtonText}
                </>
              ) : (
                submitButtonText
              )}
            </button>

            {safeRequestData.id && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceRequestForm;
