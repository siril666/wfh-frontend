import React, { useEffect, useState } from "react";
import { getProfile, getSdmApprovalRequestsHistory } from "../../api/apiService";
import SummaryCards from "./SummaryCards";
import SdmRequestsTable from "./SdmRequestsTable";

const SdmDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    getSdmApprovalRequestsHistory().then((res) => {
      const sortedRequests = res.data.sort((a, b) => b.request.requestId - a.request.requestId);
      setRequests(sortedRequests);
      setFilteredRequests(sortedRequests);
    });

    getProfile().then((res) => {
      setUserName(res.data.userName);
    });
  }, []);

  // Calculate summary stats
  const totalRequests = requests.length;
  const pendingCount = requests.filter(req => req.sdmStatus === "PENDING").length;
  const approvedCount = requests.filter(req => req.sdmStatus === "APPROVED").length;
  const rejectedCount = requests.filter(req => req.sdmStatus === "REJECTED").length;

  // Filter requests based on status
  const filterRequests = (status) => {
    setActiveFilter(status);
    if (status === "ALL") {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(req => req.sdmStatus === status));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-light text-gray-800">Hello {userName}</h1>
        </div>

        {/* Summary Cards */}
        <SummaryCards
          total={totalRequests} 
          approved={approvedCount} 
          pending={pendingCount}
          rejected={rejectedCount}
          onFilter={filterRequests}
          activeFilter={activeFilter}
        />

        {/* Requests Table Section */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-light text-gray-800">Team Requests Overview</h2>
            <div className="text-sm text-gray-500 mt-1">
              Total requests: {filteredRequests.length}
            </div>
          </div>
          <SdmRequestsTable
            requests={filteredRequests} 
            activeFilter={activeFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default SdmDashboard;