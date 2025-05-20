import { useState } from "react";
import { Link } from "react-router-dom";
import { userRegister } from "../api/apiService";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    ibsEmpId: "",
    userName: "",
    role: "",
    emailId: "",
    phoneNumber: "",
    location: "",
    country: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

    if (!formData.ibsEmpId || isNaN(formData.ibsEmpId)) {
      newErrors.ibsEmpId = "Valid Employee ID is required";
    }
    if (!formData.userName.trim()) {
      newErrors.userName = "Username is required";
    }
    if (!formData.role) {
      newErrors.role = "Role is required";
    }
    if (!formData.emailId || !emailRegex.test(formData.emailId)) {
      newErrors.emailId = "Valid email is required";
    }
    if (!formData.phoneNumber || !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Valid phone number is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }
    if (!formData.password || !passwordRegex.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters with letters and numbers";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords must match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMsg("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const payload = {
      ibsEmpId: parseInt(formData.ibsEmpId),
      userName: formData.userName.trim(),
      role: formData.role,
      emailId: formData.emailId.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      location: formData.location.trim(),
      country: formData.country.trim(),
      adminVerified: false,
      password: formData.password,
    };

    try {
      const response = await userRegister(payload);
      setSuccessMsg(response.data || "Registration successful! Awaiting admin approval.");
      // Clear form on successful registration
      setFormData({
        ibsEmpId: "",
        userName: "",
        role: "",
        emailId: "",
        phoneNumber: "",
        location: "",
        country: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ ...errors, ibsEmpId: "Employee ID already exists" });
      } else {
        setErrors({ ...errors, form: "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-extralight tracking-wide text-gray-800">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-gray-500">Register a new employee</p>
        </div>

        {errors.form && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            {errors.form}
          </div>
        )}
        {successMsg && (
          <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg">
            {successMsg}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                name="ibsEmpId"
                value={formData.ibsEmpId}
                onChange={handleChange}
                required
                placeholder="Employee ID"
                className={`w-full px-4 py-3 text-sm border-b ${
                  errors.ibsEmpId ? "border-red-500" : "border-gray-300"
                } focus:border-indigo-500 focus:outline-none`}
              />
              {errors.ibsEmpId && (
                <p className="mt-1 text-xs text-red-500">{errors.ibsEmpId}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                required
                placeholder="Username"
                className={`w-full px-4 py-3 text-sm border-b ${
                  errors.userName ? "border-red-500" : "border-gray-300"
                } focus:border-indigo-500 focus:outline-none`}
              />
              {errors.userName && (
                <p className="mt-1 text-xs text-red-500">{errors.userName}</p>
              )}
            </div>

            <div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 text-sm border-b ${
                  errors.role ? "border-red-500" : "border-gray-300"
                } focus:border-indigo-500 focus:outline-none bg-white`}
              >
                <option value="" disabled>
                  Select Role
                </option>
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="SDM">SDM</option>
                <option value="TEAM_MANAGER">TEAM_MANAGER</option>
                <option value="HR">HR</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-red-500">{errors.role}</p>
              )}
            </div>

            <div>
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleChange}
                required
                placeholder="Email"
                className={`w-full px-4 py-3 text-sm border-b ${
                  errors.emailId ? "border-red-500" : "border-gray-300"
                } focus:border-indigo-500 focus:outline-none`}
              />
              {errors.emailId && (
                <p className="mt-1 text-xs text-red-500">{errors.emailId}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                placeholder="Phone Number"
                className={`w-full px-4 py-3 text-sm border-b ${
                  errors.phoneNumber ? "border-red-500" : "border-gray-300"
                } focus:border-indigo-500 focus:outline-none`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Location"
                className={`w-full px-4 py-3 text-sm border-b ${
                  errors.location ? "border-red-500" : "border-gray-300"
                } focus:border-indigo-500 focus:outline-none`}
              />
              {errors.location && (
                <p className="mt-1 text-xs text-red-500">{errors.location}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                placeholder="Country"
                className={`w-full px-4 py-3 text-sm border-b ${
                  errors.country ? "border-red-500" : "border-gray-300"
                } focus:border-indigo-500 focus:outline-none`}
              />
              {errors.country && (
                <p className="mt-1 text-xs text-red-500">{errors.country}</p>
              )}
            </div>
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Password"
              className={`w-full px-4 py-3 text-sm border-b ${
                errors.password ? "border-red-500" : "border-gray-300"
              } focus:border-indigo-500 focus:outline-none`}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm Password"
              className={`w-full px-4 py-3 text-sm border-b ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              } focus:border-indigo-500 focus:outline-none`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
              loading ? "opacity-80" : ""
            }`}
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
                Registering...
              </>
            ) : (
              "Register"
            )}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;