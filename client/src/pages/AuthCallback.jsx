import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken } from "../api/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (token) {
      setAccessToken(token);
      // Store refresh token in sessionStorage (cleared when tab closes)
      if (refresh) sessionStorage.setItem("refreshToken", refresh);
      // Remove tokens from URL immediately so they are not in browser history
      window.history.replaceState({}, "", "/");
      navigate("/", { replace: true });
    } else {
      navigate("/login");
    }
  }, []);

  return <div>Authenticating...</div>;
}
