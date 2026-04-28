import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Truck,
  Users,
  Calendar,
  FileText,
  ChevronRight,
  ChevronLeft,
  X,
  LogOut,
  Shield,
  Activity,
  Wallet,
  ClipboardList,
  Edit3,
  History,
  Search,
  Link2,
  Wrench,
  PlusCircle,
  CheckCircle,
  Building2,
  CircleDot,
  LayoutGrid,
  Mail,
  BarChart3,
  TrendingUp,
  CreditCard,
  User,
  MapPinned,
  ScanSearch,
  MessageSquare,
} from "lucide-react";
import elogisolLogo from "../images/elogisol-logo.png";

const pageAliases = {
  "Admin Dashboard": ["Admin Dashboard", "Dashboard"],
  "Users": ["Users", "User Management"],
  "Transport Requests": ["Bookings", "Transport Requests"],
  "Edit Requests": ["Manage Bookings", "Edit Requests"],
  "Trip Details Report": ["Trip History", "Admin Container Page", "Container Page", "Trip Details Report"],
  "Filter Trips": ["Search Trips", "Filtered Transport Requests", "Filter Trips"],
  "Bed Attach/Detach": ["Bed Attach Detach", "Bed Attach/Detach", "Bed Attachment"],
  "Tyre Attach/Detach": ["Tire Attach/Detach", "Tire Attach Detach", "Tire Attachment", "Tyre Attach/Detach"],
  "Job Order": ["Job Order"],
  "Job Order Close": ["Job Order Close"],
  "Vendor Master": ["Vendor Master", "Vendor Controller"],
  "Fleet Equipment Master": ["Vehicle Master", "Fleet Equipment Master"],
  "Driver Master": ["Driver Master", "Drivers"],
  "Tire Master": ["Tire Master", "Tyre Master"],
  "Tire Position Master": ["Tire Position Master", "Tyre Position Master"],
  "Bed Master": ["Bed Master"],
  "Email Configuration": ["Email Settings", "Email Configuration"],
  "Payment Receipts": ["Payment Receipts"],
  "Daily Advance Payments": ["Advance Report", "Daily Advance Payments"],
  "Container Margin Report": ["Profit Report", "Container Margin Report"],
  "Tyre Attachment Report": ["Tire Report", "Tire Attachment Report", "Tyre Attachment Report"],
  "Transport Reports": ["Report Master", "Transport Reports"],
};

const hasPageAccess = (user, itemName) => {
  if (!user) return false;
  if (user.role?.toLowerCase() === "admin") return true;
  const pageNames = Array.isArray(user.pageNames) ? user.pageNames.map(p => p.toLowerCase()) : [];
  const aliases = (pageAliases[itemName] || [itemName]).map(a => a.toLowerCase());
  return aliases.some((alias) => pageNames.includes(alias));
};

