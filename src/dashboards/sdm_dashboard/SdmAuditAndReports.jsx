import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { getSdmApprovalRequestsHistory } from "../../api/apiService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

const SdmAuditAndReports = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState("table"); // 'table' or 'graph'
  const [graphType, setGraphType] = useState("monthly"); // 'monthly', 'team', 'reason'
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'week', 'month', 'quarter', 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // New status filter state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getSdmApprovalRequestsHistory();
        setRequests(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sort requests
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "↑" : "↓";
    }
    return null;
  };

  // Filter requests based on filters
  const filteredRequests = requests.filter(
    ({ employeeName, request, teamOwnerName, sdmStatus }) => {
      // Search term filter
      const matchesSearch =
        employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.ibsEmpId.toString().includes(searchTerm);

        // Date filter
        const requestDate = new Date(request.requestedStartDate);
        requestDate.setHours(0, 0, 0, 0); // Normalize to start of day

        let matchesDate = true;
        let start, end; // Define start/end for custom usage

        if (dateFilter === "week") {
          // Last 7 days (including today)
          start = new Date();
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);

          end = new Date();
          end.setHours(23, 59, 59, 999); // End of today

          matchesDate = requestDate >= start && requestDate <= end;
        } 
        else if (dateFilter === "month") {
          // Last 30 days (including today)
          start = new Date();
          start.setMonth(start.getMonth() - 1);
          start.setHours(0, 0, 0, 0);

          end = new Date();
          end.setHours(23, 59, 59, 999); // End of today

          matchesDate = requestDate >= start && requestDate <= end;
        } 
        else if (dateFilter === "quarter") {
          // Last 90 days (including today)
          start = new Date();
          start.setMonth(start.getMonth() - 3);
          start.setHours(0, 0, 0, 0);

          end = new Date();
          end.setHours(23, 59, 59, 999); // End of today

          matchesDate = requestDate >= start && requestDate <= end;
        } 
        else if (dateFilter === "custom" && startDate && endDate) {
          // Custom range (user-provided)
          start = new Date(startDate);
          end = new Date(endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999); // Include full end day

          matchesDate = requestDate >= start && requestDate <= end;
        }
        
      // Team filter
      const matchesTeam = teamFilter
        ? teamOwnerName.toLowerCase().includes(teamFilter.toLowerCase())
        : true;

      // Status filter
      const matchesStatus = statusFilter
        ? sdmStatus === statusFilter
        : true;

      return matchesSearch && matchesDate && matchesTeam && matchesStatus;
    }
  );

  // Sort filtered requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const keyParts = sortConfig.key.split(".");
    let valueA = a;
    let valueB = b;

    for (const part of keyParts) {
      valueA = valueA[part];
      valueB = valueB[part];
    }

    if (valueA < valueB) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Get unique teams for filter dropdown
  const uniqueTeams = [
    ...new Set(requests.map((request) => request.teamOwnerName)),
  ].filter(Boolean);

  // Prepare data for the graph
  const prepareGraphData = () => {
    if (graphType === "monthly") {
      const monthlyData = filteredRequests.reduce(
        (acc, { request, sdmStatus }) => {
          const month = new Date(request.requestedStartDate).toLocaleString(
            "default",
            { month: "short", year: "numeric" }
          );
          if (!acc[month]) {
            acc[month] = { name: month, APPROVED: 0, REJECTED: 0, PENDING: 0 };
          }
          acc[month][sdmStatus]++;
          return acc;
        },
        {}
      );

      return Object.values(monthlyData);
    } else if (graphType === "team") {
      const teamData = filteredRequests.reduce(
        (acc, { teamOwnerName, sdmStatus }) => {
          if (!teamOwnerName) return acc;
          if (!acc[teamOwnerName]) {
            acc[teamOwnerName] = {
              name: teamOwnerName,
              APPROVED: 0,
              REJECTED: 0,
              PENDING: 0,
            };
          }
          acc[teamOwnerName][sdmStatus]++;
          return acc;
        },
        {}
      );

      return Object.values(teamData);
    } else if (graphType === "reason") {
      const reasonData = filteredRequests.reduce(
        (acc, { request, sdmStatus }) => {
          const reason = request.categoryOfReason || "Other";
          if (!acc[reason]) {
            acc[reason] = {
              name: reason,
              APPROVED: 0,
              REJECTED: 0,
              PENDING: 0,
            };
          }
          acc[reason][sdmStatus]++;
          return acc;
        },
        {}
      );

      return Object.values(reasonData);
    }

    return [];
  };

  const graphData = prepareGraphData();

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = viewType === "table" ? filteredRequests : requests;

    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map(
        ({
          employeeName,
          request,
          sdmStatus,
          hrStatus,
          sdmUpdatedDate,
          teamOwnerName,
        }) => ({
          "Employee Name": employeeName,
          "Employee ID": request.ibsEmpId,
          "Start Date": request.requestedStartDate,
          "End Date": request.requestedEndDate,
          Reason: request.employeeReason,
          Category: request.categoryOfReason,
          Team: teamOwnerName,
          "SDM Status": sdmStatus,
          "HR Status": hrStatus || "N/A",
          "Action Date": sdmUpdatedDate || "N/A",
        })
      )
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WFH Requests");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, `WFH_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading data...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">WFH Audit & Reports</h1>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
                placeholder="Search by name, ID, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Team Filter */}
          <div className="w-full sm:w-48">
            <div className="relative w-full">
              <select
                className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="">All Teams</option>
                {uniqueTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <div className="relative w-full">
              <select
                className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Filter */}
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-32">
              <select
                className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="custom">Custom Range</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                </svg>
              </div>
            </div>

            {dateFilter === "custom" && (
              <>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="flex items-center justify-center">to</span>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </>
            )}
          </div>

          {/* View Type */}
          <div className="w-full sm:w-48">
            <div className="relative w-full">
              <select
                className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
              >
                <option value="table">Table View</option>
                <option value="graph">Graph View</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Graph Type (if graph view selected) */}
          {viewType === "graph" && (
            <div className="relative w-full sm:w-48">
              <select
                className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={graphType}
                onChange={(e) => setGraphType(e.target.value)}
              >
                <option value="monthly">By Month</option>
                <option value="team">By Team</option>
                <option value="reason">By Category</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                </svg>
              </div>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={exportToExcel}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Export to Excel
          </button>
        </div>
      </div>

      {/* Content */}
      {viewType === "table" ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("employeeName")}
                  >
                    Employee {getSortIndicator("employeeName")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("request.requestedStartDate")}
                  >
                    Dates {getSortIndicator("request.requestedStartDate")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("teamOwnerName")}
                  >
                    Team {getSortIndicator("teamOwnerName")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("sdmStatus")}
                  >
                    SDM Status {getSortIndicator("sdmStatus")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HR Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRequests.length > 0 ? (
                  sortedRequests.map(
                    ({
                      employeeName,
                      request,
                      sdmStatus,
                      hrStatus,
                      sdmUpdatedDate,
                      teamOwnerName,
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
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.categoryOfReason}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {request.employeeReason}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {teamOwnerName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[sdmStatus]}`}
                          >
                            {statusLabels[sdmStatus]}
                          </span>
                          {sdmUpdatedDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(sdmUpdatedDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hrStatus ? (
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[hrStatus]}`}
                            >
                              {statusLabels[hrStatus]}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Not reviewed
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No matching requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-medium mb-4">
            {graphType === "monthly" && "Monthly WFH Requests"}
            {graphType === "team" && "WFH Requests by Team"}
            {graphType === "reason" && "WFH Requests by Reason"}
          </h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={graphData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="APPROVED" fill="#10B981" name="Approved" />
                <Bar dataKey="REJECTED" fill="#EF4444" name="Rejected" />
                <Bar dataKey="PENDING" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default SdmAuditAndReports;