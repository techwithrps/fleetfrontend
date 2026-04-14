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

const TireAttachmentReport = () => {
  const [equipment, setEquipment] = useState([]);
  const [beds, setBeds] = useState([]);
  const [tires, setTires] = useState([]);
  const [positions, setPositions] = useState([]);
  const [reportRows, setReportRows] = useState([]);

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

  const formatDateOnly = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
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
      toast.error(error.message || "Failed to load mapping data");
    }
  };

  const loadReportRows = async () => {
    try {
      const response = await tireAttachmentAPI.getHistory();
      if (response.success) {
        setReportRows(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load tire report");
    }
  };

  useEffect(() => {
    loadData();
    loadReportRows();
  }, []);

  const exportTyreAttachReport = (format = "xlsx") => {
    if (!reportRows.length) {
      toast.error("No data to export");
      return;
    }

    const rows = reportRows.map((row) => {
      const attachFor = String(row.ATTACH_FOR || "").toUpperCase() === "BED" ? "BED" : "HORSE";
      const position = positionMap[String(row.POSITION_ID)] || {};
      return {
        ATTACH_FOR: attachFor,
        EQUIPMENT_NO: attachFor === "HORSE" ? equipmentMap[String(row.EQUIPMENT_ID)]?.EQUIPMENT_NO || row.EQUIPMENT_ID || "" : "",
        BED_NO: attachFor === "BED" ? bedMap[String(row.BED_ID)]?.BED_NO || row.BED_ID || "" : "",
        TIRE_NO: tireMap[String(row.TIRE_ID)]?.TIRE_NO || row.TIRE_ID || "",
        POSITION_CODE: position.POSITION_CODE || "",
        POSITION_NAME: position.POSITION_NAME || "",
        TIRE_ATTACH_DATE: formatDateOnly(row.ATTACH_DATE),
        TIRE_DETACH_DATE: formatDateOnly(row.DETACH_DATE),
        TIRE_STATUS: String(row.ATTACH_STATUS || "").toUpperCase() || "ATTACHED",
        REMARKS: row.REMARKS || "",
      };
    });

    if (format === "csv") {
        const header = Object.keys(rows[0]).join(",");
        const body = rows.map(obj => Object.values(obj).map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `TYRE_REPORT_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TYRE_REPORT");
    XLSX.writeFile(wb, `TYRE_REPORT_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-10 w-2 bg-blue-600 rounded-full"></div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Tyre Attachment Report</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Movement History</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Real-time tracking of all tyre attachments and detachments across fleet.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportTyreAttachReport("xlsx")}
                className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
              >
                Export Excel
              </button>
              <button
                onClick={() => exportTyreAttachReport("csv")}
                className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-950 transition-all shadow-lg hover:shadow-slate-300"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50/50">
              <tr>
                {["ATTACH_FOR", "EQUIPMENT_NO", "BED_NO", "TIRE_NO", "POSITION", "NAME", "ATTACHED", "DETACHED", "STATUS", "REMARKS"].map((header) => (
                  <th key={header} className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center text-slate-400 font-bold italic">
                    No records found in tyre history.
                  </td>
                </tr>
              ) : (
                reportRows.map((row) => (
                  <tr key={row.TIRE_ATTACH_ID} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-4 text-xs font-black">
                      <span className={`px-2.5 py-1 rounded-lg ${String(row.ATTACH_FOR).toUpperCase() === 'BED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {String(row.ATTACH_FOR || "").toUpperCase() === "BED" ? "BED" : "HORSE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">
                      {String(row.ATTACH_FOR || "").toUpperCase() === "BED" ? "-" : (equipmentMap[String(row.EQUIPMENT_ID)]?.EQUIPMENT_NO || row.EQUIPMENT_ID || "")}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">
                      {String(row.ATTACH_FOR || "").toUpperCase() === "BED" ? (bedMap[String(row.BED_ID)]?.BED_NO || row.BED_ID || "") : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">{tireMap[String(row.TIRE_ID)]?.TIRE_NO || row.TIRE_ID || ""}</td>
                    <td className="px-6 py-4 text-sm text-blue-600 font-black">{positionMap[String(row.POSITION_ID)]?.POSITION_CODE || ""}</td>
                    <td className="px-6 py-4 text-[11px] text-slate-500 font-bold">{positionMap[String(row.POSITION_ID)]?.POSITION_NAME || ""}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">{formatDateOnly(row.ATTACH_DATE)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">{formatDateOnly(row.DETACH_DATE) || "-"}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className={`px-3 py-1 rounded-full font-black tracking-wider shadow-sm border ${String(row.ATTACH_STATUS || "").toUpperCase() === 'DETACHED' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {String(row.ATTACH_STATUS || "ATTACHED").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 max-w-[150px] truncate italic" title={row.REMARKS}>{row.REMARKS || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TireAttachmentReport;
