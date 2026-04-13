import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { driverAPI, vendorAPI } from "../utils/Api";

// Modal Checklist Component
const ModalChecklist = ({ isOpen, onClose, onVerify }) => {
  const [checkedItems, setCheckedItems] = useState({});

  const checklistItems = [
    "CABIN ROOF",
    "CABIN INDICATOR",
    "PANEL LIGHT",
    "PANEL DISPLAY",
    "PANEL LOCK",
    "PANEL TOP GLASS",
    "GEAR LOCK",
    "DIESEL TANK KEY",
    "DIESEL TANK",
    "SEAT BELT LHS",
    "SEAT BELT RHS",
    "DRIVER SEAT",
    "CONDUCTOR SEAT",
    "FRONT BUMPER OK/NOT OK",
    "DASH BOARD ADDITIONAL SPOT",
    "NUMBER PLATE",
    "NUMBER PLATE LIGHT",
    "NUMBER PLATE BULB",
    "TROLLEY AIR PRESSURE TANK",
    "HYDROLIC JACK",
    "HYDROLIC JACK SHOE",
    "TROLLEY INSIDE LINER SHOE",
    "PM IN TROLLEY (YES/NO)",
    "TROLLEY TOOL BOX (TOOL)",
    "TROLLEY BACK (KHALA)",
    "TROLLEY SIDE SIDE RAIL",
    "TROLLEY LHS SIDE WALL",
    "TROLLEY RHS SIDE WALL",
    "SIDE END PLATE",
    "HYDROLIC JACK DECK",
    "BACK FOOT",
    "SPARETY INSIDE GRACK",
    "TROLLEY INSIDE BODY",
    "TROLLEY FLOOR FOAM",
    "TROLLEY DOOR",
    "TROLLEY SIDE BOX INSIDE",
    "TROLLEY SMALL WINDOW TOP SLIDING OK/NOT OK",
    "TROLLEY SMALL WINDOW BOTTOM ZND",
    "TROLLEY REMOTE",
    "TRAILER FLOOR",
    "TROLLEY CONTROL BOX ZINK/NOT OK",
    "UPPER JACK ZINK/GLADER",
    "TROLLEY MUDGUARD LHS",
    "TROLLEY MUDGUARD RHS",
    "TROLLEY INSIDE LINER OK/NOT OK",
    "HORSE FRONT LHS TYRE NO",
    "HORSE FRONT RHS TYRE NO",
    "HORSE REAR LHS TYRE NO",
    "HORSE REAR RHS TYRE NO",
    "TROLLY FRONT LHS TYRE NO",
    "TROLLY FRONT RHS TYRE NO",
    "TROLLY REAR LHS TYRE NO",
    "TROLLY REAR RHS TYRE NO",
    "STEPANY NO",
    "CABIN FLOOR",
    "CABIN SIDE MIRROR",
    "CABIN MIDDLE MIRROR ON TOP",
    "CABIN INSIDE MIRROR",
    "CABIN INSIDE MIRROR GLASS",
    "CABIN WASHSHIELD",
    "CABIN RHS WINDOW",
    "CABIN LHS WINDOW",
    "CABIN FOOTSTEP RHS",
    "CABIN FOOTSTEP LHS",
    "CABIN DOOR LHS HANDLE",
    "CABIN DOOR RHS HANDLE",
    "CABIN DOOR GLASS HANDLE",
    "CABIN DOOR GLASS WORKING/NOT WORKING",
    "FIRE SYLINDER",
    "PARKING LIGHT FRONT",
    "CABIN DOOR LOCK",
    "BATTERY BOX",
    "STEEL FRAME",
    "SANDWICH",
    "HORSE BACK",
    "HORSE LHS",
    "HORSE RHS",
    "HORSE MACHINE",
    "UPS",
    "LHS WIPER",
    "RHS WIPER",
    "NOX SENSOR",
    "DIFUSER MACHINE",
    "UREA NOZZLE",
    "UREA SENSOR WITH COVER",
    "BONNET SEAT",
    "NUMBER OF JACK",
    "CHASIS/KM READING/ENGINE REG NUMBER",
    "CARRIER DESCRIPTION WHILE TAKING HANDOVER FROM OEM",
  ];

  const handleItemCheck = (index) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleVerify = () => {
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    if (checkedCount === 0) {
      toast.warning("Please check at least one item before proceeding");
      return;
    }
    onVerify(checkedItems);
  };

  const handleClose = () => {
    setCheckedItems({});
    onClose();
  };

  return isOpen ? (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          width: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "10px",
          boxShadow: "0 0 15px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, color: "#2c3e50" }}>
            Vehicle Inspection Checklist
          </h2>
          <button
            onClick={handleClose}
            style={{
              padding: "6px 12px",
              backgroundColor: "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            border: "1px solid #dee2e6",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", color: "#6c757d" }}>
            Please verify the vehicle inspection checklist before saving driver
            details. Check all applicable items and click "Verify and Proceed"
            to continue.
          </p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "12px",
              color: "#28a745",
              fontWeight: "bold",
            }}
          >
            Checked Items: {Object.values(checkedItems).filter(Boolean).length}{" "}
            / {checklistItems.length}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {checklistItems.map((item, index) => (
            <label
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                background: checkedItems[index] ? "#e8f5e8" : "#f9f9f9",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="checkbox"
                checked={checkedItems[index] || false}
                onChange={() => handleItemCheck(index)}
                style={{ marginRight: "10px", transform: "scale(1.1)" }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: checkedItems[index] ? "500" : "normal",
                }}
              >
                {item}
              </span>
            </label>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            borderTop: "1px solid #dee2e6",
            paddingTop: "20px",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Verify and Proceed (
            {Object.values(checkedItems).filter(Boolean).length} items checked)
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

// Main Driver Details Component
const DriverDetails = () => {
  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'create' or 'update'
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    vendor_id: "",
    terminal_id: "",
    driver_name: "",
    address: "",
    vehicle_id: "",
    vehicle_no: "",
    contact_no: "",
    mobile_no: "",
    email_id: "",
    blood_group: "",
    joining_date: "",
    dl_no: "",
    dl_renewable_date: "",
    salary: "",
    active_flage: "Y",
    image: "",
    bal_amt: "",
    trip_bal: "",
    close_status: "",
    jo_close_status: "",
    gaurantor: "",
    driver_code: "",
    father_name: "",
    attach_status: "",
    dl_doc: "",
    address_doc: "",
    emerg_phone: "",
    phone_no: "",
  });

  // Fetch all drivers
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await driverAPI.getAllDrivers();
      if (response.success) {
        setDrivers(response.data);
      } else {
        toast.error("Failed to fetch drivers");
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast.error(error.message || "Failed to fetch drivers");
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

  // Fetch drivers and vendors on component mount
  useEffect(() => {
    fetchDrivers();
    fetchVendors();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "email_id") {
      nextValue = value.toLowerCase();
    } else if (["vehicle_no"].includes(name)) {
      nextValue = value.replace(/[\s-]/g, "").toUpperCase();
    } else if (["dl_no"].includes(name)) {
      nextValue = value.replace(/[\s/-]/g, "").toUpperCase();
    } else if (
      ["contact_no", "mobile_no", "phone_no", "emerg_phone"].includes(name)
    ) {
      const digits = value.replace(/\D/g, "");
      nextValue =
        digits.startsWith("91") && digits.length > 10
          ? digits.slice(2, 12)
          : digits.slice(0, 10);
    }

    setFormData({
      ...formData,
      [name]: nextValue,
    });
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getDriverFieldError = (name, value) => {
    if (!value) return "";
    const validators = {
      email_id: () =>
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
          ? ""
          : "Enter valid email (e.g., driver@company.com)",
      vehicle_no: () =>
        /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/.test(value)
          ? ""
          : "Use valid vehicle no (e.g., UP78CN6949)",
      dl_no: () =>
        /^[A-Z]{2}[0-9]{2}[0-9A-Z]{7,15}$/.test(value)
          ? ""
          : "Use valid DL no (e.g., UP3220190012345)",
      mobile_no: () => (/^[6-9]\d{9}$/.test(value) ? "" : "Enter valid 10-digit mobile"),
      contact_no: () => (/^\d{10}$/.test(value) ? "" : "Enter 10-digit contact no"),
      phone_no: () => (/^\d{10}$/.test(value) ? "" : "Enter 10-digit phone no"),
      emerg_phone: () => (/^\d{10}$/.test(value) ? "" : "Enter 10-digit emergency no"),
    };
    return validators[name] ? validators[name]() : "";
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (!name) return;
    const message = getDriverFieldError(name, value);
    e.target.setCustomValidity(message);
    if (message) {
      e.target.reportValidity();
      setFieldErrors((prev) => ({ ...prev, [name]: message }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle driver selection
  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setFormData({
      vendor_id: driver.VENDOR_ID || "",
      terminal_id: driver.TERMINAL_ID || "",
      driver_name: driver.DRIVER_NAME || "",
      address: driver.ADDRESS || "",
      vehicle_id: driver.VEHICLE_ID || "",
      vehicle_no: driver.VEHICLE_NO || "",
      contact_no: driver.CONTACT_NO || "",
      mobile_no: driver.MOBILE_NO || "",
      email_id: driver.EMAIL_ID || "",
      blood_group: driver.BLOOD_GROUP || "",
      joining_date: driver.JOINING_DATE
        ? new Date(driver.JOINING_DATE).toISOString().split("T")[0]
        : "",
      dl_no: driver.DL_NO || "",
      dl_renewable_date: driver.DL_RENEWABLE_DATE
        ? new Date(driver.DL_RENEWABLE_DATE).toISOString().split("T")[0]
        : "",
      salary: driver.SALARY || "",
      active_flage: driver.ACTIVE_FLAGE || "Y",
      image: driver.IMAGE || "",
      bal_amt: driver.BAL_AMT || "",
      trip_bal: driver.TRIP_BAL || "",
      close_status: driver.CLOSE_STATUS || "",
      jo_close_status: driver.JO_CLOSE_STATUS || "",
      gaurantor: driver.GAURANTOR || "",
      driver_code: driver.DRIVER_CODE || "",
      father_name: driver.FATHER_NAME || "",
      attach_status: driver.ATTACH_STATUS || "",
      dl_doc: driver.DL_DOC || "",
      address_doc: driver.ADDRESS_DOC || "",
      emerg_phone: driver.EMERG_PHONE || "",
      phone_no: driver.PHONE_NO || "",
    });
    setIsEditing(false);
  };

  // Handle form submission - now opens modal first
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.vendor_id) {
      toast.error("Please select a vendor");
      return;
    }

    if (!formData.driver_name.trim()) {
      toast.error("Driver name is required");
      return;
    }

    const keys = [
      "email_id",
      "vehicle_no",
      "dl_no",
      "mobile_no",
      "contact_no",
      "phone_no",
      "emerg_phone",
    ];
    const nextErrors = {};
    keys.forEach((key) => {
      const msg = getDriverFieldError(key, formData[key]);
      if (msg) nextErrors[key] = msg;
    });
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
      toast.error("Please fix highlighted driver fields");
      return;
    }

    // Store form data and action type, then show modal
    setPendingFormData({ ...formData });
    setPendingAction(isEditing && selectedDriver ? "update" : "create");
    setShowModal(true);
  };

  // Handle modal verification - this is where the actual save happens
  const handleModalVerify = async (checkedItems) => {
    setShowModal(false);

    if (!pendingFormData || !pendingAction) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    try {
      let response;

      if (pendingAction === "update" && selectedDriver) {
        // Update existing driver
        response = await driverAPI.updateDriver(
          selectedDriver.DRIVER_ID,
          pendingFormData
        );
        if (response.success) {
          toast.success(
            "Driver updated successfully after inspection verification"
          );
          fetchDrivers();
          setIsEditing(false);
        } else {
          toast.error(response.error || "Failed to update driver");
        }
      } else {
        // Create new driver
        response = await driverAPI.createDriver(pendingFormData);
        if (response.success) {
          toast.success(
            "Driver created successfully after inspection verification"
          );
          fetchDrivers();
          resetForm();
        } else {
          toast.error(response.error || "Failed to create driver");
        }
      }

      // Log inspection data (you can save this to database if needed)
      console.log("Inspection checklist data:", {
        driverId: response.data?.DRIVER_ID || "new",
        checkedItems: checkedItems,
        timestamp: new Date().toISOString(),
        action: pendingAction,
      });
    } catch (error) {
      console.error("Error saving driver:", error);
      toast.error(
        error.response?.data?.error || error.message || "Failed to save driver"
      );
    } finally {
      // Clear pending data
      setPendingFormData(null);
      setPendingAction(null);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setPendingFormData(null);
    setPendingAction(null);
  };

  // Handle delete driver
  const handleDeleteDriver = async () => {
    if (!selectedDriver) return;

    if (window.confirm("Are you sure you want to delete this driver?")) {
      try {
        const response = await driverAPI.deleteDriver(selectedDriver.DRIVER_ID);
        if (response.success) {
          toast.success("Driver deleted successfully");
          fetchDrivers();
          resetForm();
        } else {
          toast.error(response.error || "Failed to delete driver");
        }
      } catch (error) {
        console.error("Error deleting driver:", error);
        toast.error(
          error.response?.data?.error ||
          error.message ||
          "Failed to delete driver"
        );
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedDriver(null);
    setIsEditing(false);
    setFormData({
      vendor_id: "",
      terminal_id: "",
      driver_name: "",
      address: "",
      vehicle_id: "",
      vehicle_no: "",
      contact_no: "",
      mobile_no: "",
      email_id: "",
      blood_group: "",
      joining_date: "",
      dl_no: "",
      dl_renewable_date: "",
      salary: "",
      active_flage: "Y",
      image: "",
      bal_amt: "",
      trip_bal: "",
      close_status: "",
      jo_close_status: "",
      gaurantor: "",
      driver_code: "",
      father_name: "",
      attach_status: "",
      dl_doc: "",
      address_doc: "",
      emerg_phone: "",
      phone_no: "",
    });
  };

  // Get vendor name by ID
  const getVendorName = (vendorId) => {
    const vendor = vendors.find((v) => v.VENDOR_ID === vendorId);
    return vendor ? vendor.VENDOR_NAME : "Unknown Vendor";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Driver Master</h1>

      {/* Modal Checklist */}
      <ModalChecklist
        isOpen={showModal}
        onClose={handleModalClose}
        onVerify={handleModalVerify}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Driver List */}
        <div className="order-2 lg:order-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-medium text-gray-900">Driver List</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Select a driver to view or update details.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
              }}
              className="shrink-0 inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="button"
            >
              Add Driver
            </button>
          </div>

          <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No drivers found
              </div>
            ) : (
              drivers.map((driver) => (
                <div
                  key={driver.DRIVER_ID}
                  className={`mb-3 cursor-pointer rounded-xl border p-4 transition ${
                    selectedDriver?.DRIVER_ID === driver.DRIVER_ID
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectDriver(driver)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {driver.DRIVER_NAME}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 truncate">
                        Code: {driver.DRIVER_CODE || "N/A"}
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-100">
                      #{driver.DRIVER_ID}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <div>Vehicle: {driver.VEHICLE_NO || "N/A"}</div>
                    <div className="mt-1 text-blue-700">
                      Vendor: {driver.VENDOR_NAME || getVendorName(driver.VENDOR_ID)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Driver Form */}
        <div className="order-1 lg:order-1 bg-white rounded-lg shadow">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing
                ? selectedDriver
                  ? "Edit Driver"
                  : "Add New Driver"
                : "Driver Details"}
            </h2>
            {selectedDriver && !isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="py-1 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteDriver}
                  className="py-1 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {!selectedDriver && !isEditing ? (
              <div className="text-center text-gray-500 py-12">
                <p>Select a driver from the list or add a new one</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} onBlurCapture={handleFieldBlur} className="space-y-6">
                {/* Alert about inspection requirement */}
                {isEditing && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Vehicle Inspection Required:</strong> Before
                          saving driver details, you'll need to complete the
                          vehicle inspection checklist.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900 border-b pb-2">
                      Basic Information
                    </h3>

                    {/* Vendor Selection - Required Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Vendor*
                      </label>
                      <select
                        name="vendor_id"
                        value={formData.vendor_id}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map((vendor) => (
                          <option
                            key={vendor.VENDOR_ID}
                            value={vendor.VENDOR_ID}
                          >
                            {vendor.VENDOR_NAME} ({vendor.VENDOR_CODE})
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="hidden"
                      name="terminal_id"
                      value={formData.terminal_id}
                      onChange={handleInputChange}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Driver Code
                      </label>
                      <input
                        type="text"
                        name="driver_code"
                        value={formData.driver_code}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Driver Name*
                      </label>
                      <input
                        type="text"
                        name="driver_name"
                        value={formData.driver_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        placeholder="DRIVER NAME"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Father's Name
                      </label>
                      <input
                        type="text"
                        name="father_name"
                        value={formData.father_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Blood Group
                        </label>
                        <input
                          type="text"
                          name="blood_group"
                          value={formData.blood_group}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="A+ / B+ / O+"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Joining Date
                        </label>
                        <input
                          type="date"
                          name="joining_date"
                          value={formData.joining_date}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900 border-b pb-2">
                      Contact Information
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email ID
                      </label>
                      <input
                        type="email"
                        name="email_id"
                        value={formData.email_id}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="name@domain.com"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.email_id ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.email_id && <p className="mt-1 text-xs text-red-600">{fieldErrors.email_id}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        name="contact_no"
                        value={formData.contact_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="##########"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.contact_no ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.contact_no && <p className="mt-1 text-xs text-red-600">{fieldErrors.contact_no}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        name="mobile_no"
                        value={formData.mobile_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="##########"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.mobile_no ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.mobile_no && <p className="mt-1 text-xs text-red-600">{fieldErrors.mobile_no}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phone_no"
                        value={formData.phone_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="##########"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.phone_no ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.phone_no && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone_no}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Emergency Phone
                      </label>
                      <input
                        type="text"
                        name="emerg_phone"
                        value={formData.emerg_phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="##########"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.emerg_phone ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.emerg_phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.emerg_phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Vehicle & License Information */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">
                    Vehicle & License Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Vehicle ID
                      </label>
                      <input
                        type="number"
                        name="vehicle_id"
                        value={formData.vehicle_id}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        name="vehicle_no"
                        value={formData.vehicle_no}
                        onChange={handleInputChange}
                        onBlur={handleFieldBlur}
                        disabled={!isEditing}
                        placeholder="AA00AA0000"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.vehicle_no ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.vehicle_no && <p className="mt-1 text-xs text-red-600">{fieldErrors.vehicle_no}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        DL Number
                      </label>
                      <input
                        type="text"
                        name="dl_no"
                        value={formData.dl_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="AA00###########"
                        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 font-mono ${fieldErrors.dl_no ? "border-red-400" : "border-gray-300"}`}
                      />
                      {fieldErrors.dl_no && <p className="mt-1 text-xs text-red-600">{fieldErrors.dl_no}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        DL Renewal Date
                      </label>
                      <input
                        type="date"
                        name="dl_renewable_date"
                        value={formData.dl_renewable_date}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        DL Document
                      </label>
                      <input
                        type="text"
                        name="dl_doc"
                        value={formData.dl_doc}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Document path/URL"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Address Document
                      </label>
                      <input
                        type="text"
                        name="address_doc"
                        value={formData.address_doc}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Document path/URL"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="pt-4">
                  <h3 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">
                    Financial Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Salary
                      </label>
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Balance Amount
                      </label>
                      <input
                        type="text"
                        name="bal_amt"
                        value={formData.bal_amt}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trip Balance
                      </label>
                      <input
                        type="number"
                        name="trip_bal"
                        value={formData.trip_bal}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Guarantor
                      </label>
                      <input
                        type="text"
                        name="gaurantor"
                        value={formData.gaurantor}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Active Status
                      </label>
                      <select
                        name="active_flage"
                        value={formData.active_flage}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="Y">Active</option>
                        <option value="N">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Attachment Status
                      </label>
                      <input
                        type="text"
                        name="attach_status"
                        value={formData.attach_status}
                        onChange={handleInputChange}
                        disabled={!isEditing}
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
                      {selectedDriver
                        ? "Complete Inspection & Update Driver"
                        : "Complete Inspection & Create Driver"}
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

export default DriverDetails;
