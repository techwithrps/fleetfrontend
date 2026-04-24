import { useState, useEffect, useRef } from "react";
import { driverAPI, vendorAPI, vehicleAPI } from "../../utils/Api";
import { use } from "react";
import ContainerDetailsPage from "../../Pages/Containerdetailspage";

const VendorSearchInput = ({ value, onChange, placeholder }) => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Self option object
  const selfOption = {
    VENDOR_ID: "SELF",
    VENDOR_NAME: "Self",
    VENDOR_CODE: "SELF",
    CITY: "Own Vehicles",
    ADDRESS: "Own Vehicles",
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const response = await vehicleAPI.getAllvehicles();
        const vehiclesData = response.data || response || [];
        if (Array.isArray(vehiclesData)) {
          setVehicles(vehiclesData);
        } else {
          console.error("Vehicles data is not an array:", vehiclesData);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const response = await vendorAPI.getAllVendors();
        const vendorsData = response.data || response || [];
        if (Array.isArray(vendorsData)) {
          // Always add "Self" option at the beginning
          const vendorsWithSelf = [selfOption, ...vendorsData];
          setVendors(vendorsWithSelf);
          setFilteredVendors(vendorsWithSelf);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
        // Even if API fails, show Self option
        setVendors([selfOption]);
        setFilteredVendors([selfOption]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    if (searchTerm && vendors.length > 0) {
      const filtered = vendors.filter((v) =>
        v.VENDOR_NAME.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors(vendors);
    }
  }, [searchTerm, vendors]);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  // Simple dropdown position calculation
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;

    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Fixed smaller height

    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition("top");
    } else {
      setDropdownPosition("bottom");
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Delay calculation to ensure filteredVendors is updated
    setTimeout(calculateDropdownPosition, 0);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", calculateDropdownPosition, true);
      window.addEventListener("resize", calculateDropdownPosition);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", calculateDropdownPosition, true);
      window.removeEventListener("resize", calculateDropdownPosition);
    };
  }, [isOpen, filteredVendors.length]);

  // Simple dropdown position styles
  const getDropdownStyles = () => {
    if (!inputRef.current || !isOpen) return { display: "none" };

    const inputRect = inputRef.current.getBoundingClientRect();

    const styles = {
      width: `${Math.max(inputRect.width, 200)}px`,
      maxHeight: "200px", // Fixed height
      zIndex: 9999,
    };

    if (dropdownPosition === "top") {
      styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
      styles.left = `${inputRect.left}px`;
    } else {
      styles.top = `${inputRect.bottom + 4}px`;
      styles.left = `${inputRect.left}px`;
    }

    return styles;
  };

  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="input-clean pl-3 py-1.5 min-w-[160px]"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          placeholder={placeholder}
          required
          autoComplete="off"
        />

        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {isOpen && filteredVendors.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={getDropdownStyles()}
        >
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.VENDOR_ID}
                className={`px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-border/50 last:border-b-0 group ${
                  vendor.VENDOR_ID === "SELF" ? "bg-emerald-50/30" : ""
                }`}
                onClick={() => {
                  setSearchTerm(vendor.VENDOR_NAME);
                  onChange(vendor.VENDOR_NAME);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={`text-[12px] font-bold truncate group-hover:text-primary transition-colors ${
                    vendor.VENDOR_ID === "SELF" ? "text-emerald-700" : "text-foreground"
                  }`}>
                    {vendor.VENDOR_NAME}
                  </div>
                  {vendor.VENDOR_ID === "SELF" && (
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-emerald-200">
                      Fleet Asset
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-medium text-text-muted truncate mt-0.5 uppercase tracking-tight">
                  {vendor.VENDOR_CODE || "No code"} • {vendor.CITY || vendor.ADDRESS || "Location Unknown"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && filteredVendors.length === 0 && searchTerm && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
          style={getDropdownStyles()}
        >
          <div className="px-3 py-2 text-gray-500 text-sm">
            No vendors found matching "{searchTerm}"
          </div>
        </div>
      )}
    </>
  );
};

const DriverSearchInput = ({ value, onChange, vendorName, placeholder }) => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const [vehicles, setVehicles] = useState([]);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // First effect to get vendor ID when vendor name changes
  useEffect(() => {
    const getVendorId = async () => {
      if (!vendorName) {
        setVendorId(null);
        return;
      }

      // Handle "Self" vendor specially
      if (vendorName === "Self") {
        setVendorId("SELF");
        return;
      }

      try {
        console.log("Fetching vendors for name:", vendorName);
        const vendorsResponse = await vendorAPI.getAllVendors();
        const vendors = vendorsResponse.data || vendorsResponse || [];
        console.log("All vendors:", vendors);
        const vendor = vendors.find((v) => v.VENDOR_NAME === vendorName);

        if (vendor) {
          console.log("Found vendor:", vendor);
          setVendorId(vendor.VENDOR_ID);
        } else {
          console.log("No vendor found with name:", vendorName);
          setVendorId(null);
        }
      } catch (error) {
        console.error("Error fetching vendor ID:", error);
        setVendorId(null);
      }
    };

    getVendorId();
  }, [vendorName]);

  // Second effect to fetch drivers/vehicles when vendor ID changes
  useEffect(() => {
    const fetchData = async () => {
      if (!vendorId) {
        console.log("No vendor ID, clearing drivers");
        setDrivers([]);
        setFilteredDrivers([]);
        setVehicles([]);
        return;
      }

      setLoading(true);
      try {
        if (vendorId === "SELF") {
          // Fetch vehicles for self option
          console.log("Fetching vehicles for Self option");
          const vehiclesResponse = await vehicleAPI.getAllvehicles();
          console.log("Vehicles response for SELF:", vehiclesResponse);

          // Handle different response structures
          let vehiclesData = [];
          if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
            vehiclesData = vehiclesResponse;
          } else if (
            vehiclesResponse &&
            vehiclesResponse.data &&
            Array.isArray(vehiclesResponse.data)
          ) {
            vehiclesData = vehiclesResponse.data;
          } else if (
            vehiclesResponse &&
            Array.isArray(vehiclesResponse.vehicles)
          ) {
            vehiclesData = vehiclesResponse.vehicles;
          } else {
            console.warn(
              "Unexpected vehicles response structure:",
              vehiclesResponse
            );
            vehiclesData = [];
          }

          console.log("Processed vehicles data:", vehiclesData);
          console.log("Number of vehicles found:", vehiclesData.length);

          if (vehiclesData.length === 0) {
            console.warn("No vehicles found in response");
            setDrivers([]);
            setFilteredDrivers([]);
            setVehicles([]);
            return;
          }

          // Convert vehicles to driver-like format for compatibility
          const vehicleDrivers = vehiclesData.map((vehicle, index) => {
            console.log(`Processing vehicle ${index + 1}:`, vehicle);

            const driverName =
              vehicle.OWNER_NAME ||
              vehicle.owner_name ||
              `Owner of ${
                vehicle.VEHICLE_NUMBER ||
                vehicle.vehicle_number ||
                "Unknown Vehicle"
              }`;

            const vehicleNumber =
              vehicle.VEHICLE_NUMBER ||
              vehicle.vehicle_number ||
              vehicle.VEHICLE_NO ||
              "";
            const ownerContact =
              vehicle.OWNER_CONTACT ||
              vehicle.owner_contact ||
              vehicle.CONTACT_NO ||
              "";
            const vehicleType =
              vehicle.VEHICLE_TYPE || vehicle.vehicle_type || "";
            const make = vehicle.MAKE || vehicle.make || "";
            const model = vehicle.MODEL || vehicle.model || "";
            const year = vehicle.YEAR || vehicle.year || "";
            const vehicleId =
              vehicle.VEHICLE_ID || vehicle.vehicle_id || vehicle.id || index;

            return {
              DRIVER_ID: `VEHICLE_${vehicleId}`,
              DRIVER_NAME: driverName,
              CONTACT_NO: ownerContact,
              MOBILE_NO: ownerContact,
              DL_NO: "", // Vehicles don't have driver license info
              DL_RENEWABLE_DATE: null,
              VEHICLE_NO: vehicleNumber,
              VEHICLE_ID: vehicleId,
              VEHICLE_TYPE: vehicleType,
              MAKE: make,
              MODEL: model,
              YEAR: year,
              IS_SELF_VEHICLE: true, // Flag to identify self vehicles
            };
          });

          console.log("Converted vehicle drivers:", vehicleDrivers);

          setDrivers(vehicleDrivers);
          setFilteredDrivers(vehicleDrivers);
          setVehicles(vehiclesData);
        } else {
          // Fetch drivers for regular vendor
          console.log("Fetching drivers for vendor ID:", vendorId);
          const driversResponse = await driverAPI.getDriversByVendorId(
            vendorId
          );
          console.log("Drivers response:", driversResponse);
          const driversData = driversResponse.data || driversResponse || [];
          console.log("Drivers data:", driversData);
          setDrivers(driversData);
          setFilteredDrivers(driversData);
          setVehicles([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          response: error.response,
        });
        setDrivers([]);
        setFilteredDrivers([]);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vendorId]);

  useEffect(() => {
    if (searchTerm && drivers.length > 0) {
      const filtered = drivers.filter((d) =>
        d.DRIVER_NAME.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDrivers(filtered);
    } else {
      setFilteredDrivers(drivers);
    }
  }, [searchTerm, drivers]);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  // Simple dropdown position calculation
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return;

    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Fixed smaller height

    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition("top");
    } else {
      setDropdownPosition("bottom");
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setTimeout(calculateDropdownPosition, 0);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", calculateDropdownPosition, true);
      window.addEventListener("resize", calculateDropdownPosition);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", calculateDropdownPosition, true);
      window.removeEventListener("resize", calculateDropdownPosition);
    };
  }, [isOpen, filteredDrivers.length]);

  // Simple dropdown position styles
  const getDropdownStyles = () => {
    if (!inputRef.current || !isOpen) return { display: "none" };

    const inputRect = inputRef.current.getBoundingClientRect();

    const styles = {
      width: `${Math.max(inputRect.width, 250)}px`, // Increased width for vehicle info
      maxHeight: "200px", // Fixed height
      zIndex: 9999,
    };

    if (dropdownPosition === "top") {
      styles.bottom = `${window.innerHeight - inputRect.top + 4}px`;
      styles.left = `${inputRect.left}px`;
    } else {
      styles.top = `${inputRect.bottom + 4}px`;
      styles.left = `${inputRect.left}px`;
    }

    return styles;
  };

  // Helper function to format vehicle info
  const getVehicleInfo = (driver) => {
    if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
      // For self vehicles, show more detailed info
      const vehicleInfo = [];
      if (driver.VEHICLE_NO) vehicleInfo.push(`${driver.VEHICLE_NO}`);
      if (driver.VEHICLE_TYPE) vehicleInfo.push(`(${driver.VEHICLE_TYPE})`);
      if (driver.MAKE && driver.MODEL)
        vehicleInfo.push(`${driver.MAKE} ${driver.MODEL}`);

      return vehicleInfo.length > 0 ? vehicleInfo.join(" ") : "Own Vehicle";
    } else {
      // For vendor drivers
      if (driver.VEHICLE_NO) {
        return `Vehicle: ${driver.VEHICLE_NO}`;
      } else if (driver.VEHICLE_ID) {
        return `Vehicle ID: ${driver.VEHICLE_ID}`;
      } else {
        return "No vehicle assigned";
      }
    }
  };

  // Helper function to get contact info
  const getContactInfo = (driver) => {
    const contact = driver.CONTACT_NO || driver.MOBILE_NO;
    const license = driver.DL_NO;

    if (vendorId === "SELF" || driver.IS_SELF_VEHICLE) {
      // For self vehicles, show owner contact and year
      const info = [];
      if (contact) info.push(contact);
      if (driver.YEAR) info.push(`Year: ${driver.YEAR}`);
      return info.length > 0 ? info.join(" | ") : "No contact info";
    } else {
      // For vendor drivers
      if (contact && license) {
        return `${contact} | License: ${license}`;
      } else if (contact) {
        return contact;
      } else if (license) {
        return `License: ${license}`;
      } else {
        return "No contact info";
      }
    }
  };

  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="input-clean pl-3 py-1.5 min-w-[140px] disabled:bg-slate-50/50 disabled:text-text-muted/60"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={!vendorName}
          required
          autoComplete="off"
        />

        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {isOpen && filteredDrivers.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={getDropdownStyles()}
        >
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
            {filteredDrivers.map((driver) => (
              <div
                key={driver.DRIVER_ID}
                className={`px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-border/50 last:border-b-0 group ${
                  vendorId === "SELF" || driver.IS_SELF_VEHICLE ? "bg-emerald-50/30" : ""
                }`}
                onClick={() => {
                  setSearchTerm(driver.DRIVER_NAME);
                  onChange(driver.DRIVER_NAME, driver);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={`text-[12px] font-bold truncate group-hover:text-primary transition-colors ${
                    vendorId === "SELF" || driver.IS_SELF_VEHICLE ? "text-emerald-700" : "text-foreground"
                  }`}>
                    {driver.DRIVER_NAME}
                  </div>
                  {(vendorId === "SELF" || driver.IS_SELF_VEHICLE) && (
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-emerald-200">
                      Internal Asset
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-medium text-text-muted truncate mt-0.5 uppercase tracking-tight">
                  {getContactInfo(driver)}
                </div>
                <div className={`text-[10px] font-bold truncate mt-1 uppercase tracking-wider ${
                  vendorId === "SELF" || driver.IS_SELF_VEHICLE ? "text-emerald-600" : "text-primary"
                }`}>
                  {getVehicleInfo(driver)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && filteredDrivers.length === 0 && searchTerm && !loading && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-border rounded-lg shadow-xl"
          style={getDropdownStyles()}
        >
          <div className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">
            No logistics matches found
          </div>
        </div>
      )}

      {isOpen &&
        filteredDrivers.length === 0 &&
        !searchTerm &&
        !loading &&
        vendorName && (
          <div
            ref={dropdownRef}
            className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
            style={getDropdownStyles()}
          >
            <div className="px-3 py-2 text-gray-500 text-sm">
              {vendorId === "SELF"
                ? "No vehicles available"
                : "No drivers available for this vendor"}
            </div>
          </div>
        )}

      {!vendorName && isOpen && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg"
          style={getDropdownStyles()}
        >
          <div className="px-3 py-2 text-gray-500 text-sm">
            Please select a vendor first
          </div>
        </div>
      )}
    </>
  );
};

// Updated table component with vehicle number auto-fill
// Add this function at the top of your VehicleBasicDetailsTable component
const VehicleBasicDetailsTable = ({ vehicleDataList, updateVehicleData }) => {
  // Add this function to filter unique vehicles by vehicle number
  const getUniqueVehicles = (vehicles) => {
    // If no vehicles or empty array, return at least one empty vehicle
    if (!vehicles || vehicles.length === 0) {
      return [
        {
          vehicleIndex: 1,
          vendorName: "",
          transporterName: "",
          vehicleNumber: "",
          driverName: "",
          driverContact: "",
          licenseNumber: "",
          licenseExpiry: "",
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
          `Skipping duplicate vehicle number: ${vehicleNumber} at index ${index}`
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
        vendorName: "",
        transporterName: "",
        vehicleNumber: "",
        driverName: "",
        driverContact: "",
        licenseNumber: "",
        licenseExpiry: "",
      });
    }

    console.log(
      `Filtered ${vehicles.length} vehicles down to ${uniqueVehicles.length} unique vehicles`
    );
    return uniqueVehicles;
  };

  // Filter the vehicle data list to show only unique vehicle numbers
  const uniqueVehicleDataList = getUniqueVehicles(vehicleDataList);

  // Rest of your existing validation and handler functions remain the same...
  const validateVehicleData = (field, value) => {
    switch (field) {
      case "vehicleNumber":
        return /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(value);
      case "driverName":
        return value.length >= 3 && /^[A-Za-z.\s]+$/.test(value);
      case "driverContact":
        return /^\d{10}$/.test(value);
      case "licenseNumber":
        return value.length >= 5 && /^[A-Z0-9]+$/.test(value);
      case "licenseExpiry":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(value);
        return expiryDate >= today;
      default:
        return true;
    }
  };

  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (index, field, value) => {
    // Find the original index in vehicleDataList for this unique vehicle
    const originalIndex = vehicleDataList.findIndex(
      (v) => v.vehicleIndex === uniqueVehicleDataList[index].vehicleIndex
    );

    updateVehicleData(originalIndex, field, value);
    const isValid = validateVehicleData(field, value);
    setValidationErrors((prev) => ({
      ...prev,
      [`${originalIndex}-${field}`]: isValid
        ? null
        : `Invalid ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`,
    }));
  };

  const handleVendorChange = (index, vendorName) => {
    // Find the original index in vehicleDataList for this unique vehicle
    const originalIndex = vehicleDataList.findIndex(
      (v) => v.vehicleIndex === uniqueVehicleDataList[index].vehicleIndex
    );

    updateVehicleData(originalIndex, "vendorName", vendorName);
    updateVehicleData(originalIndex, "transporterName", vendorName);
  };

  const handleDriverSelection = (index, driverName, driverData) => {
    // Find the original index in vehicleDataList for this unique vehicle
    const originalIndex = vehicleDataList.findIndex(
      (v) => v.vehicleIndex === uniqueVehicleDataList[index].vehicleIndex
    );

    if (driverData) {
      updateVehicleData(originalIndex, "driverName", driverName);
      updateVehicleData(
        originalIndex,
        "driverContact",
        driverData.MOBILE_NO || driverData.CONTACT_NO || ""
      );
      updateVehicleData(originalIndex, "licenseNumber", driverData.DL_NO || "");
      updateVehicleData(
        originalIndex,
        "vehicleNumber",
        driverData.VEHICLE_NO || ""
      );

      if (driverData.DL_RENEWABLE_DATE) {
        const date = new Date(driverData.DL_RENEWABLE_DATE);
        const formattedDate = date.toISOString().split("T")[0];
        updateVehicleData(originalIndex, "licenseExpiry", formattedDate);
      }
    } else {
      updateVehicleData(originalIndex, "driverName", driverName);
    }
  };

  const getVendorName = (vehicle) => {
    return vehicle.vendorName || vehicle.transporterName || "";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          Logistic Asset Configuration
        </h4>
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
          * Required Parameters for Dispatch
        </span>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-border">
                <th className="px-4 py-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest w-16 text-center">
                  Asset #
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest min-w-[200px]">
                  Logistics Provider *
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest min-w-[160px]">
                  Vehicle Registration *
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest min-w-[160px]">
                  Assigner / Captain *
                </th>
                <th className="px-4 py-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest min-w-[160px]">
                  Communication *
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {uniqueVehicleDataList.map((vehicle, index) => {
                const originalIndex = vehicleDataList.findIndex(
                  (v) => v.vehicleIndex === vehicle.vehicleIndex
                );

                return (
                  <tr
                    key={`vehicle-${vehicle.vehicleIndex}`}
                    className="hover:bg-slate-50/30 transition-colors group"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="text-[11px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md">
                        {vehicle.vehicleIndex.toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <VendorSearchInput
                        value={getVendorName(vehicle)}
                        onChange={(value) => handleVendorChange(index, value)}
                        placeholder="Search Provider..."
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <input
                          type="text"
                          className={`input-clean py-1.5 px-3 text-[12px] font-bold uppercase tracking-wider ${
                            validationErrors[`${originalIndex}-vehicleNumber`]
                              ? "border-rose-300 bg-rose-50/30"
                              : ""
                          }`}
                          value={vehicle.vehicleNumber}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "vehicleNumber",
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder="e.g. MH01..."
                          pattern="[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}"
                          required
                        />
                        {validationErrors[`${originalIndex}-vehicleNumber`] && (
                          <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">
                            {validationErrors[`${originalIndex}-vehicleNumber`]}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <DriverSearchInput
                          value={vehicle.driverName}
                          onChange={(value, driverData) =>
                            handleDriverSelection(index, value, driverData)
                          }
                          vendorName={getVendorName(vehicle)}
                          placeholder="Select Personnel..."
                        />
                        {validationErrors[`${originalIndex}-driverName`] && (
                          <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">
                            {validationErrors[`${originalIndex}-driverName`]}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <input
                          type="tel"
                          className={`input-clean py-1.5 px-3 text-[12px] font-bold ${
                            validationErrors[`${originalIndex}-driverContact`]
                              ? "border-rose-300 bg-rose-50/30"
                              : ""
                          }`}
                          value={vehicle.driverContact}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "driverContact",
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                          placeholder="10-digit number"
                          pattern="\d{10}"
                          maxLength="10"
                          required
                        />
                        {validationErrors[`${originalIndex}-driverContact`] && (
                          <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">
                            {validationErrors[`${originalIndex}-driverContact`]}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VehicleBasicDetailsTable;
