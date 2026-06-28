import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken, setAccessToken } from "../api/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (token) {
      handled.current = true;
      setAccessToken(token);
      if (refresh) sessionStorage.setItem("refreshToken", refresh);
      window.history.replaceState({}, "", "/");
      navigate("/", { replace: true });
      return;
    }

    // StrictMode re-runs effects after replaceState clears the query string.
    if (getAccessToken()) {
      handled.current = true;
      navigate("/", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [navigate]);

  return <div>Authenticating...</div>;
}
