import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import CommitHeatmap from "../components/charts/CommitHeatmap";

export default function Dashboard() {
  const { data: commits = [], isLoading } = useQuery({
    queryKey: ["metrics", "commits"],
    queryFn: async () => {
      const res = await client.get("/api/metrics/commits");
      return res.data;
    },
  });

  const totalCommits = commits.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total commits (90d)</span>
          <span className="kpi-value">{isLoading ? "…" : totalCommits}</span>
        </div>
      </div>
      <section className="panel">
        <h2>Commit activity</h2>
        {isLoading ? (
          <p>Loading heatmap…</p>
        ) : (
          <>
            <CommitHeatmap data={commits} />
            {commits.length === 0 && (
              <p className="muted">
                No commits in the last 90 days. Add a repository in Settings and
                sync, or choose a repo with recent activity.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
