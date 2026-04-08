import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { tireMasterAPI } from "../utils/Api";

const TIRE_STATUS_OPTIONS = [
  { value: "NW", label: "New" },
  { value: "RN", label: "Running" },
  { value: "SC", label: "Scrap" },
  { value: "RP", label: "Repair" },
];

const MANUFACTURER_OPTIONS = ["CEAT", "MRF", "Apollo", "Bridgestone", "JK"];

const initialFormData = {
  tire_no: "",
  company: "",
  status: "NW",
  purchase_date: "",
  km_run: "",
  warranty_years: "",
  warranty_km: "",
  purchase_with_tax: "",
  purchase_without_tax: "",
  remarks: "",
};

const TireMaster = () => {
  const [tires, setTires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTire, setSelectedTire] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(initialFormData);

  const fetchTires = async () => {
    setLoading(true);
    try {
      const response = await tireMasterAPI.getAllTires();
      if (response.success) {
        setTires(response.data || []);
      } else {
        toast.error("Failed to fetch tyre details");
      }
    } catch (error) {
      toast.error(error.error || error.message || "Failed to fetch tyres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTires();
  }, []);

  const resetForm = () => {
    setSelectedTire(null);
    setIsEditing(false);
    setFormData(initialFormData);
  };

  const handleSelectTire = (tire) => {
    setSelectedTire(tire);
    setIsEditing(false);
    setFormData({
      tire_no: tire.TIRE_NO || "",
      company: tire.COMPANY || "",
      status: tire.STATUS || "NW",
      purchase_date: tire.PURCHASE_DATE
        ? new Date(tire.PURCHASE_DATE).toISOString().split("T")[0]
        : "",
      km_run: tire.KM_RUN || "",
      warranty_years: tire.WARRANTY_YEARS || "",
      warranty_km: tire.WARRANTY_KM || "",
      purchase_with_tax: tire.PURCHASE_WITH_TAX || "",
      purchase_without_tax: tire.PURCHASE_WITHOUT_TAX || "",
      remarks: tire.REMARKS || "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tire_no.trim()) {
      toast.error("Tyre number is required");
      return;
    }

    try {
      if (isEditing && selectedTire) {
        const response = await tireMasterAPI.updateTire(
          selectedTire.TIRE_ID,
          formData
        );
        if (response.success) {
          toast.success("Tyre updated successfully");
          fetchTires();
          setIsEditing(false);
        } else {
          toast.error(response.error || "Failed to update tyre");
        }
      } else {
        const response = await tireMasterAPI.createTire(formData);
        if (response.success) {
          toast.success("Tyre created successfully");
          fetchTires();
          resetForm();
        } else {
          toast.error(response.error || "Failed to create tyre");
        }
      }
    } catch (error) {
      toast.error(error.error || error.message || "Failed to save tyre");
    }
  };

  const handleDelete = async () => {
    if (!selectedTire) return;

    if (!window.confirm("Are you sure you want to delete this tyre?")) {
      return;
    }

    try {
      const response = await tireMasterAPI.deleteTire(selectedTire.TIRE_ID);
      if (response.success) {
        toast.success("Tyre deleted successfully");
        fetchTires();
        resetForm();
      } else {
        toast.error(response.error || "Failed to delete tyre");
      }
    } catch (error) {
      toast.error(error.error || error.message || "Failed to delete tyre");
    }
  };

  const filteredTires = tires.filter((tire) =>
    `${tire.TIRE_NO || ""} ${tire.COMPANY || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (statusCode) => {
    const option = TIRE_STATUS_OPTIONS.find((item) => item.value === statusCode);
    return option ? option.label : statusCode || "N/A";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tyre Master</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Tyre Inventory</h2>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tyre no/company"
              className="mt-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading tyres...</div>
            ) : filteredTires.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No tyres found</div>
            ) : (
              filteredTires.map((tire) => (
                <div
                  key={tire.TIRE_ID}
                  onClick={() => handleSelectTire(tire)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedTire?.TIRE_ID === tire.TIRE_ID ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {tire.TIRE_NO || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {tire.COMPANY || "N/A"}
                  </div>
                  <div className="text-sm text-blue-600">
                    {getStatusLabel(tire.STATUS)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
              }}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add New Tyre
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing
                ? selectedTire
                  ? "Edit Tyre"
                  : "Add New Tyre"
                : "Tyre Details"}
            </h2>
            {selectedTire && !isEditing && (
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
            {!selectedTire && !isEditing ? (
              <div className="text-center text-gray-500 py-12">
                Select a tyre from the list or add a new one
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tyre Number *
                    </label>
                    <input
                      type="text"
                      name="tire_no"
                      value={formData.tire_no}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Manufacturer
                    </label>
                    <select
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    >
                      <option value="">Select Manufacturer</option>
                      {MANUFACTURER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tyre Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    >
                      {TIRE_STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      name="purchase_date"
                      value={formData.purchase_date}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      KM Run
                    </label>
                    <input
                      type="number"
                      name="km_run"
                      value={formData.km_run}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Warranty (Years)
                    </label>
                    <input
                      type="number"
                      name="warranty_years"
                      value={formData.warranty_years}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Warranty (KM)
                    </label>
                    <input
                      type="number"
                      name="warranty_km"
                      value={formData.warranty_km}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Purchase With Tax
                    </label>
                    <input
                      type="number"
                      name="purchase_with_tax"
                      value={formData.purchase_with_tax}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Purchase Without Tax
                    </label>
                    <input
                      type="number"
                      name="purchase_without_tax"
                      value={formData.purchase_without_tax}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Remarks
                    </label>
                    <textarea
                      rows={3}
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedTire) {
                          handleSelectTire(selectedTire);
                        } else {
                          resetForm();
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {selectedTire ? "Update Tyre" : "Create Tyre"}
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

export default TireMaster;
