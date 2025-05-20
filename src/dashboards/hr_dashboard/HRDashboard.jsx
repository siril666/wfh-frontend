import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HRRequestsTable from "./HRRequestsTable";
import { getAllWFHRequestForHR, getProfile } from "../../api/apiService";
import SummaryCards from "./SummaryCards";

const HRDashboard = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
    fetchProfile();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await getAllWFHRequestForHR();
      const sortedRequests = res.data.sort(
        (a, b) => b.request.requestId - a.request.requestId
      );
      setAllRequests(sortedRequests);
      setFilteredRequests(sortedRequests);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setUserName(res.data.userName);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  // Calculate summary stats based on HR status
  const totalRequests = allRequests.length;
  const approvedCount = allRequests.filter(
    (req) => req.hrStatus === "APPROVED"
  ).length;
  const pendingCount = allRequests.filter(
    (req) => req.hrStatus === "PENDING"
  ).length;
  const rejectedCount = allRequests.filter(
    (req) => req.hrStatus === "REJECTED"
  ).length;

  // Filter requests based on HR status
  const filterRequests = (status) => {
    setActiveFilter(status);
    if (status === "ALL") {
      setFilteredRequests(allRequests);
    } else {
      setFilteredRequests(
        allRequests.filter((req) => req.hrStatus === status)
      );
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
            <h2 className="text-lg font-light text-gray-800">WFH Requests Overview</h2>
            <div className="text-sm text-gray-500 mt-1">
              Total requests: {filteredRequests.length}
            </div>
          </div>
          <HRRequestsTable
            requests={filteredRequests} 
            activeFilter={activeFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;