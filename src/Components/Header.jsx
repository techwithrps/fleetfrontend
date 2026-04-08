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

const Header = ({
  toggleMobileMenu,
  searchQuery,
  handleSearch,
  showNotifications,
  toggleNotifications,
  showUserMenu,
  toggleUserMenu,
  user,
  handleLogout,
}) => {
  return (
    <header className="bg-white shadow-sm flex items-center justify-between p-4">
      <div className="flex items-center space-x-4">
        <button onClick={toggleMobileMenu} className="text-gray-600 md:hidden">
          <Menu className="h-6 w-6" />
        </button>
      
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative text-gray-600 hover:text-gray-800"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
              <div className="p-3 border-b">
                <h3 className="font-medium">Notifications</h3>
              </div>
              <div className="p-4 text-sm text-gray-500">
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center text-gray-700 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {user?.name?.charAt(0) || <User className="h-5 w-5" />}
            </div>
            <span className="ml-2 hidden md:block">{user?.name || "User"}</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
              <div className="py-2 px-4 border-b">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </button>
                <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
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
