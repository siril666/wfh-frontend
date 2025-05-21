import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { getAllRequestsByTeamOwnerId } from "../../api/apiService";
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

const TeamManagerAuditAndReports = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState("table"); // 'table' or 'graph'
  const [graphType, setGraphType] = useState("monthly"); // 'monthly', 'reason', 'priority'
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'week', 'month', 'quarter', 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllRequestsByTeamOwnerId();
        setRequests(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const filteredRequests = requests.filter(({ employeeName, request }) => {
    const matchesSearch =
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.ibsEmpId.toString().includes(searchTerm);

    const requestDate = new Date(request.requestedStartDate);
    let matchesDate = true;

    if (dateFilter === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchesDate = requestDate >= oneWeekAgo;
    } else if (dateFilter === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      matchesDate = requestDate >= oneMonthAgo;
    } else if (dateFilter === "quarter") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      matchesDate = requestDate >= threeMonthsAgo;
    } else if (dateFilter === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      matchesDate = requestDate >= start && requestDate <= end;
    }

    return matchesSearch && matchesDate;
  });

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

  const prepareGraphData = () => {
    if (graphType === "monthly") {
      const monthlyData = filteredRequests.reduce(
        (acc, { request, tmStatus }) => {
          const month = new Date(request.requestedStartDate).toLocaleString(
            "default",
            { month: "short", year: "numeric" }
          );
          if (!acc[month]) {
            acc[month] = { name: month, APPROVED: 0, REJECTED: 0, PENDING: 0 };
          }
          acc[month][tmStatus]++;
          return acc;
        },
        {}
      );
      return Object.values(monthlyData);
    } else if (graphType === "reason") {
      const reasonData = filteredRequests.reduce(
        (acc, { request, tmStatus }) => {
          const reason = request.categoryOfReason || "Other";
          if (!acc[reason]) {
            acc[reason] = {
              name: reason,
              APPROVED: 0,
              REJECTED: 0,
              PENDING: 0,
            };
          }
          acc[reason][tmStatus]++;
          return acc;
        },
        {}
      );
      return Object.values(reasonData);
    } else if (graphType === "priority") {
      const priorityData = filteredRequests.reduce(
        (acc, { request, tmStatus }) => {
          const priority = request.priority || "MODERATE";
          if (!acc[priority]) {
            acc[priority] = {
              name: priorityLabels[priority],
              APPROVED: 0,
              REJECTED: 0,
              PENDING: 0,
            };
          }
          acc[priority][tmStatus]++;
          return acc;
        },
        {}
      );
      return Object.values(priorityData);
    }
    return [];
  };

  const graphData = prepareGraphData();

  const exportToExcel = () => {
    const dataToExport = viewType === "table" ? filteredRequests : requests;

    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map(
        ({ employeeName, request, tmStatus, sdmStatus, tmActionDate }) => ({
          "Employee Name": employeeName,
          "Employee ID": request.ibsEmpId,
          "Start Date": request.requestedStartDate,
          "End Date": request.requestedEndDate,
          Reason: request.employeeReason,
          Category: request.categoryOfReason,
          Priority: priorityLabels[request.priority],
          "TM Status": tmStatus,
          "SDM Status": sdmStatus || "Pending",
          "Action Date": tmActionDate || "N/A",
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
    saveAs(data, `WFH_TM_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
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
      <h1 className="text-xl font-semibold">WFH Audit & Reports (Team Manager)</h1>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
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
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                </svg>
              </div>
            </div>
          </div>

          {viewType === "graph" && (
            <div className="relative w-full sm:w-48">
              <select
                className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={graphType}
                onChange={(e) => setGraphType(e.target.value)}
              >
                <option value="monthly">By Month</option>
                <option value="reason">By Reason</option>
                <option value="priority">By Priority</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                </svg>
              </div>
            </div>
          )}

          <button
            onClick={exportToExcel}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Export to Excel
          </button>
        </div>
      </div>

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
                    onClick={() => requestSort("request.priority")}
                  >
                    Priority {getSortIndicator("request.priority")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("tmStatus")}
                  >
                    TM Status {getSortIndicator("tmStatus")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("sdmStatus")}
                  >
                    SDM Status {getSortIndicator("sdmStatus")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRequests.length > 0 ? (
                  sortedRequests.map(
                    ({
                      employeeName,
                      request,
                      tmStatus,
                      sdmStatus,
                      tmActionDate,
                      sdmActionDate,
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
                          <div className="text-xs text-gray-500">
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
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusStyles[tmStatus]
                            }`}
                          >
                            {statusLabels[tmStatus]}
                          </span>
                          {tmActionDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(tmActionDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusStyles[sdmStatus || "PENDING"]
                            }`}
                          >
                            {statusLabels[sdmStatus || "PENDING"]}
                          </span>
                          {sdmActionDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(sdmActionDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tmActionDate
                            ? new Date(tmActionDate).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="7"
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
            {graphType === "reason" && "WFH Requests by Reason"}
            {graphType === "priority" && "WFH Requests by Priority"}
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

export default TeamManagerAuditAndReports;


