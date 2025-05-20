import React from "react";

const statusStyles = {
  APPROVED: "bg-green-100 text-green-800",
  PENDING: "bg-orange-100 text-orange-800",
  REJECTED: "bg-red-100 text-red-800"
};

const statusLabels = {
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected"
};

const priorityStyles = {
  HIGH: "bg-red-100 text-red-800",
  MODERATE: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800"
};

const priorityLabels = {
  HIGH: "High",
  MODERATE: "Medium",
  LOW: "Low"
};

const TeamManagerRequestsTable = ({ requests, navigate }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
              Dates
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
              Reason
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
              TM Status
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
          {requests.length > 0 ? (
            requests.map((request) => (
              <tr key={request.request.requestId} className="hover:bg-gray-50">
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
                    {new Date(request.request.requestedStartDate).toLocaleDateString()} - {' '}
                    {new Date(request.request.requestedEndDate).toLocaleDateString()}
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
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    statusStyles[request.tmStatus || "PENDING"]
                  }`}>
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
                    <>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusStyles[request.sdmStatus]
                      }`}>
                        {statusLabels[request.sdmStatus]}
                      </span>
                      {request.sdmActionDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(request.sdmActionDate).toLocaleDateString()}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Not reviewed</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => navigate(`/tm-dashboard/request-details/${request.request.requestId}`)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    View
                  </button>
                  {/* {request.request.status === "PENDING" && (
                    <button
                      onClick={() => navigate(`/tm-dashboard/request-details/${request.request.requestId}`)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Approve/Reject
                    </button>
                  )} */}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
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