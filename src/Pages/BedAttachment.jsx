import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { bedAPI, bedAttachmentAPI, equipmentAPI } from "../utils/Api";

const BedAttachment = () => {
  const { user } = useAuth();
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

  const hasActiveBedOnSelectedVehicle = attachments.some(
    (row) => String(row.ATTACH_STATUS || "").toUpperCase() !== "DETACHED"
  );

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
    const results = await Promise.allSettled([
      equipmentAPI.getAllEquipment(),
      bedAPI.getAllBeds(),
    ]);
    const [equipRes, bedRes] = results;

    if (equipRes.status === "fulfilled" && equipRes.value.success) {
      const filtered = (equipRes.value.data || []).filter(
        (eq) => String(eq.BED_CHANGEABLE || "").toUpperCase() === "Y"
      );
      setEquipment(filtered);
    }

    if (bedRes.status === "fulfilled" && bedRes.value.success) {
      setBeds(bedRes.value.data || []);
    }

    const failed = [];
    if (equipRes.status === "rejected") failed.push("vehicles");
    if (bedRes.status === "rejected") failed.push("beds");
    if (failed.length > 0) {
      toast.error(`Failed to load ${failed.join(", ")} dropdowns`);
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
    const selectedTerminalId =
      user?.terminalId && String(user.terminalId).toUpperCase() !== "ALL"
        ? Number(user.terminalId)
        : null;

    if (!selectedTerminalId) {
      toast.error("Please select a specific location first");
      return;
    }

    if (!selectedEquipmentId || !selectedBedId) {
      toast.error("Select vehicle and bed");
      return;
    }
    try {
      const response = await bedAttachmentAPI.attachBed({
        equipment_id: selectedEquipmentId,
        bed_id: selectedBedId,
        terminal_id: selectedTerminalId,
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
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assign Bed</h2>
            <p className="text-sm text-gray-500">Attach one active bed per vehicle.</p>
          </div>
          {hasActiveBedOnSelectedVehicle && (
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
              Active bed already attached
            </span>
          )}
        </div>
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
              disabled={hasActiveBedOnSelectedVehicle}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">
                {hasActiveBedOnSelectedVehicle
                  ? "Vehicle already has active bed"
                  : "Select bed"}
              </option>
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
            disabled={hasActiveBedOnSelectedVehicle}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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
        <div className="p-4 max-h-[62vh] overflow-y-auto">
          {attachments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No bed attachments found
            </div>
          ) : (
            attachments.map((attach) => (
              <div
                key={attach.BED_ATTACH_ID}
                className="mb-3 rounded-xl border border-gray-200 bg-white p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    Vehicle:{" "}
                    {equipmentMap[String(attach.EQUIPMENT_ID)]?.EQUIPMENT_NO ||
                      attach.EQUIPMENT_ID}
                  </div>
                  <div className="text-sm text-gray-600">
                    Bed: {bedMap[String(attach.BED_ID)]?.BED_NO || attach.BED_ID}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      (attach.ATTACH_STATUS || "ATTACHED").toUpperCase() === "DETACHED"
                        ? "bg-slate-50 text-slate-700 ring-slate-100"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    }`}>
                      {(attach.ATTACH_STATUS || "ATTACHED").toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
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
                    className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm self-start"
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
