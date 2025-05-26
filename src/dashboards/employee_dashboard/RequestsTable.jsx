import React, { useState, useMemo } from "react";

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

const ApprovalFlowPopup = ({ request, onClose }) => {
  const statusIcons = {
    APPROVED: '✓',
    REJECTED: '✕',
    PENDING: '⋯'
  };

  const ApprovalStep = ({ step, title, status }) => (
    <div className="relative pl-8 pb-4">
      <div className="absolute left-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
        {step}
      </div>
      <div className="flex justify-between">
        <span className="text-sm">{title}</span>
        <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[status]}`}>
          {statusIcons[status]} {statusLabels[status]}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Approval Flow #{request.request.requestId}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="border-l-2 border-gray-200 pl-4 mb-4">
          <ApprovalStep step={1} title="Team Manager" status={request.tmStatus} />
          {request.tmStatus === 'APPROVED' && (
            <ApprovalStep step={2} title="Senior Manager" status={request.sdmStatus} />
          )}
          {request.tmStatus === 'APPROVED' && request.sdmStatus === 'APPROVED' && (
            <ApprovalStep step={3} title="HR Manager" status={request.hrStatus} />
          )}
        </div>

        <div className="text-sm p-3 bg-gray-50 rounded mb-4">
          {request.rejectedBy ? (
            <p className="text-red-600">Rejected by {request.rejectedBy}</p>
          ) : request.currentStage === 'COMPLETED' ? (
            <p className="text-green-600">Approved</p>
          ) : (
            <p>Pending with {request.currentStage}</p>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const RequestsTable = ({ requests, navigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "requestedStartDate",
    direction: "desc",
  });
  const [selectedRequest, setSelectedRequest] = useState(null);

  const sortedAndFilteredRequests = useMemo(() => {
    let filteredRequests = [...requests];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter((request) => {
        return (
          request.request.categoryOfReason.toLowerCase().includes(term) ||
          request.request.employeeReason.toLowerCase().includes(term) ||
          request.request.status.toLowerCase().includes(term) ||
          request.request.priority.toLowerCase().includes(term)
        );
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredRequests.sort((a, b) => {
        // Handle nested request properties
        const aValue = sortConfig.key.includes('.') 
          ? sortConfig.key.split('.').reduce((o, i) => o[i], a)
          : a[sortConfig.key];
        
        const bValue = sortConfig.key.includes('.') 
          ? sortConfig.key.split('.').reduce((o, i) => o[i], b)
          : b[sortConfig.key];

        // Special handling for dates
        if (sortConfig.key.includes('Date')) {
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

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
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
            placeholder="Search by category, status, or priority..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5 cursor-pointer"
                onClick={() => requestSort("request.categoryOfReason")}
              >
                Category {getSortIndicator("request.categoryOfReason")}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 cursor-pointer"
                onClick={() => requestSort("request.requestedStartDate")}
              >
                Dates {getSortIndicator("request.requestedStartDate")}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 cursor-pointer"
                onClick={() => requestSort("request.status")}
              >
                Status {getSortIndicator("request.status")}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 cursor-pointer"
                onClick={() => requestSort("request.priority")}
              >
                Priority {getSortIndicator("request.priority")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredRequests.length > 0 ? (
              sortedAndFilteredRequests.map((request) => (
                <tr 
                  key={request.request.requestId} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{request.request.categoryOfReason}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{request.request.employeeReason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(request.request.requestedStartDate).toLocaleDateString()} - {' '}
                      {new Date(request.request.requestedEndDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[request.request.status]}`}>
                      {statusLabels[request.request.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityStyles[request.request.priority]}`}>
                      {priorityLabels[request.request.priority]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.request.termDuration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.request.status === "PENDING" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employee-dashboard/wfh_request/edit/${request.request.requestId}`);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No matching requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Approval Flow Popup */}
      {selectedRequest && (
        <ApprovalFlowPopup 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

export default RequestsTable;