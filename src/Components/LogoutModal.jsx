import React from 'react';
import { LogOut, X } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
            <LogOut className="h-8 w-8 text-rose-600" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">Logout Securely?</h3>
          <p className="text-slate-500 text-sm mb-8">
            You are about to end your session. Any unsaved changes might be lost. Are you sure you want to exit?
          </p>

          <div className="flex flex-col space-y-3">
            <button
              onClick={onConfirm}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-200 flex items-center justify-center space-x-2"
            >
              <span>Yes, Logout Now</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl border border-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default LogoutModal;
