import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import EmployeeDashboard from "./dashboards/employee_dashboard/EmployeeDashboard";
import SdmDashboard from "./dashboards/sdm_dashboard/SdmDashboard";
import LoginPage from "./login/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";
import UnauthorizedPage from "./login/UnAuthorizedPage";
import NotFoundPage from "./login/NotFoundPage";
import RegisterPage from "./login/Register";
import TeamManagerDashboard from "./dashboards/team_manager_dashboard/TeamManagerDashboard";
import EditProfile from "./user/EditProfile";
import EmployeeCalendar from "./dashboards/employee_dashboard/EmployeeCalender";
import DashboardLayout from "./dashboards/DashboardLayout";
import WfhRequestForm from "./dashboards/employee_dashboard/wfh_request_forms/WfhRequestForm";
import WfhRequestFormEdit from "./dashboards/employee_dashboard/wfh_request_forms/WfhRequestFormEdit";
import RequestDetailPage from "./dashboards/team_manager_dashboard/RequestDetailPage";
import TeamManagerCalendar from "./dashboards/team_manager_dashboard/TeamManagerCalendar";
import SdmCalendar from "./dashboards/sdm_dashboard/SdmCalendar";
import SdmRequestDetailPage from "./dashboards/sdm_dashboard/SdmRequestDetailPage";
import HRDashboard from "./dashboards/hr_dashboard/HrDashboard";
import HRRequestDetailPage from "./dashboards/hr_dashboard/HRRequestDetailPage";
import SdmAuditAndReports from "./dashboards/sdm_dashboard/SdmAuditAndReports";
import HRAuditAndReports from "./dashboards/hr_dashboard/HRAuditAndReports";
import TeamManagerAuditAndReports from "./dashboards/team_manager_dashboard/TeamManagerAuditAndReports";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["EMPLOYEE", "TEAM_MANAGER", "SDM", "HR"]}
              />
            }
          >
            <Route element={<DashboardLayout />}>
              {/* Shared */}
              <Route path="/profile_edit" element={<EditProfile />} />

              {/* Employee Routes */}
              <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE"]} />}>
                <Route
                  path="/employee-dashboard"
                  element={<EmployeeDashboard />}
                />
                <Route
                  path="/employee-dashboard/calendar"
                  element={<EmployeeCalendar />}
                />
                <Route
                  path="/employee-dashboard/wfh_request"
                  element={<WfhRequestForm />}
                />
                <Route
                  path="/employee-dashboard/wfh_request/edit/:requestId"
                  element={<WfhRequestFormEdit />}
                />
              </Route>

              {/* Team Manager */}
              <Route
                element={<ProtectedRoute allowedRoles={["TEAM_MANAGER"]} />}
              >
                <Route
                  path="/tm-dashboard"
                  element={<TeamManagerDashboard />}
                />
                <Route
                  path="/tm-dashboard/request-details/:requestId"
                  element={<RequestDetailPage />}
                />
                <Route
                  path="/tm-dashboard/calendar"
                  element={<TeamManagerCalendar />}
                />
                <Route
                  path="/tm-dashboard/audit-and-reports"
                  element={<TeamManagerAuditAndReports />}
                />
              </Route>

              {/* SDM */}
              <Route element={<ProtectedRoute allowedRoles={["SDM"]} />}>
                <Route path="/sdm-dashboard" element={<SdmDashboard />} />
                <Route
                  path="/sdm-dashboard/request-details/:requestId"
                  element={<SdmRequestDetailPage />}
                />
                <Route
                  path="/sdm-dashboard/calendar"
                  element={<SdmCalendar />}
                />
                <Route
                  path="/sdm-dashboard/audit-and-reports"
                  element={<SdmAuditAndReports />}
                />
              </Route>

              {/* HR */}
              <Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
                <Route path="/hr-dashboard" element={<HRDashboard />} />
                <Route
                  path="/hr-dashboard/request-details/:requestId"
                  element={<HRRequestDetailPage />}
                />
                <Route
                  path="/hr-dashboard/audit-and-reports"
                  element={<HRAuditAndReports />}
                />
              </Route>
            </Route>
          </Route>

          {/* Root path handling */}
          <Route path="/" element={<RootRedirect />} />

          {/* Catch-all unmatched routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// HomeRedirect component
const RootRedirect = () => {
  const { user } = useAuth();

  if (!user) return null; // ProtectedRoute already handles this

  switch (user.role) {
    case "EMPLOYEE":
      return <Navigate to="/employee-dashboard" replace />;
    case "TEAM_MANAGER":
      return <Navigate to="/tm-dashboard" replace />;
    case "SDM":
      return <Navigate to="/sdm-dashboard" replace />;
    case "HR":
      return <Navigate to="/hr-dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default App;
