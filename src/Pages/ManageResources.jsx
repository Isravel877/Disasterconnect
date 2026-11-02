
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./ManageResources.css";

const EMPTY_FORM = {
  userId: "",
  disasterId: "",
  resourceType: "",
  quantity: "1",
  description: "",
  status: "AVAILABLE",
  location: "",
};

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return data?.message || data?.error || fallback;
}

function ManageResources() {
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [disasters, setDisasters] = useState([]);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [resourceResponse, userResponse, disasterResponse] =
        await Promise.all([
          api.get("/api/resources"),
          api.get("/api/users"),
          api.get("/api/disasters"),
        ]);

      setResources(
        Array.isArray(resourceResponse.data) ? resourceResponse.data : []
      );
      setUsers(Array.isArray(userResponse.data) ? userResponse.data : []);
      setDisasters(
        Array.isArray(disasterResponse.data) ? disasterResponse.data : []
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not load resources. Check your login and backend."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const disasterMap = useMemo(
    () =>
      new Map(
        disasters.map((disaster) => [
          String(disaster.disasterId),
          disaster,
        ])
      ),
    [disasters]
  );

  const filteredResources = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const disaster = disasterMap.get(String(resource.disasterId));
      const disasterTitle = disaster?.tittle || disaster?.title || "";

      const matchesSearch =
        !searchText ||
        [
          resource.resourceType,
          resource.userName,
          resource.location,
          resource.description,
          resource.status,
          disasterTitle,
          resource.resourcesId,
        ]
          .filter((value) => value !== null && value !== undefined)
          .some((value) => String(value).toLowerCase().includes(searchText));

      const matchesStatus =
        statusFilter === "ALL" ||
        String(resource.status).toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [resources, search, statusFilter, disasterMap]);

  const availableCount = resources.filter(
    (resource) => resource.status?.toUpperCase() === "AVAILABLE"
  ).length;

  const reservedCount = resources.filter(
    (resource) => resource.status?.toUpperCase() === "RESERVED"
  ).length;

  const distributedCount = resources.filter(
    (resource) => resource.status?.toUpperCase() === "DISTRIBUTED"
  ).length;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function handleEdit(resource) {
    setEditingId(resource.resourcesId);

    setForm({
      userId: String(resource.userId ?? ""),
      disasterId: resource.disasterId
        ? String(resource.disasterId)
        : "",
      resourceType: resource.resourceType ?? "",
      quantity: String(resource.quantity ?? 1),
      description: resource.description ?? "",
      status: (resource.status || "AVAILABLE").toUpperCase(),
      location: resource.location ?? "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const quantity = Number(form.quantity);

    if (!form.resourceType.trim()) {
      setError("Please enter the resource type.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (!editingId && !form.userId) {
      setError("Please select the user providing the resource.");
      return;
    }

    const payload = {
      resourceType: form.resourceType.trim(),
      quantity,
      description: form.description.trim(),
      status: form.status,
      location: form.location.trim(),
    };

    if (!editingId) {
      payload.user = {
        userId: Number(form.userId),
      };

      payload.disaster = form.disasterId
        ? { disasterId: Number(form.disasterId) }
        : null;
    }

    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/api/resources/${editingId}`, payload);
        setSuccess("Resource updated successfully.");
      } else {
        await api.post("/api/resources", payload);
        setSuccess("Resource added successfully.");
      }

      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not save the resource. Please check the entered details."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(resource) {
    const confirmed = window.confirm(
      `Delete resource "${resource.resourceType}" (ID ${resource.resourcesId})?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(resource.resourcesId);

    try {
      await api.delete(`/api/resources/${resource.resourcesId}`);

      if (editingId === resource.resourcesId) {
        resetForm();
      }

      setSuccess("Resource deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not delete this resource. It may be referenced by other records."
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getDisasterName(disasterId) {
    if (!disasterId) return "General resource";

    const disaster = disasterMap.get(String(disasterId));

    return disaster
      ? disaster.tittle || disaster.title || `Disaster #${disasterId}`
      : `Disaster #${disasterId}`;
  }

  function statusClass(status) {
    return String(status || "AVAILABLE")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
  }

  return (
    <main className="resources-page">
      <header className="resources-header">
        <div>
          <p className="resources-eyebrow">DISASTERCONNECT / ADMIN</p>
          <h1>Resource Management</h1>
          <p className="resources-subtitle">
            Track relief supplies, quantities, providers, and availability.
          </p>
        </div>

        <button
          type="button"
          className="resource-refresh-btn"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div className="resource-alert resource-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="resource-alert resource-alert-success" role="status">
          {success}
        </div>
      )}

      <section className="resource-stats">
        <article className="resource-stat-card">
          <span>Total resources</span>
          <strong>{resources.length}</strong>
          <small>All recorded supplies</small>
        </article>

        <article className="resource-stat-card">
          <span>Available</span>
          <strong>{availableCount}</strong>
          <small>Ready for allocation</small>
        </article>

        <article className="resource-stat-card">
          <span>Reserved</span>
          <strong>{reservedCount}</strong>
          <small>Reserved supplies</small>
        </article>

        <article className="resource-stat-card">
          <span>Distributed</span>
          <strong>{distributedCount}</strong>
          <small>Marked as distributed</small>
        </article>
      </section>

      <section className="resource-panel">
        <div className="resource-panel-heading">
          <div>
            <h2>{editingId ? "Edit resource" : "Add a resource"}</h2>
            <p>
              {editingId
                ? "Update the resource details below."
                : "Register supplies and link them to a user or disaster."}
            </p>
          </div>
        </div>

        <form className="resource-form" onSubmit={handleSubmit}>
          <label className="resource-field">
            <span>Resource type *</span>
            <input
              name="resourceType"
              value={form.resourceType}
              onChange={handleChange}
              placeholder="e.g. Drinking Water, Food, Medicine"
              required
            />
          </label>

          <label className="resource-field">
            <span>Quantity *</span>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              min="1"
              step="1"
              required
            />
          </label>

          <label className="resource-field">
            <span>Status</span>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="DISTRIBUTED">Distributed</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </label>

          <label className="resource-field">
            <span>Location</span>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Chennai, Tamil Nadu"
            />
          </label>

          <label className="resource-field">
            <span>Provided by *</span>
            <select
              name="userId"
              value={form.userId}
              onChange={handleChange}
              required={!editingId}
              disabled={Boolean(editingId)}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.fullName} (ID: {user.userId})
                </option>
              ))}
            </select>
            {editingId && (
              <small className="resource-field-note">
                Changing the provider is not supported by the current backend.
              </small>
            )}
          </label>

          <label className="resource-field">
            <span>Related disaster</span>
            <select
              name="disasterId"
              value={form.disasterId}
              onChange={handleChange}
              disabled={Boolean(editingId)}
            >
              <option value="">None / General resource</option>
              {disasters.map((disaster) => (
                <option key={disaster.disasterId} value={disaster.disasterId}>
                  {disaster.tittle ||
                    disaster.title ||
                    `Disaster #${disaster.disasterId}`}
                </option>
              ))}
            </select>
            {editingId && (
              <small className="resource-field-note">
                Changing the disaster link is not supported by the current backend.
              </small>
            )}
          </label>

          <label className="resource-field resource-field-wide">
            <span>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Add details about the supplies or how they can be used."
            />
          </label>

          <div className="resource-form-actions">
            {editingId && (
              <button
                type="button"
                className="resource-btn resource-btn-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="resource-btn resource-btn-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update resource"
                  : "Add resource"}
            </button>
          </div>
        </form>
      </section>

      <section className="resource-panel resource-list-panel">
        <div className="resource-panel-heading resource-list-heading">
          <div>
            <h2>Resource inventory</h2>
            <p>
              Showing {filteredResources.length} of {resources.length} resources
            </p>
          </div>

          <div className="resource-filters">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search resources..."
              aria-label="Search resources"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter resources by status"
            >
              <option value="ALL">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="DISTRIBUTED">Distributed</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="resource-empty-state">Loading resources...</div>
        ) : filteredResources.length === 0 ? (
          <div className="resource-empty-state">
            <strong>No resources found</strong>
            <p>Try changing your search or add a new resource above.</p>
          </div>
        ) : (
          <div className="resource-table-wrapper">
            <table className="resource-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resource</th>
                  <th>Quantity</th>
                  <th>Provider</th>
                  <th>Related disaster</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredResources.map((resource) => (
                  <tr key={resource.resourcesId}>
                    <td className="resource-id">
                      #{resource.resourcesId}
                    </td>

                    <td>
                      <strong>{resource.resourceType}</strong>
                      {resource.description && (
                        <small className="resource-description">
                          {resource.description}
                        </small>
                      )}
                    </td>

                    <td>{resource.quantity}</td>

                    <td>
                      {resource.userName || `User #${resource.userId}`}
                    </td>

                    <td>{getDisasterName(resource.disasterId)}</td>

                    <td>{resource.location || "—"}</td>

                    <td>
                      <span
                        className={`resource-status ${statusClass(
                          resource.status
                        )}`}
                      >
                        {resource.status || "AVAILABLE"}
                      </span>
                    </td>

                    <td>
                      <div className="resource-row-actions">
                        <button
                          type="button"
                          className="resource-action-edit"
                          onClick={() => handleEdit(resource)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="resource-action-delete"
                          onClick={() => handleDelete(resource)}
                          disabled={deletingId === resource.resourcesId}
                        >
                          {deletingId === resource.resourcesId
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default ManageResources;
