import React, { useEffect, useState } from "react";
import { reportMasterAPI, tireMasterAPI, equipmentAPI, driverAPI, bedAPI } from "../utils/Api";
import { toast } from "react-toastify";

const tileStyle = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

const formatLabel = (entity) =>
  entity.charAt(0).toUpperCase() + entity.slice(1);

export default function ReportMaster() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await reportMasterAPI.getAllSummary();
      if (response.success) {
        setSummary(response.data || {});
      } else {
        throw new Error("Failed to load report summary.");
      }
    } catch (error) {
      try {
        const [tyresRes, vehiclesRes, driversRes, bedsRes] = await Promise.all([
          tireMasterAPI.getAllTires(),
          equipmentAPI.getAllEquipment(),
          driverAPI.getAllDrivers(),
          bedAPI.getAllBeds(),
        ]);

        setSummary({
          tyre: {
            total: tyresRes?.data?.length || 0,
            in_use: 0,
            available: tyresRes?.data?.length || 0,
            breakdown: [],
          },
          vehicle: {
            total: vehiclesRes?.data?.length || 0,
            active: (vehiclesRes?.data || []).filter((item) =>
              ["A", "ACTIVE"].includes(String(item.STATUS || "").toUpperCase())
            ).length,
            inactive: (vehiclesRes?.data || []).filter((item) =>
              ["I", "INACTIVE"].includes(String(item.STATUS || "").toUpperCase())
            ).length,
            available: (vehiclesRes?.data || []).filter((item) =>
              ["A", "ACTIVE"].includes(String(item.STATUS || "").toUpperCase())
            ).length,
          },
          driver: {
            total: driversRes?.data?.length || 0,
            active: (driversRes?.data || []).filter((item) =>
              ["Y", "A", "ACTIVE"].includes(String(item.ACTIVE_FLAGE || "").toUpperCase())
            ).length,
            attached: (driversRes?.data || []).filter((item) =>
              String(item.ATTACH_STATUS || "").toUpperCase() === "ATTACHED"
            ).length,
            available: (driversRes?.data || []).length,
          },
          bed: {
            total: bedsRes?.data?.length || 0,
            active: (bedsRes?.data || []).filter((item) =>
              String(item.STATUS || "").toUpperCase() === "ACTIVE"
            ).length,
            attached: 0,
            available: bedsRes?.data?.length || 0,
          },
        });
      } catch (fallbackError) {
        toast.error(error?.message || "Failed to load report summary.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const entities = ["tyre", "vehicle", "driver", "bed"];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Report Master</h1>
        <button
          onClick={loadSummary}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading summary...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {entities.map((entity) => {
            const row = summary[entity] || {};
            return (
              <div key={entity} className={tileStyle}>
                <h2 className="text-lg font-semibold mb-3">{formatLabel(entity)}</h2>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Total:</span> {row.total ?? 0}</div>
                  {"active" in row && <div><span className="font-medium">Active:</span> {row.active ?? 0}</div>}
                  {"in_use" in row && <div><span className="font-medium">In Use:</span> {row.in_use ?? 0}</div>}
                  {"attached" in row && <div><span className="font-medium">Attached:</span> {row.attached ?? 0}</div>}
                  <div><span className="font-medium">Available:</span> {row.available ?? 0}</div>
                  {"inactive" in row && <div><span className="font-medium">Inactive:</span> {row.inactive ?? 0}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
