
import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isToday,
  isSameDay
} from 'date-fns';
import { getCalendarForEmployee } from '../../api/apiService';

const statusStyles = {
  APPROVED: 'bg-green-100 text-green-800 border-l-4',
  PENDING: 'bg-orange-100 text-orange-800 border-l-4',
  REJECTED: 'bg-red-100 text-red-800 border-l-4 ',
  DEFAULT: 'bg-gray-50 text-gray-600'
};

function EmployeeCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [wfhData, setWfhData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null); // 🆕 for selected date details

  useEffect(() => {
    setLoading(true);
    getCalendarForEmployee()
      .then(response => {
        const dataMap = {};
        response.data.forEach(entry => {
          dataMap[entry.date] = entry;
        });
        setWfhData(dataMap);
        setSelectedDateDetails(null); // Clear selection when month changes
      })
      .catch(err => {
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
    ...monthDays
  ];

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (wfhData[dateStr]) {
      setSelectedDateDetails({ date: dateStr, ...wfhData[dateStr] });
    } else {
      setSelectedDateDetails(null);
    }
  };

  const renderDayCell = (date, index) => {
    if (!date) {
      return <div key={`empty-${index}`} className="h-24 border border-gray-100" />;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = wfhData[dateStr];
    const isCurrentDay = isToday(date);
    const isWeekend = getDay(date) === 0 || getDay(date) === 6;

    const dayClasses = [
      'h-24 p-2 border border-gray-100 flex flex-col cursor-pointer',
      isCurrentDay ? 'bg-indigo-50' : '',
      isWeekend && !entry ? 'bg-blue-50' : '',
      entry ? statusStyles[entry.status] : statusStyles.DEFAULT
    ].join(' ');

    return (
      <div key={dateStr} className={dayClasses} onClick={() => handleDateClick(date)}>
        <div className={`text-sm font-medium ${
          isCurrentDay ? 'text-indigo-600' : 'text-gray-700'
        }`}>
          {format(date, 'd')}
          {isCurrentDay && (
            <span className="ml-1 text-xs text-indigo-400">Today</span>
          )}
        </div>
        
        {entry && (
          <div className="mt-1 text-xs truncate">
            <span className="font-medium">{entry.status}</span>
            {entry.reason && (
              <div className="text-gray-600 truncate">{entry.reason}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light text-gray-800">WFH Calendar</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              >
                ◀
              </button>
              <span className="text-lg font-medium text-gray-700">
                {format(currentMonth, 'MMMM yyyy')}
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
                {dayLabels.map(label => (
                  <div key={label} className="py-2 text-center text-sm font-medium text-gray-500 bg-white">
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
            <span className="text-xs text-gray-600">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-100 border-l-4 border-red-500 mr-2"></div>
            <span className="text-xs text-gray-600">Rejected</span>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDateDetails && (
          <div className="px-6 pb-6">
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
              <div className="text-sm p-3 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-medium">{selectedDateDetails.date}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-medium">{selectedDateDetails.status}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Reason</div>
                  <div className="truncate">{selectedDateDetails.reason}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Priority</div>
                  <div className="font-medium">{selectedDateDetails.priorityLevel}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Category</div>
                  <div className="font-medium">{selectedDateDetails.categoryOfReason}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeCalendar;
