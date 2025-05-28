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
  parseISO,
} from "date-fns";
import { getTeamManagerCalendar } from "../../api/apiService";

const TeamManagerCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDaysData, setCalendarDaysData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTeamManagerCalendar(format(currentMonth, 'yyyy-MM'))
      .then((response) => {
        setCalendarDaysData(response.data);
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

  const handleDateClick = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    const dayData = calendarDaysData.find(d => d.date === dateStr);
    setSelectedDayData(dayData || null);
  };

  const renderDayCell = (date, index) => {
    if (!date) {
      return (
        <div key={`empty-${index}`} className="h-24 border border-gray-100" />
      );
    }

    const dateStr = format(date, "yyyy-MM-dd");
    const dayData = calendarDaysData.find(d => d.date === dateStr);
    const isCurrentDay = isToday(date);
    const isWeekend = getDay(date) === 0 || getDay(date) === 6;

    const getStatusColor = () => {
      if (!dayData?.status) return "";
      const { pendingWithTeamLead, approvedByTeamLead, rejectedByTeamLead, pendingWithSdm } = dayData.status;
      
      if (rejectedByTeamLead > 0) return "bg-red-50 border-l-4 border-red-400";
      if (pendingWithTeamLead > 0) return "bg-yellow-50 border-l-4 border-yellow-400";
      if (pendingWithSdm > 0) return "bg-blue-50 border-l-4 border-blue-400";
      if (approvedByTeamLead > 0) return "bg-green-50 border-l-4 border-green-400";
      return "";
    };

    const dayClasses = [
      "h-24 p-2 border border-gray-100 flex flex-col cursor-pointer hover:bg-gray-50",
      isCurrentDay ? "bg-indigo-50" : "",
      isWeekend ? "bg-blue-50" : "",
      getStatusColor(),
    ].join(" ");

    return (
      <div
        key={dateStr}
        className={dayClasses}
        onClick={() => handleDateClick(date)}
      >
        <div className={`text-sm font-medium ${isCurrentDay ? "text-indigo-600" : "text-gray-700"}`}>
          {format(date, "d")}
          {isCurrentDay && <span className="ml-1 text-xs text-indigo-400">Today</span>}
        </div>

        {dayData?.status && (
          <div className="mt-1 space-y-1">
            {dayData.status.pendingWithTeamLead > 0 && (
              <div className="text-xs text-yellow-700">Pending: {dayData.status.pendingWithTeamLead}</div>
            )}
            {dayData.status.approvedByTeamLead > 0 && (
              <div className="text-xs text-green-700">Approved: {dayData.status.approvedByTeamLead}</div>
            )}
            {dayData.status.pendingWithSdm > 0 && (
              <div className="text-xs text-blue-700">With SDM: {dayData.status.pendingWithSdm}</div>
            )}
            {dayData.status.rejectedByTeamLead > 0 && (
              <div className="text-xs text-red-700">Rejected: {dayData.status.rejectedByTeamLead}</div>
            )}
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
              Team WFH Approval Status
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
            <div className="w-3 h-3 rounded-full bg-indigo-50 border mr-2"></div>
            <span className="text-xs text-gray-600">Today</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-50 border mr-2"></div>
            <span className="text-xs text-gray-600">Weekend</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-50 border-l-4 border-yellow-400 mr-2"></div>
            <span className="text-xs text-gray-600">Pending with TL</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-50 border-l-4 border-green-400 mr-2"></div>
            <span className="text-xs text-gray-600">Approved by TL</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-50 border-l-4 border-blue-400 mr-2"></div>
            <span className="text-xs text-gray-600">Pending with SDM</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-50 border-l-4 border-red-400 mr-2"></div>
            <span className="text-xs text-gray-600">Rejected by TL</span>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDate && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              WFH Approval Status for {format(parseISO(selectedDate), "MMMM d, yyyy")}
            </h3>

            {!selectedDayData ? (
              <p className="text-sm text-gray-500">
                No WFH requests on this date.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500">
                  <div>Status</div>
                  <div className="text-center">Count</div>
                  <div className="col-span-2">Details</div>
                </div>
                
                {selectedDayData.status.pendingWithTeamLead > 0 && (
                  <div className="grid grid-cols-4 gap-4 items-center p-2 bg-yellow-50 rounded-lg">
                    <div className="text-yellow-700">Pending with Team Lead</div>
                    <div className="text-center">{selectedDayData.status.pendingWithTeamLead}</div>
                    <div className="col-span-2 text-xs text-yellow-600">
                      Waiting for team lead approval
                    </div>
                  </div>
                )}

                {selectedDayData.status.approvedByTeamLead > 0 && (
                  <div className="grid grid-cols-4 gap-4 items-center p-2 bg-green-50 rounded-lg">
                    <div className="text-green-700">Approved by Team Lead</div>
                    <div className="text-center">{selectedDayData.status.approvedByTeamLead}</div>
                    <div className="col-span-2 text-xs text-green-600">
                      Approved by team lead, {selectedDayData.status.pendingWithSdm > 0 
                        ? `${selectedDayData.status.pendingWithSdm} pending SDM approval` 
                        : 'fully approved'}
                    </div>
                  </div>
                )}

                {selectedDayData.status.rejectedByTeamLead > 0 && (
                  <div className="grid grid-cols-4 gap-4 items-center p-2 bg-red-50 rounded-lg">
                    <div className="text-red-700">Rejected by Team Lead</div>
                    <div className="text-center">{selectedDayData.status.rejectedByTeamLead}</div>
                    <div className="col-span-2 text-xs text-red-600">
                      Rejected by team lead
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagerCalendar;