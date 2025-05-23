import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  approveRequestByTeamOwner,
  getRequestDetailsByRequestId,
  rejectRequestByTeamOwner,
} from "../../api/apiService";

const RequestDetailPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

    // NEW STATE FOR CONFIRMATION POPUP
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'approve' or 'reject'  

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const res = await getRequestDetailsByRequestId(requestId);
        setRequestData(res.data);
      } catch (error) {
        console.error("Failed to fetch request details", error);
        toast.error("Failed to load request details");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  const handleActionConfirmation = (action) => {
    setPendingAction(action);
    setShowConfirmation(true);
  };

  const handleConfirmAction = async () => {
    setShowConfirmation(false);
    setActionLoading(true);
    
    try {
      if (pendingAction === 'approve') {
        await approveRequestByTeamOwner(requestId);
        setRequestData(prev => ({
          ...prev,
          currentUserApprovalStatus: {
            ...prev.currentUserApprovalStatus,
            status: "APPROVED",
            updatedDate: new Date().toISOString().split('T')[0]
          }
        }));
        toast.success("Request approved successfully!");
      } else {
        await rejectRequestByTeamOwner(requestId);
        setRequestData(prev => ({
          ...prev,
          currentUserApprovalStatus: {
            ...prev.currentUserApprovalStatus,
            status: "REJECTED",
            updatedDate: new Date().toISOString().split('T')[0]
          }
        }));
        toast.success("Request rejected successfully!");
      }
    } catch (error) {
      toast.error(`Error ${pendingAction === 'approve' ? 'approving' : 'rejecting'} request`);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="text-center p-10">
        <p className="text-red-600">No request found for ID {requestId}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const { wfhRequest, employeeMaster, currentUserApprovalStatus } = requestData;
  const isPending = currentUserApprovalStatus?.status === "PENDING";
  const duration = wfhRequest.termDuration || 
    `${Math.floor((new Date(wfhRequest.requestedEndDate) - new Date(wfhRequest.requestedStartDate)) / (1000 * 60 * 60 * 24)) + 1} Days`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* NEW: CONFIRMATION POPUP */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Submission
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to {pendingAction} this request? This action will be submitted to SDM.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Confirm {pendingAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-light text-gray-800">Request Details</h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Employee Info Header */}
          <div className="bg-indigo-50 p-6 border-b border-indigo-100">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-800">{employeeMaster.expediaFGName}</h2>
                <p className="text-sm text-gray-600">ID: {wfhRequest.ibsEmpId} • {employeeMaster.role}</p>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField label="Team" value={employeeMaster.team} />
            <DetailField label="Location" value={employeeMaster.location} />
            <DetailField label="Start Date" value={wfhRequest.requestedStartDate} />
            <DetailField label="End Date" value={wfhRequest.requestedEndDate} />
            <DetailField label="Duration" value={duration} />
            <DetailField 
              label="Priority" 
              value={
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  wfhRequest.priority === "HIGH" 
                    ? "bg-red-100 text-red-800" 
                    : wfhRequest.priority === "MODERATE" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-green-100 text-green-800"
                }`}>
                  {wfhRequest.priority}
                </span>
              } 
            />
            <DetailField label="Category" value={wfhRequest.categoryOfReason} />
            <DetailField 
              label="Status" 
              value={
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  currentUserApprovalStatus.status === "APPROVED" 
                    ? "bg-green-100 text-green-800" 
                    : currentUserApprovalStatus.status === "REJECTED" 
                      ? "bg-red-100 text-red-800" 
                      : "bg-orange-100 text-orange-800"
                }`}>
                  {currentUserApprovalStatus.status}
                </span>
              } 
            />
          </div>

          {/* Reason Section */}
          <div className="px-6 pb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Reason</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700 italic">"{wfhRequest.employeeReason}"</p>
            </div>
          </div>

          {/* Attachment */}
          {wfhRequest.attachmentPath && (
            <div className="px-6 pb-6">
              <a
                href={wfhRequest.attachmentPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                View Attachment
              </a>
            </div>
          )}

          {/* Action Buttons */}
          {isPending && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-4">
              <button
                onClick={() => handleActionConfirmation('reject')}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                  actionLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : "Reject"}
              </button>
              <button
                onClick={() => handleActionConfirmation('approve')}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                  actionLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : "Approve"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailField = ({ label, value }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="text-sm text-gray-900">{value}</div>
  </div>
);

export default RequestDetailPage;