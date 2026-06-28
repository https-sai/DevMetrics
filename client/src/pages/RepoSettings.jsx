import { useState } from "react";
import client from "../api/client";

export default function RepoSettings() {
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [githubRepoId, setGithubRepoId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await client.post("/api/repos", {
        githubRepoId: Number(githubRepoId),
        owner,
        name,
        fullName: `${owner}/${name}`,
        private: false,
      });
      setMessage(res.data.message || "Repository added");
      setOwner("");
      setName("");
      setGithubRepoId("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add repository");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Repository settings</h1>
      <p className="muted">Add a GitHub repository to sync commits and pull requests.</p>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label>
          Owner
          <input value={owner} onChange={(e) => setOwner(e.target.value)} required />
        </label>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          GitHub repo ID
          <input
            value={githubRepoId}
            onChange={(e) => setGithubRepoId(e.target.value)}
            required
            inputMode="numeric"
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add repository"}
        </button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
