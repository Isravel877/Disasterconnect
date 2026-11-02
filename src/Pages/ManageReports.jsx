import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./ManageReports.css";

const EMPTY_FORM = {
  reason: "",
  description: "",
  status: "PENDING",
  resolvedById: "",
};

function readError(error, fallback) {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.error || fallback;
}

function normalizeRole(role) {
  return String(role || "").toUpperCase().replace(/^ROLE_/, "");
}

function ManageReports() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reportResponse, userResponse] = await Promise.all([
        api.get("/api/Reports"),
        api.get("/api/users"),
      ]);
      setReports(Array.isArray(reportResponse.data) ? reportResponse.data : []);
      setUsers(Array.isArray(userResponse.data) ? userResponse.data : []);
    } catch (err) {
      setError(readError(err, "Could not load reports. Check that you are logged in as Admin."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const admins = useMemo(
    () => users.filter((user) => normalizeRole(user.roleName) === "ADMIN"),
    [users]
  );

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesSearch = !query || [
        report.reportsId,
        report.requestId,
        report.reportedByName,
        report.reportedById,
        report.reason,
        report.description,
        report.status,
        report.resolvedByName,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "ALL"
        || String(report.status || "").toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const pendingCount = reports.filter((item) => String(item.status).toUpperCase() === "PENDING").length;
  const reviewCount = reports.filter((item) => String(item.status).toUpperCase() === "UNDER_REVIEW").length;
  const resolvedCount = reports.filter((item) => String(item.status).toUpperCase() === "RESOLVED").length;

  function startEdit(report) {
    setSelectedId(report.reportsId);
    setForm({
      reason: report.reason || "",
      description: report.description || "",
      status: String(report.status || "PENDING").toUpperCase(),
      resolvedById: report.resolvedById ? String(report.resolvedById) : "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setSelectedId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedId) {
      setError("Select a report to update first.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Report reason is required.");
      return;
    }
    if (form.status === "RESOLVED" && !form.resolvedById) {
      setError("Select the Admin who resolved this report.");
      return;
    }

    const payload = {
      reason: form.reason.trim(),
      description: form.description.trim(),
      status: form.status,
    };

    if (form.status === "RESOLVED") {
      payload.resolvedBy = { userId: Number(form.resolvedById) };
    }

    setSaving(true);
    try {
      await api.put(`/api/Reports/${selectedId}`, payload);
      setSuccess(`Report #${selectedId} updated successfully.`);
      setSelectedId(null);
      setForm({ ...EMPTY_FORM });
      await loadData();
    } catch (err) {
      setError(readError(err, "Could not update this report."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(report) {
    const confirmed = window.confirm(`Delete report #${report.reportsId}? This cannot be undone.`);
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(report.reportsId);
    try {
      await api.delete(`/api/Reports/${report.reportsId}`);
      if (selectedId === report.reportsId) resetForm();
      setSuccess(`Report #${report.reportsId} deleted.`);
      await loadData();
    } catch (err) {
      setError(readError(err, "Could not delete this report. It may be linked to other records."));
    } finally {
      setDeletingId(null);
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
    <main className="reports-page">
      <header className="reports-header">
        <div>
          <p className="reports-eyebrow">DISASTERCONNECT / ADMIN</p>
          <h1>Report Management</h1>
          <p className="reports-subtitle">Review submitted reports, update their status, and record resolution details.</p>
        </div>
        <button type="button" className="reports-refresh" onClick={loadData} disabled={loading}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </header>

      {error && <div className="reports-alert reports-alert-error" role="alert">{error}</div>}
      {success && <div className="reports-alert reports-alert-success" role="status">{success}</div>}

      <section className="reports-stats">
        <article className="reports-stat"><span>Total reports</span><strong>{reports.length}</strong><small>All submitted reports</small></article>
        <article className="reports-stat"><span>Pending</span><strong>{pendingCount}</strong><small>Awaiting review</small></article>
        <article className="reports-stat"><span>Under review</span><strong>{reviewCount}</strong><small>Being investigated</small></article>
        <article className="reports-stat"><span>Resolved</span><strong>{resolvedCount}</strong><small>Resolution recorded</small></article>
      </section>

      {selectedId !== null && (
        <section className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <h2>Update report #{selectedId}</h2>
              <p>Review the report information and save its current status.</p>
            </div>
          </div>
          <form className="reports-form" onSubmit={handleSave}>
            <label className="reports-field">
              <span>Reason *</span>
              <input name="reason" value={form.reason} onChange={handleChange} required maxLength={200} />
            </label>
            <label className="reports-field">
              <span>Status *</span>
              <select name="status" value={form.status} onChange={handleChange} required>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </label>
            <label className="reports-field reports-field-wide">
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={handleChange} rows="4" placeholder="Report details" />
            </label>
            {form.status === "RESOLVED" && (
              <label className="reports-field reports-field-wide">
                <span>Resolved by Admin *</span>
                <select name="resolvedById" value={form.resolvedById} onChange={handleChange} required>
                  <option value="">Select the resolving Admin</option>
                  {admins.map((admin) => (
                    <option key={admin.userId} value={admin.userId}>{admin.fullName} (ID: {admin.userId})</option>
                  ))}
                </select>
                {admins.length === 0 && <small>No Admin accounts were returned by /api/users.</small>}
              </label>
            )}
            <div className="reports-form-actions">
              <button type="button" className="reports-btn reports-btn-secondary" onClick={resetForm} disabled={saving}>Cancel</button>
              <button type="submit" className="reports-btn reports-btn-primary" disabled={saving || (form.status === "RESOLVED" && admins.length === 0)}>
                {saving ? "Saving…" : "Save report"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="reports-panel reports-list-panel">
        <div className="reports-panel-heading reports-list-heading">
          <div>
            <h2>Submitted reports</h2>
            <p>Showing {filteredReports.length} of {reports.length} reports.</p>
          </div>
          <div className="reports-filters">
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports…" aria-label="Search reports" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter reports by status">
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="reports-empty">Loading reports…</div>
        ) : filteredReports.length === 0 ? (
          <div className="reports-empty"><strong>No reports found</strong><p>Try a different search or status filter.</p></div>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead><tr><th>Report</th><th>Reason / details</th><th>Reported by</th><th>Request</th><th>Created</th><th>Resolution</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredReports.map((report) => {
                  const status = String(report.status || "PENDING").toUpperCase();
                  return (
                    <tr key={report.reportsId}>
                      <td className="reports-id">#{report.reportsId}</td>
                      <td><strong>{report.reason}</strong>{report.description && <small className="reports-description">{report.description}</small>}</td>
                      <td><strong>{report.reportedByName || `User #${report.reportedById}`}</strong><small className="reports-secondary">User ID: {report.reportedById}</small></td>
                      <td>{report.requestId ? `Request #${report.requestId}` : "General report"}</td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>{report.resolvedByName ? <><strong>{report.resolvedByName}</strong><small className="reports-secondary">{formatDate(report.resolvedAt)}</small></> : "—"}</td>
                      <td><span className={`reports-status ${statusClass(status)}`}>{status.replaceAll("_", " ")}</span></td>
                      <td><div className="reports-row-actions">
                        <button type="button" className="reports-edit-btn" onClick={() => startEdit(report)}>Review</button>
                        <button type="button" className="reports-delete-btn" onClick={() => handleDelete(report)} disabled={deletingId === report.reportsId}>{deletingId === report.reportsId ? "Deleting…" : "Delete"}</button>
                      </div></td>
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

export default ManageReports;
