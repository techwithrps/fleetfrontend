import React, { useState } from "react";
import { servicesAPI } from "../../utils/Api";

const NewServiceModal = ({ isOpen, onClose, onServiceAdded }) => {
  const [formData, setFormData] = useState({
    TERMINAL_ID: 1001,
    SERVICE_ID: 1,
    SERVICE_CODE: "",
    SERVICE_NAME: "",
    SERVICE_TYPE_CODE: "A",
    TAX_GROUP_ID: 10,
    UNIT: "Container",
    MAP_CODE: "MAP-CC-001",
    TAX_ON_PERCENTAGE: 18.0,
    UOM_ID: 5,
    SAP_MAP_CODE: "SAPCC001",
    SERVICE_TYPE: "S",
    SERVICE_GROUP: "G",
    EXEMPTED: "N",
    SERVICE_MAP_CODE: "X",
    CREATED_BY: "admin",
    TPT_MODE: "R",
    LCL_TYPE: "F",
    LCL_PER: 5.5,
    HAZ_PER: 2.5,
    IWB_FLAG: "N",
    SERVICE_GROUP_MAP: "SGM1",
    SERVICE: "Y",
    TALLY_SERVICE_NAME: "Tally Custom Clearance",
    TALLY_SERVICE_AGRO: "Agro Clearance",
    PERIODIC: "N",
    ADD_IMP_SERVICE_TYPE: "I",
    COMPANY_ID: 100,
    RRJ_SERVICE_NAME: "RRJ Clearance",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await servicesAPI.createService(formData);
      await onServiceAdded(); // This will trigger the services refresh
      onClose();
    } catch (error) {
      console.error("Error creating service:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Service</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Service Code *
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={formData.SERVICE_CODE}
                onChange={(e) =>
                  setFormData({ ...formData, SERVICE_CODE: e.target.value })
                }
                placeholder="e.g., CC001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Service Name *
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={formData.SERVICE_NAME}
                onChange={(e) =>
                  setFormData({ ...formData, SERVICE_NAME: e.target.value })
                }
                placeholder="e.g., Other Charges"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.UNIT}
                onChange={(e) =>
                  setFormData({ ...formData, UNIT: e.target.value })
                }
              >
                <option value="Container">Container</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Package">Package</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tax Percentage
              </label>
              <input
                type="number"
                step="0.0001"
                className="w-full border rounded-md p-2"
                value={formData.TAX_ON_PERCENTAGE}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    TAX_ON_PERCENTAGE: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tally Service Name
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={formData.TALLY_SERVICE_NAME}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    TALLY_SERVICE_NAME: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                RRJ Service Name
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={formData.RRJ_SERVICE_NAME}
                onChange={(e) =>
                  setFormData({ ...formData, RRJ_SERVICE_NAME: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Adding Service..." : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewServiceModal;
