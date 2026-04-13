import React from "react";
import { AdminSidebar } from "./Adminsidebar";
import { CustomerSidebar } from "./CustomerSidebar";
import { DriverSidebar } from "./DriverSidebar";
import { useAuth } from "../contexts/AuthContext";

export const RoleSidebar = (props) => {
  const { user } = useAuth();
  
  if (!user) return null;

  // Render the appropriate sidebar based on user role
  const role = user.role?.toLowerCase();
  switch (role) {
    case "admin":
      return <AdminSidebar {...props} />;
    case "accounts":
      return <AdminSidebar {...props} />;
    case "reports & mis":
      return <AdminSidebar {...props} />;
    case "customer":
      return <CustomerSidebar {...props} />;
    case "driver":
      return <DriverSidebar {...props} />;
    default:
      return null;
  }
};
