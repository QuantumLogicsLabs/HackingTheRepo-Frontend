const KNOWN = new Set(["queued", "running", "completed", "failed", "refined"]);

function formatStatus(status) {
  if (!status || typeof status !== "string") return "—";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export default function StatusBadge({ status }) {
  const variant = KNOWN.has(status) ? status : "queued";
  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot"></span>
      {formatStatus(status)}
    </span>
  );
}
