import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { bedAPI, bedAttachmentAPI, equipmentAPI } from "../utils/Api";

const BedAttachment = () => {
  const [equipment, setEquipment] = useState([]);
  const [beds, setBeds] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activeBedIds, setActiveBedIds] = useState(new Set());
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [remarks, setRemarks] = useState("");

  const equipmentMap = equipment.reduce((acc, item) => {
    acc[String(item.EQUIPMENT_ID)] = item;
    return acc;
  }, {});

  const bedMap = beds.reduce((acc, item) => {
    acc[String(item.BED_ID)] = item;
    return acc;
  }, {});

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "N/A";

  const loadActiveBedUsage = async () => {
    try {
      const response = await bedAttachmentAPI.getHistory();
      if (!response.success) return;

      const active = new Set(
        (response.data || [])
          .filter(
            (row) => String(row.ATTACH_STATUS || "").toUpperCase() !== "DETACHED"
          )
          .map((row) => String(row.BED_ID))
      );
      setActiveBedIds(active);
    } catch (error) {
      console.error("Failed to load active bed usage:", error);
    }
  };

  const loadData = async () => {
    try {
      const [equipRes, bedRes] = await Promise.all([
        equipmentAPI.getAllEquipment(),
        bedAPI.getAllBeds(),
      ]);
      if (equipRes.success) {
        const filtered = (equipRes.data || []).filter(
          (eq) => String(eq.BED_CHANGEABLE || "").toUpperCase() === "Y"
        );
        setEquipment(filtered);
      }
      if (bedRes.success) setBeds(bedRes.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load dropdowns");
    }
  };

  const loadAttachments = async (equipmentId) => {
    if (!equipmentId) {
      setAttachments([]);
      return;
    }
    try {
      const response = await bedAttachmentAPI.getHistory({
        equipment_id: equipmentId,
      });
      if (response.success) {
        setAttachments(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch bed attachments");
    }
  };

  useEffect(() => {
    loadData();
    loadActiveBedUsage();
  }, []);

  useEffect(() => {
    loadAttachments(selectedEquipmentId);
  }, [selectedEquipmentId]);

  const handleAttach = async () => {
    if (!selectedEquipmentId || !selectedBedId) {
      toast.error("Select vehicle and bed");
      return;
    }
    try {
      const response = await bedAttachmentAPI.attachBed({
        equipment_id: selectedEquipmentId,
        bed_id: selectedBedId,
        remarks,
      });
      if (response.success) {
        toast.success("Bed attached successfully");
        setSelectedBedId("");
        setRemarks("");
        loadAttachments(selectedEquipmentId);
        loadActiveBedUsage();
      } else {
        toast.error(response.error || "Failed to attach bed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to attach bed");
    }
  };

  const handleDetach = async (attachmentId) => {
    try {
      const response = await bedAttachmentAPI.detachBed(attachmentId, {
        remarks,
      });
      if (response.success) {
        toast.success("Bed detached successfully");
        setRemarks("");
        loadAttachments(selectedEquipmentId);
        loadActiveBedUsage();
      } else {
        toast.error(response.error || "Failed to detach bed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to detach bed");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bed Attach / Detach</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vehicle No
            </label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select vehicle</option>
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
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select bed</option>
              {beds
                .filter((bed) => !activeBedIds.has(String(bed.BED_ID)))
                .map((bed) => (
                <option key={bed.BED_ID} value={bed.BED_ID}>
                  {bed.BED_NO}
                </option>
                ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleAttach}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Attach
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Attached Beds
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {attachments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No bed attachments found
            </div>
          ) : (
            attachments.map((attach) => (
              <div
                key={attach.BED_ATTACH_ID}
                className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    Vehicle:{" "}
                    {equipmentMap[String(attach.EQUIPMENT_ID)]?.EQUIPMENT_NO ||
                      attach.EQUIPMENT_ID}
                  </div>
                  <div className="text-sm text-gray-500">
                    Bed: {bedMap[String(attach.BED_ID)]?.BED_NO || attach.BED_ID}
                  </div>
                  <div className="text-sm text-gray-500">
                    Status: {attach.ATTACH_STATUS || "ATTACHED"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Attached: {formatDateTime(attach.ATTACH_DATE)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Detached: {formatDateTime(attach.DETACH_DATE)}
                  </div>
                  {attach.REMARKS && (
                    <div className="text-sm text-gray-500">
                      Remarks: {attach.REMARKS}
                    </div>
                  )}
                </div>
                {attach.ATTACH_STATUS !== "DETACHED" && (
                  <button
                    onClick={() => handleDetach(attach.BED_ATTACH_ID)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Detach
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BedAttachment;
