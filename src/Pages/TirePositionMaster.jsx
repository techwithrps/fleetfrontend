import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { tirePositionAPI } from "../utils/Api";

const POSITION_NAME_OPTIONS = [
  "F1 OUT",
  "LEFT I",
  "LEFT I INNER",
  "LEFT I OUTER",
  "LEFT II",
  "LEFT II INNER",
  "LEFT II OUTER",
  "LEFT III",
  "LEFT III INNER",
  "LEFT III OUTER",
  "LEFT IV INNER",
  "LEFT IV OUTER",
  "LEFT V INNER",
  "LEFT V OUTER",
  "RIGHT I",
];

const TirePositionMaster = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    position_code: "",
    position_name: "",
    position_group: "",
    status: "ACTIVE",
    remarks: "",
  });

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await tirePositionAPI.getAllPositions();
      if (response.success) {
        setPositions(response.data || []);
      } else {
        toast.error("Failed to fetch positions");
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch positions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const resetForm = () => {
    setSelectedPosition(null);
    setIsEditing(false);
    setFormData({
      position_code: "",
      position_name: "",
      position_group: "",
      status: "ACTIVE",
      remarks: "",
    });
  };

  const handleSelectPosition = (position) => {
    setSelectedPosition(position);
    setFormData({
      position_code: position.POSITION_CODE || "",
      position_name: position.POSITION_NAME || "",
      position_group: position.POSITION_GROUP || "",
      status: position.STATUS || "ACTIVE",
      remarks: position.REMARKS || "",
    });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.position_code.trim() || !formData.position_name.trim()) {
      toast.error("Position code and name are required");
      return;
    }
    try {
      if (isEditing && selectedPosition) {
        const response = await tirePositionAPI.updatePosition(
          selectedPosition.POSITION_ID,
          formData
        );
        if (response.success) {
          toast.success("Position updated successfully");
          fetchPositions();
          setIsEditing(false);
        } else {
          toast.error(response.error || "Failed to update position");
        }
      } else {
        const response = await tirePositionAPI.createPosition(formData);
        if (response.success) {
          toast.success("Position created successfully");
          fetchPositions();
          resetForm();
        } else {
          toast.error(response.error || "Failed to create position");
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to save position");
    }
  };

  const handleDelete = async () => {
    if (!selectedPosition) return;
    if (!window.confirm("Are you sure you want to delete this position?")) {
      return;
    }
    try {
      const response = await tirePositionAPI.deletePosition(
        selectedPosition.POSITION_ID
      );
      if (response.success) {
        toast.success("Position deleted");
        fetchPositions();
        resetForm();
      } else {
        toast.error(response.error || "Failed to delete position");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete position");
    }
  };

  const filteredPositions = positions.filter((position) =>
    `${position.POSITION_CODE || ""} ${position.POSITION_NAME || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tyre Position Master</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 lg:order-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-medium text-gray-900">Position List</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Keep position names consistent for reporting.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
              }}
              className="shrink-0 inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              type="button"
            >
              Add Position
            </button>
          </div>

          <div className="p-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code / name..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="px-4 pb-4 max-h-[65vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : filteredPositions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No positions found
              </div>
            ) : (
              filteredPositions.map((position) => (
                <div
                  key={position.POSITION_ID}
                  className={`mb-3 cursor-pointer rounded-xl border p-4 transition ${
                    selectedPosition?.POSITION_ID === position.POSITION_ID
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectPosition(position)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {position.POSITION_CODE || "N/A"}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 truncate">
                        {position.POSITION_NAME || "N/A"}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        (position.STATUS || "ACTIVE").toUpperCase() === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                          : "bg-slate-50 text-slate-700 ring-slate-100"
                      }`}
                    >
                      {(position.STATUS || "ACTIVE").toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">
                      Group: {position.POSITION_GROUP || "N/A"}
                    </span>
                    <span className="text-gray-400">ID #{position.POSITION_ID}</span>
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
                ? selectedPosition
                  ? "Edit Position"
                  : "Add New Position"
                : "Position Details"}
            </h2>
            {selectedPosition && !isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="py-1 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="py-1 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <div className="p-6">
            {!selectedPosition && !isEditing ? (
              <div className="text-center text-gray-500 py-12">
                Select a position from the list or add a new one.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position Code *
                    </label>
                    <input
                      type="text"
                      name="position_code"
                      value={formData.position_code}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position Name *
                    </label>
                    <select
                      name="position_name"
                      value={formData.position_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select position name</option>
                      {POSITION_NAME_OPTIONS.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position Group
                    </label>
                    <input
                      type="text"
                      name="position_group"
                      value={formData.position_group}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
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
                </div>
                {isEditing && (
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPosition) {
                          handleSelectPosition(selectedPosition);
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
                      {selectedPosition ? "Update Position" : "Create Position"}
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

export default TirePositionMaster;
