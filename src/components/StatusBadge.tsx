import type { JobStatus } from "../types";

const KNOWN = new Set<JobStatus>(["queued", "running", "completed", "failed", "refined"]);

interface StatusBadgeProps {
  status?: JobStatus | string | null;
}

function formatStatus(status?: JobStatus | string | null): string {
  if (!status || typeof status !== "string") return "—";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const variant = KNOWN.has(status as JobStatus) ? status : "queued";
  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot"></span>
      {formatStatus(status)}
    </span>
  );
}
