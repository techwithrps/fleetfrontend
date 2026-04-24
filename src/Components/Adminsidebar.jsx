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
} from "lucide-react";
import elogisolLogo from "../images/elogisol-logo.png";

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
        {
          name: "Dashboard",
          icon: Home,
          path: "dashboard",
          description: "Summary & Overview",
        },
        {
          name: "Users",
          icon: Users,
          path: "users",
          description: "Manage Users",
        },
      ],
    },
    {
      title: "Daily Tasks",
      items: [
        {
          name: "Bookings",
          icon: ClipboardList,
          path: "transport-requests",
          description: "Manage Booking List",
        },
        {
          name: "Manage Bookings",
          icon: Edit3,
          path: "editrequest",
          description: "Update Booking Details",
        },
        {
          name: "Trip History",
          icon: History,
          path: "admincontainerpage",
          description: "View All Trips",
        },
        {
          name: "Search Trips",
          icon: Search,
          path: "filtered-transport-requests",
          description: "Find & Track Trips",
        },
        {
          name: "Assign Trailer",
          icon: Link2,
          path: "bed-attachment",
          description: "Link Trailer to Vehicle",
        },
        {
          name: "Tire Attach/Detach",
          icon: Wrench,
          path: "tire-attachment",
          description: "Update Tire Positions",
        },
        {
          name: "Job Order",
          icon: PlusCircle,
          path: "job-order",
          description: "Start Trip & Payment",
        },
        {
          name: "Job Order Close",
          icon: CheckCircle,
          path: "job-order-close",
          description: "Finish Trip & Settle",
        },
      ],
    },
    {
      title: "Master",
      items: [
        {
          name: "Vendor Master",
          icon: Building2,
          path: "vendor-controller",
          description: "Manage Vendors",
        },
        {
          name: "Vehicle Master",
          icon: Truck,
          path: "fleet-equipment",
          description: "Manage All Vehicles",
        },
        {
          name: "Driver Master",
          icon: User,
          path: "drivers",
          description: "Manage Driver Data",
        },
        {
          name: "Tire Master",
          icon: CircleDot,
          path: "tire-master",
          description: "Manage Tire Stock",
        },
        {
          name: "Tire Position Master",
          icon: LayoutGrid,
          path: "tire-position-master",
          description: "Configure Wheel Slots",
        },
        {
          name: "Trailer Master",
          icon: Truck,
          path: "bed-master",
          description: "Manage All Trailers",
        },
        {
          name: "Email Settings",
          icon: Mail,
          path: "email-config",
          description: "Configure SMTP",
        },
      ],
    },
    {
      title: "Payments",
      items: [
        {
          name: "Payment Receipts",
          icon: CreditCard,
          path: "payment-receipts",
          description: "Track Customer Payments",
        },
      ],
    },
    {
      title: "Reports",
      items: [
        {
          name: "Advance Report",
          icon: BarChart3,
          path: "daily-advance-payments",
          description: "Daily Payment Summary",
        },
        {
          name: "Profit Report",
          icon: TrendingUp,
          path: "container-margin-report",
          description: "Trip Profitability",
        },
        {
          name: "Tire Report",
          icon: FileText,
          path: "tire-attachment-report",
          description: "Tire Change History",
        },
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
    navigate(path === "dashboard" ? "/admin-dashboard" : `/admin/${path}`);
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
                  <div key={item.path} className="relative group/item">
                    <Link
                      to={item.path === "dashboard" ? "/admin-dashboard" : `/admin/${item.path}`}
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
                      <Link
                        key={item.path}
                        to={item.path === "dashboard" ? "/admin-dashboard" : `/admin/${item.path}`}
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
