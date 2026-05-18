import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  Tag,
  Layers,
  DollarSign,
  FileText,
  Terminal as TerminalIcon
} from "lucide-react";
import { itemMasterAPI } from "../utils/Api";

const initialFormData = {
  item_code: "",
  item_name: "",
  item_group: "",
  unit: "",
  unit_price: "",
  status: "ACTIVE",
  remarks: "",
  terminal_id: ""
};

const ItemMaster = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(initialFormData);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await itemMasterAPI.getAll();
      if (response.success) {
        setItems(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setSelectedItem(null);
    setIsEditing(false);
    setFormData(initialFormData);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setIsEditing(false);
    setFormData({
      item_code: item.ITEM_CODE || "",
      item_name: item.ITEM_NAME || "",
      item_group: item.ITEM_GROUP || "",
      unit: item.UNIT || "",
      unit_price: item.UNIT_PRICE || "",
      status: item.STATUS || "ACTIVE",
      remarks: item.REMARKS || "",
      terminal_id: item.TERMINAL_ID || ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_code.trim() || !formData.item_name.trim()) {
      toast.error("Item code and name are required");
      return;
    }

    try {
      if (selectedItem) {
        const response = await itemMasterAPI.update(selectedItem.ITEM_ID, formData);
        if (response.success) {
          toast.success("Item updated successfully");
          fetchItems();
          setIsEditing(false);
        }
      } else {
        const response = await itemMasterAPI.create(formData);
        if (response.success) {
          toast.success("Item created successfully");
          fetchItems();
          resetForm();
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to save item");
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await itemMasterAPI.delete(selectedItem.ITEM_ID);
      if (response.success) {
        toast.success("Item deleted successfully");
        fetchItems();
        resetForm();
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete item");
    }
  };

  const filteredItems = items.filter((item) =>
    `${item.ITEM_CODE || ""} ${item.ITEM_NAME || ""} ${item.ITEM_GROUP || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Package size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Item Master</h1>
              <p className="text-slate-500 font-medium text-sm">Manage company inventory and services</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsEditing(true);
            }}
            className="flex items-center justify-center gap-2 px-6 h-12 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add New Item
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* List Section */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-280px)]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Registry ({filteredItems.length})</h3>
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">Loading registry...</div>
              ) : filteredItems.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm font-medium">No items found</div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.ITEM_ID}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full p-4 text-left border-b border-slate-50 transition-all hover:bg-slate-50 group ${
                      selectedItem?.ITEM_ID === item.ITEM_ID ? "bg-indigo-50/50 border-l-4 border-l-indigo-600" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{item.ITEM_CODE}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${
                        item.STATUS === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {item.STATUS}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{item.ITEM_NAME}</h4>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Layers size={12} /> {item.ITEM_GROUP || 'General'}</span>
                      <span className="flex items-center gap-1 font-black text-slate-600">₹{item.UNIT_PRICE || '0'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[600px] flex flex-col">
            {/* Form/Detail Header */}
            <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {isEditing ? (selectedItem ? "Edit Item" : "New Item Configuration") : "Item Profile"}
                </h2>
                {!isEditing && selectedItem && (
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Reference ID: #{selectedItem.ITEM_ID}</p>
                )}
              </div>
              
              {!isEditing && selectedItem && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Edit Item"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete Item"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-8">
              {!selectedItem && !isEditing ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mb-6 border-2 border-dashed border-slate-100">
                    <Package size={40} />
                  </div>
                  <h3 className="text-slate-900 font-black text-lg mb-2">No Item Selected</h3>
                  <p className="text-slate-400 font-medium text-sm max-w-[240px]">Select an item from the registry or create a new one to begin</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Item Code */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Tag size={12} className="text-indigo-500" /> Item Code
                      </label>
                      <input
                        type="text"
                        name="item_code"
                        value={formData.item_code}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g. SRV-001"
                        className="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Item Name */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <FileText size={12} className="text-indigo-500" /> Item Name
                      </label>
                      <input
                        type="text"
                        name="item_name"
                        value={formData.item_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter descriptive name"
                        className="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Group */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Layers size={12} className="text-indigo-500" /> Item Group
                      </label>
                      <input
                        type="text"
                        name="item_group"
                        value={formData.item_group}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g. Spare Parts"
                        className="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <DollarSign size={12} className="text-indigo-500" /> Unit Price (₹)
                      </label>
                      <input
                        type="number"
                        name="unit_price"
                        value={formData.unit_price}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="0.00"
                        className="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Unit */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         Unit of measure
                      </label>
                      <input
                        type="text"
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g. PCS, KG, LTR"
                        className="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed appearance-none"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>

                    {/* Remarks - Full Width */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Additional Remarks
                      </label>
                      <textarea
                        name="remarks"
                        rows={3}
                        value={formData.remarks}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Enter any additional notes..."
                        className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed resize-none"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  {isEditing && (
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedItem) {
                            handleSelectItem(selectedItem);
                          } else {
                            resetForm();
                          }
                        }}
                        className="flex items-center gap-2 px-6 h-12 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-8 h-12 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        <Check size={18} />
                        {selectedItem ? "Save Changes" : "Create Item"}
                      </button>
                    </div>
                  )}

                  {!isEditing && selectedItem && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
                      <div className="p-4 rounded-2xl bg-slate-50 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                          <Check size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created By</p>
                          <p className="text-xs font-bold text-slate-700">{selectedItem.CREATED_BY || 'System'}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                          <AlertCircle size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Update</p>
                          <p className="text-xs font-bold text-slate-700">
                            {selectedItem.UPDATED_ON ? new Date(selectedItem.UPDATED_ON).toLocaleString() : 'No updates recorded'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemMaster;
