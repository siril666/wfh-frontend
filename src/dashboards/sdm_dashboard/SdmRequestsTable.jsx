import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const statusStyles = {
  APPROVED: "bg-green-100 text-green-800",
  PENDING: "bg-orange-100 text-orange-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusLabels = {
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected",
};

const priorityStyles = {
  HIGH: "bg-red-100 text-red-800",
  MODERATE: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

const priorityLabels = {
  HIGH: "High",
  MODERATE: "Medium",
  LOW: "Low",
};

const SdmRequestsTable = ({ requests, activeFilter }) => {
  const navigate = useNavigate();
  const [expandedTeams, setExpandedTeams] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "request.requestedStartDate",
    direction: "desc", // Default: recent first
  });
  const [viewMode, setViewMode] = useState("grouped"); // 'grouped' or 'ungrouped'

  // Initialize expanded state when requests load
  useEffect(() => {
    const initialExpandedState = {};
    requests.forEach(({ request }) => {
      initialExpandedState[request.teamOwnerId] = true; // Default expanded
    });
    setExpandedTeams(initialExpandedState);
  }, [requests]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const priorityOrder = {
    HIGH: 3,
    MODERATE: 2,
    LOW: 1,
  };
  
  const sortByPriority = (a, b, direction = "asc") => {
    const aPriority = priorityOrder[a.request.priority] || 0;
    const bPriority = priorityOrder[b.request.priority] || 0;
  
    if (aPriority < bPriority) return direction === "asc" ? -1 : 1;
    if (aPriority > bPriority) return direction === "asc" ? 1 : -1;
    return 0;
  };
  

  // Sort and filter requests
  const sortedAndFilteredRequests = useMemo(() => {
    let filteredRequests = [...requests];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter(
        ({ request, employeeName }) => {
          return (
            employeeName.toLowerCase().includes(term) ||
            request.ibsEmpId.toString().includes(term) ||
            request.employeeReason.toLowerCase().includes(term) ||
            request.categoryOfReason.toLowerCase().includes(term)
          );
        }
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredRequests.sort((a, b) => {
        // Handle nested properties
        const getValue = (obj, path) =>
          path.split(".").reduce((o, p) => (o || {})[p], obj);

        const aValue = getValue(a, sortConfig.key);
        const bValue = getValue(b, sortConfig.key);

        // Handle priority sort
        if (sortConfig.key === "request.priority") {
          return sortByPriority(a, b, sortConfig.direction);
        }

        // Handle date sort
        if (sortConfig.key.includes("Date")) {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }

        // Default comparison for other fields
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredRequests;
  }, [requests, searchTerm, sortConfig]);

  // Group requests by teamOwnerId if grouping is enabled
  const groupedRequests = useMemo(() => {
    if (viewMode === "ungrouped") {
      return {
        all: { 
          teamName: "All Requests", 
          teamOwnerName: "", 
          requests: sortedAndFilteredRequests 
        },
      };
    }

    return sortedAndFilteredRequests.reduce((acc, requestData) => {
      const { request, teamOwnerName, teamName } = requestData;
      const ownerId = request.teamOwnerId;

      if (!acc[ownerId]) {
        acc[ownerId] = { 
          teamOwnerName, 
          teamName: teamName || teamOwnerName, 
          requests: [] 
        };
      }
      acc[ownerId].requests.push(requestData);
      return acc;
    }, {});
  }, [sortedAndFilteredRequests, viewMode]);

  const toggleTeamExpand = (teamOwnerId) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamOwnerId]: !prev[teamOwnerId],
    }));
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search by name, ID, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("grouped")}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === "grouped"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Grouped by Team
          </button>
          <button
            onClick={() => setViewMode("ungrouped")}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === "ungrouped"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Ungrouped View
          </button>
        </div>
      </div>

      {/* Requests Table */}
      {Object.entries(groupedRequests).map(([teamOwnerId, group]) => (
        <div
          key={teamOwnerId}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          {viewMode === "grouped" && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {group.teamName} - {group.teamOwnerName} {teamOwnerId !== "all" && `(ID: ${teamOwnerId})`}
              </h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {group.requests.length} request
                  {group.requests.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => toggleTeamExpand(teamOwnerId)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  {expandedTeams[teamOwnerId] ? "Collapse ▲" : "Expand ▼"}
                </button>
              </div>
            </div>
          )}

          {(viewMode === "ungrouped" || expandedTeams[teamOwnerId] !== false) && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Employee
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 cursor-pointer"
                      onClick={() => requestSort("request.requestedStartDate")}
                    >
                      Dates {getSortIndicator("request.requestedStartDate")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Reason
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 cursor-pointer"
                      onClick={() => requestSort("request.priority")}
                    >
                      Priority {getSortIndicator("request.priority")}
                    </th>
                    {viewMode === "grouped" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Team
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      SDM Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      HR Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.requests.map(
                    ({
                      request,
                      employeeName,
                      sdmStatus,
                      hrStatus,
                      sdmUpdatedDate,
                      teamOwnerName,
                      teamName
                    }) => (
                      <tr key={request.requestId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employeeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {request.ibsEmpId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(
                              request.requestedStartDate
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              request.requestedEndDate
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.termDuration}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.categoryOfReason}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {request.employeeReason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              priorityStyles[request.priority || "LOW"]
                            }`}
                          >
                            {priorityLabels[request.priority || "LOW"]}
                          </span>
                        </td>
                        {viewMode === "grouped" && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {teamName || teamOwnerName}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusStyles[sdmStatus || "PENDING"]
                            }`}
                          >
                            {statusLabels[sdmStatus || "PENDING"]}
                          </span>
                          {sdmUpdatedDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(sdmUpdatedDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hrStatus ? (
                            <>
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[hrStatus]}`}
                              >
                                {statusLabels[hrStatus]}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Not reviewed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {sdmStatus === "PENDING" ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/sdm-dashboard/request-details/${request.requestId}`
                                )
                              }
                              className="text-green-600 hover:text-green-900"
                            >
                              Review
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                navigate(
                                  `/sdm-dashboard/request-details/${request.requestId}`
                                )
                              }
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {Object.keys(groupedRequests).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No matching requests found</p>
        </div>
      )}
    </div>
  );
};

export default SdmRequestsTable;