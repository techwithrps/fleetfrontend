import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles = [], pageName = null }) => {
  const { user, loading, handleAuthError, isTokenExpired } = useAuth();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const customerLikeRoles = new Set(["customer", "operations", "finance"]);

  useEffect(() => {
    const validateAccess = async () => {
      if (loading) return; // Wait for auth context to finish loading

      // Check if user exists
      if (user) {
        // If user has required role, allow access (case-insensitive)
        const userRole = user.role?.toLowerCase();
        const effectiveRole = customerLikeRoles.has(userRole) ? "customer" : userRole;
        
        let hasAccess = false;
        if (userRole === 'admin') {
          hasAccess = true;
        } else if (pageName) {
          const userPageNames = user.pageNames || [];
          const pageNameLower = pageName.toLowerCase();
          hasAccess = userPageNames.some(p => p.toLowerCase() === pageNameLower);
        } else {
          hasAccess = allowedRoles.length === 0 || 
            allowedRoles.some(role => role.toLowerCase() === effectiveRole);
        }

        if (hasAccess) {
          setIsValidating(false);
          return;
        }

        // User doesn't have required role, redirect to their dashboard
        switch (userRole) {
          case "admin":
            navigate("/admin-dashboard", { replace: true });
            break;
          case "operations":
          case "finance":
          case "customer":
            navigate("/customer-dashboard", { replace: true });
            break;
          case "driver":
            navigate("/driver-dashboard", { replace: true });
            break;
          case "accounts":
            navigate("/accounts-dashboard", { replace: true });
            break;
          case "reports & mis":
            navigate("/reports-dashboard", { replace: true });
            break;
          default:
            navigate("/", { replace: true });
        }
      } else {
        // No user, will be handled by the redirect below
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [user, loading, allowedRoles, pageName, navigate, isTokenExpired]);

  // Show loading state while checking authentication or validating
  if (loading || isValidating) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Validating access...</span>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check token validity one more time before rendering
  const token = localStorage.getItem("token");
  if (!token || isTokenExpired(token)) {
    handleAuthError(navigate, "Your session has expired. Please log in again.");
    return <Navigate to="/login" replace />;
  }

  // Final check for render
  const userRole = user.role?.toLowerCase();
  const effectiveRole = customerLikeRoles.has(userRole) ? "customer" : userRole;
  
  let hasAccess = false;
  if (userRole === 'admin') {
    hasAccess = true;
  } else if (pageName) {
    const userPageNames = user.pageNames || [];
    const pageNameLower = pageName.toLowerCase();
    hasAccess = userPageNames.some(p => p.toLowerCase() === pageNameLower);
  } else {
    hasAccess = allowedRoles.length === 0 || 
      allowedRoles.some(role => role.toLowerCase() === effectiveRole);
  }

  if (!hasAccess) {
    switch (userRole) {
      case "admin":
        return <Navigate to="/admin-dashboard" replace />;
      case "operations":
      case "finance":
      case "customer":
        return <Navigate to="/customer-dashboard" replace />;
      case "driver":
        return <Navigate to="/driver-dashboard" replace />;
      case "accounts":
        return <Navigate to="/accounts-dashboard" replace />;
      case "reports & mis":
        return <Navigate to="/reports-dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // If user is authenticated and authorized, render the children
  return children;
};
