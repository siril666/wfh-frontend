import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { getDetailsFromEmpMasterAndEmpInfo, submitNewWfhRequest } from '../../../api/apiService';

const WfhRequestForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ibsEmpId: '',
    employeeName: '',
    requestedStartDate: '',
    requestedEndDate: '',
    employeeReason: '',
    categoryOfReason: '',
    teamOwnerId: '',
    dmId: '',
    termDuration: '',
    priority: 'MODERATE',
    location: '',
    attachment: null
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getQuarterEndDate = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    const quarterEndMonth = quarter * 3;
    return new Date(year, quarterEndMonth, 0);
  };

  const calculateTermDuration = () => {
    const start = new Date(formData.requestedStartDate);
    const end = new Date(formData.requestedEndDate);
    const timeDiff = end - start;
    const days = timeDiff / (1000 * 3600 * 24);
    setFormData(prev => ({
      ...prev,
      termDuration: days > 0 ? `${days} Days` : ''
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    getDetailsFromEmpMasterAndEmpInfo()
      .then(res => {
        setFormData(prev => ({
          ...prev,
          ibsEmpId: res.data.ibsEmpId,
          employeeName: res.data.employeeName,
          teamOwnerId: res.data.teamOwnerId,
          dmId: res.data.dmId,
          location: res.data.currentLocation
        }));
      })
      .catch(err => console.error("Auto-fill error:", err));
  }, []);

  useEffect(() => {
    const now = new Date();
    const start = new Date(formData.requestedStartDate);
    const end = new Date(formData.requestedEndDate);
    const quarterEnd = getQuarterEndDate(now);
    const sixMonthsLater = new Date(start);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const valid =
      !isNaN(start) && !isNaN(end) &&
      start > now &&
      start <= quarterEnd &&
      end > start &&
      end <= sixMonthsLater;

    setIsFormValid(valid);

    if (formData.requestedStartDate && formData.requestedEndDate) {
      calculateTermDuration();
    }
  }, [formData.requestedStartDate, formData.requestedEndDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, attachment: e.target.files[0] }));
  };

  const validateDates = () => {
    const now = new Date();
    const start = new Date(formData.requestedStartDate);
    const end = new Date(formData.requestedEndDate);
    const quarterEnd = getQuarterEndDate(now);

    if (isNaN(start) || start <= now) {
      toast.error("Start date must be a future date.");
      return false;
    }

    if (start > quarterEnd) {
      toast.error("Start date must be within the current quarter.");
      return false;
    }

    if (isNaN(end) || end <= start) {
      toast.error("End date must be after the start date.");
      return false;
    }

    const sixMonthsLater = new Date(start);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    if (end > sixMonthsLater) {
      toast.error("End date must be within 6 months of the start date.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateDates()) return;

    const confirmSubmit = window.confirm("Are you sure you want to submit this WFH request?");
    if (!confirmSubmit) return;

    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val !== null) data.append(key, val);
    });

    try {
      const response = await submitNewWfhRequest(data);
      toast.success("Request submitted successfully!");
      setMessage(response.data);

      setTimeout(() => {
        navigate('/employee');
      }, 2000);
    } catch (err) {
      toast.error("Submission failed.");
      console.error("Submission Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const quarterEndDate = getQuarterEndDate(new Date()).toISOString().split("T")[0];

  const startDateForMaxEnd = formData.requestedStartDate
    ? new Date(formData.requestedStartDate)
    : null;

  const maxEndDate = startDateForMaxEnd
    ? new Date(startDateForMaxEnd.setMonth(startDateForMaxEnd.getMonth() + 6)).toISOString().split("T")[0]
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="w-full max-w-3xl space-y-8 bg-white rounded-xl shadow-md p-8">
        <div className="text-center">
          <h2 className="text-3xl font-extralight tracking-wide text-gray-800">Work From Home Request</h2>
          <p className="mt-2 text-sm text-gray-500">Fill in the details to submit your WFH request</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                readOnly 
                value={formData.ibsEmpId}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
              <input
                readOnly 
                value={formData.employeeName}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="requestedStartDate"
                value={formData.requestedStartDate}
                onChange={handleChange}
                required
                min={today}
                max={quarterEndDate}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="requestedEndDate"
                value={formData.requestedEndDate}
                onChange={handleChange}
                required
                min={formData.requestedStartDate}
                max={maxEndDate}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea
                name="employeeReason"
                value={formData.employeeReason}
                onChange={handleChange}
                required
                placeholder="Enter reason..."
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none h-24 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="categoryOfReason"
                value={formData.categoryOfReason}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Select --</option>
                <option value="Family Medical">Family Medical</option>
                <option value="Maternity">Maternity</option>
                <option value="Medical">Medical</option>
                <option value="Permanent">Permanent</option>
                <option value="Personal">Personal</option>
                <option value="Project Demand">Project Demand</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              >
                <option value="HIGH">High</option>
                <option value="MODERATE">Moderate</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term Duration</label>
              <input
                type="text"
                name="termDuration"
                placeholder="e.g. 3 Days"
                value={formData.termDuration}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Owner ID</label>
              <input
                readOnly 
                value={formData.teamOwnerId}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DM ID</label>
              <input
                readOnly 
                value={formData.dmId}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                readOnly 
                value={formData.location}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full md:w-auto flex justify-center py-3 px-6 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                isFormValid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : 'Submit Request'}
            </button>
          </div>

          {message && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg text-center">
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default WfhRequestForm;