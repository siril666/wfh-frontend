import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeamManagerRequestsTable from "./TeamManagerRequestsTable";
import SummaryCards from "../sdm_dashboard/SummaryCards";
import { getAllRequestsByTeamOwnerId, getProfile } from "../../api/apiService";

const TeamManagerDashboard = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
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

  // Summary stats
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

  // Filter requests based on status and search
  const filterRequests = (status) => {
    setActiveFilter(status);
    applySearchAndFilter(allRequests, searchTerm, status);
  };

  // Search input handler
  const onSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    applySearchAndFilter(allRequests, term, activeFilter);
  };

  // Apply filtering + searching together
  const applySearchAndFilter = (requests, term, status) => {
    const lowerSearch = term.toLowerCase();

    let filtered = requests;

    if (status !== "ALL") {
      filtered = filtered.filter(req => req.request.status === status);
    }

    filtered = filtered.filter(req => {
      const idStr = String(req?.request?.ibsEmpId || "");
      const nameStr = (req?.employeeName || "").toLowerCase();
      return (
        idStr.toLowerCase().includes(lowerSearch) ||
        nameStr.includes(lowerSearch)
      );
    });

    setFilteredRequests(filtered);
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

        {/* Summary Cards (Filter Tabs) */}
        <SummaryCards
          total={totalRequests}
          approved={approvedCount}
          pending={pendingCount}
          rejected={rejectedCount}
          onFilter={filterRequests}
          activeFilter={activeFilter}
        />

        {/* Search box below filter tabs */}
        <div className="my-4">
          <input
            type="text"
            placeholder="Search by Employee ID or Name"
            value={searchTerm}
            onChange={onSearchChange}
            className="border border-gray-300 rounded-md px-3 py-1 w-full max-w-sm focus:outline-none focus:ring focus:border-indigo-500"
          />
        </div>

        {/* Requests Table */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-light text-gray-800">
                Team Requests
              </h2>
              <div className="text-sm text-gray-500">
                Showing: {filteredRequests.length} of {allRequests.length} requests
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
