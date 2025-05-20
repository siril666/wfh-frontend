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
    switch (user?.role) {
      case "HR":
        return "/hr-dashboard";
      case "TEAM_MANAGER":
        return "/tm-dashboard";
      case "SDM":
        return "/sdm-dashboard";
      case "EMPLOYEE":
      default:
        return "/employee-dashboard";
    }
  };

  // Custom NavLink component for dashboard-specific routes
  const DashboardNavLink = ({ to, children }) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-gray-600 hover:bg-gray-100"
        }`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed z-10">
      {/* Logo Section */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800 flex items-center">
          <svg
            className="w-6 h-6 text-indigo-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          WFH Tracker
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <DashboardNavLink to={getBasePath()}>
          <svg
            className="w-5 h-5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Dashboard
        </DashboardNavLink>
        {!(user?.role == "HR") && (
          <DashboardNavLink to={`${getBasePath()}/calendar`}>
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            WFH Calendar
          </DashboardNavLink>
        )}
        {!(user?.role == "EMPLOYEE") && (
          <DashboardNavLink to={`${getBasePath()}/audit-and-reports`}>
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Audit and Reports
          </DashboardNavLink>
        )}
      </nav>

      {/* Profile Section */}
      <div className="relative px-4 py-4 border-t border-gray-200 mt-auto" ref={popupRef}>
        <div
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          onClick={() => setShowPopup(!showPopup)}
        >
          <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center rounded-lg font-medium">
            {user?.userName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.userName || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role?.replace("_", " ") || "Role"}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              showPopup ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {showPopup && (
          <div className="absolute bottom-16 left-4 right-4 bg-white border border-gray-200 shadow-lg rounded-lg z-10 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {user?.userName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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