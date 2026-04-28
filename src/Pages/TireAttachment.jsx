import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import {
  equipmentAPI,
  bedAPI,
  tireMasterAPI,
  tirePositionAPI,
  tireAttachmentAPI,
} from "../utils/Api";

const createAttachRow = () => ({ tireId: "", positionId: "" });

const TireAttachment = () => {
  const { user } = useAuth();
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
  const [attachRows, setAttachRows] = useState([createAttachRow()]);
  const [remarks, setRemarks] = useState("");
  const [selectedDetachIds, setSelectedDetachIds] = useState([]);

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
    const results = await Promise.allSettled([
      equipmentAPI.getAllEquipment(),
      bedAPI.getAllBeds(),
      tireMasterAPI.getAllTires(),
      tirePositionAPI.getAllPositions(),
    ]);

    const [equipRes, bedRes, tireRes, posRes] = results;

    if (equipRes.status === "fulfilled" && equipRes.value.success) {
      setEquipment(equipRes.value.data || []);
    } else if (equipRes.status === "rejected") {
      console.error("Failed to load vehicles:", equipRes.reason);
    }

    if (bedRes.status === "fulfilled" && bedRes.value.success) {
      setBeds(bedRes.value.data || []);
    } else if (bedRes.status === "rejected") {
      console.error("Failed to load beds:", bedRes.reason);
    }

    if (tireRes.status === "fulfilled" && tireRes.value.success) {
      setTires(tireRes.value.data || []);
    } else if (tireRes.status === "rejected") {
      console.error("Failed to load tires:", tireRes.reason);
    }

    if (posRes.status === "fulfilled" && posRes.value.success) {
      setPositions(posRes.value.data || []);
    } else if (posRes.status === "rejected") {
      console.error("Failed to load tire positions:", posRes.reason);
    }

    const failedSources = [];
    if (equipRes.status === "rejected") failedSources.push("vehicles");
    if (bedRes.status === "rejected") failedSources.push("beds");
    if (tireRes.status === "rejected") failedSources.push("tires");
    if (posRes.status === "rejected") failedSources.push("positions");
    if (failedSources.length > 0) {
      toast.error(`Failed to load ${failedSources.join(", ")} dropdowns`);
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
    setAttachRows([createAttachRow()]);
    loadAttachments();
  }, [attachFor, equipmentId, bedId]);

  const handleAttach = async () => {
    const selectedLocationId =
      user?.terminalId && String(user.terminalId).toUpperCase() !== "ALL"
        ? user.terminalId
        : null;

    if (!selectedLocationId) {
      toast.error("Please select a specific location first");
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
    if (attachRows.length === 0) {
      toast.error("Add at least one tire row");
      return;
    }

    const invalidRowIndex = attachRows.findIndex(
      (row) => !row.tireId || !row.positionId
    );
    if (invalidRowIndex !== -1) {
      toast.error(`Complete Tire/Position in row ${invalidRowIndex + 1}`);
      return;
    }

    const selectedTires = attachRows.map((row) => String(row.tireId));
    const selectedPositions = attachRows.map((row) => String(row.positionId));

    if (new Set(selectedTires).size !== selectedTires.length) {
      toast.error("Same tire cannot be selected more than once");
      return;
    }
    if (new Set(selectedPositions).size !== selectedPositions.length) {
      toast.error("Same position cannot be selected more than once");
      return;
    }

    const availablePositionIds = new Set(
      availablePositions.map((pos) => String(pos.POSITION_ID))
    );
    const invalidPositionSelected = selectedPositions.some(
      (position) => !availablePositionIds.has(position)
    );
    if (invalidPositionSelected) {
      toast.error("One or more selected positions are already occupied");
      return;
    }

    try {
      let successCount = 0;
      for (const row of attachRows) {
        const response = await tireAttachmentAPI.attachTire({
          attach_for: attachFor,
          location_id: selectedLocationId,
          equipment_id: attachFor === "VEHICLE" ? equipmentId : null,
          bed_id: attachFor === "BED" ? bedId : null,
          tire_id: row.tireId,
          position_id: row.positionId,
          remarks,
        });

        if (response.success) {
          successCount += 1;
        } else {
          throw new Error(response.error || "Failed to attach tire");
        }
      }

      toast.success(
        successCount > 1
          ? `${successCount} tires attached successfully`
          : "Tire attached successfully"
      );
      setAttachRows([createAttachRow()]);
      setRemarks("");
      loadAttachments();
      loadActiveTireUsage();
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to attach tire");
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

  const handleBulkDetach = async () => {
    if (selectedDetachIds.length === 0) {
      toast.error("Select at least one attached tire to detach");
      return;
    }
    try {
      const response = await tireAttachmentAPI.detachTiresBulk(selectedDetachIds, {
        remarks,
      });
      if (response.success) {
        toast.success(response.message || "Bulk detach completed");
        setSelectedDetachIds([]);
        setRemarks("");
        loadAttachments();
        loadActiveTireUsage();
      } else {
        toast.error(response.error || "Bulk detach failed");
      }
    } catch (error) {
      toast.error(error.message || "Bulk detach failed");
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
                setAttachRows([createAttachRow()]);
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

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tire Attach Rows
            </label>
            <div className="space-y-2">
              {attachRows.map((row, index) => {
                const selectedTireIds = attachRows
                  .filter((_, rowIndex) => rowIndex !== index)
                  .map((item) => String(item.tireId));
                const selectedPositionIds = attachRows
                  .filter((_, rowIndex) => rowIndex !== index)
                  .map((item) => String(item.positionId));

                return (
                  <div key={`attach-row-${index}`} className="grid grid-cols-1 md:grid-cols-11 gap-2">
                    <div className="md:col-span-5">
                      <select
                        value={row.tireId}
                        onChange={(e) =>
                          setAttachRows((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, tireId: e.target.value }
                                : item
                            )
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select tire</option>
                        {tires
                          .filter(
                            (tire) =>
                              !activeTireIds.has(String(tire.TIRE_ID)) &&
                              !selectedTireIds.includes(String(tire.TIRE_ID))
                          )
                          .map((tire) => (
                            <option key={tire.TIRE_ID} value={tire.TIRE_ID}>
                              {tire.TIRE_NO}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <select
                        value={row.positionId}
                        onChange={(e) =>
                          setAttachRows((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, positionId: e.target.value }
                                : item
                            )
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">
                          {availablePositions.length === 0
                            ? "No position available"
                            : "Select position"}
                        </option>
                        {availablePositions
                          .filter(
                            (pos) =>
                              !selectedPositionIds.includes(String(pos.POSITION_ID))
                          )
                          .map((pos) => (
                            <option key={pos.POSITION_ID} value={pos.POSITION_ID}>
                              {pos.POSITION_CODE} - {pos.POSITION_NAME}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() =>
                          setAttachRows((prev) =>
                            prev.length > 1
                              ? prev.filter((_, rowIndex) => rowIndex !== index)
                              : prev
                          )
                        }
                        disabled={attachRows.length === 1}
                        className="w-full mt-1 px-2 py-2 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                      >
                        -
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setAttachRows((prev) => [...prev, createAttachRow()])}
              className="mt-3 px-3 py-2 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            >
              Attach More
            </button>
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
              !user?.terminalId ||
              String(user.terminalId).toUpperCase() === "ALL" ||
              (attachFor === "VEHICLE" && !equipmentId) ||
              (attachFor === "BED" && !bedId) ||
              availablePositions.length === 0
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
                Grouped by vehicle/bed. Detach individual tires as needed.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {attachments.length} total tires
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {attachments.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No tyre attachments found
            </div>
          ) : (
            (() => {
              // Group attachments by vehicle/bed
              const groups = attachments.reduce((acc, item) => {
                const isBed = item.ATTACH_FOR === "BED";
                const id = isBed ? item.BED_ID : item.EQUIPMENT_ID;
                const type = isBed ? "BED" : "VEHICLE";
                const key = `${type}_${id}`;

                if (!acc[key]) {
                  acc[key] = {
                    type,
                    id,
                    name: isBed 
                      ? (bedMap[String(id)]?.BED_NO || id)
                      : (equipmentMap[String(id)]?.EQUIPMENT_NO || id),
                    items: []
                  };
                }
                acc[key].items.push(item);
                return acc;
              }, {});

              return Object.values(groups).map((group) => (
                <div key={group.key || `${group.type}_${group.id}`} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
                    <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-sm font-black">
                      {group.type}: {group.name}
                    </div>
                    <div className="text-xs text-slate-400 font-bold italic">
                      {group.items.length} tires attached
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map((attach) => (
                      <div
                        key={attach.TIRE_ATTACH_ID}
                        className="relative p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                              Tyre No
                            </span>
                            <span className="text-base font-black text-slate-800">
                              {tireMap[String(attach.TIRE_ID)]?.TIRE_NO || attach.TIRE_ID}
                            </span>
                          </div>
                          {(() => {
                            const status = String(attach.ATTACH_STATUS || "ATTACHED").toUpperCase();
                            const isDetached = status === "DETACHED";
                            return (
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  isDetached
                                    ? "bg-slate-100 text-slate-500"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {status}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Position</span>
                            <span className="text-xs font-bold text-slate-600">
                              {positionMap[String(attach.POSITION_ID)]?.POSITION_CODE || attach.POSITION_ID}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Date</span>
                            <span className="text-[10px] text-slate-600">
                              {new Date(attach.ATTACH_DATE).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {attach.REMARKS && (
                          <div className="text-[10px] text-slate-500 italic truncate mb-3" title={attach.REMARKS}>
                            "{attach.REMARKS}"
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                          {String(attach.ATTACH_STATUS || "ATTACHED").toUpperCase() !== "DETACHED" && (
                            <label className="flex items-center gap-2 text-[10px] text-slate-500 font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded text-blue-600"
                                checked={selectedDetachIds.includes(String(attach.TIRE_ATTACH_ID))}
                                onChange={(e) => {
                                  const id = String(attach.TIRE_ATTACH_ID);
                                  setSelectedDetachIds((prev) =>
                                    e.target.checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
                                  );
                                }}
                              />
                              Select
                            </label>
                          )}
                          
                          {attach.ATTACH_STATUS !== "DETACHED" && (
                            <button
                              onClick={() => handleDetach(attach.TIRE_ATTACH_ID)}
                              className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-black transition-all"
                            >
                              Detach
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={() => {
            const activeIds = attachments
              .filter((row) => String(row.ATTACH_STATUS || "").toUpperCase() !== "DETACHED")
              .map((row) => String(row.TIRE_ATTACH_ID));
            setSelectedDetachIds(activeIds);
          }}
          className="mr-3 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
        >
          Select All Active
        </button>
        <button
          onClick={() => setSelectedDetachIds([])}
          className="mr-3 px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
        >
          Clear Selection
        </button>
        <button
          onClick={handleBulkDetach}
          disabled={selectedDetachIds.length === 0}
          className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50"
        >
          Bulk Detach Selected ({selectedDetachIds.length})
        </button>
      </div>
    </div>
  );
};

export default TireAttachment;
