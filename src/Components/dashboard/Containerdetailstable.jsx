import React from "react";
import { useNavigate } from "react-router-dom";

const ContainerDetailsTable = ({ vehicleDataList, updateVehicleData, transportRequestId, tripType }) => {
  const navigate = useNavigate();

  // Check if the trip type is one of the TR types that should show VIN details
  const isTrType = tripType && ['Tr-4', 'Tr-5', 'Tr-6', 'Tr-8', 'Tr-9', 'Ven'].includes(tripType);

  // Extract the number from TR type (e.g., Tr-4 -> 4)
  const getTrNumber = () => {
    if (!tripType) return 0;
    
    const match = tripType.match(/Tr-(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    } else if (tripType === 'Ven') {
      return 4; // Ven is equivalent to Tr-4
    }
    return 0;
  };

  const handleViewContainerDetails = () => {
    // Store the current container data in sessionStorage to access it on the container details page
    sessionStorage.setItem("containerData", JSON.stringify(vehicleDataList));
    sessionStorage.setItem("transportRequestId", transportRequestId);
    
    // Navigate to the container details page
    navigate("/customer/container-page");
  };

  const handleViewVinDetails = () => {
    // Store the current container data in sessionStorage to access it on the container details page
    sessionStorage.setItem("containerData", JSON.stringify(vehicleDataList));
    sessionStorage.setItem("transportRequestId", transportRequestId);
    sessionStorage.setItem("vehicleType", tripType); // Store the vehicle type instead of just the number
    
    // Navigate to the container details page
    navigate("/customer/vinpage");
  };

  return (
    <div className="mt-10 border-t border-border pt-8">
      <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-widest">
              Deployment Unit Specifications
            </h4>
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-tight">
              Manage unit identifiers and specific loading configurations
            </p>
          </div>
        </div>

        {!isTrType && (
          <button
            type="button"
            onClick={handleViewContainerDetails}
            className="btn-action px-6 py-2 flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">Configure Units</span>
          </button>
        )}

        {isTrType && (
          <button
            type="button"
            onClick={handleViewVinDetails}
            className="btn-action px-6 py-2 flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">Verify Serial Identifiers</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ContainerDetailsTable;
