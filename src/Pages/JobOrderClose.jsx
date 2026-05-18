import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  CheckCircle, 
  Search, 
  Calendar, 
  FileText, 
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Layers,
  ChevronRight,
  ClipboardCheck,
  RefreshCw,
  Plus,
  Trash2,
  Building2,
  Package,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { jobOrderAPI, jobOrderCloseAPI, itemMasterAPI, vendorAPI } from "../utils/Api";

const JobOrderClose = () => {
  const [openOrders, setOpenOrders] = useState([]);
  const [closes, setCloses] = useState([]);
  const [items, setItems] = useState([]); // All items from Item Master
  const [vendors, setVendors] = useState([]); // All vendors from Vendor Master
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  
  const [formData, setFormData] = useState({
    jo_id: "",
    jo_no: "",
    terminal_id: "",
    trip_close_date: new Date().toISOString().split('T')[0],
    total_advance: "",
    balance_advance: "0",
    jo_close_amount: "",
    advance_refund: "NO",
    close_remarks: "",
    vendor_id: "",
    used_items: [], // Array of { item_id, item_name, quantity, unit_price }
  });

  const loadData = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      jobOrderAPI.getAll({ status: "OPEN" }),
      jobOrderCloseAPI.getAll(),
      itemMasterAPI.getAll(),
      vendorAPI.getAllVendors(),
    ]);

    const [joRes, closeRes, itemRes, vendorRes] = results;

    if (joRes.status === "fulfilled" && joRes.value.success) {
      setOpenOrders(joRes.value.data || []);
    }
    if (closeRes.status === "fulfilled" && closeRes.value.success) {
      setCloses(closeRes.value.data || []);
    }
    if (itemRes.status === "fulfilled" && itemRes.value.success) {
      setItems(itemRes.value.data || []);
    }
    if (vendorRes.status === "fulfilled" && vendorRes.value.success) {
      setVendors(vendorRes.value.data || []);
    }

    const failed = [];
    if (joRes.status === "rejected") failed.push("job orders");
    if (closeRes.status === "rejected") failed.push("job close records");
    if (itemRes.status === "rejected") failed.push("items");
    if (vendorRes.status === "rejected") failed.push("vendors");
    if (failed.length > 0) {
      toast.error(`Failed to load ${failed.join(", ")}`);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderSelect = (e) => {
    const joId = e.target.value;
    const order = openOrders.find((o) => String(o.JO_ID) === String(joId));
    
    const totalAdv = order ? Number(order.ADVANCE_CASH || 0) + Number(order.ADVANCE_OIL || 0) : 0;
    
    setFormData((prev) => ({
      ...prev,
      jo_id: joId,
      jo_no: order?.JO_NO || "",
      terminal_id: order?.TERMINAL_ID || "",
      total_advance: totalAdv,
      balance_advance: "0",
      jo_close_amount: "0",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      used_items: [...prev.used_items, { item_id: "", item_name: "", quantity: 1, unit_price: 0 }]
    }));
  };

  const removeItemRow = (index) => {
    setFormData(prev => ({
      ...prev,
      used_items: prev.used_items.filter((_, i) => i !== index)
    }));
  };

  const handleItemRowChange = (index, field, value) => {
    const newItems = [...formData.used_items];
    if (field === 'item_id') {
      const selectedItem = items.find(i => String(i.ITEM_ID) === String(value));
      newItems[index] = {
        ...newItems[index],
        item_id: value,
        item_name: selectedItem?.ITEM_NAME || "",
        unit_price: selectedItem?.UNIT_PRICE || 0
      };
    } else {
      newItems[index][field] = value;
    }
    setFormData(prev => ({ ...prev, used_items: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jo_id) {
      toast.error("Please select a job order to close");
      return;
    }
    
    setSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        items: formData.used_items
      };

      const response = await jobOrderCloseAPI.create(submissionData);
      if (response.success) {
        toast.success(`Job Order ${formData.jo_no} closed successfully`);
        setFormData({
          jo_id: "",
          jo_no: "",
          terminal_id: "",
          trip_close_date: new Date().toISOString().split('T')[0],
          total_advance: "",
          balance_advance: "0",
          jo_close_amount: "",
          advance_refund: "NO",
          close_remarks: "",
          vendor_id: "",
          used_items: [],
        });
        loadData();
      } else {
        toast.error(response.error || "Failed to close job order");
      }
    } catch (error) {
      toast.error(error.message || "Failed to close job order");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCloses = closes.filter(c => 
    (c.JO_NO || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.VEHICLE_NO || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.DRIVER_NAME || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.VENDOR_NAME || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatINR = (value) => {
    const amount = Number(value || 0);
    return `₹${Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "0"}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <CheckCircle size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Job Order Close</h1>
              <p className="text-slate-500 font-medium text-sm">Settle advances, track parts, and finalize trips</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Clock size={14} className="text-emerald-500" />
            Active Jobs: {openOrders.length}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settlement Form */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-black text-slate-900">Close Transaction</h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Enter settlement details and inventory usage</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* JO Selection */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Layers size={12} className="text-emerald-500" /> Select Job Order
                  </label>
                  <select
                    value={formData.jo_id}
                    onChange={handleOrderSelect}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Choose an open job order...</option>
                    {openOrders.map((order) => (
                      <option key={order.JO_ID} value={order.JO_ID}>
                        {order.JO_NO} — {order.VEHICLE_NO || 'N/A'} ({order.DRIVER_NAME || 'Unknown'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vendor Dropdown */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Building2 size={12} className="text-emerald-500" /> Vendor / Service Provider
                  </label>
                  <select
                    name="vendor_id"
                    value={formData.vendor_id}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a vendor from master...</option>
                    {vendors.map((v) => (
                      <option key={v.VENDOR_ID} value={v.VENDOR_ID}>
                        {v.VENDOR_NAME} ({v.VENDOR_CODE || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Total Advance */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Advance
                  </label>
                  <input
                    type="number"
                    name="total_advance"
                    value={formData.total_advance}
                    readOnly
                    className="w-full h-12 px-4 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500"
                  />
                </div>

                {/* Balance Advance */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <RefreshCw size={12} className="text-emerald-500" /> Balance Advance
                  </label>
                  <input
                    type="number"
                    name="balance_advance"
                    value={formData.balance_advance}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Close Amount */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Settlement Amount
                  </label>
                  <input
                    type="number"
                    name="jo_close_amount"
                    value={formData.jo_close_amount}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-emerald-50/30 border border-emerald-100 rounded-xl text-sm font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Refund Toggle */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Advance Refund
                  </label>
                  <select
                    name="advance_refund"
                    value={formData.advance_refund}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                  >
                    <option value="YES">Yes, Refunded</option>
                    <option value="NO">No Refund</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                      <Package size={18} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Items Used</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[11px] hover:bg-indigo-100 transition-all active:scale-95"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.used_items.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No items added to this closure</p>
                    </div>
                  ) : (
                    formData.used_items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Item from Master</label>
                          <select
                            value={item.item_id}
                            onChange={(e) => handleItemRowChange(idx, 'item_id', e.target.value)}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500"
                          >
                            <option value="">Select an item...</option>
                            {items.map(i => (
                              <option key={i.ITEM_ID} value={i.ITEM_ID}>{i.ITEM_NAME} ({i.ITEM_CODE})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemRowChange(idx, 'quantity', e.target.value)}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="h-11 w-11 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2 pt-6 border-t border-slate-100">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <FileText size={12} className="text-emerald-500" /> Settlement Remarks
                </label>
                <textarea
                  name="close_remarks"
                  rows={3}
                  value={formData.close_remarks}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes about this closure..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !formData.jo_id}
                  className="flex items-center gap-2 px-10 h-14 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <ClipboardCheck size={20} />
                  )}
                  {submitting ? "Processing..." : "Finalize & Close Job"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History Sidebar - Full Details View */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 max-h-[calc(100vh-220px)]">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Closure History</h3>
              <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-md">
                RECORDS: {filteredCloses.length}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
              {loading ? (
                <div className="py-20 text-center animate-pulse">
                  <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-4" />
                  <p className="text-slate-300 font-bold text-sm uppercase tracking-widest">Fetching records...</p>
                </div>
              ) : filteredCloses.length === 0 ? (
                <div className="py-20 text-center">
                  <Filter size={32} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold text-sm">No closure records found</p>
                </div>
              ) : (
                filteredCloses.map((close) => (
                  <div 
                    key={close.JO_CLOSE_ID} 
                    className={`group mb-4 rounded-[24px] border transition-all overflow-hidden ${
                      expandedId === close.JO_CLOSE_ID 
                      ? "border-emerald-200 bg-emerald-50/10 ring-1 ring-emerald-50 shadow-lg shadow-emerald-50" 
                      : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    {/* Compact Header */}
                    <button 
                      onClick={() => setExpandedId(expandedId === close.JO_CLOSE_ID ? null : close.JO_CLOSE_ID)}
                      className="w-full text-left p-5 flex items-start justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">{close.JO_NO}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="text-[10px] font-bold text-slate-400">
                            {close.TRIP_CLOSE_DATE ? new Date(close.TRIP_CLOSE_DATE).toLocaleDateString('en-GB') : 'N/A'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {close.VEHICLE_NO || close.JO_NO || "Job Order"}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          <span>{formatINR(close.JO_CLOSE_AMOUNT)}</span>
                          {close.VENDOR_NAME && <span className="flex items-center gap-1 text-indigo-500"><Building2 size={10} /> {close.VENDOR_NAME}</span>}
                        </div>
                      </div>
                      <div className="mt-1 p-1 bg-slate-50 rounded-lg text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                        {expandedId === close.JO_CLOSE_ID ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Full Detail Content */}
                    {expandedId === close.JO_CLOSE_ID && (
                      <div className="px-5 pb-5 pt-2 border-t border-emerald-100/50 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Driver</p>
                            <p className="text-xs font-bold text-slate-700">{close.DRIVER_NAME || 'N/A'}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Advance Refund</p>
                            <p className={`text-xs font-black ${close.ADVANCE_REFUND === 'YES' ? 'text-emerald-600' : 'text-slate-600'}`}>
                              {close.ADVANCE_REFUND}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Advance</p>
                            <p className="text-xs font-bold text-slate-700">{formatINR(close.TOTAL_ADVANCE)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance Settled</p>
                            <p className="text-xs font-bold text-slate-700">{formatINR(close.BALANCE_ADVANCE)}</p>
                          </div>
                        </div>

                        {/* Items Sub-list */}
                        {close.ITEMS_SUMMARY && (
                          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Package size={10} /> Parts & Items Used
                            </p>
                            <div className="text-[11px] font-bold text-slate-600 leading-relaxed">
                              {close.ITEMS_SUMMARY.split('(').map((part, i) => (
                                <div key={i} className={i > 0 ? "mt-1" : ""}>
                                  {i === 0 ? part : `• ${part}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Remarks */}
                        <div className="mt-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Remarks</p>
                          <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                            "{close.CLOSE_REMARKS || 'No remarks provided'}"
                          </p>
                        </div>

                        {/* Audit Info */}
                        <div className="mt-6 pt-4 border-t border-slate-100/50 flex items-center justify-between text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                          <span>By: {close.CREATED_BY || 'System'}</span>
                          <span>ID: #{close.JO_CLOSE_ID}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobOrderClose;
