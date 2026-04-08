import React, { useEffect, useState } from "react";
import ServicesSelection from "../dashboard/ServiceSelection";
import { rateCardAPI } from "../../utils/Api";
import { toast } from "react-toastify";

const PricingScheduleSection = ({
  safeRequestData,
  setRequestData,
  services,
  loadingServices,
  handleServiceToggle,
  handleServicePriceChange,
  isNewServiceModalOpen,
  setIsNewServiceModalOpen,
  handleServiceAdded,
  today,
  currentTime,
}) => {
  const [availableRates, setAvailableRates] = useState([]);
  const [autoAppliedServices, setAutoAppliedServices] = useState(new Set());
  const [extraCharges, setExtraCharges] = useState(0);

  const currentNoOfVehicles = parseInt(safeRequestData.no_of_vehicles) || 1;
  const totalContainers = parseInt(safeRequestData.total_containers) || 0;
  const unitMultiplier = totalContainers > 0 ? totalContainers : 1;

  // Initialize dates
  useEffect(() => {
    const needsUpdate = {};
    if (!safeRequestData.expected_pickup_date) needsUpdate.expected_pickup_date = today;
    if (!safeRequestData.expected_delivery_date) needsUpdate.expected_delivery_date = today;
    if (Object.keys(needsUpdate).length > 0) {
      setRequestData(prev => ({ ...prev, ...needsUpdate }));
    }
  }, [today]);

  // Fetch Available Rate Cards based on Route
  useEffect(() => {
    const { pickup_location, delivery_location } = safeRequestData;
    if (!pickup_location || !delivery_location) {
      setAvailableRates([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await rateCardAPI.matchRate({
          from_location: pickup_location,
          to_location: delivery_location
        });

        if (response.data.success) {
          setAvailableRates(response.data.rates || []);
        } else {
          setAvailableRates([]);
        }
      } catch (error) {
        console.error("Fetch rates error:", error);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [safeRequestData.pickup_location, safeRequestData.delivery_location]);

  // Handle Rate Card Selection (Auto-fill)
  const applyRateCard = (rate) => {
    const updatedPrices = { ...safeRequestData.service_prices };
    const updatedServiceTypes = [...safeRequestData.service_type];
    
    // Auto-fill service type and price
    if (!updatedServiceTypes.includes(rate.service_type)) {
      updatedServiceTypes.push(rate.service_type);
    }
    updatedPrices[rate.service_type] = rate.final_rate;

    // Apply metadata
    setRequestData(prev => ({
      ...prev,
      service_type: updatedServiceTypes,
      service_prices: updatedPrices,
      commodity: rate.commodity || prev.commodity,
      container_type: rate.container_type || prev.container_type,
      vehicle_status: rate.container_status || prev.vehicle_status,
      // If the rate has a specific size, we can suggest it
      ...(rate.container_size && prev.vehicle_type === 'Trailer' ? {
          containers_20ft: rate.container_size === '20' ? 1 : 0,
          containers_40ft: rate.container_size === '40' ? 1 : 0,
          total_containers: 1
      } : {})
    }));

    const newAuto = new Set(autoAppliedServices);
    newAuto.add(rate.service_type);
    setAutoAppliedServices(newAuto);

    toast.success(`Applied ${rate.service_type} rate from "${rate.contract_name}"`);
  };

  const calculateServiceTotal = () => {
    const servicePrices = safeRequestData.service_prices || {};
    return Object.keys(servicePrices)
      .filter(s => safeRequestData.service_type.includes(s))
      .reduce((sum, s) => sum + (parseFloat(servicePrices[s]) || 0), 0) * unitMultiplier * currentNoOfVehicles;
  };

  const estimatedTotal = calculateServiceTotal() + parseFloat(extraCharges || 0);

  return (
    <div className="space-y-8 mt-6">
      {/* 1. MATCHING RATE CARDS (Suggested) */}
      {availableRates.length > 0 && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 transition-all duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-tighter">Matching Contracts Found</h3>
            </div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{availableRates.length} Options Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRates.map((rate) => (
              <button
                key={rate.id}
                onClick={() => applyRateCard(rate)}
                type="button"
                className="group relative bg-white border border-blue-100 p-4 rounded-2xl text-left hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-blue-600 text-white p-1 rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{rate.service_type}</span>
                  <span className="text-lg font-black text-blue-700">₹{parseFloat(rate.final_rate).toLocaleString()}</span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">{rate.contract_name}</h4>
                <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-bold">
                  <span className="bg-gray-100 px-2 py-0.5 rounded uppercase">{rate.container_size || 'N/A'} Size</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded uppercase">{rate.container_status || 'Empty/Loaded'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. SERVICES SELECTION */}
      <div className="bg-white border border-gray-100 rounded-3xl p-1">
        <ServicesSelection
          services={services}
          loadingServices={loadingServices}
          selectedServices={safeRequestData.service_type}
          servicePrices={safeRequestData.service_prices}
          onServiceToggle={handleServiceToggle}
          onServicePriceChange={handleServicePriceChange}
          isNewServiceModalOpen={isNewServiceModalOpen}
          setIsNewServiceModalOpen={setIsNewServiceModalOpen}
          onServiceAdded={handleServiceAdded}
        />
      </div>

      {/* 3. ADDITIONAL CHARGES (SIMPLIFIED) */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Additional Charges (Optional)</label>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black italic">₹</span>
              <input 
                type="number"
                value={extraCharges || ''}
                onChange={(e) => setExtraCharges(e.target.value)}
                placeholder="Enter extra amount..."
                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-8 pr-4 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
               Total: ₹{estimatedTotal.toLocaleString()}
            </div>
          </div>
      </div>

      {/* 4. DATE SELECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="group">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 group-hover:text-blue-500 transition-colors">Pickup Window</label>
          <input
            type="date"
            className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            value={safeRequestData.expected_pickup_date || today}
            onChange={(e) => setRequestData(prev => ({ ...prev, expected_pickup_date: e.target.value }))}
            required
          />
        </div>
        <div className="group">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 group-hover:text-blue-500 transition-colors">Delivery target</label>
          <input
            type="date"
            className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            value={safeRequestData.expected_delivery_date || today}
            onChange={(e) => setRequestData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default PricingScheduleSection;
