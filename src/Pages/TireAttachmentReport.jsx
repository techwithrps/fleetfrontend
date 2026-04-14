import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  equipmentAPI,
  bedAPI,
  tireMasterAPI,
  tirePositionAPI,
  tireAttachmentAPI,
  driverAPI,
} from "../utils/Api";

const TireAttachmentReport = () => {
  const [equipment, setEquipment] = useState([]);
  const [beds, setBeds] = useState([]);
  const [tires, setTires] = useState([]);
  const [positions, setPositions] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const driverMap = drivers.reduce((acc, item) => {
    acc[String(item.DRIVER_ID)] = item;
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

  const filteredRows = reportRows.filter((row) => {
    const vNo = String(row.ATTACH_FOR || "").toUpperCase() === "BED" 
      ? (bedMap[String(row.BED_ID)]?.BED_NO || String(row.BED_ID) || "")
      : (equipmentMap[String(row.EQUIPMENT_ID)]?.EQUIPMENT_NO || String(row.EQUIPMENT_ID) || "");
    
    return vNo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleVehicleLookup = () => {
    if (!searchTerm) {
      setSelectedVehicle(null);
      return;
    }
    const found = equipment.find(e => 
      String(e.EQUIPMENT_NO).toLowerCase() === searchTerm.toLowerCase()
    );
    setSelectedVehicle(found || null);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipRes, bedRes, tireRes, posRes, driverRes, reportRes] = await Promise.all([
        equipmentAPI.getAllEquipment(),
        bedAPI.getAllBeds(),
        tireMasterAPI.getAllTires(),
        tirePositionAPI.getAllPositions(),
        driverAPI.getAllDrivers(),
        tireAttachmentAPI.getHistory(),
      ]);
      
      if (equipRes.success) setEquipment(equipRes.data || []);
      if (bedRes.success) setBeds(bedRes.data || []);
      if (tireRes.success) setTires(tireRes.data || []);
      if (posRes.success) setPositions(posRes.data || []);
      if (driverRes.success) setDrivers(driverRes.data || []);
      if (reportRes.success) setReportRows(reportRes.data || []);

    } catch (error) {
      toast.error(error.message || "Failed to load mapping data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportTyreAttachReport = (format = "xlsx") => {
    const dataToExport = searchTerm ? filteredRows : reportRows;

    if (!dataToExport.length) {
      toast.error("No data to export");
      return;
    }

    const rows = dataToExport.map((row, index) => {
      const attachFor = String(row.ATTACH_FOR || "").toUpperCase() === "BED" ? "BED" : "HORSE";
      const position = positionMap[String(row.POSITION_ID)] || {};
      return {
        "S.No": index + 1,
        "VEHICLE/BED NO": attachFor === "HORSE" 
          ? equipmentMap[String(row.EQUIPMENT_ID)]?.EQUIPMENT_NO || row.EQUIPMENT_ID || "" 
          : bedMap[String(row.BED_ID)]?.BED_NO || row.BED_ID || "",
        ATTACH_FOR: attachFor,
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
    <div className="container mx-auto px-4 py-8 relative min-h-screen">
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <div className="h-1 w-full bg-blue-100 overflow-hidden">
            <div className="h-full bg-blue-600 animate-[progress_1.5s_ease-in-out_infinite] origin-left"></div>
          </div>
          <div className="absolute right-6 top-6">
             <div className="w-5 h-5 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-2 bg-blue-600 rounded-full"></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Fleet Intelligence Report</h1>
            <p className="text-slate-500 font-medium lowercase">tire / bed attach detach report</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100">
           <div className="relative flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Enter Vehicle Number (e.g. MH12AB1234)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVehicleLookup()}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
              />
              <svg className="w-6 h-6 absolute left-4 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           </div>
           <button 
              onClick={handleVehicleLookup}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              LOOKUP
           </button>
        </div>
      </div>

      {selectedVehicle && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="flex items-center gap-4 pr-6 lg:border-r border-slate-100">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Vehicle</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{selectedVehicle.EQUIPMENT_NO}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Driver</p>
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {driverMap[String(selectedVehicle.DRIVER_ATTACH_ID)]?.DRIVER_NAME || "Not Assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Model / Make</p>
                  <p className="text-sm font-bold text-slate-800">{selectedVehicle.MODEL || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Vendor</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedVehicle.VENDOR_NAME || "Own"}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Engine No</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{selectedVehicle.ENG_NO || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black ${selectedVehicle.STATUS === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {selectedVehicle.STATUS === 'A' ? 'AVAILABLE' : 'IN-USE'}
                  </span>
                </div>
              </div>

              <div className="lg:pl-6 lg:border-l border-slate-100">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Insurance Up To</p>
                  <p className="text-xs font-bold text-slate-600">{formatDateOnly(selectedVehicle.INS_VALIDITY) || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tyre History & Movements</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Historical records of all tyre changes for {searchTerm ? `"${searchTerm}"` : "the entire fleet"}.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportTyreAttachReport("xlsx")}
                className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
              >
                Export Results
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50/50">
              <tr>
                {["S.No", "VEHICLE/BED NO", "ATTACH_FOR", "TIRE_NO", "POSITION", "NAME", "ATTACHED", "DETACHED", "STATUS", "REMARKS"].map((header) => (
                  <th key={header} className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center text-slate-400 font-bold italic">
                    {searchTerm ? `No movement records found for "${searchTerm}"` : "No records found in tyre history."}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={row.TIRE_ATTACH_ID} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-black">
                      {String(row.ATTACH_FOR || "").toUpperCase() === "BED" 
                        ? (bedMap[String(row.BED_ID)]?.BED_NO || row.BED_ID || "-")
                        : (equipmentMap[String(row.EQUIPMENT_ID)]?.EQUIPMENT_NO || row.EQUIPMENT_ID || "-")
                      }
                    </td>
                    <td className="px-6 py-4 text-xs font-black">
                      <span className={`px-2.5 py-1 rounded-lg ${String(row.ATTACH_FOR).toUpperCase() === 'BED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {String(row.ATTACH_FOR || "").toUpperCase() === "BED" ? "BED" : "HORSE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">{tireMap[String(row.TIRE_ID)]?.TIRE_NO || row.TIRE_ID || ""}</td>
                    <td className="px-6 py-4 text-sm text-blue-600 font-black">{positionMap[String(row.POSITION_ID)]?.POSITION_CODE || ""}</td>
                    <td className="px-6 py-4 text-[11px] text-slate-500 font-bold">{positionMap[String(row.POSITION_ID)]?.POSITION_NAME || ""}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">{formatDateOnly(row.ATTACH_DATE)}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 font-medium">{formatDateOnly(row.DETACH_DATE) || "-"}</td>
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
