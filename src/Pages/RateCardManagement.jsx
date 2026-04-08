import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  TrendingUp,
  Filter,
  Eye,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Info,
  Download,
  Upload,
  ArrowRight,
  Search,
  Package
} from 'lucide-react';
import { rateCardAPI } from '../utils/Api';
import { toast } from 'react-toastify';

const RateCardManagement = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'upload'
  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    contract_name: '',
    rate_code: '',
    customer_type: 'Direct',
    customer_name: '',
    remarks: '',
    valid_from: '',
    valid_to: '',
    doc_type: 'Export',
    service_type: 'Transportation',
    from_location: '',
    to_location: '',
    handover_location: '',
    pol: '',
    pod: '',
    container_size: '20ft',
    container_type: 'DV',
    container_status: 'Loaded',
    commodity: '',
    weight_range_from: '0',
    weight_range_to: '99999',
    base_rate: '',
    discount: '0',
    final_rate: '',
    rate_type: 'fixed'
  });

  useEffect(() => {
    fetchRateCards();
  }, []);

  const fetchRateCards = async () => {
    try {
      const response = await rateCardAPI.getCustomerRates();
      if (response.data.success) {
        setRateCards(response.data.rateCards);
      }
    } catch (error) {
      toast.error('Failed to fetch rate cards');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'base_rate' || name === 'discount') {
        const base = parseFloat(name === 'base_rate' ? value : prev.base_rate) || 0;
        const disc = parseFloat(name === 'discount' ? value : prev.discount) || 0;
        newData.final_rate = (base - disc).toString();
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await rateCardAPI.create(formData);
      if (response.data.success) {
        toast.success('Rate card submitted');
        setShowModal(false);
        fetchRateCards();
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    }
  };

  const resetForm = () => {
    setFormData({
      contract_name: '',
      rate_code: '',
      customer_type: 'Direct',
      customer_name: '',
      remarks: '',
      valid_from: '',
      valid_to: '',
      doc_type: 'Export',
      service_type: 'Transportation',
      from_location: '',
      to_location: '',
      handover_location: '',
      pol: '',
      pod: '',
      container_size: '20ft',
      container_type: 'DV',
      container_status: 'Loaded',
      commodity: '',
      weight_range_from: '0',
      weight_range_to: '99999',
      base_rate: '',
      discount: '0',
      final_rate: '',
      rate_type: 'fixed'
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this rate card?")) return;
    setIsDeleting(id);
    try {
      await rateCardAPI.delete(id);
      toast.success("Deleted");
      fetchRateCards();
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(null);
    }
  };

  // CSV Parsing optimized for report-style template
  const parseCSV = (text) => {
    const lines = text.split("\n");
    if (lines.length < 2) return { data: [], errors: ["File is empty"] };
    
    // Global extracted values
    const globalData = {
        rate_code: 'RC-CSV',
        customer_type: 'Direct',
        contract_name: 'CSV Import',
        remarks: 'Bulk Upload'
    };

    // Scan for global values in first few rows
    lines.slice(0, 10).forEach(line => {
      const parts = line.split(",").map(v => v.trim());
      parts.forEach((p, idx) => {
        if (p.toLowerCase().includes("rate code")) globalData.rate_code = parts[idx+1] || globalData.rate_code;
        if (p.toLowerCase().includes("customer type")) globalData.customer_type = parts[idx+1] || globalData.customer_type;
        if (p.toLowerCase().includes("customer") && !p.toLowerCase().includes("type")) globalData.contract_name = parts[idx+1] || globalData.contract_name;
        if (p.toLowerCase().includes("remarks")) globalData.remarks = parts[idx+1] || globalData.remarks;
      });
    });

    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const cleanLine = lines[i].toLowerCase();
        if (cleanLine.includes("from date") && cleanLine.includes("doc type") && cleanLine.includes("servicce")) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) return { data: [], errors: ["Detail header not found. Make sure 'From Date' and 'Doc Type' are in the header row."] };

    const headers = lines[headerIndex].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const data = [];
    const errors = [];

    const fieldMap = {
        "from date": "valid_from", "to date": "valid_to", "doc type": "doc_type",
        "service": "service_type", "servicce": "service_type", "from/pickup": "from_location",
        "to location": "to_location", "handover location": "handover_location",
        "pol": "pol", "pod": "pod", "cont size": "container_size", "cont type": "container_type",
        "cont status": "container_status", "commodity": "commodity", "from range": "weight_range_from",
        "to range": "weight_range_to", "base rate": "base_rate", "discount": "discount", "rate": "final_rate"
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;
            return date.toISOString().split('T')[0];
        } catch (e) { return null; }
    };

    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith(',,,,,') || line.toLowerCase().includes("field name")) continue;
        
        const values = line.split(",").map(v => v.trim().replace(/"/g, ''));
        const row = { ...globalData };
        
        headers.forEach((h, idx) => {
            const field = fieldMap[h.trim()];
            if (field) {
                let val = values[idx] || '';
                if (field === 'valid_from' || field === 'valid_to') val = formatDate(val);
                if (['base_rate', 'discount', 'final_rate', 'weight_range_from', 'weight_range_to'].includes(field)) {
                    val = parseFloat(val) || 0;
                }
                row[field] = val;
            }
        });

        // Basic row validation
        if (row.valid_from && row.doc_type) {
            data.push(row);
        }
    }
    return { data, errors };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    const text = await file.text();
    const { data, errors } = parseCSV(text);
    setCsvData(data);
    setCsvErrors(errors);
  };

  const handleBulkSubmit = async () => {
    setIsUploading(true);
    try {
      const response = await rateCardAPI.createBulk(csvData);
      if (response.data.success) {
        toast.success("Bulk upload successful");
        setActiveTab('list');
        fetchRateCards();
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Rate Code,Customer Type,Customer,Remarks\n" + 
      "RC-001,Direct,Alpha Terminals,Test Rate Card\n\n" + 
      "From Date,To Date,Doc Type,Servicce,From/Pickup,To Location,Handover Location,POL,POD,Cont Size,Cont Type,Cont Status,Commodity,From Range,To Range,Base Rate,Discount,Rate\n" + 
      "4/1/2026,3/31/2027,Export,Transportation,Panki,Lucknow,Panki,JNPT,JEBAL ALI,40,DV,Loaded,Toys,0,99999,40000,0,40000";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "RateCard_Standard_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Rates</h1>
          <p className="text-sm text-gray-500">Manage and upload your service pricing schedules</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-gray-100 p-1 rounded-xl flex">
                <button 
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Rate Registry
                </button>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Bulk Upload
                </button>
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center"
            >
                <Plus className="w-4 h-4 mr-2" /> New Rate
            </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search customer, location or code..." className="w-full pl-11 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>
                <button className="p-2.5 rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 transition-all"><Filter className="w-4 h-4" /></button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Service & Identity</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Route Detail</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Container</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Net Rate</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan="6" className="px-6 py-4"><div className="h-10 bg-gray-100 rounded-lg w-full"></div></td>
                                </tr>
                            ))
                        ) : rateCards.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-20 text-center">
                                    <div className="max-w-xs mx-auto">
                                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-medium">No rates found in registry.</p>
                                        <button onClick={() => setShowModal(true)} className="text-blue-600 text-sm font-bold mt-2 hover:underline">Add your first rate card →</button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rateCards.map((card) => (
                                <tr key={card.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 tracking-tight">{card.rate_code || 'RC-' + card.id}</div>
                                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{card.contract_name || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm font-bold text-gray-700">
                                            {card.from_location} <ArrowRight className="w-3 h-3 mx-2 text-gray-300" /> {card.to_location}
                                        </div>
                                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{card.pol || '---'} → {card.pod || '---'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-black text-gray-800">{card.container_size} {card.container_type}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{card.container_status}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm font-black text-gray-900">₹{(parseFloat(card.final_rate) || 0).toLocaleString()}</div>
                                        {parseFloat(card.discount) > 0 && <div className="text-[10px] text-red-300 line-through">₹{card.base_rate}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(card.status)}`}>
                                            {card.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button 
                                                onClick={() => setSelectedCard(card)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(card.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-blue-600 p-10 rounded-[2.5rem] text-white overflow-hidden relative shadow-2xl shadow-blue-200">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Bulk Import</h2>
                    <p className="text-blue-100 text-sm font-medium max-w-sm">Scale your operations by importing contract rates in bulk via CSV report.</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4"><Upload className="w-64 h-64" /></div>
            </div>

            <div 
                onClick={() => fileInputRef.current.click()}
                className={`border-4 border-dashed rounded-[2.5rem] p-16 text-center transition-all cursor-pointer ${csvFile ? 'border-green-300 bg-green-50/30' : 'border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30'}`}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ${csvFile ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {csvFile ? <CheckCircle className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                </div>
                <h3 className="text-xl font-black text-gray-900 italic tracking-tight">{csvFile ? csvFile.name : "Choose CSV Report"}</h3>
                <p className="text-sm font-medium text-gray-500 mt-2">Compatible with standard logistics CSV templates.</p>
                {csvData.length > 0 && <div className="mt-4 inline-block bg-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-100 shadow-sm shadow-blue-50">Parsed {csvData.length} records</div>}
                
                {csvErrors.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 text-left max-h-40 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-black uppercase text-red-400 mb-2 tracking-widest flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-2" /> Validation Issues
                    </p>
                    <ul className="text-[10px] text-red-600 space-y-1 list-disc list-inside">
                      {csvErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button 
                  onClick={downloadTemplate}
                  className="px-8 py-4 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" /> Template
                </button>
                <button 
                  onClick={handleBulkSubmit}
                  disabled={!csvFile || isUploading}
                  className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-gray-200 hover:bg-black transition-all flex items-center justify-center disabled:opacity-30"
                >
                  {isUploading ? "Processing..." : "Execute Bulk Upload →"}
                </button>
            </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/20">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
                <div className="p-10 border-b border-gray-50 flex justify-between items-start">
                    <div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-3 inline-block">Rate Overview</span>
                        <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{selectedCard.rate_code || 'RC-' + selectedCard.id}</h3>
                        <p className="text-sm text-gray-500 font-medium">{selectedCard.contract_name}</p>
                    </div>
                    <button onClick={() => setSelectedCard(null)} className="p-3 hover:bg-gray-100 rounded-full text-gray-400 transition-all"><XCircle className="w-8 h-8" /></button>
                </div>
                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Routing Details</p>
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-bold text-gray-700 bg-gray-50 px-4 py-2 rounded-xl">{selectedCard.from_location}</div>
                                <ArrowRight className="w-4 h-4 text-blue-400" />
                                <div className="text-sm font-bold text-gray-700 bg-gray-50 px-4 py-2 rounded-xl">{selectedCard.to_location}</div>
                            </div>
                            <div className="text-xs text-gray-400 font-medium">POL: {selectedCard.pol || 'N/A'} | POD: {selectedCard.pod || 'N/A'}</div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Specification</p>
                            <div className="text-sm font-bold text-gray-800">{selectedCard.container_size} {selectedCard.container_type} - {selectedCard.container_status}</div>
                            <div className="text-xs text-gray-400 font-medium">Commodity: {selectedCard.commodity || 'General Cargo'}</div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-900 p-8 rounded-[2rem] flex items-center justify-between shadow-2xl shadow-gray-200">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">Negotiated Contract Rate</p>
                            <p className="text-4xl font-black text-white italic tracking-tighter">₹{parseFloat(selectedCard.final_rate || 0).toLocaleString()}</p>
                        </div>
                        <div className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border shadow-lg ${getStatusStyle(selectedCard.status)}`}>
                            {selectedCard.status}
                        </div>
                    </div>
                </div>
                <div className="px-10 pb-10 flex gap-4">
                    <button onClick={() => setSelectedCard(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Close</button>
                </div>
            </div>
        </div>
      )}

      {/* Simplified New Rate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
                <div className="p-8 border-b flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">New Rate Configuration</h3>
                        <p className="text-sm text-gray-500">Configure parameters for manual contract insertion</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><XCircle className="w-8 h-8" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-12 custom-scrollbar">
                    {/* Section 1: Core Identification */}
                    <div className="grid grid-cols-4 gap-6">
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Rate Code</label>
                            <input name="rate_code" value={formData.rate_code} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-blue-100 transition-all uppercase italic" placeholder="AUTO" />
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Customer Type</label>
                            <select name="customer_type" value={formData.customer_type} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-sm">
                                <option>Direct</option><option>Inter-Branch</option><option>Vendor</option>
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Customer Name</label>
                            <input name="customer_name" required value={formData.customer_name} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all italic" placeholder="Alpha Terminals..." />
                        </div>
                    </div>

                    {/* Section 2: Validity & Movement */}
                    <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 grid grid-cols-5 gap-6 relative shadow-sm">
                        <div className="absolute top-0 right-10 -translate-y-1/2 flex gap-4">
                            <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-50 flex items-center space-x-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">From Date</label>
                                    <input type="date" name="valid_from" value={formData.valid_from} onChange={handleInputChange} className="text-xs font-black italic border-none p-0 focus:ring-0" />
                                </div>
                                <div className="w-px h-8 bg-gray-100"></div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">To Date</label>
                                    <input type="date" name="valid_to" value={formData.valid_to} onChange={handleInputChange} className="text-xs font-black italic border-none p-0 focus:ring-0" />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Doc Type</label>
                            <select name="doc_type" value={formData.doc_type} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm">
                                <option>Export</option><option>Import</option><option>Domestic</option>
                            </select>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Servicce</label>
                            <select name="service_type" value={formData.service_type} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm italic">
                                <option>Transportation</option><option>Labour</option><option>Stuffing</option>
                            </select>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">From/Pickup</label>
                            <input name="from_location" value={formData.from_location} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm" placeholder="Origin" />
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">To Location</label>
                            <input name="to_location" value={formData.to_location} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm" placeholder="Dest." />
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Handover Loc.</label>
                            <input name="handover_location" value={formData.handover_location} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm" placeholder="H/O" />
                        </div>
                        <div className="col-span-2 space-y-1 pt-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">POL (Port of Loading)</label>
                             <input name="pol" value={formData.pol} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm" placeholder="POL Name" />
                        </div>
                        <div className="col-span-2 space-y-1 pt-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">POD (Port of Discharge)</label>
                             <input name="pod" value={formData.pod} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm" placeholder="POD Name" />
                        </div>
                    </div>

                    {/* Section 3: Technical Specs & Weight */}
                    <div className="grid grid-cols-5 gap-6 bg-blue-50/20 p-10 rounded-[3rem] border border-blue-50 shadow-sm relative">
                        <div className="absolute top-0 left-10 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 italic">
                            <Package className="w-3 h-3" /> Technical Specs
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cont size</label>
                            <select name="container_size" value={formData.container_size} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm">
                                <option>20ft</option><option>40ft</option><option>45ft</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cont Type</label>
                            <select name="container_type" value={formData.container_type} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-black italic shadow-sm">
                                <option>DV</option><option>HC</option><option>RF</option><option>OT</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Status</label>
                            <select name="container_status" value={formData.container_status} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm">
                                <option>Loaded</option><option>Empty</option>
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commodity</label>
                             <input name="commodity" value={formData.commodity} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm italic" placeholder="Specify Cargo..." />
                        </div>
                        <div className="col-span-2 space-y-1 pt-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">From Weight Range (MT)</label>
                             <input type="number" name="weight_range_from" value={formData.weight_range_from} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm" />
                        </div>
                        <div className="col-span-2 space-y-1 pt-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">To Weight Range (MT)</label>
                             <input type="number" name="weight_range_to" value={formData.weight_range_to} onChange={handleInputChange} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm" />
                        </div>
                    </div>

                    {/* Section 4: Final Pricing */}
                    <div className="grid grid-cols-4 gap-8 items-end p-2">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Base Rate (INR)</label>
                            <input type="number" name="base_rate" required value={formData.base_rate} onChange={handleInputChange} className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl text-2xl font-black italic focus:ring-2 focus:ring-blue-100 transition-all text-gray-900 shadow-inner" placeholder="0.00" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Discount</label>
                            <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl text-sm font-black text-red-500 focus:ring-2 focus:ring-red-100 transition-all" placeholder="0.00" />
                        </div>
                        <div className="col-span-2 bg-gray-900 px-8 py-6 rounded-[2.5rem] flex justify-between items-center text-white shadow-2xl shadow-gray-200 border-t border-white/5 relative overflow-hidden">
                             <div className="absolute -left-10 top-0 opacity-10 bg-white blur-3xl w-40 h-40 rounded-full"></div>
                             <div className="relative z-10">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Calculated Contract Rate</p>
                                <p className="text-4xl font-black italic tracking-tighter">₹{(parseFloat(formData.final_rate) || 0).toLocaleString()}</p>
                             </div>
                             <div className="bg-white/10 p-4 rounded-3xl relative z-10 animate-pulse"><TrendingUp className="w-8 h-8 text-blue-400" /></div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-6 border-t border-gray-50">
                        <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all">Discard Draft</button>
                        <button type="submit" className="px-16 py-5 bg-blue-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all italic">Register Contract →</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default RateCardManagement;
