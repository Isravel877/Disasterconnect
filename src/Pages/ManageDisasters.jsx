
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ManageDisasters.css";

const emptyForm = {
  tittle: "",
  description: "",
  disasterType: "FLOOD",
  severity: "HIGH",
  location: "",
  latitude: "",
  longitude: "",
  status: "ACTIVE",
  createdById: "",
};

function getSeverity(disaster) {
  return disaster.severity ?? disaster.serverity ?? "";
}

function getLongitude(disaster) {
  return disaster.longitude ?? disaster.logitude ?? "";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString();
}

function ManageDisasters() {
  const navigate = useNavigate();

  const [disasters, setDisasters] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError("");
      setNotice("");
    }

    try {
      const results = await Promise.allSettled([
        api.get("/api/disasters"),
        api.get("/api/users"),
      ]);

      const disasterResult = results[0];
      const userResult = results[1];

      const allResults = [disasterResult, userResult];
      const unauthorized = allResults.some(
        (result) =>
          result.status === "rejected" &&
          result.reason?.response?.status === 401
      );

      if (unauthorized) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
        return;
      }

      if (disasterResult.status === "fulfilled") {
        const data = disasterResult.value.data;

        setDisasters(Array.isArray(data) ? data : []);
      } else {
        console.error(
          "Unable to load disasters:",
          disasterResult.reason
        );

        const status =
          disasterResult.reason?.response?.status;

        setError(
          status === 403
            ? "You do not have permission to view disasters."
            : "Unable to load disasters. Check the backend API."
        );
      }

      if (userResult.status === "fulfilled") {
        const data = userResult.value.data;

        const users = Array.isArray(data) ? data : [];

        setAdmins(
          users.filter(
            (user) =>
              String(user.roleName || "").toUpperCase() === "ADMIN"
          )
        );
      } else {
        console.error(
          "Unable to load admin users:",
          userResult.reason
        );
        setAdmins([]);
      }
    } catch (err) {
      console.error("Disaster loading error:", err);
      setError("Unable to load disaster data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDisasters = useMemo(() => {
    const term = search.trim().toLowerCase();

    return disasters.filter((disaster) => {
      const text = [
        disaster.disasterId,
        disaster.tittle,
        disaster.description,
        disaster.disasterType,
        getSeverity(disaster),
        disaster.location,
        disaster.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        String(disaster.status || "").toUpperCase() ===
          statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [disasters, search, statusFilter]);

  const activeCount = disasters.filter(
    (disaster) =>
      String(disaster.status || "").toUpperCase() === "ACTIVE"
  ).length;

  const highSeverityCount = disasters.filter((disaster) =>
    ["HIGH", "CRITICAL", "SEVERE"].includes(
      String(getSeverity(disaster)).toUpperCase()
    )
  ).length;

  function openCreateForm() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      createdById: admins[0]
        ? String(admins[0].userId)
        : "",
    });

    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(disaster) {
    setEditingId(disaster.disasterId);

    setForm({
      tittle: disaster.tittle || "",
      description: disaster.description || "",
      disasterType: disaster.disasterType || "OTHER",
      severity: getSeverity(disaster) || "MEDIUM",
      location: disaster.location || "",
      latitude: disaster.latitude ?? "",
      longitude: getLongitude(disaster) ?? "",
      status: disaster.status || "ACTIVE",
      createdById: disaster.createdById
        ? String(disaster.createdById)
        : "",
    });

    setError("");
    setNotice("");
    setShowForm(true);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!form.tittle.trim() || !form.location.trim()) {
      setError("Enter a disaster title and location.");
      return;
    }

    if (!editingId && !form.createdById) {
      setError(
        "No admin account is available as the disaster creator. Check GET /api/users."
      );
      return;
    }

    const payload = {
      tittle: form.tittle.trim(),
      description: form.description.trim(),
      disasterType: form.disasterType,
      // These names match the current Disaster entity setters.
      serverity: form.severity,
      location: form.location.trim(),
      latitude: Number(form.latitude || 0),
      logitude: Number(form.longitude || 0),
      status: form.status,
    };

    if (!editingId) {
      payload.createdBy = {
        userId: Number(form.createdById),
      };
    }

    try {
      setSaving(true);

      if (editingId) {
        const response = await api.put(
          `/api/disasters/${editingId}`,
          payload
        );

        setDisasters((current) =>
          current.map((disaster) =>
            String(disaster.disasterId) === String(editingId)
              ? response.data
              : disaster
          )
        );

        setNotice("Disaster updated successfully.");
      } else {
        const response = await api.post(
          "/api/disasters",
          payload
        );

        setDisasters((current) => [
          response.data,
          ...current,
        ]);

        setNotice("Disaster created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("Saving disaster failed:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Only an authorized admin can change disasters.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to save the disaster. Check your form and backend."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(disaster) {
    const confirmed = window.confirm(
      `Delete "${disaster.tittle}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      setDeletingId(disaster.disasterId);

      await api.delete(
        `/api/disasters/${disaster.disasterId}`
      );

      setDisasters((current) =>
        current.filter(
          (item) =>
            String(item.disasterId) !==
            String(disaster.disasterId)
        )
      );

      setNotice("Disaster deleted successfully.");
    } catch (err) {
      console.error("Deleting disaster failed:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Only an authorized admin can delete disasters.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to delete the disaster."
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <main className="disaster-admin">
      <header className="disaster-admin-header">
        <div>
          <Link to="/admin-dashboard" className="disaster-back-link">
            ← Admin Dashboard
          </Link>

          <p className="disaster-eyebrow">ADMINISTRATION</p>
          <h1>Manage Disasters</h1>
          <p className="disaster-page-subtitle">
            Record incidents and keep disaster information up to date.
          </p>
        </div>

        <button
          type="button"
          className="disaster-primary-btn"
          onClick={openCreateForm}
        >
          <span aria-hidden="true">＋</span> Add disaster
        </button>
      </header>

      {error && (
        <div className="disaster-message disaster-error" role="alert">
          {error}
          {error.toLowerCase().includes("log in") && (
            <> <Link to="/login">Login</Link></>
          )}
        </div>
      )}

      {notice && (
        <div
          className="disaster-message disaster-success"
          role="status"
        >
          {notice}
        </div>
      )}

      <section className="disaster-metrics">
        <article className="disaster-metric">
          <div className="disaster-metric-icon blue">▦</div>
          <p>Total disasters</p>
          <strong>{loading ? "—" : disasters.length}</strong>
          <span>All recorded incidents</span>
        </article>

        <article className="disaster-metric">
          <div className="disaster-metric-icon green">✓</div>
          <p>Active disasters</p>
          <strong>{loading ? "—" : activeCount}</strong>
          <span>Currently marked active</span>
        </article>

        <article className="disaster-metric">
          <div className="disaster-metric-icon amber">!</div>
          <p>High severity</p>
          <strong>{loading ? "—" : highSeverityCount}</strong>
          <span>High, critical or severe</span>
        </article>
      </section>

      <section className="disaster-table-panel">
        <div className="disaster-table-heading">
          <div>
            <h2>Disaster records</h2>
            <p>Search, review and manage reported incidents.</p>
          </div>

          <button
            type="button"
            className="disaster-refresh-btn"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        <div className="disaster-filters">
          <label className="disaster-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, type or location..."
              aria-label="Search disaster records"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by disaster status"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="disaster-table-scroll">
          <table className="disaster-table">
            <thead>
              <tr>
                <th>DISASTER</th>
                <th>TYPE</th>
                <th>SEVERITY</th>
                <th>LOCATION</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="disaster-table-empty">
                    Loading disaster records...
                  </td>
                </tr>
              ) : filteredDisasters.length === 0 ? (
                <tr>
                  <td colSpan="7" className="disaster-table-empty">
                    {search || statusFilter !== "ALL"
                      ? "No matching disasters found."
                      : "No disasters have been recorded yet."}
                  </td>
                </tr>
              ) : (
                filteredDisasters.map((disaster) => {
                  const severity = String(
                    getSeverity(disaster) || "UNKNOWN"
                  ).toLowerCase();

                  const status = String(
                    disaster.status || "UNKNOWN"
                  ).toLowerCase();

                  return (
                    <tr key={disaster.disasterId}>
                      <td>
                        <div className="disaster-name-cell">
                          <span className="disaster-record-id">
                            #{disaster.disasterId}
                          </span>

                          <div>
                            <strong>
                              {disaster.tittle || "Untitled disaster"}
                            </strong>
                            <span>
                              {disaster.description || "No description"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{disaster.disasterType || "—"}</td>

                      <td>
                        <span
                          className={`disaster-badge severity-${severity}`}
                        >
                          {getSeverity(disaster) || "Unknown"}
                        </span>
                      </td>

                      <td>{disaster.location || "—"}</td>

                      <td>
                        <span
                          className={`disaster-badge disaster-status-${status}`}
                        >
                          {disaster.status || "Unknown"}
                        </span>
                      </td>

                      <td>{formatDate(disaster.createdAt)}</td>

                      <td>
                        <div className="disaster-row-actions">
                          <button
                            type="button"
                            className="disaster-edit-btn"
                            onClick={() => openEditForm(disaster)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="disaster-delete-btn"
                            onClick={() => handleDelete(disaster)}
                            disabled={
                              deletingId === disaster.disasterId
                            }
                          >
                            {deletingId === disaster.disasterId
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="disaster-table-footer">
          Showing {loading ? "—" : filteredDisasters.length} of{" "}
          {loading ? "—" : disasters.length} records
        </div>
      </section>

      {showForm && (
        <div
          className="disaster-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="disaster-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disaster-form-title"
          >
            <div className="disaster-modal-header">
              <div>
                <p className="disaster-eyebrow">
                  DISASTER MANAGEMENT
                </p>
                <h2 id="disaster-form-title">
                  {editingId ? "Edit disaster" : "Create disaster"}
                </h2>
                <p>
                  Enter the incident details below.
                </p>
              </div>

              <button
                type="button"
                className="disaster-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="disaster-form-grid">
                <label className="disaster-field full">
                  <span>Disaster title *</span>
                  <input
                    name="tittle"
                    value={form.tittle}
                    onChange={handleFormChange}
                    placeholder="e.g. Chennai Flood"
                    maxLength={150}
                    required
                  />
                </label>

                <label className="disaster-field">
                  <span>Disaster type *</span>
                  <select
                    name="disasterType"
                    value={form.disasterType}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="FLOOD">Flood</option>
                    <option value="FIRE">Fire</option>
                    <option value="CYCLONE">Cyclone</option>
                    <option value="EARTHQUAKE">Earthquake</option>
                    <option value="LANDSLIDE">Landslide</option>
                    <option value="DROUGHT">Drought</option>
                    <option value="TSUNAMI">Tsunami</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label className="disaster-field">
                  <span>Severity *</span>
                  <select
                    name="severity"
                    value={form.severity}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </label>

                <label className="disaster-field full">
                  <span>Location *</span>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="City, district or affected area"
                    maxLength={200}
                    required
                  />
                </label>

                <label className="disaster-field">
                  <span>Latitude</span>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={form.latitude}
                    onChange={handleFormChange}
                    placeholder="Optional"
                  />
                </label>

                <label className="disaster-field">
                  <span>Longitude</span>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={form.longitude}
                    onChange={handleFormChange}
                    placeholder="Optional"
                  />
                </label>

                <label className="disaster-field">
                  <span>Status *</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </label>

                {!editingId && (
                  <label className="disaster-field">
                    <span>Created by admin *</span>
                    <select
                      name="createdById"
                      value={form.createdById}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select admin</option>
                      {admins.map((admin) => (
                        <option
                          key={admin.userId}
                          value={admin.userId}
                        >
                          {admin.fullName} (ID: {admin.userId})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="disaster-field full">
                  <span>Description</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Describe the incident and affected area..."
                    rows={4}
                    maxLength={2000}
                  />
                </label>
              </div>

              {error && (
                <p className="disaster-form-error" role="alert">
                  {error}
                </p>
              )}

              <div className="disaster-form-actions">
                <button
                  type="button"
                  className="disaster-cancel-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="disaster-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create disaster"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default ManageDisasters;
