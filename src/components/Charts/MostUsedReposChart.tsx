import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Job } from "../../types";

interface Props {
  jobs: Job[];
  loading: boolean;
  repoName?: (url: string) => string;
}

export default function MostUsedReposChart({ jobs, loading, repoName }: Props) {
  const counts = new Map<string, number>();
  jobs.forEach((j) => {
    const name = repoName ? repoName(j.repoUrl) : j.repoUrl;
    counts.set(name, (counts.get(name) || 0) + 1);
  });

  const data = Array.from(counts.entries())
    .map(([repo, count]) => ({ repo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (loading) return <div className="empty-state">Loading…</div>;
  if (data.length === 0) return <div className="empty-state">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 16, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="repo" type="category" width={150} />
        <Tooltip />
        <Bar dataKey="count" fill="#38a169" />
      </BarChart>
    </ResponsiveContainer>
  );
}
