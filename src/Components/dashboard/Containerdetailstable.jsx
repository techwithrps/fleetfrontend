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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-gray-900">
       
          <span className="text-sm font-normal text-gray-500 ml-2">
         
          </span>
        </h4>
        {!isTrType && (
          <button
            type="button"
            onClick={handleViewContainerDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Container Details
          </button>
        )}

        {isTrType && (
          <button
            type="button"
            onClick={handleViewVinDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Vin Details
          </button>
        )}
      </div>
      <div className="overflow-x-auto border rounded-lg">
      
      </div>
    </div>
  );
};

export default ContainerDetailsTable;
