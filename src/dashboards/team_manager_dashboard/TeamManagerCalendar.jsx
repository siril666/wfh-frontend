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
import {
  getTeamManagerCalendar,
  getTeamManagerOnDate,
} from "../../api/apiService";

const TeamManagerCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarMap, setCalendarMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [approvedEmployees, setApprovedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("accessToken");
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    getTeamManagerCalendar()
      .then((response) => {
        setCalendarMap(response.data);
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

  const handleDateClick = async (dateStr) => {
    setSelectedDate(dateStr);
    try {
      const res = await getTeamManagerOnDate(dateStr);
      setApprovedEmployees(res.data);
    } catch (err) {
      console.error("Failed to fetch approved employees", err);
    }
  };

  const renderDayCell = (date, index) => {
    if (!date) {
      return (
        <div key={`empty-${index}`} className="h-24 border border-gray-100" />
      );
    }

    const dateStr = format(date, "yyyy-MM-dd");
    const hasData = !!calendarMap[dateStr];
    const isCurrentDay = isToday(date);
    const isWeekend = getDay(date) === 0 || getDay(date) === 6;

    const dayClasses = [
      "h-24 p-2 border border-gray-100 flex flex-col",
      isCurrentDay ? "bg-indigo-50" : "",
      isWeekend ? "bg-blue-50" : "",
      hasData
        ? "bg-green-100 text-green-800 border-l-4 "
        : "bg-gray-50",
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

        {hasData && (
          <div className="mt-1 text-xs">
            <span className="font-medium">{calendarMap[dateStr]} WFH</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light text-gray-800">
              Team WFH Calendar
            </h1>
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
            <div className="w-3 h-3 rounded-full bg-indigo-50 border  mr-2"></div>
            <span className="text-xs text-gray-600">Today</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-50 border mr-2"></div>
            <span className="text-xs text-gray-600">Weekend</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-100 border-l-4 mr-2"></div>
            <span className="text-xs text-gray-600">WFH Approved</span>
          </div>
        </div>

        {/* Selected Day's Employees */}
        {selectedDate && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Approved WFH on {selectedDate}
            </h3>

            {approvedEmployees.length === 0 ? (
              <p className="text-sm text-gray-500">
                No approved WFH requests on this date.
              </p>
            ) : (
              <ul className="space-y-2">
                {approvedEmployees.map((emp, idx) => (
                  <li key={idx} className="text-sm p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{emp.employeeName}</span> (ID:{" "}
                    {emp.ibsEmpId}) — {emp.from} to {emp.to}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagerCalendar;

