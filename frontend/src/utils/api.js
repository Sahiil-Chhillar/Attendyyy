import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});


api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("attendyy_user") || "null");
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("attendyy_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
