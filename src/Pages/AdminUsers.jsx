import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { userAPI } from "../utils/Api"; // Import the specific API methods
import { useAuth } from "../contexts/AuthContext";
import { Users, Search, RefreshCw, UserPlus } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isFromSidebar = location.state?.fromSidebar;

  // Load users function following TransporterDetails pattern
  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the API method instead of direct axios call
      const response = await userAPI.getAllUsers();

      if (response.success) {
        setUsers(response.data || response.users || []);
        toast.info("Users loaded successfully");
      }
    } catch (error) {
      // Handle different error scenarios like TransporterDetails
      if (error.status === 404 || error.message?.includes("not found")) {
        setUsers([]);
        console.log("No users found");
      } else if (error.status === 401) {
        setError("Authentication required. Please login again.");
        toast.error("Authentication required. Please login again.");
      } else if (error.status === 403) {
        setError("Access denied. Admin privileges required.");
        toast.error("Access denied. Admin privileges required.");
      } else {
        console.error("Error loading users:", error);
        setError(error.message || "Failed to load users");
        toast.error(error.message || "Failed to load users");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // UseEffect pattern following TransporterDetails
  useEffect(() => {
    if (isFromSidebar && user?.role === "Admin") {
      loadUsers();
    }
  }, [isFromSidebar, user]);

  // Delete user function
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await userAPI.deleteUser(userId);

      if (response.success) {
        toast.success(response.message || "User deleted successfully!");
        // Remove user from local state
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Error deleting user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update user role function
  const handleUpdateUserRole = async (userId, newRole) => {
    setIsSubmitting(true);

    try {
      const response = await userAPI.updateUserRole(userId, { role: newRole });

      if (response.success) {
        toast.success(response.message || "User role updated successfully!");
        // Update user in local state
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error(error.message || "Error updating user role");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh function
  const handleRefresh = () => {
    if (isFromSidebar && user?.role === "Admin") {
      loadUsers();
    }
  };

  // If not accessed through sidebar, show access denied
  if (!isFromSidebar) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Access Denied. Please navigate through the sidebar.
        </div>
      </div>
    );
  }

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state pattern like TransporterDetails
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">View and manage all system users</p>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">View and manage all system users</p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={loading || isSubmitting}
            className={`flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 ${
              loading || isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            className="flex items-center px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700"
            disabled={isSubmitting}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Error state */}
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      ) : null}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full border-0 ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "driver"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                        value={user.role}
                        onChange={(e) =>
                          handleUpdateUserRole(user.id, e.target.value)
                        }
                        disabled={isSubmitting}
                      >
                        <option value="customer">Customer</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        disabled={isSubmitting}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
