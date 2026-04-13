import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { jobOrderAPI, equipmentAPI, bedAPI, driverAPI } from "../utils/Api";

const JobOrder = () => {
  const [orders, setOrders] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [beds, setBeds] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    jo_no: "",
    jo_date: "",
    jo_type: "",
    jo_for: "VEHICLE",
    jo_validity: "",
    equipment_id: "",
    bed_id: "",
    vehicle_no: "",
    driver_id: "",
    driver_name: "",
    driver_contact_no: "",
    workshop_location: "",
    survey_by: "",
    license_validity: "",
    vehicle_type: "",
    previous_balance: "",
    remarks: "",
    advance_cash: "",
    advance_oil: "",
    status: "OPEN",
  });

  const loadDropdowns = async () => {
    try {
      const [equipRes, bedRes, driverRes] = await Promise.all([
        equipmentAPI.getAllEquipment(),
        bedAPI.getAllBeds(),
        driverAPI.getAllDrivers(),
      ]);
      if (equipRes.success) setEquipment(equipRes.data || []);
      if (bedRes.success) setBeds(bedRes.data || []);
      if (driverRes.success) setDrivers(driverRes.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load dropdowns");
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await jobOrderAPI.getAll();
      if (response.success) setOrders(response.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch job orders");
    }
  };

  useEffect(() => {
    loadDropdowns();
    fetchOrders();
  }, []);

  const resetForm = () => {
    setSelectedOrder(null);
    setIsEditing(false);
    setFormData({
      jo_no: "",
      jo_date: "",
      jo_type: "",
      jo_for: "VEHICLE",
      jo_validity: "",
      equipment_id: "",
      bed_id: "",
      vehicle_no: "",
      driver_id: "",
      driver_name: "",
      driver_contact_no: "",
      workshop_location: "",
      survey_by: "",
      license_validity: "",
      vehicle_type: "",
      previous_balance: "",
      remarks: "",
      advance_cash: "",
      advance_oil: "",
      status: "OPEN",
    });
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setFormData({
      jo_no: order.JO_NO || "",
      jo_date: order.JO_DATE ? new Date(order.JO_DATE).toISOString().split("T")[0] : "",
      jo_type: order.JO_TYPE || "",
      jo_for: order.JO_FOR || "VEHICLE",
      jo_validity: order.JO_VALIDITY
        ? new Date(order.JO_VALIDITY).toISOString().split("T")[0]
        : "",
      equipment_id: order.EQUIPMENT_ID || "",
      bed_id: order.BED_ID || "",
      vehicle_no: order.VEHICLE_NO || "",
      driver_id: order.DRIVER_ID || "",
      driver_name: order.DRIVER_NAME || "",
      driver_contact_no: order.DRIVER_CONTACT_NO || "",
      workshop_location: order.WORKSHOP_LOCATION || "",
      survey_by: order.SURVEY_BY || "",
      license_validity: order.LICENSE_VALIDITY
        ? new Date(order.LICENSE_VALIDITY).toISOString().split("T")[0]
        : "",
      vehicle_type: order.VEHICLE_TYPE || "",
      previous_balance: order.PREVIOUS_BALANCE || "",
      remarks: order.REMARKS || "",
      advance_cash: order.ADVANCE_CASH || "",
      advance_oil: order.ADVANCE_OIL || "",
      status: order.STATUS || "OPEN",
    });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDriverChange = (e) => {
    const driverId = e.target.value;
    const driver = drivers.find((d) => String(d.DRIVER_ID) === String(driverId));
    setFormData((prev) => ({
      ...prev,
      driver_id: driverId,
      driver_name: driver?.DRIVER_NAME || "",
      driver_contact_no: driver?.CONTACT_NO || driver?.MOBILE_NO || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jo_type) {
      toast.error("JO type is required");
      return;
    }
    try {
      if (isEditing && selectedOrder) {
        const response = await jobOrderAPI.update(
          selectedOrder.JO_ID,
          formData
        );
        if (response.success) {
          toast.success("Job order updated");
          fetchOrders();
          setIsEditing(false);
        } else {
          toast.error(response.error || "Failed to update job order");
        }
      } else {
        const response = await jobOrderAPI.create(formData);
        if (response.success) {
          toast.success("Job order created");
          fetchOrders();
          resetForm();
        } else {
          toast.error(response.error || "Failed to create job order");
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to save job order");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Job Order</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 lg:order-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-medium text-gray-900">Job Orders</h2>
              <p className="text-xs text-gray-500 mt-0.5">Open and manage job orders.</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
              }}
              className="shrink-0 inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              type="button"
            >
              Add JO
            </button>
          </div>
          <div className="max-h-[65vh] overflow-y-auto p-4">
            {orders.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No job orders found
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.JO_ID}
                  className={`mb-3 rounded-xl border p-4 cursor-pointer transition ${
                    selectedOrder?.JO_ID === order.JO_ID
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectOrder(order)}
                >
                  <div className="font-semibold text-gray-900 truncate">{order.JO_NO || "JO"}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Type: {order.JO_TYPE || "N/A"}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      (order.STATUS || "OPEN").toUpperCase() === "OPEN"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-slate-50 text-slate-700 ring-slate-100"
                    }`}>
                      {(order.STATUS || "OPEN").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="order-1 lg:order-1 bg-white rounded-lg shadow">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing
                ? selectedOrder
                  ? "Edit Job Order"
                  : "Add Job Order"
                : "Job Order Details"}
            </h2>
          </div>
          <div className="p-6">
            {!selectedOrder && !isEditing ? (
              <div className="text-center text-gray-500 py-12">
                Select a job order from the list or add a new one.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      JO No
                    </label>
                    <input
                      type="text"
                      name="jo_no"
                      value={formData.jo_no}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      JO Date
                    </label>
                    <input
                      type="date"
                      name="jo_date"
                      value={formData.jo_date}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      JO Type *
                    </label>
                    <select
                      name="jo_type"
                      value={formData.jo_type}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select</option>
                      <option value="Breakdown">Breakdown</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Trip">Trip</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      JO For
                    </label>
                    <select
                      name="jo_for"
                      value={formData.jo_for}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="VEHICLE">Vehicle</option>
                      <option value="BED">Bed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vehicle No
                    </label>
                    <select
                      name="equipment_id"
                      value={formData.equipment_id}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select</option>
                      {equipment.map((eq) => (
                        <option key={eq.EQUIPMENT_ID} value={eq.EQUIPMENT_ID}>
                          {eq.EQUIPMENT_NO}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bed No
                    </label>
                    <select
                      name="bed_id"
                      value={formData.bed_id}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select</option>
                      {beds.map((bed) => (
                        <option key={bed.BED_ID} value={bed.BED_ID}>
                          {bed.BED_NO}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Driver
                    </label>
                    <select
                      name="driver_id"
                      value={formData.driver_id}
                      onChange={handleDriverChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select</option>
                      {drivers.map((driver) => (
                        <option key={driver.DRIVER_ID} value={driver.DRIVER_ID}>
                          {driver.DRIVER_NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Driver Contact
                    </label>
                    <input
                      type="text"
                      name="driver_contact_no"
                      value={formData.driver_contact_no}
                      onChange={handleInputChange}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Advance Cash
                    </label>
                    <input
                      type="number"
                      name="advance_cash"
                      value={formData.advance_cash}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Advance Oil
                    </label>
                    <input
                      type="number"
                      name="advance_oil"
                      value={formData.advance_oil}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
                {isEditing && (
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedOrder) {
                          handleSelectOrder(selectedOrder);
                        } else {
                          resetForm();
                        }
                      }}
                      className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {selectedOrder ? "Update Job Order" : "Create Job Order"}
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

export default JobOrder;
