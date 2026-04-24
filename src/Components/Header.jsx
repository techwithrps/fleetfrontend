import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  User,
  ChevronDown,
  Settings,
  LogOut,
  MapPin,
  Smartphone,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { locationAPI } from "../utils/Api";
import PWAInstallButton from "./PWAInstallButton";

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
  const { user, switchLocation } = useAuth();
  const [locations, setLocations] = useState([]);
  const [showLocationMenu, setShowLocationMenu] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const allLocations = await locationAPI.getAllLocations();
        const normalizedAll = (Array.isArray(allLocations) ? allLocations : [])
          .map((loc) => ({
            id: Number(loc.LOCATION_ID ?? loc.location_id ?? loc.id),
            name: String(loc.LOCATION_NAME ?? loc.name ?? ""),
          }))
          .filter((loc) => Number.isFinite(loc.id) && loc.name);

        const isAdmin = String(user?.role || "").toLowerCase() === "admin";
        const assignedIds = Array.isArray(user?.terminalIds)
          ? user.terminalIds.map(Number).filter((id) => Number.isFinite(id))
          : [];

        const allowedLocations = isAdmin
          ? normalizedAll
          : normalizedAll.filter((loc) => assignedIds.includes(loc.id));

        const withAllOption = isAdmin
          ? [{ id: "ALL", name: "All Locations" }, ...allowedLocations]
          : allowedLocations;

        setLocations(withAllOption);
      } catch (error) {
        console.error("Failed to fetch locations", error);
      }
    };
    if (user?.id) fetchLocations();
  }, [user?.id, user?.role, user?.terminalIds]);

  const handleLocationSwitch = async (locationId) => {
    try {
      await switchLocation(locationId);
      setShowLocationMenu(false);
    } catch (error) {
      console.error("Failed to switch location", error);
    }
  };

  const currentLocationName =
    locations.find((location) => String(location.id) === String(user?.terminalId))?.name ||
    (user?.terminalId === "ALL" ? "All Locations" : "Select Location");

  return (
    <header className="bg-white border-b border-border sticky top-0 z-[100] flex items-center justify-between px-6 py-2.5">
      <div className="flex items-center space-x-4">
        <button onClick={toggleMobileMenu} className="p-2 -ml-2 text-text-muted hover:text-foreground transition-colors md:hidden">
          <Menu className="h-5 w-5" />
        </button>

        {/* Location Switcher (Desktop) */}
        <div className="hidden md:flex items-center relative dropdown-container">
          <button 
            onClick={() => setShowLocationMenu(!showLocationMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 hover:bg-background border border-border rounded-md transition-all group"
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-[13px] font-semibold text-foreground">
              {currentLocationName}
            </span>
            <ChevronDown className={`h-3 w-3 text-text-muted transition-transform duration-200 ${showLocationMenu ? 'rotate-180' : ''}`} />
          </button>

          {showLocationMenu && (
            <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden backdrop-blur-xl bg-white/95">
              <div className="px-5 py-3 border-b border-slate-50 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Location</span>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar px-2">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleLocationSwitch(loc.id)}
                    className={`w-full text-left px-4 py-3 text-[11px] font-bold flex items-center space-x-3 rounded-2xl transition-all duration-300 ${
                      String(loc.id) === String(user?.terminalId) 
                        ? 'text-indigo-600 bg-indigo-50 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:pl-5'
                    }`}
                  >
                    <MapPin className={`h-4 w-4 ${String(loc.id) === String(user?.terminalId) ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                    <span className="uppercase tracking-tight">{loc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* PWA Install Button (Mobile Only) */}
        <PWAInstallButton />

        {/* Notifications */}
        <div className="relative dropdown-container">
          <button
            onClick={toggleNotifications}
            className="relative p-2 text-text-muted hover:text-primary transition-colors rounded-md hover:bg-slate-50"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border border-white"></span>
          </button>

          {showNotifications && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-border z-50 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-[13px] text-foreground">Notifications</h3>
                <span className="text-[11px] text-primary font-semibold cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="p-8 text-center text-[13px] text-text-muted flex flex-col items-center">
                <Bell className="h-6 w-6 text-slate-200 mb-3" />
                <p>No new notifications</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border hidden sm:block"></div>

        {/* User Menu */}
        <div className="relative dropdown-container">
          <button
            onClick={toggleUserMenu}
            className="flex items-center space-x-2.5 focus:outline-none group p-1 rounded-md hover:bg-slate-50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-[13px] font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-[13px] font-bold text-foreground leading-none">{user?.name || "User"}</span>
              <span className="text-[10px] text-text-muted mt-1 font-medium uppercase tracking-wider">{user?.role}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-text-muted group-hover:text-foreground transition-colors hidden md:block" />
          </button>

          {showUserMenu && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-border z-50 animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden"
            >
              <div className="py-2.5 px-4 bg-slate-50/50 border-b border-border">
                <p className="text-[13px] font-bold text-foreground truncate">{user?.name}</p>
                <p className="text-[11px] text-text-muted truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1">
                <button 
                  onClick={() => toast.info("Profile feature coming soon")}
                  className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-slate-50 rounded-md flex items-center transition-colors"
                >
                  <User className="h-4 w-4 mr-3 text-text-muted" />
                  Profile settings
                </button>
                <button 
                  onClick={() => toast.info("Account settings coming soon")}
                  className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-slate-50 rounded-md flex items-center transition-colors"
                >
                  <Settings className="h-4 w-4 mr-3 text-text-muted" />
                  Account settings
                </button>
              </div>
              <div className="p-1 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-[13px] text-rose-600 font-semibold hover:bg-rose-50 rounded-md flex items-center transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
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
