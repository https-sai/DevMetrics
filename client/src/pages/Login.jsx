const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Login() {
  return (
    <div className="login-page">
      <h1>DevMetrics</h1>
      <p>Connect your GitHub account to view engineering analytics.</p>
      <a className="login-button" href={`${API_URL}/api/auth/github`}>
        Sign in with GitHub
      </a>
    </div>
  );
}
