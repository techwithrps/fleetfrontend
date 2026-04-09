import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  equipmentAPI,
  bedAPI,
  tireMasterAPI,
  tirePositionAPI,
  tireAttachmentAPI,
} from "../utils/Api";

const TireAttachment = () => {
  const [attachFor, setAttachFor] = useState("VEHICLE");
  const [equipment, setEquipment] = useState([]);
  const [beds, setBeds] = useState([]);
  const [tires, setTires] = useState([]);
  const [positions, setPositions] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activeTireIds, setActiveTireIds] = useState(new Set());

  const [equipmentId, setEquipmentId] = useState("");
  const [bedId, setBedId] = useState("");
  const [tireId, setTireId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [remarks, setRemarks] = useState("");

  const equipmentMap = equipment.reduce((acc, item) => {
    acc[String(item.EQUIPMENT_ID)] = item;
    return acc;
  }, {});

  const bedMap = beds.reduce((acc, item) => {
    acc[String(item.BED_ID)] = item;
    return acc;
  }, {});

  const tireMap = tires.reduce((acc, item) => {
    acc[String(item.TIRE_ID)] = item;
    return acc;
  }, {});

  const positionMap = positions.reduce((acc, item) => {
    acc[String(item.POSITION_ID)] = item;
    return acc;
  }, {});

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "N/A";

  const loadActiveTireUsage = async () => {
    try {
      const response = await tireAttachmentAPI.getHistory();
      if (!response.success) return;

      const active = new Set(
        (response.data || [])
          .filter(
            (row) => String(row.ATTACH_STATUS || "").toUpperCase() !== "DETACHED"
          )
          .map((row) => String(row.TIRE_ID))
      );
      setActiveTireIds(active);
    } catch (error) {
      console.error("Failed to load active tire usage:", error);
    }
  };

  const loadData = async () => {
    try {
      const [equipRes, bedRes, tireRes, posRes] = await Promise.all([
        equipmentAPI.getAllEquipment(),
        bedAPI.getAllBeds(),
        tireMasterAPI.getAllTires(),
        tirePositionAPI.getAllPositions(),
      ]);
      if (equipRes.success) setEquipment(equipRes.data || []);
      if (bedRes.success) setBeds(bedRes.data || []);
      if (tireRes.success) setTires(tireRes.data || []);
      if (posRes.success) setPositions(posRes.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load dropdowns");
    }
  };

  const loadAttachments = async () => {
    try {
      const params =
        attachFor === "VEHICLE" && equipmentId
          ? { equipment_id: equipmentId }
          : attachFor === "BED" && bedId
            ? { bed_id: bedId }
            : {};
      const response = await tireAttachmentAPI.getHistory(params);
      if (response.success) {
        setAttachments(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch tire attachments");
    }
  };

  useEffect(() => {
    loadData();
    loadActiveTireUsage();
  }, []);

  useEffect(() => {
    loadAttachments();
  }, [attachFor, equipmentId, bedId]);

  const handleAttach = async () => {
    if (!tireId || !positionId) {
      toast.error("Select tire and position");
      return;
    }
    if (attachFor === "VEHICLE" && !equipmentId) {
      toast.error("Select vehicle");
      return;
    }
    if (attachFor === "BED" && !bedId) {
      toast.error("Select bed");
      return;
    }
    try {
      const response = await tireAttachmentAPI.attachTire({
        attach_for: attachFor,
        equipment_id: attachFor === "VEHICLE" ? equipmentId : null,
        bed_id: attachFor === "BED" ? bedId : null,
        tire_id: tireId,
        position_id: positionId,
        remarks,
      });
      if (response.success) {
        toast.success("Tire attached successfully");
        setTireId("");
        setPositionId("");
        setRemarks("");
        loadAttachments();
        loadActiveTireUsage();
      } else {
        toast.error(response.error || "Failed to attach tire");
      }
    } catch (error) {
      toast.error(error.message || "Failed to attach tire");
    }
  };

  const handleDetach = async (attachmentId) => {
    try {
      const response = await tireAttachmentAPI.detachTire(attachmentId, {
        remarks,
      });
      if (response.success) {
        toast.success("Tire detached successfully");
        setRemarks("");
        loadAttachments();
        loadActiveTireUsage();
      } else {
        toast.error(response.error || "Failed to detach tire");
      }
    } catch (error) {
      toast.error(error.message || "Failed to detach tire");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tyre Attach / Detach</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Attach For
            </label>
            <select
              value={attachFor}
              onChange={(e) => {
                setAttachFor(e.target.value);
                setEquipmentId("");
                setBedId("");
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="VEHICLE">Vehicle</option>
              <option value="BED">Bed</option>
            </select>
          </div>
          {attachFor === "VEHICLE" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vehicle No
              </label>
              <select
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
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
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bed No
              </label>
              <select
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select bed</option>
                {beds.map((bed) => (
                  <option key={bed.BED_ID} value={bed.BED_ID}>
                    {bed.BED_NO}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tire Position
            </label>
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select position</option>
              {positions.map((pos) => (
                <option key={pos.POSITION_ID} value={pos.POSITION_ID}>
                  {pos.POSITION_CODE} - {pos.POSITION_NAME}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tire
            </label>
            <select
              value={tireId}
              onChange={(e) => setTireId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select tire</option>
              {tires
                .filter((tire) => !activeTireIds.has(String(tire.TIRE_ID)))
                .map((tire) => (
                <option key={tire.TIRE_ID} value={tire.TIRE_ID}>
                  {tire.TIRE_NO}
                </option>
                ))}
            </select>
          </div>
          <div className="md:col-span-2">
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
            Attached Tyres
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {attachments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No tyre attachments found
            </div>
          ) : (
            attachments.map((attach) => (
              <div
                key={attach.TIRE_ATTACH_ID}
                className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {attach.ATTACH_FOR === "BED" ? "Bed" : "Vehicle"}:{" "}
                    {attach.ATTACH_FOR === "BED"
                      ? bedMap[String(attach.BED_ID)]?.BED_NO || attach.BED_ID
                      : equipmentMap[String(attach.EQUIPMENT_ID)]?.EQUIPMENT_NO ||
                        attach.EQUIPMENT_ID}
                  </div>
                  <div className="text-sm text-gray-500">
                    Tire:{" "}
                    {tireMap[String(attach.TIRE_ID)]?.TIRE_NO || attach.TIRE_ID}
                  </div>
                  <div className="text-sm text-gray-500">
                    Position:{" "}
                    {positionMap[String(attach.POSITION_ID)]?.POSITION_CODE ||
                      attach.POSITION_ID}
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
                    onClick={() => handleDetach(attach.TIRE_ATTACH_ID)}
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

export default TireAttachment;
