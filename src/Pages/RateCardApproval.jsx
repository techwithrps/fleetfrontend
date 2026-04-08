import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  MessageSquare,
  Search,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import api from '../utils/Api';
import { toast } from 'react-toastify';

const RateCardApproval = () => {
  const [pendingCards, setPendingCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [approvalAction, setApprovalAction] = useState('approve'); // approve or reject
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchPendingRateCards();
  }, []);

  const fetchPendingRateCards = async () => {
    try {
      const response = await api.get('/rate-cards/pending');
      if (response.data.success) {
        setPendingCards(response.data.rateCards);
      }
    } catch (error) {
      toast.error('Failed to fetch pending rate cards');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (card, action) => {
    setSelectedCard(card);
    setApprovalAction(action);
    setShowApproveModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    const status = approvalAction === 'approve' ? 'approved' : 'rejected';
    try {
      const response = await api.put(`/rate-cards/update-status/${selectedCard.id}`, {
        status,
        admin_comment: comment
      });
      if (response.data.success) {
        toast.success(`Rate card ${status} successfully!`);
        setShowApproveModal(false);
        setComment('');
        fetchPendingRateCards();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Contract Approvals</h1>
          <p className="text-gray-500 mt-1">Review and approve customer rate card contracts</p>
        </div>
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search contracts..." 
            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase mb-4">Pending Requests</span>
            <div className="flex items-center justify-between">
               <span className="text-3xl font-black text-blue-600">{pendingCards.length}</span>
               <div className="bg-blue-50 p-2 rounded-lg text-blue-500"><Clock className="w-5 h-5" /></div>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase mb-4">Total Customers</span>
            <div className="flex items-center justify-between">
               <span className="text-3xl font-black text-purple-600 font-mono">14</span>
               <div className="bg-purple-50 p-2 rounded-lg text-purple-500"><TrendingDown className="w-5 h-5" /></div>
            </div>
         </div>
         <div className="bg-blue-600 p-5 rounded-2xl shadow-xl text-white flex flex-col justify-between md:col-span-2">
            <span className="text-xs font-bold text-blue-100 uppercase mb-4">Active System Metric</span>
            <div className="flex items-center space-x-4">
               <div>
                  <h4 className="text-lg font-bold">Standardized Pricing Active</h4>
                  <p className="text-xs text-blue-200 opacity-80 mt-0.5">Automated billing is processing approved rate cards.</p>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 tracking-tight flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-blue-500" /> Pending Approvals</h2>
          <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">View All Archive</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Customer</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Contract Details</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Validity</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Service Rates (Fixed)</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">Scanning for pending contracts...</td>
                </tr>
              ) : pendingCards.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                       <CheckCircle className="w-16 h-16 text-green-100 mb-4" />
                       <p className="text-lg font-bold text-gray-300">All contracts up to date!</p>
                       <span className="text-xs text-gray-200 font-mono tracking-tighter uppercase mt-2">Perfect Zero Backlog State</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingCards.map((card) => (
                  <tr key={card.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md transform transition-transform group-hover:scale-110">
                          {card.customer_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{card.customer_name}</div>
                          <div className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{card.customer_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-800">{card.contract_name}</div>
                      <div className="flex items-center text-[10px] text-gray-500 font-medium mt-1">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase tracking-tighter mr-2">{card.container_size}</span>
                        <span className="border-l border-gray-200 px-2">{card.vehicle_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col text-xs font-mono font-bold text-gray-700">
                        <span className="flex items-center text-green-600"><div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" /> {new Date(card.valid_from).toLocaleDateString()}</span>
                        <ChevronRight className="w-3 h-3 text-gray-200 my-0.5 ml-0.5" />
                        <span className="flex items-center text-red-500"><div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" /> {new Date(card.valid_to).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="grid grid-cols-3 gap-2">
                         <div className="bg-indigo-50/50 p-2 rounded-lg text-center border border-indigo-100/30">
                            <span className="text-[9px] font-black text-indigo-400 uppercase block mb-1">Pickup</span>
                            <span className="text-xs font-bold text-indigo-700">₹{card.pickup_rate}</span>
                         </div>
                         <div className="bg-purple-50/50 p-2 rounded-lg text-center border border-purple-100/30">
                            <span className="text-[9px] font-black text-purple-400 uppercase block mb-1">Stuff</span>
                            <span className="text-xs font-bold text-purple-700">₹{card.stuffing_rate}</span>
                         </div>
                         <div className="bg-blue-50/50 p-2 rounded-lg text-center border border-blue-100/30">
                            <span className="text-[9px] font-black text-blue-400 uppercase block mb-1">H.over</span>
                            <span className="text-xs font-bold text-blue-700">₹{card.handover_rate}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => openApprovalModal(card, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-xl shadow-lg shadow-green-100 transition-all hover:-translate-y-0.5 active:scale-95" title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => openApprovalModal(card, 'reject')}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95" title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
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

      {showApproveModal && selectedCard && (
        <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-gray-100 overflow-hidden">
              <div className={`p-10 ${approvalAction === 'approve' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white`}>
                 <div className="flex justify-between items-start mb-6">
                    <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md"><FileText className="w-8 h-8" /></div>
                    <button onClick={() => setShowApproveModal(false)} className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors font-bold text-xl">&times;</button>
                 </div>
                 <h3 className="text-3xl font-black mb-2">{approvalAction === 'approve' ? 'Confirm Approval' : 'Submit Rejection'}</h3>
                 <p className="text-white/80 font-medium">Finalizing contract for <span className="font-bold underline">{selectedCard.customer_name}</span>. This action is recorded in audit logs.</p>
              </div>
              <div className="p-10 bg-white">
                 <div className="flex items-start bg-gray-50 p-6 rounded-3xl mb-8 border border-gray-100">
                    <Info className="w-5 h-5 text-blue-500 mr-4 mt-1" />
                    <div className="text-sm font-medium text-gray-600 leading-relaxed italic">
                       "Verify pickup, stuffing, and handover rates against the master contract agreement before finalizing status."
                    </div>
                 </div>
                 <form onSubmit={handleUpdateStatus}>
                    <div className="mb-8">
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1 flex items-center"><MessageSquare className="w-3.5 h-3.5 mr-2" /> Administrator Comment</label>
                       <textarea 
                          className="w-full px-6 py-4 rounded-3xl border border-gray-100 bg-gray-50/50 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all min-h-[120px] font-medium text-gray-700" 
                          placeholder={approvalAction === 'approve' ? "Add any special instructions (optional)..." : "Please state the reason for rejection..."}
                          required={approvalAction === 'reject'}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                       />
                    </div>
                    <div className="flex gap-4">
                       <button 
                          type="button" 
                          onClick={() => setShowApproveModal(false)}
                          className="flex-1 px-8 py-4 rounded-3xl text-gray-400 font-bold hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs"
                       >
                         Cancel Interaction
                       </button>
                       <button 
                          type="submit"
                          className={`flex-1 px-8 py-4 rounded-3xl text-white font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 ${approvalAction === 'approve' ? 'bg-green-600 shadow-green-100 hover:bg-green-700' : 'bg-red-600 shadow-red-100 hover:bg-red-700'}`}
                       >
                         Execute {approvalAction}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const FileText = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);

export default RateCardApproval;
