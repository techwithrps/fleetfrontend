import React, { useState, useEffect, Fragment } from "react";
import { toast, ToastContainer } from "react-toastify";
import api, { userAPI } from "../utils/Api";
import { useAuth } from "../contexts/AuthContext";
import { 
  Users, 
  Search, 
  RefreshCw, 
  UserPlus, 
  X, 
  Mail, 
  Phone, 
  Lock, 
  Shield, 
  User, 
  Check,
  CheckSquare,
  ShieldCheck,
  Activity,
  Layers,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit3,
  CheckCircle2,
  Plus
} from "lucide-react";
import { useLocation } from "react-router-dom";

const ROLE_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "admin", label: "Admin" },
];

const ROLE_STYLES = {
  customer: {
    badge: "bg-blue-100/80 text-blue-700 border-blue-200",
    avatar: "bg-blue-50 text-blue-600",
    empty: "No customers found",
  },
  operations: {
    badge: "bg-amber-100/80 text-amber-700 border-amber-200",
    avatar: "bg-amber-50 text-amber-600",
    empty: "No operations users found",
  },
  finance: {
    badge: "bg-emerald-100/80 text-emerald-700 border-emerald-200",
    avatar: "bg-emerald-50 text-emerald-600",
    empty: "No finance users found",
  },
  admin: {
    badge: "bg-indigo-100/80 text-indigo-700 border-indigo-200",
    avatar: "bg-indigo-50 text-indigo-600",
    empty: "No administrators found",
  },
};

