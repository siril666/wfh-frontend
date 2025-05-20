import React, { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const Sidebar = () => {
  const { user, logout } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);

  const handleLogout = () => {
    logout();
  };

  const handleEditProfile = () => {
    window.location.href = "/profile_edit";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper function to determine base dashboard path
  const getBasePath = () => {
    switch(user?.role) {
      case 'HR': return '/hr-dashboard';
      case 'TEAM_MANAGER': return '/tm-dashboard';
      case 'SDM': return '/sdm-dashboard';
      case 'EMPLOYEE':
      default:
        return '/employee-dashboard';
    }
  };

  // Custom NavLink component for dashboard-specific routes
  const DashboardNavLink = ({ to, children }) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block px-4 py-2 rounded font-medium ${
          isActive ? "bg-purple-600 text-white" : "text-gray-700"
        }`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <div className="w-64 h-screen bg-white shadow-md flex flex-col fixed z-10">
      {/* Logo Section */}
      <div className="px-6 py-4 text-2xl font-bold text-purple-700">
        WFH Tracker
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        <DashboardNavLink to={getBasePath()}>
          Dashboard
        </DashboardNavLink>
        {!(user?.role == "HR") 
        &&
        <DashboardNavLink to={`${getBasePath()}/calendar`}>
          WFH Calendar
        </DashboardNavLink>
        }
        <DashboardNavLink to={`${getBasePath()}/audit-and-reports`}>
          Audit and Reports
        </DashboardNavLink>
      </nav>

      {/* Profile Section */}
      <div className="relative px-4 py-4 border-t mt-auto" ref={popupRef}>
        <div
          className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center cursor-pointer"
          onClick={() => setShowPopup(!showPopup)}
        >
          {user?.userName?.[0]?.toUpperCase() || "U"}
        </div>

        {showPopup && (
          <div className="absolute bottom-16 left-4 w-48 bg-white border shadow-lg rounded z-10">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              {user?.userName}
              <div className="text-xs text-gray-400">{user?.role}</div>
            </div>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;