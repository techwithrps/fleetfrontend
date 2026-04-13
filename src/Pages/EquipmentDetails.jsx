import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { equipmentAPI, vendorAPI } from "../utils/Api";

const EquipmentDetails = () => {
  const [equipment, setEquipment] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    TERMINAL_ID: "",
    EQUIPMENT_NO: "",
    EQUIPMENT_TYPE: "",
    PURCHAGE_DATE: "",
    INSURANCE_NO: "",
    ENG_NO: "",
    ENG_TYPE: "",
    VIN_NO: "",
    MANUFACTURING_YEAR: "",
    MODEL: "",
    CONDITION: "N",
    TARE_WT: "",
    GROSS_WT: "",
    STATUS: "A",
    BED_CHANGEABLE: "N",
    IMAGE: "",
    REGISTRATION_DATE: "",
    MANUFACTURER: "",
    INS_VENDOR: "",
    INS_VALIDITY: "",
    PERMIT_FROM: "",
    PERMIT_TO: "",
    POLLUTION_VALIDITY: "",
    RTO: "",
    FITNESS_DOC: "",
    VALIDITY: "",
    RC_DOC: "",
    INSURANCE_DOC: "",
    PERMIT_A: "",
    PERMIT_B: "",
    XL_TYPE: "",
    COMPANY_ID: "",
    DRIVER_ATTACH_ID: "",
    DRIVER_ATTCAH_STATUS: "",
    STATE_PERMIT_FROM: "",
    STATE_PERMIT_TO: "",
    ROAD_TAX_VALIDITY: "",
    REMARK_NOTE: "",
    VENDER_ID: ""
  });

  // Fetch all equipment
  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await equipmentAPI.getAllEquipment();
      if (response.success) {
        setEquipment(response.data);
      } else {
        toast.error("Failed to fetch equipment");
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast.error(error.message || "Failed to fetch equipment");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all vendors for dropdown
  const fetchVendors = async () => {
    try {
      const response = await vendorAPI.getAllVendors();
      if (response.success) {
        setVendors(response.data);
      } else {
        toast.error("Failed to fetch vendors");
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to fetch vendors");
    }
  };

  // Fetch equipment and vendors on component mount
  useEffect(() => {
    fetchEquipment();
    fetchVendors();
  }, []);

  const getEquipmentFieldError = (name, value) => {
    if (!value) return "";
    const currentYear = new Date().getFullYear() + 1;
    const validators = {
      EQUIPMENT_NO: () =>
        /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/.test(value)
          ? ""
          : "Use valid Indian vehicle no (e.g., UP78CN6949)",
      VIN_NO: () =>
        /^[A-HJ-NPR-Z0-9]{17}$/.test(value)
          ? ""
          : "VIN must be 17 chars (no I, O, Q)",
      INSURANCE_NO: () =>
        String(value).trim().length >= 6
          ? ""
          : "Insurance no should be at least 6 characters",
      MANUFACTURING_YEAR: () =>
        /^(19|20)\d{2}$/.test(String(value)) &&
        Number(value) >= 1980 &&
        Number(value) <= currentYear
          ? ""
          : `Enter valid year (1980-${currentYear})`,
    };
    return validators[name] ? validators[name]() : "";
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (!name) return;
    const message = getEquipmentFieldError(name, value);
    e.target.setCustomValidity(message);
    if (message) {
      e.target.reportValidity();
      setFieldErrors((prev) => ({ ...prev, [name]: message }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateEquipmentForm = () => {
    const keys = ["EQUIPMENT_NO", "VIN_NO", "INSURANCE_NO", "MANUFACTURING_YEAR"];
    const nextErrors = {};
    keys.forEach((key) => {
      const msg = getEquipmentFieldError(key, formData[key]);
      if (msg) nextErrors[key] = msg;
    });
    setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
        setFormData({ ...formData, [name]: files[0] });
    } else {
        let nextValue = value;

        if (name === "EQUIPMENT_NO") {
          nextValue = value.replace(/[\s-]/g, "").toUpperCase();
        } else if (name === "VIN_NO") {
          nextValue = value.replace(/\s/g, "").toUpperCase();
        } else if (["ENG_NO", "ENG_TYPE", "RTO", "MANUFACTURER"].includes(name)) {
          nextValue = value.toUpperCase();
        } else if (["TERMINAL_ID", "COMPANY_ID", "DRIVER_ATTACH_ID"].includes(name)) {
          nextValue = value.replace(/\D/g, "");
        } else if (name === "MANUFACTURING_YEAR") {
          nextValue = value.replace(/\D/g, "").slice(0, 4);
        }

        setFormData({ ...formData, [name]: nextValue });
        if (fieldErrors[name]) {
          setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
    }
  };

  // Handle equipment selection
  const handleSelectEquipment = (equip) => {
    setSelectedEquipment(equip);
    setFormData({
      TERMINAL_ID: equip.TERMINAL_ID || "",
      EQUIPMENT_NO: equip.EQUIPMENT_NO || "",
      EQUIPMENT_TYPE: equip.EQUIPMENT_TYPE || "",
      PURCHAGE_DATE: equip.PURCHAGE_DATE ? new Date(equip.PURCHAGE_DATE).toISOString().split('T')[0] : "",
      INSURANCE_NO: equip.INSURANCE_NO || "",
      ENG_NO: equip.ENG_NO || "",
      ENG_TYPE: equip.ENG_TYPE || "",
      VIN_NO: equip.VIN_NO || "",
      MANUFACTURING_YEAR: equip.MANUFACTURING_YEAR || "",
      MODEL: equip.MODEL || "",
      CONDITION: equip.CONDITION || "N",
      TARE_WT: equip.TARE_WT || "",
      GROSS_WT: equip.GROSS_WT || "",
      STATUS: equip.STATUS || "A",
      BED_CHANGEABLE: equip.BED_CHANGEABLE || "N",
      IMAGE: equip.IMAGE || "",
      REGISTRATION_DATE: equip.REGISTRATION_DATE ? new Date(equip.REGISTRATION_DATE).toISOString().split('T')[0] : "",
      MANUFACTURER: equip.MANUFACTURER || "",
      INS_VENDOR: equip.INS_VENDOR || "",
      INS_VALIDITY: equip.INS_VALIDITY ? new Date(equip.INS_VALIDITY).toISOString().split('T')[0] : "",
      PERMIT_FROM: equip.PERMIT_FROM ? new Date(equip.PERMIT_FROM).toISOString().split('T')[0] : "",
      PERMIT_TO: equip.PERMIT_TO ? new Date(equip.PERMIT_TO).toISOString().split('T')[0] : "",
      POLLUTION_VALIDITY: equip.POLLUTION_VALIDITY ? new Date(equip.POLLUTION_VALIDITY).toISOString().split('T')[0] : "",
      RTO: equip.RTO || "",
      FITNESS_DOC: equip.FITNESS_DOC || "",
      VALIDITY: equip.VALIDITY ? new Date(equip.VALIDITY).toISOString().split('T')[0] : "",
      RC_DOC: equip.RC_DOC || "",
      INSURANCE_DOC: equip.INSURANCE_DOC || "",
      PERMIT_A: equip.PERMIT_A || "",
      PERMIT_B: equip.PERMIT_B || "",
      XL_TYPE: equip.XL_TYPE || "",
      COMPANY_ID: equip.COMPANY_ID || "",
      DRIVER_ATTACH_ID: equip.DRIVER_ATTACH_ID || "",
      DRIVER_ATTCAH_STATUS: equip.DRIVER_ATTCAH_STATUS || "",
      STATE_PERMIT_FROM: equip.STATE_PERMIT_FROM ? new Date(equip.STATE_PERMIT_FROM).toISOString().split('T')[0] : "",
      STATE_PERMIT_TO: equip.STATE_PERMIT_TO ? new Date(equip.STATE_PERMIT_TO).toISOString().split('T')[0] : "",
      ROAD_TAX_VALIDITY: equip.ROAD_TAX_VALIDITY ? new Date(equip.ROAD_TAX_VALIDITY).toISOString().split('T')[0] : "",
      REMARK_NOTE: equip.REMARK_NOTE || "",
      VENDER_ID: equip.VENDER_ID || ""
    });
    setIsEditing(false);
  };

  // Handle form submission for creating/updating equipment
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.EQUIPMENT_NO) {
      toast.error("Vehicle No is required");
      return;
    }
    if (!validateEquipmentForm()) {
      toast.error("Please fix highlighted vehicle fields");
      return;
    }
    
    const data = new FormData();
    for (const key in formData) {
        data.append(key, formData[key]);
    }

    try {
      if (isEditing && selectedEquipment) {
        // Update existing equipment
        const response = await equipmentAPI.updateEquipment(selectedEquipment.EQUIPMENT_ID, data);
        if (response.success) {
          toast.success("Vehicle updated successfully");
          fetchEquipment();
          setIsEditing(false);
        } else {
          toast.error(response.error || "Failed to update equipment");
        }
      } else {
        // Create new equipment
        const response = await equipmentAPI.createEquipment(data);
        if (response.success) {
          toast.success("Vehicle created successfully");
          fetchEquipment();
          resetForm();
        } else {
          toast.error(response.error || "Failed to create equipment");
        }
      }
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to save equipment");
    }
  };

  // Handle delete equipment
  const handleDeleteEquipment = async () => {
    if (!selectedEquipment) return;

    if (window.confirm("Are you sure you want to delete this equipment?")) {
      try {
        const response = await equipmentAPI.deleteEquipment(selectedEquipment.EQUIPMENT_ID);
        if (response.success) {
          toast.success("Vehicle deleted successfully");
          fetchEquipment();
          resetForm();
        } else {
          toast.error(response.error || "Failed to delete equipment");
        }
      } catch (error) {
        console.error("Error deleting equipment:", error);
        toast.error(error.response?.data?.error || error.message || "Failed to delete equipment");
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedEquipment(null);
    setIsEditing(false);
    setFormData({
      TERMINAL_ID: "",
      EQUIPMENT_NO: "",
      EQUIPMENT_TYPE: "",
      PURCHAGE_DATE: "",
      INSURANCE_NO: "",
      ENG_NO: "",
      ENG_TYPE: "",
      VIN_NO: "",
      MANUFACTURING_YEAR: "",
      MODEL: "",
      CONDITION: "N",
      TARE_WT: "",
      GROSS_WT: "",
      STATUS: "A",
      BED_CHANGEABLE: "N",
      IMAGE: "",
      REGISTRATION_DATE: "",
      MANUFACTURER: "",
      INS_VENDOR: "",
      INS_VALIDITY: "",
      PERMIT_FROM: "",
      PERMIT_TO: "",
      POLLUTION_VALIDITY: "",
      RTO: "",
      FITNESS_DOC: "",
      VALIDITY: "",
      RC_DOC: "",
      INSURANCE_DOC: "",
      PERMIT_A: "",
      PERMIT_B: "",
      XL_TYPE: "",
      COMPANY_ID: "",
      DRIVER_ATTACH_ID: "",
      DRIVER_ATTCAH_STATUS: "",
      STATE_PERMIT_FROM: "",
      STATE_PERMIT_TO: "",
      ROAD_TAX_VALIDITY: "",
      REMARK_NOTE: "",
      VENDER_ID: ""
    });
  };

  // Get vendor name by ID
  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v.VENDOR_ID === vendorId);
    return vendor ? vendor.VENDOR_NAME : 'Unknown Vendor';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Vehicle Master</h1>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Equipment List */}
        <div className="order-2 lg:order-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-gray-200 sticky top-0 z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Vehicle List</h2>
                <p className="text-sm text-slate-500">Select a vehicle to view details.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {equipment.length} total
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Vehicle
                </button>
              </div>
            </div>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto p-3 space-y-2 bg-slate-50/40">
            {loading ? (
              <div className="p-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : equipment.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No vehicles found</div>
            ) : (
              equipment.map((equip) => (
                <div 
                  key={equip.EQUIPMENT_ID} 
                  className={`group rounded-2xl border p-4 cursor-pointer transition ${
                    selectedEquipment?.EQUIPMENT_ID === equip.EQUIPMENT_ID
                      ? "bg-white border-blue-200 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }`}
                  onClick={() => handleSelectEquipment(equip)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-slate-900 truncate">
                        {equip.EQUIPMENT_NO || "N/A"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        <span className="font-bold">Type:</span> {equip.EQUIPMENT_TYPE || "N/A"}{" "}
                        <span className="text-slate-300">|</span>{" "}
                        <span className="font-bold">Model:</span> {equip.MODEL || "N/A"}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black tracking-wide ${
                        equip.STATUS === "A"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {equip.STATUS === "A" ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Equipment Form */}
        <div className="order-1 lg:order-1 bg-white rounded-lg shadow">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
                  {isEditing ? (selectedEquipment ? "Edit Vehicle" : "Add New Vehicle") : "Vehicle Details"}
            </h2>
            {selectedEquipment && !isEditing && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="py-1 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                >
                  Edit
                </button>
                <button 
                  onClick={handleDeleteEquipment}
                  className="py-1 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {!selectedEquipment && !isEditing ? (
              <div className="text-center text-gray-500 py-12">
                <p>Select a vehicle from the list or add a new one</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} onBlurCapture={handleFieldBlur} className="space-y-6">
                {/* Basic Information */}
	                <div className="pt-4">
	                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Basic Information</h3>
	                  
	                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
	                    <input type="hidden" name="TERMINAL_ID" value={formData.TERMINAL_ID} />
	                    
	                    <div>
	                      <label className="block text-sm font-medium text-gray-700">Vehicle No*</label>
                      <input
                        type="text"
                        name="EQUIPMENT_NO"
                        value={formData.EQUIPMENT_NO}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        placeholder="AA00AA0000"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.EQUIPMENT_NO ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.EQUIPMENT_NO && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.EQUIPMENT_NO}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                      <select
                        name="EQUIPMENT_TYPE"
                        value={formData.EQUIPMENT_TYPE}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Type</option>
                        <option value="TRAILER 20">Trailer 20</option>
                        <option value="TRAILER 40">Trailer 40</option>
                        <option value="TRUCK">Truck</option>
                        <option value="DUMPER">Dumper</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                      <input
                        type="date"
                        name="PURCHAGE_DATE"
                        value={formData.PURCHAGE_DATE}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                      <input
                        type="date"
                        name="REGISTRATION_DATE"
                        value={formData.REGISTRATION_DATE}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                      <input
                        type="text"
                        name="MANUFACTURER"
                        value={formData.MANUFACTURER}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g., ASHOK LEYLAND"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Model</label>
                      <input
                        type="text"
                        name="MODEL"
                        value={formData.MODEL}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g., 4019"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manufacturing Year</label>
                      <input
                        type="number"
                        name="MANUFACTURING_YEAR"
                        value={formData.MANUFACTURING_YEAR}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g., 2019"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.MANUFACTURING_YEAR ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.MANUFACTURING_YEAR && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.MANUFACTURING_YEAR}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vendor</label>
                      <select
                        name="VENDER_ID"
                        value={formData.VENDER_ID}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.VENDOR_ID} value={vendor.VENDOR_ID}>
                            {vendor.VENDOR_NAME}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Engine Information */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Engine Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Engine Number</label>
                      <input
                        type="text"
                        name="ENG_NO"
                        value={formData.ENG_NO}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g., CNPZ113267"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Engine Type</label>
                      <select
                        name="ENG_TYPE"
                        value={formData.ENG_TYPE}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Engine Type</option>
                        <option value="DIESEL">Diesel</option>
                        <option value="PETROL">Petrol</option>
                        <option value="CNG">CNG</option>
                        <option value="EV">EV</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">VIN Number</label>
                      <input
                        type="text"
                        name="VIN_NO"
                        value={formData.VIN_NO}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="17 chars, e.g., MB1TRDWB2CPNC1234"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.VIN_NO ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.VIN_NO && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.VIN_NO}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bed Changeable</label>
                      <select
                        name="BED_CHANGEABLE"
                        value={formData.BED_CHANGEABLE}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">XL Type</label>
                      <input
                        type="text"
                        name="XL_TYPE"
                        value={formData.XL_TYPE}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Weight Information */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Weight Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tare Weight</label>
                      <input
                        type="number"
                        name="TARE_WT"
                        value={formData.TARE_WT}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gross Weight</label>
                      <input
                        type="number"
                        name="GROSS_WT"
                        value={formData.GROSS_WT}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Insurance & Permit Information */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Insurance & Permit Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Insurance Number</label>
                      <input
                        type="text"
                        name="INSURANCE_NO"
                        value={formData.INSURANCE_NO}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g., 0126616965"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.INSURANCE_NO ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.INSURANCE_NO && (
                        <p className="mt-1 text-xs text-red-600">{fieldErrors.INSURANCE_NO}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Insurance Vendor</label>
                      <input
                        type="text"
                        name="INS_VENDOR"
                        value={formData.INS_VENDOR}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g., ICICI LOMBARD"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Insurance Validity</label>
                      <input
                        type="date"
                        name="INS_VALIDITY"
                        value={formData.INS_VALIDITY}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Permit From</label>
                      <input
                        type="date"
                        name="PERMIT_FROM"
                        value={formData.PERMIT_FROM}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Permit To</label>
                      <input
                        type="date"
                        name="PERMIT_TO"
                        value={formData.PERMIT_TO}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State Permit From</label>
                      <input
                        type="date"
                        name="STATE_PERMIT_FROM"
                        value={formData.STATE_PERMIT_FROM}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State Permit To</label>
                      <input
                        type="date"
                        name="STATE_PERMIT_TO"
                        value={formData.STATE_PERMIT_TO}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pollution Validity</label>
                      <input
                        type="date"
                        name="POLLUTION_VALIDITY"
                        value={formData.POLLUTION_VALIDITY}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Road Tax Validity</label>
                      <input
                        type="date"
                        name="ROAD_TAX_VALIDITY"
                        value={formData.ROAD_TAX_VALIDITY}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Documents & Status */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Documents & Status</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">RTO</label>
                      <input
                        type="text"
                        name="RTO"
                        value={formData.RTO}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g., KANPUR"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fitness Document</label>
                      <input
                        type="file"
                        name="FITNESS_DOC"
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Validity</label>
                      <input
                        type="date"
                        name="VALIDITY"
                        value={formData.VALIDITY}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">RC Document</label>
                      <input
                        type="file"
                        name="RC_DOC"
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Insurance Document</label>
                      <input
                        type="file"
                        name="INSURANCE_DOC"
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Permit A</label>
                      <input
                        type="file"
                        name="PERMIT_A"
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Permit B</label>
                      <input
                        type="file"
                        name="PERMIT_B"
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Condition</label>
                      <select
                        name="CONDITION"
                        value={formData.CONDITION}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="N">New</option>
                        <option value="U">Used</option>
                        <option value="R">Refurbished</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="STATUS"
                        value={formData.STATUS}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="A">Active</option>
                        <option value="I">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Driver Attachment */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Driver Attachment</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Driver Attach ID</label>
                      <input
                        type="number"
                        name="DRIVER_ATTACH_ID"
                        value={formData.DRIVER_ATTACH_ID}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Driver Attach Status</label>
                      <select
                        name="DRIVER_ATTCAH_STATUS"
                        value={formData.DRIVER_ATTCAH_STATUS}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Status</option>
                        <option value="ATTACHED">Attached</option>
                        <option value="DETACHED">Detached</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Other Information */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Other Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company ID</label>
                      <input
                        type="number"
                        name="COMPANY_ID"
                        value={formData.COMPANY_ID}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Image</label>
                      <input
                        type="file"
                        name="IMAGE"
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Remarks</label>
                      <textarea
                        name="REMARK_NOTE"
                        value={formData.REMARK_NOTE}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows="3"
                        placeholder="e.g., Periodic service completed"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {selectedEquipment ? 'Update Vehicle' : 'Create Vehicle'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetails;
