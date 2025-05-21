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

const HRRequestsTable = ({ requests, activeFilter }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "request.requestedStartDate",
    direction: "desc", // Default: recent first
  });
  const [groupBy, setGroupBy] = useState("none"); // 'none', 'sdm', or 'team'
  const [expandedGroups, setExpandedGroups] = useState({});

  // Initialize expanded groups
  useEffect(() => {
    const initialExpandedState = {};
    if (groupBy === "team") {
      requests.forEach(({ request }) => {
        initialExpandedState[request.teamOwnerId] = true;
      });
    } else if (groupBy === "sdm") {
      requests.forEach(({ request }) => {
        initialExpandedState[request.dmId] = true;
      });
    }
    setExpandedGroups(initialExpandedState);
  }, [requests, groupBy]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredRequests = useMemo(() => {
    let filteredRequests = [...requests];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter(({ request, userName }) => {
        return (
          request.ibsEmpId.toString().includes(term) ||
          request.employeeReason.toLowerCase().includes(term) ||
          request.categoryOfReason.toLowerCase().includes(term) ||
          userName.toLowerCase().includes(term) ||
          request.currentLocation.toLowerCase().includes(term)
        );
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredRequests.sort((a, b) => {
        const getValue = (obj, path) =>
          path.split(".").reduce((o, p) => (o || {})[p], obj);

        const aValue = getValue(a, sortConfig.key);
        const bValue = getValue(b, sortConfig.key);

        // Sort by date
        if (sortConfig.key === "request.requestedStartDate") {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }

        // Sort by priority (custom order)
        if (sortConfig.key === "request.priority") {
          const priorityOrder =
            sortConfig.direction === "asc"
              ? { LOW: 1, MODERATE: 2, HIGH: 3 }
              : { HIGH: 1, MODERATE: 2, LOW: 3 };
          return priorityOrder[aValue] - priorityOrder[bValue];
        }

        // Sort by category (custom order)
        if (sortConfig.key === "request.categoryOfReason") {
          const categoryOrder =
            sortConfig.direction === "asc"
              ? {
                  Personal: 5,
                  Permanent: 4,
                  Medical: 1,
                  Maternity: 3,
                  "Family Medical": 2,
                }
              : {
                  "Family Medical": 4,
                  Maternity: 3,
                  Medical: 5,
                  Permanent: 2,
                  Personal: 1,
                };
          return categoryOrder[aValue] - categoryOrder[bValue];
        }

        // Fallback generic string comparison
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filteredRequests;
  }, [requests, searchTerm, sortConfig]);

  // Group requests based on current grouping preference
  const groupedRequests = useMemo(() => {
    if (groupBy === "none") {
      return {
        all: { name: "All Requests", requests: sortedAndFilteredRequests },
      };
    }

    return sortedAndFilteredRequests.reduce((acc, requestData) => {
      const { request, teamOwnerName } = requestData;
      let groupKey, groupName;

      if (groupBy === "team") {
        groupKey = request.teamOwnerId;
        groupName = `Team: ${teamOwnerName} (ID: ${groupKey})`;
      } else if (groupBy === "sdm") {
        groupKey = request.dmId;
        groupName = `SDM: ${requestData.userName} (ID: ${groupKey})`;
      }

      if (!acc[groupKey]) {
        acc[groupKey] = { name: groupName, requests: [] };
      }
      acc[groupKey].requests.push(requestData);
      return acc;
    }, {});
  }, [sortedAndFilteredRequests, groupBy]);

  const toggleGroupExpand = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
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
              placeholder="Search by ID, name, category or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grouping Controls */}
        <div className="flex space-x-2">
          <button
            onClick={() => setGroupBy("none")}
            className={`px-3 py-1 text-sm rounded-md ${
              groupBy === "none"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            No Grouping
          </button>
          <button
            onClick={() => setGroupBy("team")}
            className={`px-3 py-1 text-sm rounded-md ${
              groupBy === "team"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Group by Team
          </button>
          <button
            onClick={() => setGroupBy("sdm")}
            className={`px-3 py-1 text-sm rounded-md ${
              groupBy === "sdm"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Group by SDM
          </button>
        </div>
      </div>

      {/* Requests Table */}
      {Object.entries(groupedRequests).map(([groupKey, group]) => (
        <div
          key={groupKey}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          {groupBy !== "none" && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {group.name}
              </h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {group.requests.length} request
                  {group.requests.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => toggleGroupExpand(groupKey)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  {expandedGroups[groupKey] ? "Collapse ▲" : "Expand ▼"}
                </button>
              </div>
            </div>
          )}

          {(groupBy === "none" || expandedGroups[groupKey]) && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("request.requestedStartDate")}
                    >
                      Dates {getSortIndicator("request.requestedStartDate")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("request.categoryOfReason")}
                    >
                      Category {getSortIndicator("request.categoryOfReason")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("request.priority")}
                    >
                      Priority {getSortIndicator("request.priority")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall Status
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HR Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.requests.map(
                    ({
                      request,
                      hrStatus,
                      hrUpdatedDate,
                      userName,
                      teamOwnerName,
                    }) => (
                      <tr key={request.requestId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userName}
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
                              priorityStyles[request.priority]
                            }`}
                          >
                            {priorityLabels[request.priority]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.currentLocation}
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusStyles[request.status]
                        }`}>
                          {statusLabels[request.status]}
                        </span>
                      </td> */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusStyles[hrStatus || "PENDING"]
                            }`}
                          >
                            {statusLabels[hrStatus || "PENDING"]}
                          </span>
                          {hrUpdatedDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(hrUpdatedDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {hrStatus === "PENDING" ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/hr-dashboard/request-details/${request.requestId}`
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
                                  `/hr-dashboard/request-details/${request.requestId}`
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

export default HRRequestsTable;
