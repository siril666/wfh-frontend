

import React, { useState, useEffect } from "react";

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

const priorityOrder = {
  HIGH: 1,
  MODERATE: 2,
  LOW: 3,
};

const TeamManagerRequestsTable = ({ requests, navigate }) => {
  const [sortedRequests, setSortedRequests] = useState([]);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [sortByDateAsc, setSortByDateAsc] = useState(true);

  useEffect(() => {
    let sorted = [...requests];
    sorted.sort((a, b) => {
      const dateA = new Date(a.request.requestedStartDate);
      const dateB = new Date(b.request.requestedStartDate);
      return sortByDateAsc ? dateA - dateB : dateB - dateA;
    });

    if (sortByPriority) {
      sorted.sort((a, b) => {
        const prioA = priorityOrder[a.request.priority || "LOW"];
        const prioB = priorityOrder[b.request.priority || "LOW"];
        return prioA - prioB;
      });
    }

    setSortedRequests(sorted);
  }, [requests, sortByPriority, sortByDateAsc]);

  const togglePrioritySort = () => setSortByPriority((prev) => !prev);
  const toggleDateSort = () => setSortByDateAsc((prev) => !prev);

  const getHrStatus = (sdmStatus, hrStatus) => {
    if (!sdmStatus || sdmStatus === "PENDING") {
      return {
        status: "NOT_REVIEWED",
        label: "Not Reviewed",
      };
    }
    if (sdmStatus === "REJECTED") {
      return {
        status: "NOT_REVIEWED",
        label: "Not Reviewed",
      };
    }
    if (sdmStatus === "APPROVED") {
      return {
        status: hrStatus || "PENDING",
        label: statusLabels[hrStatus] || "Pending",
      };
    }
    return {
      status: "NOT_REVIEWED",
      label: "Not Reviewed",
    };
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
              <div className="flex items-center gap-2">
                Dates
                <button
                  onClick={toggleDateSort}
                  className="text-gray-500 hover:text-gray-800"
                  title="Sort by Date"
                >
                  {sortByDateAsc ? "⬆️" : "⬇️"}
                </button>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
              <div className="flex items-center gap-2">
                Priority
                <button
                  onClick={togglePrioritySort}
                  className="text-gray-500 hover:text-gray-800"
                  title="Sort by Priority"
                >
                  {sortByPriority ? "⬆️" : "⬇️"}
                </button>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
              TM Status
            </th>
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
          {sortedRequests.length > 0 ? (
            sortedRequests.map((request) => {
              const hrStatusInfo = getHrStatus(request.sdmStatus, request.hrStatus);

              return (
                <tr
                  key={request.request.requestId}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {request.employeeName}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {request.request.ibsEmpId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(
                        request.request.requestedStartDate
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        request.request.requestedEndDate
                      ).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.request.termDuration}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {request.request.categoryOfReason}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {request.request.employeeReason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        priorityStyles[request.request.priority || "LOW"]
                      }`}
                    >
                      {priorityLabels[request.request.priority || "LOW"]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusStyles[request.tmStatus || "PENDING"]
                      }`}
                    >
                      {statusLabels[request.tmStatus || "PENDING"]}
                    </span>
                    {request.tmActionDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(request.tmActionDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.sdmStatus ? (
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusStyles[request.sdmStatus]
                        }`}
                      >
                        {statusLabels[request.sdmStatus]}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Not Reviewed</span>
                    )}
                    {request.sdmActionDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(request.sdmActionDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hrStatusInfo.status === "NOT_REVIEWED" ? (
                      <span className="text-sm text-gray-500">{hrStatusInfo.label}</span>
                    ) : (
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusStyles[hrStatusInfo.status]
                        }`}
                      >
                        {hrStatusInfo.label}
                      </span>
                    )}
                    {request.hrActionDate && hrStatusInfo.status !== "NOT_REVIEWED" && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(request.hrActionDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() =>
                        navigate(
                          `/tm-dashboard/request-details/${request.request.requestId}`
                        )
                      }
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan="8"
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No requests found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TeamManagerRequestsTable;