import React from "react";
import LocationSearchInput from "./LocationSearchInput";
import CustomerSearchInput from "../dashboard/CustomerSearchinput";
import { toast } from "react-toastify";

const LocationsCargoSection = ({
  safeRequestData,
  setRequestData,
  useOpenStreetMap,
  setUseOpenStreetMap,
}) => {
  const shouldForceLoadedStatus = (vehicleType) => {
    const alwaysLoadedTypes = [
      "Tr-4",
      "Tr-5",
      "Tr-8",
      "Tr-9",
      "Single Car Carrier",
    ];
    return alwaysLoadedTypes.includes(vehicleType);
  };

  // New helper function to check if commodity should be locked to VIN
  const shouldLockCommodityToVIN = (vehicleType) => {
    const vinTypes = ["Tr-4", "Tr-5", "Tr-8", "Tr-9", "Single Car Carrier"];
    return vinTypes.includes(vehicleType);
  };

  const currentVehicleStatus = shouldForceLoadedStatus(
    safeRequestData.vehicle_type
  )
    ? "Loaded"
    : safeRequestData.vehicle_status;

  const handleCheckboxChange = (e) => {
    setUseOpenStreetMap(e.target.checked);
  };

  const normalizeLocation = (value) => String(value || "").trim().toLowerCase();

  const handlePickupChange = (value) => {
    const nextPickup = String(value || "").trim();
    const currentDelivery = String(safeRequestData.delivery_location || "").trim();
    if (
      nextPickup &&
      currentDelivery &&
      normalizeLocation(nextPickup) === normalizeLocation(currentDelivery)
    ) {
      toast.error("Pickup and delivery location cannot be same.");
      return;
    }
    setRequestData((prev) => ({
      ...prev,
      pickup_location: nextPickup,
    }));
  };

  const handleDeliveryChange = (value) => {
    const nextDelivery = String(value || "").trim();
    const currentPickup = String(safeRequestData.pickup_location || "").trim();
    if (
      nextDelivery &&
      currentPickup &&
      normalizeLocation(nextDelivery) === normalizeLocation(currentPickup)
    ) {
      toast.error("Pickup and delivery location cannot be same.");
      return;
    }
    setRequestData((prev) => ({
      ...prev,
      delivery_location: nextDelivery,
    }));
  };

  return (
    <>
      {/* Consignee and Consigner Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Consignee</label>
          <CustomerSearchInput
            value={safeRequestData.consignee}
            onChange={(value) =>
              setRequestData({ ...safeRequestData, consignee: value })
            }
            placeholder="Search and select consignee"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Consigner</label>
          <CustomerSearchInput
            value={safeRequestData.consigner}
            onChange={(value) =>
              setRequestData({ ...safeRequestData, consigner: value })
            }
            placeholder="Search and select consigner"
          />
        </div>
      </div>

      {/* Map Selection Checkbox */}
      <div className="mb-4">
        <label className="bg-blue-50 p-2 rounded-lg border border-blue-200">
          <input
            type="checkbox"
            checked={useOpenStreetMap}
            onChange={handleCheckboxChange}
            className="mr-2 "
          />
          Use Google Map
        </label>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Pickup Location
          </label>
          <LocationSearchInput
            value={safeRequestData.pickup_location}
            onChange={handlePickupChange}
            placeholder="Enter pickup location"
            useOpenStreetMap={useOpenStreetMap}
          />
        </div>
        {currentVehicleStatus === "Loaded" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Stuffing Location
            </label>
            <LocationSearchInput
              value={safeRequestData.stuffing_location}
              onChange={(value) =>
                setRequestData((prev) => ({
                  ...prev,
                  stuffing_location: value,
                }))
              }
              placeholder="Enter stuffing location"
              useOpenStreetMap={useOpenStreetMap}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">
            Delivery Location
          </label>
          <LocationSearchInput
            value={safeRequestData.delivery_location}
            onChange={handleDeliveryChange}
            placeholder="Enter delivery location"
            useOpenStreetMap={useOpenStreetMap}
          />
        </div>
      </div>

      {/* Cargo Details (only when Loaded) */}
      {currentVehicleStatus === "Loaded" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Commodity/Cargo
            </label>
            {shouldLockCommodityToVIN(safeRequestData.vehicle_type) ? (
              <div>
                <input
                  type="text"
                  className="w-full border rounded-md p-2 bg-gray-100"
                  value="VIN"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  This trip type automatically uses VIN as commodity
                </p>
              </div>
            ) : (
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={safeRequestData.commodity}
                onChange={(e) =>
                  setRequestData({
                    ...safeRequestData,
                    commodity: e.target.value,
                  })
                }
                required
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cargo Type</label>
            <select
              className="w-full border rounded-md p-2"
              value={safeRequestData.cargo_type}
              onChange={(e) =>
                setRequestData({
                  ...safeRequestData,
                  cargo_type: e.target.value,
                })
              }
              required
            >
              <option value="">Select Type</option>
              <option value="General">General</option>
              <option value="Hazardous">Hazardous</option>
              <option value="Perishable">Perishable</option>
              <option value="Fragile">Fragile</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Total Weight (KG)
            </label>
            {shouldLockCommodityToVIN(safeRequestData.vehicle_type) ? (
              <div>
                <input
                  type="number"
                  className="w-full border rounded-md p-2 bg-gray-100"
                  value={0}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Weight is automatically set to 0 for this trip type
                </p>
              </div>
            ) : (
              <input
                type="number"
                name="cargo_weight"
                className="w-full border rounded-md p-2"
                value={safeRequestData.cargo_weight}
                onChange={(e) =>
                  setRequestData((prev) => ({
                    ...prev,
                    cargo_weight: Number(e.target.value),
                  }))
                }
                required
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LocationsCargoSection;
