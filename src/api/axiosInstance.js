import axios from "axios";

export const axiosInstanceSecurity8080 = axios.create({
  baseURL: "http://localhost:8080",
});

export const axiosInstanceSecurity8081 = axios.create({
  baseURL: "http://localhost:8081",
});

// Create an axios instance with a base URL
export const axiosInstance8080 = axios.create({
  baseURL: "http://localhost:8080",
});

axiosInstanceSecurity8080.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Or sessionStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstanceSecurity8081.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Or sessionStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
