import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, getRequestsHistory } from "../../api/apiService";
import SummaryCards from "./SummaryCards";
import RequestsTable from "./RequestsTable";
import Sidebar from "../../nav/Sidebar";

export default function EmployeeDashboard() {
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getRequestsHistory().then((response) => {
      const sortedRequests = response.data.sort(
        (a, b) => b.request.requestId - a.request.requestId
      );
      setAllRequests(sortedRequests);
      setFilteredRequests(sortedRequests); // Show all by default
    });

    getProfile()
      .then((response) => {
        setUserName(response.data.userName);
      })
      .catch((error) => {
        console.error("Error fetching user profile:", error);
      });
  }, []);

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
      setFilteredRequests(allRequests.filter((req) => req.request.status === status));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-6">
        <h1 className="text-2xl font-light text-gray-800">
          Hello {userName}
        </h1>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          onClick={() => navigate("/employee-dashboard/wfh_request")}
        >
          New Request
        </button>
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
              Request History
            </h2>
            <div className="text-sm text-gray-500">
              Showing: {filteredRequests.length} of {allRequests.length}{" "}
              requests
            </div>
          </div>
          <RequestsTable requests={filteredRequests} navigate={navigate} />
        </div>
      </div>
    </div>
  );
}