// Modern User Modal
const UserModal = ({ isOpen, onClose, onSubmit, user = null, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        role: user.role?.toLowerCase() || "customer",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "customer",
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300" onClick={onClose}></div>
      <div className="relative bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-white/40 overflow-hidden transform animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-slate-800 to-slate-950 p-8 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-widest">
              {user ? "Edit User" : "Add New User"}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                required
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="USER NAME"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="email"
                required
                disabled={!!user}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 disabled:opacity-50"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="EMAIL@DOMAIN.COM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="tel"
                required
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-DIGIT MOBILE"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="password"
                required={!user}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={user ? "••••••••" : "NEW PASSWORD"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">User Role</label>
            <div className="relative group">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all duration-300 appearance-none cursor-pointer"
                value={formData.role.toLowerCase()}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {ROLE_OPTIONS.map((roleOption) => (
                  <option key={roleOption.value} value={roleOption.value}>
                    {roleOption.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : user ? "Update Protocol" : "Authorize Principal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Access Modal for Permissions
const PAGE_GROUPS = [
  {
    group: "MASTERS",
    pages: ["Vendor Master", "Fleet Equipment Master", "Driver Master", "Tire Master", "Tire Position Master", "Bed Master"]
  },
  {
    group: "TRANSACTIONS & OPERATIONS",
    pages: ["Job Order", "Job Order Close", "Bed Attach/Detach", "Tyre Attach/Detach", "My Shipments", "Container Stage", "VIN Survey", "ASN Upload"]
  },
  {
    group: "REQUESTS & TRACKING",
    pages: ["Transport Requests", "Edit Requests", "Trip Details Report", "Filter Trips"]
  },
  {
    group: "COMMERCIAL & REPORTS",
    pages: ["Payment Receipts", "Daily Advance Payments", "Container Margin Report", "Tyre Attachment Report", "Transport Reports"]
  }
];

const AccessModal = ({ isOpen, onClose, user }) => {
  const [locations, setLocations] = useState([]);
  const [pages, setPages] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [locRes, pageRes, accessRes] = await Promise.all([
          api.get("/access/locations"),
          api.get("/access/pages"),
          api.get(`/access/user/${user.id}`)
        ]);
        
        const allowedPages = [
          "Transport Requests", "Edit Requests", 
          "Trip Details Report", "Filter Trips", "My Shipments", "Container Stage", 
          "VIN Survey", "Bed Attach/Detach", "Tyre Attach/Detach", "Job Order", 
          "Job Order Close", "ASN Upload", "Vendor Master", "Fleet Equipment Master", 
          "Driver Master", "Tire Master", "Tire Position Master", "Bed Master", 
          "Payment Receipts", "Daily Advance Payments", 
          "Container Margin Report", "Tyre Attachment Report", "Transport Reports"
        ].map(p => p.toLowerCase());

        setLocations(locRes.data.data || []);
        
        const allPages = pageRes.data.data || [];
        const filteredPages = allPages.filter(p => allowedPages.includes(p.PAGE_NAME?.toLowerCase()));
        setPages(filteredPages);
        
        const initialSelections = accessRes.data.data || [];
        if (initialSelections.length > 0) {
          const locToPages = {};
          initialSelections.forEach(s => {
            const l = String(s.location_id);
            if (!locToPages[l]) locToPages[l] = [];
            locToPages[l].push({
              page_id: Number(s.page_id),
              can_view: !!s.can_view,
              can_create: !!s.can_create,
              can_edit: !!s.can_edit
            });
          });
          
          const configMap = {};
          Object.keys(locToPages).forEach(l => {
            const pStr = locToPages[l]
              .sort((a,b) => a.page_id - b.page_id)
              .map(p => `${p.page_id}:${p.can_view?1:0}${p.can_create?1:0}${p.can_edit?1:0}`)
              .join("|");
            
            if (!configMap[pStr]) configMap[pStr] = [];
            configMap[pStr].push(l);
          });
          
          const newConfigs = Object.keys(configMap).map((pStr, idx) => {
            const pageData = pStr.split("|").filter(s => s).map(s => {
              const [pid, perms] = s.split(":");
              return {
                page_id: Number(pid),
                can_view: perms[0] === '1',
                can_create: perms[1] === '1',
                can_edit: perms[2] === '1'
              };
            });
            return {
              id: Date.now() + idx,
              locs: configMap[pStr],
              pages: pageData
            };
          });
          setConfigs(newConfigs.length > 0 ? newConfigs : [{ id: Date.now(), locs: [], pages: [] }]);
        } else {
          setConfigs([{ id: Date.now(), locs: [], pages: [] }]);
        }
      } catch (err) {
        toast.error("Failed to load access config");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, user]);

  const addConfigBlock = () => setConfigs([...configs, { id: Date.now(), locs: [], pages: [] }]);
  const removeConfigBlock = (id) => setConfigs(configs.filter(c => c.id !== id));

  const togglePermission = (configId, pageId, type) => {
    setConfigs(configs.map(c => {
      if (c.id === configId) {
        const pageIdx = c.pages.findIndex(p => p.page_id === pageId);
        let nextPages = [...c.pages];
        if (pageIdx === -1) {
          nextPages.push({ page_id: pageId, can_view: type === 'view', can_create: type === 'create', can_edit: type === 'edit' });
        } else {
          const p = nextPages[pageIdx];
          const nextVal = !p[`can_${type}`];
          nextPages[pageIdx] = { ...p, [`can_${type}`]: nextVal };
          if (!nextPages[pageIdx].can_view && !nextPages[pageIdx].can_create && !nextPages[pageIdx].can_edit) {
            nextPages = nextPages.filter((_, i) => i !== pageIdx);
          }
        }
        return { ...c, pages: nextPages };
      }
      return c;
    }));
  };

  const toggleGroupPermission = (configId, groupPageNames, type) => {
    setConfigs(configs.map(c => {
      if (c.id === configId) {
        const groupPageIds = pages
          .filter(p => groupPageNames.map(n => n.toLowerCase()).includes(p.PAGE_NAME?.toLowerCase()))
          .map(p => Number(p.PAGE_ID));

        const currentGroupPages = c.pages.filter(p => groupPageIds.includes(p.page_id));
        const allHavePerm = groupPageIds.every(pid => {
          const p = currentGroupPages.find(cp => cp.page_id === pid);
          return p && p[`can_${type}`];
        });
        const targetState = !allHavePerm;

        let nextPages = [...c.pages];
        groupPageIds.forEach(pageId => {
          const pageIdx = nextPages.findIndex(p => p.page_id === pageId);
          if (pageIdx === -1) {
            if (targetState) {
              nextPages.push({ page_id: pageId, can_view: type === 'view', can_create: type === 'create', can_edit: type === 'edit' });
            }
          } else {
            const p = nextPages[pageIdx];
            nextPages[pageIdx] = { ...p, [`can_${type}`]: targetState };
            if (!nextPages[pageIdx].can_view && !nextPages[pageIdx].can_create && !nextPages[pageIdx].can_edit) {
              nextPages[pageIdx].cleanup = true;
            }
          }
        });
        nextPages = nextPages.filter(p => !p.cleanup);
        return { ...c, pages: nextPages };
      }
      return c;
    }));
  };

  const toggleRowFullAccess = (configId, pageId) => {
    setConfigs(configs.map(c => {
      if (c.id === configId) {
        const pageIdx = c.pages.findIndex(p => p.page_id === pageId);
        let nextPages = [...c.pages];
        
        if (pageIdx === -1) {
          nextPages.push({ page_id: pageId, can_view: true, can_create: true, can_edit: true });
        } else {
          const p = nextPages[pageIdx];
          const hasAll = p.can_view && p.can_create && p.can_edit;
          
          if (hasAll) {
            nextPages = nextPages.filter((_, i) => i !== pageIdx);
          } else {
            nextPages[pageIdx] = { ...p, can_view: true, can_create: true, can_edit: true };
          }
        }
        return { ...c, pages: nextPages };
      }
      return c;
    }));
  };

  const toggleLocation = (configId, locId) => {
    setConfigs(configs.map(c => {
      if (c.id === configId) {
        const hasLoc = c.locs.includes(locId);
        return { ...c, locs: hasLoc ? c.locs.filter(l => l !== locId) : [...c.locs, locId] };
      } else {
        return { ...c, locs: c.locs.filter(l => l !== locId) };
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const assignments = [];
      configs.forEach(c => {
        c.locs.forEach(locId => {
          c.pages.forEach(p => {
            assignments.push({ 
              location_id: Number(locId), 
              page_id: Number(p.page_id),
              can_view: p.can_view ? 1 : 0,
              can_create: p.can_create ? 1 : 0,
              can_edit: p.can_edit ? 1 : 0
            });
          });
        });
      });
      const res = await api.post(`/access/user/${user.id}`, { assignments });
      if (res.data?.success) {
        toast.success("Access policy enforced!");
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save access");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-5 text-white flex-shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-wider">Enforce Access Policy</h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">User: {user?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20">
             <RefreshCw size={48} className="animate-spin text-indigo-500 mb-6" />
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Permissions Matrix...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50">
            {configs.map((config, index) => (
              <div key={config.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      Deployment Nodes (Group {index + 1})
                    </label>
                    <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto custom-scrollbar pr-2">
                      {locations.map(loc => {
                        const locIdStr = String(loc.location_id);
                        const isSelectedHere = config.locs.includes(locIdStr);
                        const isSelectedElsewhere = configs.some(c => c.id !== config.id && c.locs.includes(locIdStr));
                        
                        return (
                          <button
                            key={loc.location_id}
                            onClick={() => toggleLocation(config.id, locIdStr)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors border ${
                              isSelectedHere 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : isSelectedElsewhere
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                            }`}
                          >
                            {loc.LOCATION_NAME}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {configs.length > 1 && (
                    <button onClick={() => removeConfigBlock(config.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Registry Module</th>
                        <th className="text-center py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-24">Full Access</th>
                        <th className="text-center py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-24">Read Access</th>
                        <th className="text-center py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-24">Write Access</th>
                        <th className="text-center py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-24">Edit Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {PAGE_GROUPS.map(({ group, pages: groupPageNames }) => {
                        const pagesInGroup = pages.filter(p => groupPageNames.map(name => name.toLowerCase()).includes(p.PAGE_NAME?.toLowerCase()));
                        if (pagesInGroup.length === 0) return null;
                        const hasNoLoc = config.locs.length === 0;
                        
                        return (
                          <Fragment key={group}>
                            <tr className="bg-indigo-50/30">
                              <td colSpan="2" className="px-5 py-2 text-[10px] font-bold uppercase text-indigo-700 tracking-wider border-b border-indigo-100">{group}</td>
                              <td className="py-2 text-center border-b border-indigo-100">
                                <button
                                  disabled={hasNoLoc}
                                  onClick={() => toggleGroupPermission(config.id, groupPageNames, 'view')}
                                  className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${hasNoLoc ? 'text-indigo-300 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                                >
                                  Select All
                                </button>
                              </td>
                              <td className="py-2 text-center border-b border-indigo-100">
                                <button
                                  disabled={hasNoLoc}
                                  onClick={() => toggleGroupPermission(config.id, groupPageNames, 'create')}
                                  className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${hasNoLoc ? 'text-indigo-300 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                                >
                                  Select All
                                </button>
                              </td>
                              <td className="py-2 text-center border-b border-indigo-100">
                                <button
                                  disabled={hasNoLoc}
                                  onClick={() => toggleGroupPermission(config.id, groupPageNames, 'edit')}
                                  className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${hasNoLoc ? 'text-indigo-300 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                                >
                                  Select All
                                </button>
                              </td>
                            </tr>
                            {pagesInGroup.map(page => {
                              const pageEntry = config.pages.find(p => p.page_id === Number(page.PAGE_ID));
                              const canView = !!pageEntry?.can_view;
                              const canCreate = !!pageEntry?.can_create;
                              const canEdit = !!pageEntry?.can_edit;
                              const hasNoLoc = config.locs.length === 0;

                              const hasAll = canView && canCreate && canEdit;

                              return (
                                <tr key={page.PAGE_ID} className="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                  <td className="px-5 py-2.5">
                                    <span className={`text-xs font-semibold tracking-tight ${hasNoLoc ? 'text-slate-400' : 'text-slate-700'}`}>{page.PAGE_NAME}</span>
                                  </td>
                                  <td className="py-2.5 text-center bg-slate-50/50 border-x border-slate-100">
                                    <button
                                      disabled={hasNoLoc}
                                      onClick={() => toggleRowFullAccess(config.id, Number(page.PAGE_ID))}
                                      className={`mx-auto w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                                        hasAll ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-300 hover:border-slate-400'
                                      } ${hasNoLoc ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                      title="Select All"
                                    >
                                      {hasAll && <Check size={12} strokeWidth={4} />}
                                    </button>
                                  </td>
                                  <td className="py-2.5 text-center">
                                    <button
                                      disabled={hasNoLoc}
                                      onClick={() => togglePermission(config.id, Number(page.PAGE_ID), 'view')}
                                      className={`mx-auto w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                                        canView ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-300 hover:border-slate-400'
                                      } ${hasNoLoc ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                      {canView && <Check size={12} strokeWidth={4} />}
                                    </button>
                                  </td>
                                  <td className="py-2.5 text-center">
                                    <button
                                      disabled={hasNoLoc}
                                      onClick={() => togglePermission(config.id, Number(page.PAGE_ID), 'create')}
                                      className={`mx-auto w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                                        canCreate ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-300 hover:border-slate-400'
                                      } ${hasNoLoc ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                      {canCreate && <Check size={12} strokeWidth={4} />}
                                    </button>
                                  </td>
                                  <td className="py-2.5 text-center">
                                    <button
                                      disabled={hasNoLoc}
                                      onClick={() => togglePermission(config.id, Number(page.PAGE_ID), 'edit')}
                                      className={`mx-auto w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                                        canEdit ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-300 hover:border-slate-400'
                                      } ${hasNoLoc ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                      {canEdit && <Check size={12} strokeWidth={4} />}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <button
              onClick={addConfigBlock}
              className="w-full py-5 border border-dashed border-slate-300 rounded-xl text-slate-500 font-bold uppercase text-xs hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Plus size={16} />
              </div>
              Add New Protocol Group
            </button>
          </div>
        )}

        <div className="p-5 border-t border-slate-200 bg-white flex gap-3 flex-shrink-0 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wide hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || configs.every(c => c.locs.length === 0)}
            className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs uppercase tracking-wide hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Deploying..." : "Enforce Access Policy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessTargetUser, setAccessTargetUser] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      if (response.success) setUsers(response.data || response.users || []);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO TERMINATE THIS ACCOUNT?")) return;
    try {
      const response = await userAPI.deleteUser(userId);
      if (response.success) {
        toast.success("Account Terminated");
        loadUsers();
      }
    } catch (error) {
      toast.error("Termination Failed");
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const response = await userAPI.updateUserRole(userId, { role: newRole });
      if (response.success) {
        toast.success("Role Reassigned");
        loadUsers();
      }
    } catch (error) {
      toast.error("Reassignment Failed");
    }
  };

  const handleModalSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      let response;
      if (selectedUser) response = await userAPI.updateUser(selectedUser.id, formData);
      else response = await userAPI.createUser(formData);
      if (response.success) {
        toast.success(selectedUser ? "Profile Updated" : "Identity Created");
        loadUsers();
        setIsModalOpen(false);
      }
    } catch (error) {
      toast.error("Operation Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderUserSection = (title, usersInSection, roleKey, showGiveRole = false) => {
    const roleStyle = ROLE_STYLES[roleKey];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            {title} ({usersInSection.length})
          </h2>
        </div>
        <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-100/50 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Name</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Details</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usersInSection.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[13px] font-black ${roleStyle.avatar} border border-slate-100 shadow-sm uppercase group-hover:scale-110 transition-transform`}>
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{u.name}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">USER_ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{u.email}</div>
                      <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter italic">{u.phone || "NO PHONE"}</div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <select
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl border appearance-none text-center transition-all cursor-pointer outline-none focus:ring-4 focus:ring-indigo-500/10 ${roleStyle.badge}`}
                        value={u.role?.toLowerCase()}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                      >
                        {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>)}
                      </select>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        {showGiveRole && (
                          <button onClick={() => { setAccessTargetUser(u); setIsAccessModalOpen(true); }} className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl border border-emerald-100 transition-all shadow-sm">
                            <ShieldCheck size={18} strokeWidth={2.5} />
                          </button>
                        )}
                        <button onClick={() => { setSelectedUser(u); setIsModalOpen(true); }} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl border border-indigo-100 transition-all shadow-sm">
                          <Edit3 size={18} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-3 text-rose-600 hover:bg-rose-50 rounded-2xl border border-rose-100 transition-all shadow-sm">
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usersInSection.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-16 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                      {roleStyle.empty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      <ToastContainer position="top-right" autoClose={2000} />
      
      <header className="bg-white border-b border-slate-200 mb-8">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <Users className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  User <span className="text-indigo-600 tracking-tighter">Management</span>
                </h1>
                <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                  <Activity size={14} className="text-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Manage user access and roles</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH USERS..."
                  className="w-72 h-11 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
                className="h-11 px-6 rounded-xl bg-indigo-600 text-white flex items-center gap-2.5 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-300"
              >
                <UserPlus size={18} strokeWidth={3} />
                Add User
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-10 space-y-12">
        {renderUserSection("Administrators", filteredUsers.filter(u => u.role?.toLowerCase() === "admin"), "admin")}
        {renderUserSection("Operations Team", filteredUsers.filter(u => u.role?.toLowerCase() === "operations"), "operations", true)}
        {renderUserSection("Finance Team", filteredUsers.filter(u => u.role?.toLowerCase() === "finance"), "finance", true)}
        {renderUserSection("Customers", filteredUsers.filter(u => u.role?.toLowerCase() === "customer"), "customer", true)}
      </main>

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleModalSubmit} user={selectedUser} isSubmitting={isSubmitting} />
      {isAccessModalOpen && <AccessModal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} user={accessTargetUser} />}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        @keyframes zoom-in-95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation-fill-mode: forwards; }
      `}} />
    </div>
  );
}