export function AdminSidebar({
  collapsed,
  toggleSidebar,
  activePage,
  setActivePage,
  mobileMenuOpen,
  toggleMobileMenu,
  handleLogout,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  const navSections = [
    {
      title: "Main",
      items: [
        { name: "Admin Dashboard", icon: Home, path: "/admin-dashboard", description: "Summary & Overview" },
        { name: "Users", icon: Users, path: "/admin/users", description: "Manage Users" },
      ],
    },
    {
      title: "Daily Tasks",
      items: [
        { name: "Transport Requests", icon: ClipboardList, path: "/admin/transport-requests", description: "Manage Booking List" },
        { name: "Edit Requests", icon: Edit3, path: "/admin/editrequest", description: "Update Booking Details" },
        { name: "Trip Details Report", icon: History, path: "/admin/admincontainerpage", description: "View All Trips" },
        { name: "Filter Trips", icon: Search, path: "/admin/filtered-transport-requests", description: "Find & Track Trips" },
        { name: "My Shipments", icon: Truck, path: "/customer/my-shipments", description: "Track Deliveries" },
        { name: "Container Stage", icon: MapPinned, path: "/customer/container-page", description: "Manage Container Flow" },
        { name: "VIN Survey", icon: ScanSearch, path: "/customer/vinpage", description: "Vehicle Inspection Survey" },
        { name: "Bed Attach/Detach", icon: Link2, path: "/admin/bed-attachment", description: "Link Bed to Vehicle" },
        { name: "Tyre Attach/Detach", icon: Wrench, path: "/admin/tire-attachment", description: "Update Tire Positions" },
        { name: "Job Order", icon: PlusCircle, path: "/admin/job-order", description: "Start Trip & Payment" },
        { name: "Job Order Close", icon: CheckCircle, path: "/admin/job-order-close", description: "Finish Trip & Settle" },
      ],
    },
    {
      title: "Documents",
      items: [
        { name: "ASN Upload", icon: MessageSquare, path: "/customer/ASN", description: "Upload ASN Documents" },
      ],
    },
    {
      title: "Master",
      items: [
        { name: "Vendor Master", icon: Building2, path: "/admin/vendor-controller", description: "Manage Vendors" },
        { name: "Fleet Equipment Master", icon: Truck, path: "/admin/fleet-equipment", description: "Manage All Vehicles" },
        { name: "Driver Master", icon: User, path: "/admin/drivers", description: "Manage Driver Data" },
        { name: "Tire Master", icon: CircleDot, path: "/admin/tire-master", description: "Manage Tire Stock" },
        { name: "Tire Position Master", icon: LayoutGrid, path: "/admin/tire-position-master", description: "Configure Wheel Slots" },
        { name: "Bed Master", icon: Truck, path: "/admin/bed-master", description: "Manage All Beds" },
        { name: "Email Configuration", icon: Mail, path: "/admin/email-config", description: "Configure SMTP" },
      ],
    },
    {
      title: "Payments",
      items: [
        { name: "Payment Receipts", icon: CreditCard, path: "/admin/payment-receipts", description: "Track Customer Payments" },
      ],
    },
    {
      title: "Reports",
      items: [
        { name: "Daily Advance Payments", icon: BarChart3, path: "/admin/daily-advance-payments", description: "Daily Payment Summary" },
        { name: "Container Margin Report", icon: TrendingUp, path: "/admin/container-margin-report", description: "Trip Profitability" },
        { name: "Tyre Attachment Report", icon: FileText, path: "/admin/tire-attachment-report", description: "Tire Change History" },
        { name: "Transport Reports", icon: BarChart3, path: "/admin/report-master", description: "Master Inventory Summary" },
      ],
    },
  ];

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        toggleMobileMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen, toggleMobileMenu]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const handleNavigation = (path) => {
    setActivePage(path);
    navigate(path);
    if (mobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  const getDashboardRouteByRole = () => {
    const role = String(user?.role || "").toLowerCase();
    if (role === "accounts") return "/accounts-dashboard";
    if (role === "reports & mis") return "/reports-dashboard";
    return "/admin-dashboard";
  };

  const handleBrandClick = () => {
    setActivePage("dashboard");
    navigate(getDashboardRouteByRole());
    if (mobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  const isActiveItem = (path) => activePage === path;

  return (
    <>
      {/* Sidebar - Desktop */}
      <div
        className={`${
          collapsed ? "w-16" : "w-64"
        } sidebar-container hidden md:flex flex-col border-r border-white/5 fixed h-full z-40 transition-all duration-300 ease-in-out`}
      >
        {/* Header Section */}
        <div className="p-4 border-b border-white/5">
          {collapsed ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                <img src={elogisolLogo} alt="eLOGisol" className="h-full w-full object-contain" />
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-sidebar-hover text-sidebar-text transition-colors"
                title="Expand"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBrandClick}
                className="flex items-center gap-3 group"
              >
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                  <img src={elogisolLogo} alt="eLOGisol" className="h-full w-full object-contain" />
                </div>
                <div className="text-left">
                  <h1 className="font-display font-bold text-[15px] leading-tight text-white group-hover:text-primary transition-colors">
                    Fleet Admin
                  </h1>
                  <p className="text-[10px] text-sidebar-text/50 font-medium uppercase tracking-wider">
                    Operations
                  </p>
                </div>
              </button>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-sidebar-hover text-sidebar-text transition-colors"
                title="Collapse"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-text/40">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  hasPageAccess(user, item.name) ? (
                  <div key={item.path} className="relative group/item">
                    <Link
                      to={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`nav-link ${isActiveItem(item.path) ? "active" : ""} ${
                        collapsed ? "justify-center px-0" : ""
                      }`}
                    >
                      <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${
                        isActiveItem(item.path) ? "text-white" : "text-sidebar-text/70"
                      }`} />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                    
                    {collapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-sidebar-bg border border-white/10 rounded-md text-[12px] text-white whitespace-nowrap opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all z-50 shadow-xl">
                        {item.name}
                      </div>
                    )}
                  </div>
                  ) : null
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-white/5 bg-black/10">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full p-2 text-red-400 hover:bg-red-500/10 rounded-md transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-[18px] w-[18px]" />
            {!collapsed && <span className="text-[13px] font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] md:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={toggleMobileMenu} />
          <div
            className={`sidebar-container w-72 h-full flex flex-col shadow-2xl transition-transform duration-300 ease-out`}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm">
                  <img src={elogisolLogo} alt="eLOGisol" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg text-white">Fleet Admin</h1>
                  <p className="text-[10px] text-sidebar-text/50 uppercase tracking-widest font-semibold">Management</p>
                </div>
              </div>
              <button onClick={toggleMobileMenu} className="p-2 text-sidebar-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 py-6 px-4 overflow-y-auto">
              {navSections.map((section) => (
                <div key={section.title} className="mb-8">
                  <div className="px-3 mb-3 text-[11px] font-bold uppercase tracking-widest text-sidebar-text/30">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      hasPageAccess(user, item.name) ? (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActiveItem(item.path)
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-sidebar-text hover:bg-sidebar-hover"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                      ) : null
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 w-full p-4 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-semibold"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
