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

export default function JobDurationTrendChart({ jobs, loading }: Props) {
  // compute durations in minutes when possible
  const map = new Map<string, { total: number; count: number }>();
  jobs.forEach((j) => {
    const start = j.startedAt || j.createdAt;
    const end = j.finishedAt || j.completedAt || j.updatedAt || null;
    if (!start || !end) return;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return;
    const mins = (e.getTime() - s.getTime()) / 60000;
    const day = formatDateISO(s);
    const cur = map.get(day) || { total: 0, count: 0 };
    cur.total += mins;
    cur.count += 1;
    map.set(day, cur);
  });

  const data = Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, v]) => ({
      date,
      avgDurationMin: Math.round(v.total / v.count),
    }));

  if (loading) return <div className="empty-state">Loading…</div>;
  if (data.length === 0)
    return <div className="empty-state">No duration data available</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" minTickGap={20} />
        <YAxis unit="m" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="avgDurationMin"
          stroke="#805ad5"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
