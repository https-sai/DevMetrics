import axios from "axios";

// Store access token in memory — NOT localStorage
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

// Attach token to every outgoing request
client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On 401, silently refresh and retry
client.interceptors.response.use(null, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && !original._retry) {
    original._retry = true;
    try {
      const refreshToken = sessionStorage.getItem("refreshToken");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        { refreshToken },
      );
      setAccessToken(res.data.accessToken);
      original.headers.Authorization = `Bearer ${res.data.accessToken}`;
      return client(original);
    } catch {
      setAccessToken(null);
      sessionStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
  }
  return Promise.reject(error);
});

export default client;
