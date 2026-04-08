import React from "react";
import ContainerCard from "./ContainerCards";

const VehicleGroup = ({ 
  vehicleNumber, 
  vehicleContainers, 
  expandedVehicle, 
  containers,
  onToggleExpansion, 
  onAddContainer, 
  onUpdateContainer, 
  onRemoveContainer 
}) => {
  const isExpanded = expandedVehicle === vehicleNumber;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Vehicle Header */}
      <div
        className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
          isExpanded ? "bg-blue-50" : "bg-gray-50"
        }`}
        onClick={() => onToggleExpansion(vehicleNumber)}
      >
        <div className="flex items-center">
          <span className="font-medium text-gray-900">
            {vehicleNumber === "unassigned"
              ? "Unassigned Containers"
              : `Vehicle: ${vehicleNumber}`}
          </span>
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {vehicleContainers.length} container
            {vehicleContainers.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center">
          {/* Add Container Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddContainer(vehicleNumber);
            }}
            className="mr-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Add container to this vehicle"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
          {/* Expand/Collapse Icon */}
          <svg
            className={`h-5 w-5 text-gray-500 transform transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Container Cards */}
      {isExpanded && (
        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicleContainers.map((container, containerIndex) => {
              // Use a stable key based on container.id or vehicleIndex
              const key =
                container.id ||
                `container-${container.vehicleIndex}-${vehicleNumber}-${containerIndex}`;

              return (
                <ContainerCard
                  key={key}
                  container={container}
                  containerIndex={containerIndex}
                  vehicleNumber={vehicleNumber}
                  containers={containers}
                  onUpdateContainer={onUpdateContainer}
                  onRemoveContainer={onRemoveContainer}
                  canRemove={containers.length > 1}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleGroup;