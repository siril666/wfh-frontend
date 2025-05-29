import React, { useEffect, useState } from "react";
import { changePassword, getProfile, updateProfile } from "../api/apiService";

const EditProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [profile, setProfile] = useState({
    userName: "",
    ibsEmpId: "",
    role: "",
    emailId: "",
    phoneNumber: "",
    location: "",
    country: "",
    adminVerified: false,
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      setErrorMsg("Missing empId or accessToken in localStorage");
      return;
    }

    getProfile()
      .then((res) => {
        setProfile(res.data);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setErrorMsg("Failed to load profile data.");
      });
  }, []);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    if (!profile.userName.trim()) newErrors.userName = "Username is required";
    if (!profile.emailId || !emailRegex.test(profile.emailId)) newErrors.emailId = "Invalid email";
    if (!phoneRegex.test(profile.phoneNumber)) newErrors.phoneNumber = "Invalid phone number";
    if (!profile.location.trim()) newErrors.location = "Location is required";
    if (!profile.country.trim()) newErrors.country = "Country is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) newErrors.currentPassword = "Current password is required";
    if (!passwordForm.newPassword) newErrors.newPassword = "New password is required";
    else if (passwordForm.newPassword.length < 8) newErrors.newPassword = "Password must be at least 8 characters";
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords don't match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await updateProfile(profile);
      setSuccessMsg("Profile updated successfully!");
      setIsEditing(false);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("Failed to update profile.");
      console.error("Update failed:", err);
    }
  };

  const handlePasswordSave = async () => {
    if (!validatePasswordForm()) return;

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setErrorMsg("Session expired. Please log in again.");
        return;
      }

      console.log(passwordForm);

      const response = await changePassword(passwordForm)

      setSuccessMsg(response.data);
      setErrorMsg("");
      setShowPasswordForm(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
    } catch (err) {
      setErrorMsg(err.response?.data || "Failed to change password");
      console.error("Password change failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl p-8 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-4">Edit Profile</h2>

        {successMsg && (
          <div className="mb-4 p-3 text-green-700 bg-green-50 rounded-lg text-sm">
            {successMsg}
          </div>
        )}
        <div className="space-y-4">
          {[
            ["User Name", "userName"],
            ["IBS Emp ID", "ibsEmpId"],
            ["Role", "role"],
            ["Email ID", "emailId"],
            ["Phone Number", "phoneNumber"],
            ["Location", "location"],
            ["Country", "country"],
          ].map(([label, name]) => (
            <div key={name}>
              <label className="block font-medium text-sm text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="text"
                name={name}
                value={profile[name]}
                onChange={handleChange}
                disabled={!isEditing || name === "ibsEmpId" || name === "role"}
                className={`w-full px-4 py-2 text-sm border rounded-md focus:outline-none ${
                  errors[name]
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-indigo-500"
                }`}
              />
              {errors[name] && (
                <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
              )}
            </div>
          ))}

          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full mt-4 text-blue-600 text-sm font-medium hover:text-blue-800"
            >
              Change Password
            </button>
          )}

          {showPasswordForm && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Change Password</h3>
              {[
                ["Current Password", "currentPassword", "password"],
                ["New Password", "newPassword", "password"],
                ["Confirm New Password", "confirmNewPassword", "password"],
              ].map(([label, name, type]) => (
                <div key={name} className="mb-4">
                  <label className="block font-medium text-sm text-gray-700 mb-1">
                    {label}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={passwordForm[name]}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-2 text-sm border rounded-md focus:outline-none ${
                      passwordErrors[name]
                        ? "border-red-500 focus:border-red-600"
                        : "border-gray-300 focus:border-indigo-500"
                    }`}
                  />
                  {passwordErrors[name] && (
                    <p className="mt-1 text-xs text-red-500">{passwordErrors[name]}</p>
                  )}
                </div>
              ))}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Save Password
                </button>
              </div>
            </div>
          )}
        {errorMsg && (
          <div className="mb-4 p-3 text-red-700 bg-red-50 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}
          <div className="flex justify-end mt-6 space-x-4">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save Profile
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;