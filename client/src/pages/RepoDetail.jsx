import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

export default function RepoDetail() {
  const { repoId } = useParams();

  const { data: cycleTime = [], isLoading } = useQuery({
    queryKey: ["metrics", "cycle-time", repoId],
    queryFn: async () => {
      const res = await client.get("/api/metrics/cycle-time", {
        params: { repoId },
      });
      return res.data;
    },
  });

  return (
    <div className="page">
      <h1>Repository metrics</h1>
      <p className="muted">Repo ID: {repoId}</p>
      {isLoading ? (
        <p>Loading cycle time…</p>
      ) : cycleTime.length === 0 ? (
        <p>No pull request data yet. Sync a repository from Settings.</p>
      ) : (
        <ul className="metric-list">
          {cycleTime.map((row) => (
            <li key={row.date}>
              {row.date}: {row.avgHours}h avg cycle time ({row.prCount} PRs)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
