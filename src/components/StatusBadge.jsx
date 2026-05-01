export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot"></span>
      {status}
    </span>
  );
}
