import {
  LineChart,
  Line,
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
}

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function SuccessRateChart({ jobs, loading }: Props) {
  // group by day
  const map = new Map<string, { completed: number; failed: number }>();
  jobs.forEach((j) => {
    const day = j.createdAt ? formatDateISO(new Date(j.createdAt)) : "unknown";
    const entry = map.get(day) || { completed: 0, failed: 0 };
    if (j.status === "completed") entry.completed += 1;
    if (j.status === "failed") entry.failed += 1;
    map.set(day, entry);
  });

  const data = Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, v]) => {
      const attempts = v.completed + v.failed;
      const successRate =
        attempts === 0 ? null : Math.round((v.completed / attempts) * 100);
      return { date, successRate };
    });

  if (loading) return <div className="empty-state">Loading…</div>;

  if (data.length === 0)
    return <div className="empty-state">No data to display</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" minTickGap={20} />
        <YAxis domain={[0, 100]} unit="%" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="successRate"
          stroke="#2b6cb0"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
