import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { bedAPI } from "../utils/Api";

const BedMaster = () => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    bed_no: "",
    bed_type: "",
    bed_size: "",
    purchase_date: "",
    company_name: "",
    status: "ACTIVE",
    remarks: "",
  });

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const response = await bedAPI.getAllBeds();
      if (response.success) {
        setBeds(response.data || []);
      } else {
        toast.error("Failed to fetch beds");
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch beds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  const resetForm = () => {
    setSelectedBed(null);
    setIsEditing(false);
    setFormData({
      bed_no: "",
      bed_type: "",
      bed_size: "",
      purchase_date: "",
      company_name: "",
      status: "ACTIVE",
      remarks: "",
    });
  };

  const handleSelectBed = (bed) => {
    setSelectedBed(bed);
    setFormData({
      bed_no: bed.BED_NO || "",
      bed_type: bed.BED_TYPE || "",
      bed_size: bed.BED_SIZE || "",
      purchase_date: bed.PURCHASE_DATE
        ? new Date(bed.PURCHASE_DATE).toISOString().split("T")[0]
        : "",
      company_name: bed.COMPANY_NAME || "",
      status: bed.STATUS || "ACTIVE",
      remarks: bed.REMARKS || "",
    });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bed_no.trim()) {
      toast.error("Bed number is required");
      return;
    }
    try {
      if (isEditing && selectedBed) {
        const response = await bedAPI.updateBed(selectedBed.BED_ID, formData);
        if (response.success) {
          toast.success("Bed updated successfully");
          fetchBeds();
          setIsEditing(false);
        } else {
          toast.error(response.error || "Failed to update bed");
        }
      } else {
        const response = await bedAPI.createBed(formData);
        if (response.success) {
          toast.success("Bed created successfully");
          fetchBeds();
          resetForm();
        } else {
          toast.error(response.error || "Failed to create bed");
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to save bed");
    }
  };

  const handleDelete = async () => {
    if (!selectedBed) return;
    if (!window.confirm("Are you sure you want to delete this bed?")) return;
    try {
      const response = await bedAPI.deleteBed(selectedBed.BED_ID);
      if (response.success) {
        toast.success("Bed deleted");
        fetchBeds();
        resetForm();
      } else {
        toast.error(response.error || "Failed to delete bed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete bed");
    }
  };

  const filteredBeds = beds.filter((bed) =>
    (bed.BED_NO || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bed Master</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 lg:order-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-medium text-gray-900">Bed Inventory</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Select a bed to view or edit details.
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
              Add Bed
            </button>
          </div>

          <div className="p-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bed no..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="px-4 pb-4 max-h-[65vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : filteredBeds.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No beds found
              </div>
            ) : (
              filteredBeds.map((bed) => (
                <div
                  key={bed.BED_ID}
                  className={`mb-3 cursor-pointer rounded-xl border p-4 transition ${
                    selectedBed?.BED_ID === bed.BED_ID
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectBed(bed)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {bed.BED_NO || "N/A"}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 truncate">
                        {bed.BED_TYPE ? `Type: ${bed.BED_TYPE}` : "Type: N/A"}{" "}
                        {bed.BED_SIZE ? `| Size: ${bed.BED_SIZE}` : ""}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        (bed.STATUS || "ACTIVE").toUpperCase() === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                          : "bg-slate-50 text-slate-700 ring-slate-100"
                      }`}
                    >
                      {(bed.STATUS || "ACTIVE").toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Company: {bed.COMPANY_NAME || "N/A"}</span>
                    <span className="text-gray-400">ID #{bed.BED_ID}</span>
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
                ? selectedBed
                  ? "Edit Bed"
                  : "Add New Bed"
                : "Bed Details"}
            </h2>
            {selectedBed && !isEditing && (
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
            {!selectedBed && !isEditing ? (
              <div className="text-center text-gray-500 py-12">
                Select a bed from the list or add a new one.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bed No *
                    </label>
                    <input
                      type="text"
                      name="bed_no"
                      value={formData.bed_no}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bed Type
                    </label>
                    <input
                      type="text"
                      name="bed_type"
                      value={formData.bed_type}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bed Size
                    </label>
                    <input
                      type="text"
                      name="bed_size"
                      value={formData.bed_size}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
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
                        if (selectedBed) {
                          handleSelectBed(selectedBed);
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
                      {selectedBed ? "Update Bed" : "Create Bed"}
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

export default BedMaster;
