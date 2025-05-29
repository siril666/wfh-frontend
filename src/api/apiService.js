import { axiosInstance8080, axiosInstanceSecurity8080, axiosInstanceSecurity8081 } from "./axiosInstance";

  
  
  // Login APIs
  export const userLogin = (credentials) => {
    return axiosInstance8080.post("/auth/token",credentials)
  }
  
  export const userRegister = (payload) => {
    return axiosInstance8080.post("/auth",payload)
  }
  
  // User APIs
  export const updateProfile = (profile) => {
    return axiosInstanceSecurity8080.post("/users/update",profile)
  }
  
  export const getProfile = () => {
    return axiosInstanceSecurity8080.get(`/users/profile`);
  };

  export const changePassword = (data) => {
    return axiosInstanceSecurity8080.post('/users/change-password', data);
  };
  
  // Employee APIs
  export const getRequestsHistory = () => {
    return axiosInstanceSecurity8081.get(`/employee/requests/status`);
  };
  
  export const getCalendarForEmployee = () => {
    return axiosInstanceSecurity8081.get(`/employee/calendar`);
  };
  
  //Wfh_Form APIs
  export const getDetailsFromEmpMasterAndEmpInfo = () => {
    return axiosInstanceSecurity8081.get(`/wfh-requests/employee-details`);
  };
  
  export const submitNewWfhRequest = (data) => {
    return axiosInstanceSecurity8081.post(`/wfh-requests/submit`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };
  
  export const getRequestDetailsFromWfhByRequestId = (requestId) => {
    return axiosInstanceSecurity8081.get(`/wfh-requests/${requestId}`);
  };
  
  export const updateEditedRequestDetails = (data) => {
    return axiosInstanceSecurity8081.post(`/wfh-requests/update`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };
  
  export const cancelRequest = (requestId) => {
    return axiosInstanceSecurity8081.delete(`/wfh-requests/${requestId}`);
  };
  
  
  // Team Manager APIs
  export const getAllRequestsByTeamOwnerId = () => {
    return axiosInstanceSecurity8081.get(`/tm/requests`);
  };
  
  export const getRequestDetailsByRequestId = (requestId) => {
    return axiosInstanceSecurity8081.get(`/tm/request-details/${requestId}`);
  };
  
  export const approveRequestByTeamOwner = (requestId) => {
    return axiosInstanceSecurity8081.post(`/tm/${requestId}/approve`);
  };
  
  export const rejectRequestByTeamOwner = (requestId) => {
    return axiosInstanceSecurity8081.post(`/tm/${requestId}/reject`);
  };
  
  export const getTeamManagerCalendar = () => {
    return axiosInstanceSecurity8081.get(`/tm/calendar`);
  };
  
  export const getTeamManagerOnDate = (dateStr) => {
    return axiosInstanceSecurity8081.get(`/tm/employees-on-date?date=${dateStr}`);
  };
  
  // SDM APIs
  export const getSdmApprovalRequestsHistory = () => {
    return axiosInstanceSecurity8081.get(`/sdm/requests`);
  };
  
  export const getSdmRequestDetails = (requestId) => {
    return axiosInstanceSecurity8081.get(`/sdm/request-details/${requestId}`);
  };
  
  export const getSdmCalendar = () => {
    return axiosInstanceSecurity8081.get(`/sdm/calendar`);
  };
  
  export const getSdmDateDetails = (date) => {
    return axiosInstanceSecurity8081.get(`/sdm/calendar/details?date=${date}`);
  };
  
  export const approveRequestBySdm = (requestId) => {
    return axiosInstanceSecurity8081.post(`/sdm/${requestId}/approve`);
  };
  
  export const rejectRequestBySdm = (requestId) => {
    return axiosInstanceSecurity8081.post(`/sdm/${requestId}/reject`);
  };
  
  // HR APIs
  export const getAllWFHRequestForHR = () => {
    return axiosInstanceSecurity8081.get(`/hr/requests`);
  };

  export const getHrRequestDetails = (requestId) => {
    return axiosInstanceSecurity8081.get(`/hr/request-details/${requestId}`);
  };
  
  export const approveRequestByHR = (requestId) => {
    return axiosInstanceSecurity8081.post(`/hr/${requestId}/approve`);
  };
  
  export const rejectRequestByHR = (requestId) => {
    return axiosInstanceSecurity8081.post(`/hr/${requestId}/reject`);
  };