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
      <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          {safeRequestData.id ? "Operational Deployment Edit" : "Initialize New Deployment"}
        </h3>
        {safeRequestData.id && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Registry ID: #{safeRequestData.id}
          </p>
        )}
      </div>
      <div className="p-10">
        <form
          onSubmit={handleSubmit}
          className="space-y-12"
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
          <div className="flex gap-4 pt-10 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-[2] h-14 rounded-2xl ${
                isSubmitting ? "bg-indigo-400" : "bg-slate-900 hover:bg-indigo-600"
              } text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center shadow-xl shadow-slate-200`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-3"></div>
                  {loadingButtonText.toUpperCase()}
                </>
              ) : (
                submitButtonText.toUpperCase()
              )}
            </button>

            {safeRequestData.id && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 h-14 rounded-2xl border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                ABORT EDIT
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceRequestForm;
