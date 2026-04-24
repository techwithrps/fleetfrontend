import React from "react";

const VehicleChargesTable = ({
  vehicleDataList,
  services,
  updateVehicleData,
}) => {
  // Add deduplication function for charges table
  const getUniqueVehicles = (vehicles) => {
    // If no vehicles or empty array, return at least one empty vehicle
    if (!vehicles || vehicles.length === 0) {
      return [
        {
          vehicleIndex: 1,
          vehicleNumber: "",
          serviceCharges: {},
          additionalCharges: 0,
          totalCharge: 0,
        },
      ];
    }

    const seenVehicleNumbers = new Set();
    const uniqueVehicles = [];

    vehicles.forEach((vehicle, index) => {
      const vehicleNumber = vehicle.vehicleNumber?.trim().toUpperCase();

      // For empty vehicle numbers, always include them (for new entries)
      if (!vehicleNumber) {
        uniqueVehicles.push(vehicle);
        return;
      }

      // If vehicle number is already seen, skip it
      if (seenVehicleNumbers.has(vehicleNumber)) {
        console.log(
          `Skipping duplicate vehicle number in charges: ${vehicleNumber} at index ${index}`
        );
        return;
      }

      // Add to seen set and unique vehicles array
      seenVehicleNumbers.add(vehicleNumber);
      uniqueVehicles.push(vehicle);
    });

    // Ensure at least one row is always shown
    if (uniqueVehicles.length === 0) {
      uniqueVehicles.push({
        vehicleIndex: 1,
        vehicleNumber: "",
        serviceCharges: {},
        additionalCharges: 0,
        totalCharge: 0,
      });
    }

    console.log(
      `Charges table: Filtered ${vehicles.length} vehicles down to ${uniqueVehicles.length} unique vehicles`
    );
    return uniqueVehicles;
  };

  // Filter the vehicle data list to show only unique vehicle numbers
  const uniqueVehicleDataList = getUniqueVehicles(vehicleDataList);

  const handleServiceChargeChange = (index, serviceName, value) => {
    // Find the original index in vehicleDataList for this unique vehicle
    const originalIndex = vehicleDataList.findIndex(
      (v) => v.vehicleIndex === uniqueVehicleDataList[index].vehicleIndex
    );

    const vehicle = vehicleDataList[originalIndex];
    const updatedCharges = {
      ...vehicle.serviceCharges,
      [serviceName]: value,
    };

    updateVehicleData(originalIndex, "serviceCharges", updatedCharges);

    const serviceTotal = Object.values(updatedCharges).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );

    updateVehicleData(originalIndex, "totalCharge", serviceTotal);
  };

  const handleAdditionalChargeChange = (index, value) => {
    // Find the original index in vehicleDataList for this unique vehicle
    const originalIndex = vehicleDataList.findIndex(
      (v) => v.vehicleIndex === uniqueVehicleDataList[index].vehicleIndex
    );

    updateVehicleData(originalIndex, "additionalCharges", value);
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Financial Deployment Matrix
        </h4>
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
          All Charges in INR (₹)
        </span>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-border">
                <th className="px-4 py-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest w-32">
                  Asset Identifier
                </th>

                {services.map((serviceName) => (
                  <th
                    key={serviceName}
                    className="px-4 py-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest min-w-[140px]"
                  >
                    Provider: {serviceName}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest min-w-[160px]">
                  Auxiliary Commitment
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest min-w-[160px]">
                  Total Financial Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {uniqueVehicleDataList.map((vehicle, index) => (
                <tr
                  key={`charges-${vehicle.vehicleIndex || index}`}
                  className="hover:bg-slate-50/30 transition-colors group"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[11px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-1 rounded-md block text-center truncate max-w-[120px]">
                      {vehicle.vehicleNumber || `Asset ${vehicle.vehicleIndex || index + 1}`}
                    </span>
                  </td>

                  {services.map((serviceName) => (
                    <td key={serviceName} className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        className="input-clean py-1.5 px-3 text-[12px] font-bold min-w-[120px]"
                        value={vehicle.serviceCharges?.[serviceName] || ""}
                        onChange={(e) =>
                          handleServiceChargeChange(
                            index,
                            serviceName,
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      className="input-clean py-1.5 px-3 text-[12px] font-bold min-w-[120px]"
                      value={vehicle.additionalCharges || ""}
                      onChange={(e) =>
                        handleAdditionalChargeChange(index, e.target.value)
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="bg-slate-100/50 border border-border rounded-lg py-1.5 px-3 min-w-[140px] text-right">
                      <span className="text-[12px] font-bold text-foreground">
                        ₹{(vehicle.totalCharge || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VehicleChargesTable;
