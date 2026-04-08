import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { jobOrderAPI, jobOrderCloseAPI } from "../utils/Api";

const JobOrderClose = () => {
  const [openOrders, setOpenOrders] = useState([]);
  const [closes, setCloses] = useState([]);
  const [formData, setFormData] = useState({
    jo_id: "",
    jo_no: "",
    trip_close_date: "",
    total_advance: "",
    balance_advance: "",
    jo_close_amount: "",
    advance_refund: "NO",
    close_remarks: "",
  });

  const loadOrders = async () => {
    try {
      const response = await jobOrderAPI.getAll({ status: "OPEN" });
      if (response.success) {
        setOpenOrders(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load open job orders");
    }
  };

  const loadCloses = async () => {
    try {
      const response = await jobOrderCloseAPI.getAll();
      if (response.success) {
        setCloses(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load job order closes");
    }
  };

  useEffect(() => {
    loadOrders();
    loadCloses();
  }, []);

  const handleOrderSelect = (e) => {
    const joId = e.target.value;
    const order = openOrders.find((o) => String(o.JO_ID) === String(joId));
    setFormData((prev) => ({
      ...prev,
      jo_id: joId,
      jo_no: order?.JO_NO || "",
      total_advance: order
        ? Number(order.ADVANCE_CASH || 0) + Number(order.ADVANCE_OIL || 0)
        : "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jo_id) {
      toast.error("Select a job order");
      return;
    }
    try {
      const response = await jobOrderCloseAPI.create(formData);
      if (response.success) {
        toast.success("Job order closed");
        setFormData({
          jo_id: "",
          jo_no: "",
          trip_close_date: "",
          total_advance: "",
          balance_advance: "",
          jo_close_amount: "",
          advance_refund: "NO",
          close_remarks: "",
        });
        loadOrders();
        loadCloses();
      } else {
        toast.error(response.error || "Failed to close job order");
      }
    } catch (error) {
      toast.error(error.message || "Failed to close job order");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Job Order Close</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              JO No
            </label>
            <select
              value={formData.jo_id}
              onChange={handleOrderSelect}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select JO</option>
              {openOrders.map((order) => (
                <option key={order.JO_ID} value={order.JO_ID}>
                  {order.JO_NO}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Total Advance
            </label>
            <input
              type="number"
              name="total_advance"
              value={formData.total_advance}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Balance Advance
            </label>
            <input
              type="number"
              name="balance_advance"
              value={formData.balance_advance}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              JO Close Amount
            </label>
            <input
              type="number"
              name="jo_close_amount"
              value={formData.jo_close_amount}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Advance Refund
            </label>
            <select
              name="advance_refund"
              value={formData.advance_refund}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trip Close Date
            </label>
            <input
              type="date"
              name="trip_close_date"
              value={formData.trip_close_date}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              name="close_remarks"
              value={formData.close_remarks}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close Job Order
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Closed Job Orders
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {closes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No job order closes found
            </div>
          ) : (
            closes.map((close) => (
              <div key={close.JO_CLOSE_ID} className="p-4">
                <div className="font-medium text-gray-900">
                  JO No: {close.JO_NO || "N/A"}
                </div>
                <div className="text-sm text-gray-500">
                  Trip Close Date:{" "}
                  {close.TRIP_CLOSE_DATE
                    ? new Date(close.TRIP_CLOSE_DATE).toLocaleDateString()
                    : "N/A"}
                </div>
                <div className="text-sm text-gray-500">
                  Total Advance: {close.TOTAL_ADVANCE || 0}
                </div>
                <div className="text-sm text-gray-500">
                  Balance Advance: {close.BALANCE_ADVANCE || 0}
                </div>
                <div className="text-sm text-gray-500">
                  Close Amount: {close.JO_CLOSE_AMOUNT || 0}
                </div>
                <div className="text-sm text-gray-500">
                  Advance Refund: {close.ADVANCE_REFUND || "N/A"}
                </div>
                {close.CLOSE_REMARKS && (
                  <div className="text-sm text-gray-500">
                    Remarks: {close.CLOSE_REMARKS}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JobOrderClose;
