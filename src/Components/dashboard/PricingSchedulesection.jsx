import React, { useEffect, useState } from "react";
import ServicesSelection from "../dashboard/ServiceSelection";

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

  const calculateServiceTotal = () => {
    const servicePrices = safeRequestData.service_prices || {};
    return Object.keys(servicePrices)
      .filter(s => safeRequestData.service_type.includes(s))
      .reduce((sum, s) => sum + (parseFloat(servicePrices[s]) || 0), 0) * unitMultiplier * currentNoOfVehicles;
  };

  const estimatedTotal = calculateServiceTotal() + parseFloat(extraCharges || 0);

  return (
    <div className="space-y-8 mt-6">
      {/* 1. SERVICES SELECTION */}
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

      {/* 2. ADDITIONAL CHARGES (SIMPLIFIED) */}
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

      {/* 3. DATE SELECTION */}
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
