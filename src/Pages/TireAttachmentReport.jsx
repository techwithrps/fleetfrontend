import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  equipmentAPI,
  bedAPI,
  tireMasterAPI,
  tirePositionAPI,
  driverAPI,
  tireAttachmentAPI,
} from "../utils/Api";
import {
  Search,
  Truck,
  RotateCcw,
  FileText,
  Calendar,
  Eye,
  MapPin,
  ChevronRight,
  Download,
  AlertCircle,
  Package,
} from "lucide-react";

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
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
      toast.error("Audit failure");
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
      toast.error("No transactional records found");
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

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TYRE_REPORT");
    XLSX.writeFile(wb, `TYRE_AUDIT_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="bg-white border-b border-slate-200 mb-8">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                Tire Attachment Report
              </h1>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">
                History of tire changes on vehicles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search Vehicle No..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVehicleLookup()}
                  className="input-clean pl-10 pr-4 py-2 text-[11px] w-64"
                />
             </div>
             <button onClick={handleVehicleLookup} className="btn-action px-6 py-2">
                Search
             </button>
             <button onClick={() => exportTyreAttachReport()} className="btn-action bg-emerald-600 border-emerald-600 hover:bg-emerald-700 px-6 py-2 flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />
                Export Excel
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
        {selectedVehicle && (
          <div className="card-premium p-6 bg-white mb-8 border-l-4 border-l-primary animate-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex items-center gap-4 pr-8 lg:border-r border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Vehicle Number</p>
                  <p className="text-xl font-display font-bold text-foreground tracking-tight">{selectedVehicle.EQUIPMENT_NO}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Driver Name</p>
                  <p className="text-[11px] font-bold text-foreground truncate">
                    {driverMap[String(selectedVehicle.DRIVER_ATTACH_ID)]?.DRIVER_NAME || "NOT ASSIGNED"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Configuration</p>
                  <p className="text-[11px] font-bold text-foreground">{selectedVehicle.MODEL || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Resource Status</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${selectedVehicle.STATUS === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {selectedVehicle.STATUS === 'A' ? 'Deployed' : 'Operational'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Insurance Expiry</p>
                  <p className="text-[11px] font-bold text-foreground">{formatDateOnly(selectedVehicle.INS_VALIDITY) || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card-premium overflow-hidden bg-white shadow-xl shadow-slate-200/40">
          <div className="bg-slate-50/80 px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-primary/60" />
              <h3 className="text-[12px] font-bold text-foreground uppercase tracking-widest">
                History List {searchTerm && `: Details of ${searchTerm}`}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
              Total <span className="text-foreground">{filteredRows.length} Entries Found</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-border">
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">Vehicle/Bed</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">Tire Number</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">Tire Position</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">Attach Date</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">Detach Date</th>
                  <th className="px-6 py-4 text-[9px] font-bold text-text-muted uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <AlertCircle className="w-10 h-10" />
                        <p className="text-[11px] font-bold uppercase tracking-widest">No History Found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const isBed = String(row.ATTACH_FOR || "").toUpperCase() === "BED";
                    const position = positionMap[String(row.POSITION_ID)] || {};
                    return (
                      <tr key={index} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-6 py-4 text-[11px] font-bold text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-foreground uppercase tracking-tight">
                              {isBed ? (bedMap[String(row.BED_ID)]?.BED_NO || row.BED_ID || "-") : (equipmentMap[String(row.EQUIPMENT_ID)]?.EQUIPMENT_NO || row.EQUIPMENT_ID || "-")}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isBed ? 'text-indigo-500' : 'text-primary/70'}`}>
                              {isBed ? 'Trailer Bed' : 'Vehicle'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-foreground uppercase">{tireMap[String(row.TIRE_ID)]?.TIRE_NO || row.TIRE_ID || "N/A"}</span>
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-0.5">Asset ID: {row.TIRE_ID}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">{position.POSITION_CODE || "N/A"}</span>
                            <span className="text-[9px] font-medium text-text-muted uppercase truncate max-w-[120px]">{position.POSITION_NAME || ""}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[11px] font-bold text-slate-600">
                          {formatDateOnly(row.ATTACH_DATE)}
                        </td>
                        <td className="px-6 py-4 text-[11px] font-bold text-slate-400">
                          {formatDateOnly(row.DETACH_DATE) || "ACTIVE"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm ${String(row.ATTACH_STATUS || "").toUpperCase() === 'DETACHED' ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {String(row.ATTACH_STATUS || "ATTACHED").toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TireAttachmentReport;
