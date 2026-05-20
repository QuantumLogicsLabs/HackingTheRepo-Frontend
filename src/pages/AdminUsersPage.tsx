import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import type { AuthUser } from "../types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data as AuthUser[]);
      setError("");
    } catch (err: unknown) {
      const response = err as { response?: { data?: { message?: string } } };
      setError(response.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard", { replace: true });
      return;
    }
    loadUsers();
  }, [navigate, user]);

  const changeRole = async (id: string | undefined, role: string) => {
    if (!id) return;
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      await loadUsers();
    } catch {
      setError("Could not update user role.");
    }
  };

  const deleteUser = async (id: string | undefined) => {
    if (!id || !window.confirm("Delete this user permanently?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      await loadUsers();
    } catch {
      setError("Could not delete user.");
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User management</h1>
          <p className="page-sub">
            Admins can review all registered users and promote or demote roles.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        {error && (
          <div style={{ color: "var(--red)", marginBottom: 16 }}>{error}</div>
        )}
        {loading ? (
          <div className="empty-state">
            <div className="spinner"></div>
            <span>Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>There are currently no users to manage.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr 1fr",
                gap: 12,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text3)",
                textTransform: "uppercase",
                padding: "0 12px",
              }}
            >
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Actions</span>
            </div>
            {users.map((userItem) => (
              <div
                key={userItem.id}
                className="card"
                style={{
                  padding: 16,
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1fr 1fr",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{userItem.username}</strong>
                </div>
                <div>{userItem.email}</div>
                <div>{userItem.role || "user"}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {userItem.id !== user?.id && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: "8px 12px", fontSize: 12 }}
                      onClick={() =>
                        changeRole(
                          userItem.id,
                          userItem.role === "admin" ? "user" : "admin",
                        )
                      }
                    >
                      {userItem.role === "admin" ? "Demote" : "Promote"}
                    </button>
                  )}
                  {userItem.id !== user?.id && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "8px 12px", fontSize: 12 }}
                      onClick={() => deleteUser(userItem.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
