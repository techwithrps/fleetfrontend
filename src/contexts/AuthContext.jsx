import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import {
  authAPI,
  setAuthToken,
  isTokenExpired,
  clearAuthData,
} from "../utils/Api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to handle logout
  const logout = useCallback((navigate, showMessage = true) => {
    clearAuthData();
    setUser(null);

    if (showMessage) {
      toast.info("You have been logged out.");
    }

    // Redirect to login page
    if (navigate) {
      navigate("/login", { replace: true });
    } else {
      // If navigate is not available, use window.location
      window.location.href = "/login";
    }
  }, []);

  // Function to handle authentication errors
  const handleAuthError = useCallback(
    (navigate, message = "Session expired. Please log in again.") => {
      clearAuthData();
      setUser(null);
      toast.error(message);

      if (navigate) {
        navigate("/login", { replace: true });
      } else {
        window.location.href = "/login";
      }
    },
    []
  );

  // Check if user session is valid
  const checkUserSession = useCallback(async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
  
    if (!token || !storedUser) {
      return false;
    }
  
    try {
      // Parse user data
      const userData = JSON.parse(storedUser);
      
      // Set user data without strict validation
      setUser(userData);
      setAuthToken(token);
      return true;
    } catch (error) {
      console.error("Error checking user session:", error);
      return false;
    }
  }, []);

  // Initialize authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const hasSession = await checkUserSession();
        if (hasSession) {
          const isValid = await authAPI.checkSession();
          if (!isValid) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuthData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [checkUserSession]);

  // Set up periodic token validation (every 30 minutes instead of 5 minutes)
  useEffect(() => {
    const validateTokenPeriodically = async () => {
      if (user) {
        try {
          const isValid = await authAPI.checkSession();
          if (!isValid) {
            setUser(null);
          }
        } catch (error) {
          console.error("Error validating token:", error);
          clearAuthData();
          setUser(null);
        }
      }
    };
  
    // Check every 30 minutes (fixed the calculation: 30 minutes in milliseconds)
    const interval = setInterval(validateTokenPeriodically, 30 * 60 * 1000);
  
    return () => clearInterval(interval);
  }, [user]);

  const login = async (credentials, navigate) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);

      // Store user data and token
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("token", response.token);
      setAuthToken(response.token);
      setUser(response.user);

      toast.success(`Welcome back, ${response.user.name}!`);

      // Redirect based on user role (case-insensitive)
      if (navigate) {
        const role = response.user.role.toLowerCase();
        switch (role) {
          case "admin":
            navigate("/admin-dashboard");
            break;
          case "operations":
          case "finance":
          case "customer":
            navigate("/customer-dashboard");
            break;
          case "driver":
            navigate("/driver-dashboard");
            break;
          case "accounts":
            navigate("/accounts-dashboard");
            break;
          case "reports & mis":
            navigate("/reports-dashboard");
            break;
          default:
            navigate("/");
        }
      }

      return response;
    } catch (error) {
      toast.error(error.message || "Login failed. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const switchLocation = async (locationId) => {
    try {
      setLoading(true);
      const response = await authAPI.switchLocation(locationId);
      
      // Update token and user
      localStorage.setItem("token", response.token);
      setAuthToken(response.token);
      
      // Update local user object with new terminal selection
      const updatedUser = { ...user, terminalId: response.terminalId };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      toast.success("Location switched successfully");
      
      return response;
    } catch (error) {
      toast.error(error.message || "Failed to switch location.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    switchLocation,
    loading,
    handleAuthError,
    checkUserSession,
    isTokenExpired,
    updateUser: (newData) => {
      const updatedUser = { ...user, ...newData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
