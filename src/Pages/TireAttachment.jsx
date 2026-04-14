import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
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
  const [activeAttachmentRows, setActiveAttachmentRows] = useState([]);

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

  const formatDateOnly = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

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
      setActiveAttachmentRows(
        (response.data || []).filter(
          (row) => String(row.ATTACH_STATUS || "").toUpperCase() !== "DETACHED"
        )
      );
    } catch (error) {
      console.error("Failed to load active tire usage:", error);
    }
  };

  const occupiedPositionIds = new Set(
    activeAttachmentRows
      .filter((row) => {
        if (attachFor === "VEHICLE") {
          return (
            String(row.ATTACH_FOR || "").toUpperCase() === "VEHICLE" &&
            String(row.EQUIPMENT_ID) === String(equipmentId)
          );
        }
        return (
          String(row.ATTACH_FOR || "").toUpperCase() === "BED" &&
          String(row.BED_ID) === String(bedId)
        );
      })
      .map((row) => String(row.POSITION_ID))
  );

  const availablePositions = positions.filter(
    (pos) => !occupiedPositionIds.has(String(pos.POSITION_ID))
  );

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
        loadReportRows();
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
        loadReportRows();
      } else {
        toast.error(response.error || "Failed to detach tire");
      }
    } catch (error) {
      toast.error(error.message || "Failed to detach tire");
    }
  };

  const getTargetNo = (row) => {
    const attachFor = String(row.ATTACH_FOR || "").toUpperCase();
    if (attachFor === "BED") {
      return bedMap[String(row.BED_ID)]?.BED_NO || row.BED_ID || "";
    }
    return equipmentMap[String(row.EQUIPMENT_ID)]?.EQUIPMENT_NO || row.EQUIPMENT_ID || "";
  };

  const getPositionLabel = (row) => {
    const pos = positionMap[String(row.POSITION_ID)];
    if (!pos) return row.POSITION_ID || "";
    return `${pos.POSITION_CODE || ""}${pos.POSITION_NAME ? ` (${pos.POSITION_NAME})` : ""}`;
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
              <option value="">
                {availablePositions.length === 0
                  ? "No position available"
                  : "Select position"}
              </option>
              {availablePositions.map((pos) => (
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
            disabled={
              (attachFor === "VEHICLE" && !equipmentId) ||
              (attachFor === "BED" && !bedId) ||
              availablePositions.length === 0
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Attach
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Attached Tyres</h2>
              <p className="text-sm text-slate-500">
                Latest attachments first. Detach only when status is active.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {attachments.length} records
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {attachments.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No tyre attachments found
            </div>
          ) : (
            attachments.map((attach) => (
              <div
                key={attach.TIRE_ATTACH_ID}
                className="p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-extrabold text-slate-900">
                      {attach.ATTACH_FOR === "BED" ? "Bed" : "Vehicle"}{" "}
                      <span className="text-slate-400 font-bold">/</span>{" "}
                      <span className="font-black">
                        {attach.ATTACH_FOR === "BED"
                          ? bedMap[String(attach.BED_ID)]?.BED_NO || attach.BED_ID
                          : equipmentMap[String(attach.EQUIPMENT_ID)]?.EQUIPMENT_NO ||
                            attach.EQUIPMENT_ID}
                      </span>
                    </div>
                    {(() => {
                      const status = String(attach.ATTACH_STATUS || "ATTACHED").toUpperCase();
                      const isDetached = status === "DETACHED";
                      return (
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black tracking-wide ${
                            isDetached
                              ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100"
                          }`}
                        >
                          {status}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Tyre
                      </div>
                      <div className="text-sm font-semibold text-slate-700 truncate">
                        {tireMap[String(attach.TIRE_ID)]?.TIRE_NO || attach.TIRE_ID}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Position
                      </div>
                      <div className="text-sm font-semibold text-slate-700 truncate">
                        {positionMap[String(attach.POSITION_ID)]?.POSITION_CODE ||
                          attach.POSITION_ID}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Timeline
                      </div>
                      <div className="text-xs text-slate-600">
                        <div>
                          <span className="font-bold">Attached:</span>{" "}
                          {formatDateTime(attach.ATTACH_DATE)}
                        </div>
                        <div>
                          <span className="font-bold">Detached:</span>{" "}
                          {formatDateTime(attach.DETACH_DATE)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {attach.REMARKS && (
                    <div className="mt-3 text-sm text-slate-600">
                      <span className="font-bold text-slate-700">Remarks:</span>{" "}
                      {attach.REMARKS}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  {attach.ATTACH_STATUS !== "DETACHED" && (
                    <button
                      onClick={() => handleDetach(attach.TIRE_ATTACH_ID)}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 text-sm font-bold shadow-sm"
                    >
                      Detach
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
};

export default TireAttachment;
