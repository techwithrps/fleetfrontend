import { useState } from "react";
import LocationSearchInput from "./LocationSearchInput";

const ParentComponent = () => {
  const [useOpenStreetMap, setUseOpenStreetMap] = useState(false);
  const [location1, setLocation1] = useState("");
  const [location2, setLocation2] = useState("");

  const handleCheckboxChange = (e) => {
    setUseOpenStreetMap(e.target.checked);
  };

  return (
    <div className="p-4">
      {/* Single checkbox that controls both inputs */}
      <div className="mb-4">
        <label className="flex items-center text-sm text-gray-600">
          <input
            type="checkbox"
            checked={useOpenStreetMap}
            onChange={handleCheckboxChange}
            className="mr-2"
          />
          Use OpenStreetMap
        </label>
      </div>

      {/* Two location inputs side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Location
          </label>
          <LocationSearchInput
            value={location1}
            onChange={setLocation1}
            placeholder="Enter starting location"
            useOpenStreetMap={useOpenStreetMap}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Location
          </label>
          <LocationSearchInput
            value={location2}
            onChange={setLocation2}
            placeholder="Enter destination"
            useOpenStreetMap={useOpenStreetMap}
          />
        </div>
      </div>
    </div>
  );
};

export default ParentComponent;
