import React from "react";
import {
  Menu,
  Search,
  Bell,
  User,
  ChevronDown,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const Header = ({
  toggleMobileMenu,
  mobileMenuOpen,
  searchQuery,
  handleSearch,
  showNotifications,
  toggleNotifications,
  showUserMenu,
  toggleUserMenu,
  user,
  handleLogout,
  collapsed,
  toggleSidebar,
}) => {
  return (
    // Change the header class to adjust z-index and ensure proper positioning
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between p-4 h-16">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200 md:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-5 w-5 transform group-hover:scale-110 transition-transform duration-200" />
          </button>

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users, requests, drivers..."
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 lg:w-80 transition-all duration-200 bg-gray-50 focus:bg-white"
                value={searchQuery}
                onChange={handleSearch}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Mobile Search Toggle - Show on smaller screens */}
          <button className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200 md:hidden focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-xs text-white font-medium">3</span>
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={toggleNotifications}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        Mark all read
                      </button>
                    </div>
                  </div>

                  {/* Notification Items */}
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            New transport request
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            John Doe requested transport for tomorrow
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            2 minutes ago
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Maintenance due
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Vehicle #1234 needs scheduled maintenance
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            1 hour ago
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Driver assigned
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Mike Johnson assigned to Route #5
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            3 hours ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={toggleUserMenu}
              className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                {user?.name ? (
                  <span className="text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <span className="hidden md:block text-sm font-medium max-w-24 truncate">
                {user?.name || "User"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={toggleUserMenu} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                  {/* User Info */}
                  <div className="py-3 px-4 border-b border-gray-200 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || "admin@fleet.com"}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center space-x-3 transition-colors duration-150">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>Profile</span>
                    </button>
                    <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center space-x-3 transition-colors duration-150">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span>Settings</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left flex items-center space-x-3 transition-colors duration-150"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Expandable */}
      <div className="md:hidden border-t border-gray-200 bg-gray-50">
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
