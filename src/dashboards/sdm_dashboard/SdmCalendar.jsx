import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";
import { getSdmCalendar, getSdmDateDetails } from "../../api/apiService";

const statusStyles = {
  APPROVED: "bg-green-100 text-green-800 border-l-4 border-green-500",
  PENDING: "bg-orange-100 text-orange-800 border-l-4 border-orange-500",
  REJECTED: "bg-red-100 text-red-800 border-l-4 border-red-500",
  PENDING_HR: "bg-blue-100 text-blue-800 border-l-4 border-blue-500",
  DEFAULT: "bg-gray-50 text-gray-600",
};

const SdmCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [dateDetails, setDateDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSdmCalendar()
      .then((response) => {
        setCalendarData(response.data);
      })
      .catch((err) => {
        console.error("Failed to fetch calendar data", err);
      })
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const calendarDays = [
    ...Array.from({ length: startDay }, () => null),
    ...monthDays,
  ];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDateStatus = (dateStr) => {
    const dateEntry = calendarData.find((item) => item.date === dateStr);
    if (!dateEntry) return null;

    const teams = Object.keys(dateEntry.teamStatus);
    if (teams.length === 0) return null;

    // Get status for all teams on this date
    const statusCounts = {
      approvedBySdm: 0,
      pendingWithSdm: 0,
      rejectedBySdm: 0,
      pendingWithHr: 0,
    };

    teams.forEach((teamId) => {
      const team = dateEntry.teamStatus[teamId];
      statusCounts.approvedBySdm += team.approvedBySdm;
      statusCounts.pendingWithSdm += team.pendingWithSdm;
      statusCounts.rejectedBySdm += team.rejectedBySdm;
      statusCounts.pendingWithHr += team.pendingWithHr;
    });

    // Determine the most significant status to display
    if (statusCounts.pendingWithSdm > 0) return "PENDING";
    if (statusCounts.rejectedBySdm > 0) return "REJECTED";
    if (statusCounts.pendingWithHr > 0) return "PENDING_HR";
    if (statusCounts.approvedBySdm > 0) return "APPROVED";

    return null;
  };

  const getDateSummary = (dateStr) => {
    const dateEntry = calendarData.find((item) => item.date === dateStr);
    if (!dateEntry) return null;

    const teams = Object.keys(dateEntry.teamStatus);
    if (teams.length === 0) return null;

    const summary = {
      approved: 0,
      pending: 0,
      rejected: 0,
      pendingHr: 0,
      teams: teams.length,
    };

    teams.forEach((teamId) => {
      const team = dateEntry.teamStatus[teamId];
      summary.approved += team.approvedBySdm;
      summary.pending += team.pendingWithSdm;
      summary.rejected += team.rejectedBySdm;
      summary.pendingHr += team.pendingWithHr;
    });

    return summary;
  };

  const handleDateClick = async (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedTeam(null);
    try {
      const res = await getSdmDateDetails(dateStr);
      setDateDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch date details", err);
    }
  };

  const handleTeamClick = (teamId) => {
    setSelectedTeam(teamId);
  };

  const renderDayCell = (date, index) => {
    if (!date) {
      return <div key={`empty-${index}`} className="h-24 border border-gray-100" />;
    }

    const dateStr = format(date, "yyyy-MM-dd");
    const status = getDateStatus(dateStr);
    const summary = getDateSummary(dateStr);
    const isCurrentDay = isToday(date);
    const isWeekend = getDay(date) === 0 || getDay(date) === 6;

    const dayClasses = [
      "h-24 p-2 border border-gray-100 flex flex-col cursor-pointer",
      isCurrentDay ? "bg-indigo-50" : "",
      isWeekend ? "bg-blue-50" : "",
      status ? statusStyles[status] : statusStyles.DEFAULT,
    ].join(" ");

    return (
      <div
        key={dateStr}
        className={dayClasses}
        onClick={() => handleDateClick(dateStr)}
      >
        <div
          className={`text-sm font-medium ${
            isCurrentDay ? "text-indigo-600" : "text-gray-700"
          }`}
        >
          {format(date, "d")}
          {isCurrentDay && (
            <span className="ml-1 text-xs text-indigo-400">Today</span>
          )}
        </div>

        {summary && (
          <div className="mt-1 text-xs space-y-1">
            {summary.approved > 0 && (
              <div className="text-green-700">✓ {summary.approved} Approved</div>
            )}
            {summary.pending > 0 && (
              <div className="text-orange-600">⌛ {summary.pending} Pending</div>
            )}
            {summary.rejected > 0 && (
              <div className="text-red-600">✗ {summary.rejected} Rejected</div>
            )}
            {summary.pendingHr > 0 && (
              <div className="text-blue-600">⏳ {summary.pendingHr} With HR</div>
            )}
            <div className="text-gray-500">{summary.teams} team(s)</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light text-gray-800">SDM WFH Calendar</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              >
                ◀
              </button>
              <span className="text-lg font-medium text-gray-700">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-px mb-1 bg-gray-100">
                {dayLabels.map((label) => (
                  <div
                    key={label}
                    className="py-2 text-center text-sm font-medium text-gray-500 bg-white"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px bg-gray-100">
                {calendarDays.map((date, index) => renderDayCell(date, index))}
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-100 flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-indigo-50 border border-indigo-200 mr-2"></div>
            <span className="text-xs text-gray-600">Today</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-50 border border-blue-200 mr-2"></div>
            <span className="text-xs text-gray-600">Weekend</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-100 border-l-4 border-green-500 mr-2"></div>
            <span className="text-xs text-gray-600">Approved</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-100 border-l-4 border-orange-500 mr-2"></div>
            <span className="text-xs text-gray-600">Pending SDM Review</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-100 border-l-4 border-red-500 mr-2"></div>
            <span className="text-xs text-gray-600">Rejected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-100 border-l-4 border-blue-500 mr-2"></div>
            <span className="text-xs text-gray-600">Pending HR Review</span>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              WFH Requests on {selectedDate}
            </h3>

            {dateDetails.length === 0 ? (
              <p className="text-sm text-gray-500">
                No WFH requests on this date.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className={`px-3 py-1 text-xs rounded-full ${
                      !selectedTeam
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    All Teams
                  </button>
                  {Array.from(
                    new Set(dateDetails.map((item) => item.teamOwnerId))
                  ).map((teamId) => (
                    <button
                      key={teamId}
                      onClick={() => handleTeamClick(teamId)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        selectedTeam === teamId
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Team {teamId}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {dateDetails
                    .filter(request => !selectedTeam || request.teamOwnerId === selectedTeam)
                    .map((request, idx) => (
                      <div
                        key={idx}
                        className="text-sm p-3 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-2"
                      >
                        <div>
                          <span className="font-medium">{request.employeeName}</span>
                          <div className="text-xs text-gray-500">ID: {request.employeeId}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Dates</div>
                          {request.startDate} to {request.endDate}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">SDM Status</div>
                          <span
                            className={`font-medium ${
                              request.sdmStatus === "APPROVED"
                                ? "text-green-600"
                                : request.sdmStatus === "REJECTED"
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          >
                            {request.sdmStatus || "PENDING"}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Reason</div>
                          <div className="truncate">{request.reason}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SdmCalendar;