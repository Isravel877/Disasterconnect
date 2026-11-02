import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";


import "./ManageAssingment.css";

function readError(error, fallback) {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.error || fallback;
}

function normalizeRole(role) {
  return String(role || "").toUpperCase().replace(/^ROLE_/, "");
}

function ManageAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ requestId: "", helperId: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [assignmentResponse, requestResponse, userResponse] = await Promise.all([
        api.get("/api/RequestAssignment"),
        api.get("/api/HelpRequest"),
        api.get("/api/users"),
      ]);

      setAssignments(Array.isArray(assignmentResponse.data) ? assignmentResponse.data : []);
      setRequests(Array.isArray(requestResponse.data) ? requestResponse.data : []);
      setUsers(Array.isArray(userResponse.data) ? userResponse.data : []);
    } catch (err) {
      setError(readError(err, "Could not load assignments. Check that you are logged in as Admin."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const helpers = useMemo(
    () => users.filter((user) => normalizeRole(user.roleName) === "HELPER"),
    [users]
  );

  const activeRequests = useMemo(
    () => requests.filter((request) => {
      const status = String(request.status || "").toUpperCase();
      return !["COMPLETED", "CANCELLED", "CLOSED", "RESOLVED"].includes(status);
    }),
    [requests]
  );

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const matchesSearch = !query || [
        assignment.assignmentId,
        assignment.requestId,
        assignment.requestTitle,
        assignment.helperId,
        assignment.helperName,
        assignment.status,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));

      const matchesStatus = statusFilter === "ALL"
        || String(assignment.status || "").toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  const assignedCount = assignments.filter(
    (item) => String(item.status).toUpperCase() === "ASSIGNED"
  ).length;
  const acceptedCount = assignments.filter(
    (item) => String(item.status).toUpperCase() === "ACCEPTED"
  ).length;
  const completedCount = assignments.filter(
    (item) => String(item.status).toUpperCase() === "COMPLETED"
  ).length;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.requestId || !form.helperId) {
      setError("Select both a help request and a helper.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/api/RequestAssignment", {
        request: { requestId: Number(form.requestId) },
        helper: { userId: Number(form.helperId) },
      });
      setForm({ requestId: "", helperId: "" });
      setSuccess("Assignment created successfully.");
      await loadData();
    } catch (err) {
      setError(readError(err, "Could not create assignment. The helper may already be assigned to this request."));
    } finally {
      setSaving(false);
    }
  }

  async function cancelAssignment(assignment) {
    if (!["ASSIGNED", "ACCEPTED"].includes(String(assignment.status).toUpperCase())) return;
    const confirmed = window.confirm(
      `Cancel assignment #${assignment.assignmentId} for "${assignment.requestTitle || `request ${assignment.requestId}`}"?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setWorkingId(assignment.assignmentId);
    try {
      await api.put(`/api/RequestAssignment/${assignment.assignmentId}`, {
        status: "CANCELLED",
      });
      setSuccess(`Assignment #${assignment.assignmentId} was cancelled.`);
      await loadData();
    } catch (err) {
      setError(readError(err, "Could not cancel this assignment."));
    } finally {
      setWorkingId(null);
    }
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function statusClass(status) {
    return String(status || "unknown").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  }

  return (
    <main className="assignments-page">
      <header className="assignments-header">
        <div>
          <p className="assignments-eyebrow">DISASTERCONNECT / ADMIN</p>
          <h1>Assignment Management</h1>
          <p className="assignments-subtitle">
            Allocate help requests to helpers and monitor response progress.
          </p>
        </div>
        <button type="button" className="assignments-refresh" onClick={loadData} disabled={loading}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </header>

      {error && <div className="assignments-alert assignments-alert-error" role="alert">{error}</div>}
      {success && <div className="assignments-alert assignments-alert-success" role="status">{success}</div>}

      <section className="assignments-stats">
        <article className="assignments-stat"><span>Total assignments</span><strong>{assignments.length}</strong><small>All recorded allocations</small></article>
        <article className="assignments-stat"><span>Assigned</span><strong>{assignedCount}</strong><small>Waiting for helper acceptance</small></article>
        <article className="assignments-stat"><span>Accepted</span><strong>{acceptedCount}</strong><small>Work in progress</small></article>
        <article className="assignments-stat"><span>Completed</span><strong>{completedCount}</strong><small>Completed assignments</small></article>
      </section>

      <section className="assignments-panel">
        <div className="assignments-panel-heading">
          <div>
            <h2>Create an assignment</h2>
            <p>Choose an active help request and a registered Helper account.</p>
          </div>
        </div>

        <form className="assignments-form" onSubmit={handleCreate}>
          <label className="assignments-field">
            <span>Help request *</span>
            <select name="requestId" value={form.requestId} onChange={handleChange} required>
              <option value="">Select a help request</option>
              {activeRequests.map((request) => (
                <option key={request.requestId} value={request.requestId}>
                  #{request.requestId} — {request.tittle || request.title || "Untitled request"} ({request.status || "Unknown"})
                </option>
              ))}
            </select>
          </label>
          <label className="assignments-field">
            <span>Helper *</span>
            <select name="helperId" value={form.helperId} onChange={handleChange} required>
              <option value="">Select a helper</option>
              {helpers.map((helper) => (
                <option key={helper.userId} value={helper.userId}>
                  {helper.fullName} (ID: {helper.userId})
                </option>
              ))}
            </select>
          </label>
          <div className="assignments-form-note">
            {helpers.length === 0
              ? "No Helper accounts were found. Create a user with the HELPER role first."
              : `${helpers.length} helper account${helpers.length === 1 ? "" : "s"} available.`}
          </div>
          <div className="assignments-form-actions">
            <button type="submit" className="assignments-btn assignments-btn-primary" disabled={saving || helpers.length === 0 || activeRequests.length === 0}>
              {saving ? "Creating…" : "Create assignment"}
            </button>
          </div>
        </form>
      </section>

      <section className="assignments-panel assignments-list-panel">
        <div className="assignments-panel-heading assignments-list-heading">
          <div>
            <h2>All assignments</h2>
            <p>Showing {filteredAssignments.length} of {assignments.length} assignments.</p>
          </div>
          <div className="assignments-filters">
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search request or helper…" aria-label="Search assignments" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter assignments by status">
              <option value="ALL">All statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="assignments-empty">Loading assignments…</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="assignments-empty"><strong>No assignments found</strong><p>Try a different filter or create an assignment above.</p></div>
        ) : (
          <div className="assignments-table-wrap">
            <table className="assignments-table">
              <thead><tr><th>Assignment</th><th>Help request</th><th>Helper</th><th>Assigned</th><th>Accepted</th><th>Completed</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filteredAssignments.map((assignment) => {
                  const status = String(assignment.status || "ASSIGNED").toUpperCase();
                  const canCancel = ["ASSIGNED", "ACCEPTED"].includes(status);
                  return (
                    <tr key={assignment.assignmentId}>
                      <td className="assignments-id">#{assignment.assignmentId}</td>
                      <td><strong>{assignment.requestTitle || `Request #${assignment.requestId}`}</strong><small className="assignments-secondary">Request ID: {assignment.requestId}</small></td>
                      <td><strong>{assignment.helperName || `Helper #${assignment.helperId}`}</strong><small className="assignments-secondary">User ID: {assignment.helperId}</small></td>
                      <td>{formatDate(assignment.assignedAt)}</td>
                      <td>{formatDate(assignment.acceptedAt)}</td>
                      <td>{formatDate(assignment.completedAt)}</td>
                      <td><span className={`assignments-status ${statusClass(status)}`}>{status}</span></td>
                      <td>
                        {canCancel ? (
                          <button type="button" className="assignments-cancel-btn" onClick={() => cancelAssignment(assignment)} disabled={workingId === assignment.assignmentId}>
                            {workingId === assignment.assignmentId ? "Cancelling…" : "Cancel"}
                          </button>
                        ) : <span className="assignments-no-action">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default ManageAssignments;
