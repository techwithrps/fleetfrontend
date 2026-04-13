import React from "react";
import {
  Menu,
  Search,
  Bell,
  User,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const Header = ({
  toggleMobileMenu,
  searchQuery,
  handleSearch,
  showNotifications,
  toggleNotifications,
  showUserMenu,
  toggleUserMenu,
  user: userProp,
  handleLogout,
}) => {
  const { user } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 flex items-center justify-between px-6 py-3 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center space-x-4">
        <button onClick={toggleMobileMenu} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center space-x-5">
        {/* Notifications */}
        <div className="relative dropdown-container">
          <button
            onClick={toggleNotifications}
            className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-full"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full border border-white"></span>
          </button>

          {showNotifications && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
                <span className="text-xs text-blue-600 cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
                <Bell className="h-8 w-8 text-slate-200 mb-3" />
                <p>No new notifications</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

        {/* User Menu */}
        <div className="relative dropdown-container">
          <button
            onClick={toggleUserMenu}
            className="flex items-center space-x-3 focus:outline-none group p-1 pr-2 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {user?.name?.charAt(0) || <User className="h-4 w-4" />}
            </div>
            <div className="hidden md:flex flex-col items-start px-1">
              <span className="text-sm font-semibold text-slate-700 leading-none">{user?.name || "User"}</span>
              <span className="text-xs text-slate-500 mt-1 leading-none">{user?.role || "Manage Account"}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors hidden md:block" />
          </button>

          {showUserMenu && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
            >
              <div className="py-3 px-4 bg-slate-50 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button 
                  onClick={() => toast.info("Profile feature coming soon")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center transition-colors"
                >
                  <User className="h-4 w-4 mr-3 text-slate-400" />
                  Profile details
                </button>
                <button 
                  onClick={() => toast.info("Account settings coming soon")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center transition-colors"
                >
                  <Settings className="h-4 w-4 mr-3 text-slate-400" />
                  Account settings
                </button>
              </div>
              <div className="p-1.5 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3 text-rose-500" />
                  Logout securely
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
