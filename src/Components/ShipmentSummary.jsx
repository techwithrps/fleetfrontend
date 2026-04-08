import React from "react";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const ShipmentSummary = ({
  shipments,
  customStats = null,
  gridCols = "md:grid-cols-4",
  showIcons = true,
  className = "mb-6",
}) => {
  // Default stats configuration
  const defaultStats = [
    {
      label: "Total Shipments",
      value: shipments.length,
      color: "blue",
      icon: Package,
    },
    {
      label: "Pending",
      value: shipments.filter((s) => s.status === "pending").length,
      color: "yellow",
      icon: Clock,
    },
    {
      label: "In Transit",
      value: shipments.filter((s) => s.status === "in_transit").length,
      color: "purple",
      icon: Truck,
    },
    {
      label: "Delivered",
      value: shipments.filter((s) => s.status === "delivered").length,
      color: "green",
      icon: CheckCircle,
    },
  ];

  // Use custom stats if provided, otherwise use default
  const summaryStats = customStats || defaultStats;

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-6 ${className}`}>
      {summaryStats.map((stat, index) => {
        const IconComponent = stat.icon || Package;

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              {showIcons && (
                <div className={`p-3 rounded-md bg-${stat.color}-100`}>
                  <IconComponent className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              )}
              <div className={showIcons ? "ml-4" : ""}>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {typeof stat.value === "function"
                    ? stat.value(shipments)
                    : stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShipmentSummary;
