import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import {
  getRequestDetailsFromWfhByRequestId,
  getProfile,
  cancelRequest,
  updateEditedRequestDetails,
  getDetailsFromEmpMasterAndEmpInfo,
} from "../../../api/apiService";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

const WfhRequestFormEdit = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const initialFormDataRef = useRef(null);

  const [formData, setFormData] = useState({
    ibsEmpId: "",
    employeeName: "",
    requestedStartDate: "",
    requestedEndDate: "",
    employeeReason: "",
    categoryOfReason: "",
    status: "",
    teamOwnerId: "",
    teamOwnerName: "",
    dmName: "",
    dmId: "",
    termDuration: "",
    priority: "MODERATE",
    location: "",
    attachment: null,
    requestId: requestId || null,
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [openConfirmation, setOpenConfirmation] = useState(false);

  // Function to check if a date is a weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  const getQuarterEndDate = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    const quarterEndMonth = quarter * 3;
    return new Date(year, quarterEndMonth, 0);
  };

  // Calculate working days between two dates (excludes weekends)
  const calculateWorkingDays = (startDate, endDate) => {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure we're comparing dates without time components
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const calculateTermDuration = () => {
    if (!formData.requestedStartDate || !formData.requestedEndDate) return;

    const workingDays = calculateWorkingDays(
      formData.requestedStartDate,
      formData.requestedEndDate
    );

    setFormData((prev) => ({
      ...prev,
      termDuration: workingDays > 0 ? `${workingDays} Working Days` : "",
    }));
  };

  const handleCancel = () => {
    setCancelLoading(true);
    cancelRequest(requestId)
      .then((res) => {
        toast.success("Request cancelled successfully!");
        setMessage(res.data);
        setTimeout(() => {
          navigate("/");
          window.location.reload();
        }, 2000);
      })
      .catch((err) => {
        toast.error(err?.response?.data ?? "Cancellation failed.");
        console.error("Cancellation Error:", err);
      })
      .finally(() => {
        setCancelLoading(false);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // First get employee details to populate names
    getDetailsFromEmpMasterAndEmpInfo()
      .then((res) => {
        const employeeDetails = res.data;

        // Then get the request details
        getRequestDetailsFromWfhByRequestId(requestId)
          .then((requestRes) => {
            const requestData = requestRes.data;

            const initialData = {
              ibsEmpId: requestData.ibsEmpId,
              employeeName: employeeDetails.employeeName,
              teamOwnerId: requestData.teamOwnerId,
              teamOwnerName: employeeDetails.teamOwnerName,
              dmName: employeeDetails.dmName,
              dmId: requestData.dmId,
              location:
                requestData.currentLocation || employeeDetails.currentLocation,
              requestedStartDate: requestData.requestedStartDate,
              requestedEndDate: requestData.requestedEndDate,
              employeeReason: requestData.employeeReason,
              categoryOfReason: requestData.categoryOfReason,
              status: requestData.status,
              termDuration: requestData.termDuration,
              priority: requestData.priority,
              requestId: requestData.requestId,
              attachment: requestData.attachment || null,
            };

            setFormData(initialData);
            initialFormDataRef.current = initialData;
          })
          .catch((err) => console.error("Request details error:", err));
      })
      .catch((err) => console.error("Employee details error:", err));
  }, [requestId]);

  useEffect(() => {
    // Check if form has changes compared to initial data
    if (initialFormDataRef.current) {
      const currentFormData = { ...formData };
      const initialData = { ...initialFormDataRef.current };

      // Compare all fields except those that shouldn't be compared
      const fieldsToCompare = [
        "requestedStartDate",
        "requestedEndDate",
        "employeeReason",
        "categoryOfReason",
        "priority",
        "attachment",
      ];

      const hasFormChanged = fieldsToCompare.some((field) => {
        if (field === "attachment") {
          // Special handling for file attachment
          return currentFormData[field] !== initialData[field];
        }
        return currentFormData[field] !== initialData[field];
      });

      setHasChanges(hasFormChanged);
    }

    // Validate form dates
    const now = new Date();
    const start = formData.requestedStartDate
      ? new Date(formData.requestedStartDate)
      : null;
    const end = formData.requestedEndDate
      ? new Date(formData.requestedEndDate)
      : null;
    const quarterEnd = getQuarterEndDate(now);
    const sixMonthsLater = start ? new Date(start) : new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const valid =
      start &&
      end &&
      !isWeekend(start) &&
      !isWeekend(end) &&
      start > now &&
      start <= quarterEnd &&
      end >= start &&
      end <= sixMonthsLater;

    setIsFormValid(valid);

    if (formData.requestedStartDate && formData.requestedEndDate) {
      calculateTermDuration();
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, attachment: e.target.files[0] }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.requestedStartDate) {
      newErrors.requestedStartDate = "Start date is required";
      isValid = false;
    } else if (isWeekend(new Date(formData.requestedStartDate))) {
      newErrors.requestedStartDate = "Start date cannot be a weekend";
      isValid = false;
    }

    if (!formData.requestedEndDate) {
      newErrors.requestedEndDate = "End date is required";
      isValid = false;
    } else if (isWeekend(new Date(formData.requestedEndDate))) {
      newErrors.requestedEndDate = "End date cannot be a weekend";
      isValid = false;
    }

    if (!formData.employeeReason) {
      newErrors.employeeReason = "Reason is required";
      isValid = false;
    }

    if (!formData.categoryOfReason) {
      newErrors.categoryOfReason = "Category is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const date = new Date(value);

    if (isWeekend(date)) {
      toast.error("Weekends are not allowed. Please select a weekday.");
      setErrors((prev) => ({ ...prev, [name]: "Weekends are not allowed" }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when valid date is selected
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmitConfirmation = (e) => {
    e.preventDefault();

    const isFormValid = validateForm();
    if (!isFormValid) return;

    setOpenConfirmation(true);
  };

  const handleSubmit = async () => {
    setOpenConfirmation(false);
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val !== null) data.append(key, val);
    });

    try {
      const response = await updateEditedRequestDetails(data);
      toast.success("Request updated successfully!");
      setMessage(response.data);

      setTimeout(() => {
        navigate("/employee-dashboard");
      }, 2000);
    } catch (err) {
      toast.error("Update failed.");
      console.error("Update Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get today's date and adjust if it's a weekend
  const today = new Date();
  if (isWeekend(today)) {
    today.setDate(today.getDate() + (today.getDay() === 6 ? 2 : 1)); // If Saturday, add 2 days. If Sunday, add 1 day
  }
  const todayFormatted = today.toISOString().split("T")[0];

  const quarterEndDate = getQuarterEndDate(new Date())
    .toISOString()
    .split("T")[0];

  const startDateForMaxEnd = formData.requestedStartDate
    ? new Date(formData.requestedStartDate)
    : null;

  const maxEndDate = startDateForMaxEnd
    ? new Date(startDateForMaxEnd.setMonth(startDateForMaxEnd.getMonth() + 6))
        .toISOString()
        .split("T")[0]
    : "";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back button positioned at the top left */}
        <div className="mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

        <ToastContainer position="top-center" autoClose={3000} />

        {/* <div className="w-full max-w-3xl space-y-8 bg-white rounded-xl shadow-md p-8"> */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center">
            <h2 className="text-3xl font-extralight tracking-wide text-gray-800">
              Edit Work From Home Request
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Update your WFH request details
            </p>
          </div>

          <form onSubmit={handleSubmitConfirmation} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee ID and Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  readOnly
                  value={formData.ibsEmpId}
                  className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name
                </label>
                <input
                  readOnly
                  value={formData.employeeName}
                  className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Team Owner and Delivery Manager Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Owner Name
                </label>
                <input
                  readOnly
                  value={formData.teamOwnerName}
                  className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Manager Name
                </label>
                <input
                  readOnly
                  value={formData.dmName}
                  className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Category and Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="categoryOfReason"
                  value={formData.categoryOfReason}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-sm border-b ${
                    errors.categoryOfReason
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:border-indigo-500 focus:outline-none`}
                >
                  <option value="">-- Select --</option>
                  <option value="Family Medical">Family Medical</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Medical">Medical</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Personal">Personal</option>
                  <option value="Project Demand">Project Demand</option>
                </select>
                {errors.categoryOfReason && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.categoryOfReason}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
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

              {/* Start and End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="requestedStartDate"
                  value={formData.requestedStartDate}
                  onChange={handleDateChange}
                  required
                  min={todayFormatted}
                  max={quarterEndDate}
                  className={`w-full px-4 py-3 text-sm border-b ${
                    errors.requestedStartDate
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:border-indigo-500 focus:outline-none`}
                />
                {errors.requestedStartDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.requestedStartDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="requestedEndDate"
                  value={formData.requestedEndDate}
                  onChange={handleDateChange}
                  required
                  min={formData.requestedStartDate}
                  max={maxEndDate}
                  className={`w-full px-4 py-3 text-sm border-b ${
                    errors.requestedEndDate
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:border-indigo-500 focus:outline-none`}
                />
                {errors.requestedEndDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.requestedEndDate}
                  </p>
                )}
              </div>

              {/* Term Duration */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term Duration
                </label>
                <input
                  type="text"
                  name="termDuration"
                  placeholder="e.g. 3 Working Days"
                  value={formData.termDuration}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
                  readOnly
                />
              </div>

              {/* Reason */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  name="employeeReason"
                  value={formData.employeeReason}
                  onChange={handleChange}
                  required
                  placeholder="Enter reason..."
                  className={`w-full px-4 py-3 text-sm border-b ${
                    errors.employeeReason ? "border-red-500" : "border-gray-300"
                  } focus:border-indigo-500 focus:outline-none h-24 resize-none`}
                />
                {errors.employeeReason && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.employeeReason}
                  </p>
                )}
              </div>

              {/* Attachment */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachment
                </label>
                <div className="flex items-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    id="file-upload-edit"
                    className="hidden"
                  />
                  <div className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none">
                    <span className="text-gray-500">
                      {formData.attachment
                        ? formData.attachment.name
                        : "No file chosen"}
                    </span>
                  </div>
                  <label
                    htmlFor="file-upload-edit"
                    className="ml-2 bg-gray-100 px-3 py-1 rounded text-gray-700 text-xs cursor-pointer hover:bg-gray-200"
                  >
                    Browse
                  </label>
                </div>
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="w-full px-4 py-3 text-sm">
                  {formData.status}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelLoading}
                className={`w-full md:w-auto flex justify-center py-3 px-6 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${
                  cancelLoading ? "opacity-80" : ""
                }`}
              >
                {cancelLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  "Cancel Request"
                )}
              </button>
              <button
                type="submit"
                disabled={!isFormValid || !hasChanges || loading}
                className={`w-full md:w-auto flex justify-center py-3 px-6 text-sm font-medium rounded-md 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                transition-all duration-200 ${
                  isFormValid && hasChanges
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                } ${loading ? "opacity-75" : ""}`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  "Update Request"
                )}
              </button>
            </div>

            {message && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg text-center">
                {message}
              </div>
            )}
          </form>

          {/* Confirmation Dialog */}
          <Dialog
            open={openConfirmation}
            onClose={() => setOpenConfirmation(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle
              id="alert-dialog-title"
              className="text-lg font-medium text-gray-900"
            >
              Confirm Update
            </DialogTitle>
            <DialogContent>
              <DialogContentText
                id="alert-dialog-description"
                className="text-gray-600"
              >
                Are you sure you want to update this WFH request?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenConfirmation(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                autoFocus
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default WfhRequestFormEdit;
