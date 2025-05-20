import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeamManagerRequestsTable from "./TeamManagerRequestsTable";
import SummaryCards from "../sdm_dashboard/SummaryCards";
import { getAllRequestsByTeamOwnerId, getProfile } from "../../api/apiService";

const TeamManagerDashboard = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [userName, setUserName] = useState("");
  const [profile, setProfile] = useState({});
  const navigate = useNavigate();

  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!accessToken) return;
    fetchRequests();
    fetchProfile();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await getAllRequestsByTeamOwnerId();
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
      const res = await getProfile(accessToken);
      setProfile(res.data);
      setUserName(res.data.userName);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  // Calculate summary stats
  const totalRequests = allRequests.length;
  const approvedCount = allRequests.filter(
    (req) => req.request.status === "APPROVED"
  ).length;
  const pendingCount = allRequests.filter(
    (req) => req.request.status === "PENDING"
  ).length;
  const rejectedCount = allRequests.filter(
    (req) => req.request.status === "REJECTED"
  ).length;

  // Filter requests based on status
  const filterRequests = (status) => {
    setActiveFilter(status);
    if (status === "ALL") {
      setFilteredRequests(allRequests);
    } else {
      setFilteredRequests(
        allRequests.filter((req) => req.request.status === status)
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <main className="flex-1 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-light text-gray-800">
            Hello {userName} 👋🏼
          </h1>
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

        {/* Requests Table */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-light text-gray-800">
                Team Requests
              </h2>
              <div className="text-sm text-gray-500">
                Showing: {filteredRequests.length} of {allRequests.length}{" "}
                requests
              </div>
            </div>
            <TeamManagerRequestsTable
              requests={filteredRequests}
              navigate={navigate}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamManagerDashboard;
