
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ManageUsers.css";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  roleId: ""
};

function formatLabel(value) {
  if (!value) return "Not specified";

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRole(user) {
  return String(user.roleName || "UNKNOWN").toUpperCase();
}

function getStatus(user) {
  return String(user.accountStatus || "UNKNOWN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function ManageUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError("");
      setNotice("");
    }

    try {
      const response = await api.get("/api/users");

      if (!Array.isArray(response.data)) {
        throw new Error("Unexpected users response format");
      }

      setUsers(response.data);
    } catch (err) {
      console.error("Unable to load users:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
        return;
      }

      if (err.response?.status === 403) {
        setError("Only an authorized admin can manage users.");
      } else {
        setError("Unable to load users. Check the backend API.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const searchableText = [
        user.userId,
        user.fullName,
        user.email,
        user.phone,
        user.address,
        user.roleName,
        user.accountStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(term);

      const matchesRole =
        roleFilter === "ALL" || getRole(user) === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const requesterCount = users.filter(
    (user) => getRole(user) === "REQUESTER"
  ).length;

  const helperCount = users.filter(
    (user) => getRole(user) === "HELPER"
  ).length;

  const adminCount = users.filter(
    (user) => getRole(user) === "ADMIN"
  ).length;

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(user) {
    setEditingId(user.userId);

    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      password: "",
    });

    setError("");
    setNotice("");
    setShowForm(true);
  }

  function handleChange(event) {
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

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };

    if (!editingId) {
      if (!form.password.trim()) {
        setError("Enter a password for the new requester account.");
        return;
      }

      if (!editingId) {
        payload.password = form.password;
        payload.roleId = Number(form.roleId);
      }
    }

    try {
      setSaving(true);

      if (editingId) {
        const response = await api.put(
          `/api/users/${editingId}`,
          payload
        );

        setUsers((current) =>
          current.map((user) =>
            String(user.userId) === String(editingId)
              ? { ...user, ...response.data }
              : user
          )
        );

        setNotice("User details updated successfully.");
      } else {
        const response = await api.post("/api/users", payload);

        setUsers((current) => [response.data, ...current]);

        setNotice(
          "Requester account created successfully."
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("Unable to save user:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
      } else if (err.response?.status === 403) {
        setError("You do not have permission to manage users.");
      } else {
        setError(
          err.response?.data?.message ||
          "Unable to save user details. Check the submitted fields."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    const confirmed = window.confirm(
      `Delete the account for ${user.fullName}? If this account is linked to requests or assignments, the database may prevent deletion.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      setDeletingId(user.userId);

      await api.delete(`/api/users/${user.userId}`);

      setUsers((current) =>
        current.filter(
          (item) =>
            String(item.userId) !== String(user.userId)
        )
      );

      setNotice("User deleted successfully.");
    } catch (err) {
      console.error("Unable to delete user:", err);

      const responseData = err.response?.data;
      const message =
        typeof responseData === "string"
          ? responseData
          : responseData?.message || responseData?.error || "";

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
      } else if (err.response?.status === 403) {
        setError("You do not have permission to delete users.");
      } else if (
        /constraint|foreign key|referenced|integrity/i.test(message) ||
        err.response?.status === 409
      ) {
        setError(
          "This user is linked to other records. Deletion is blocked by the database. Keep the account or implement a safe deactivation workflow."
        );
      } else {
        setError(
          message ||
          "Unable to delete the user. Check the backend error details."
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
    <main className="manage-users">
      <header className="users-page-header">
        <div>
          <Link to="/admin-dashboard" className="users-back-link">
            ← Admin Dashboard
          </Link>

          <p className="users-eyebrow">ADMINISTRATION</p>
          <h1>Manage Users</h1>
          <p className="users-subtitle">
            View registered accounts and manage user details.
          </p>
        </div>

        <button
          type="button"
          className="users-primary-button"
          onClick={openCreateForm}
        >
          + Add requester
        </button>
      </header>

      {error && (
        <div className="users-message users-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="users-message users-success" role="status">
          {notice}
        </div>
      )}

      <section className="users-stats">
        <article className="users-stat-card">
          <span className="users-stat-icon blue">♙</span>
          <p>Total users</p>
          <strong>{loading ? "—" : users.length}</strong>
          <span>All registered accounts</span>
        </article>

        <article className="users-stat-card">
          <span className="users-stat-icon green">✓</span>
          <p>Helpers</p>
          <strong>{loading ? "—" : helperCount}</strong>
          <span>Community helpers</span>
        </article>

        <article className="users-stat-card">
          <span className="users-stat-icon purple">◎</span>
          <p>Requesters</p>
          <strong>{loading ? "—" : requesterCount}</strong>
          <span>People requesting help</span>
        </article>

        <article className="users-stat-card">
          <span className="users-stat-icon amber">♧</span>
          <p>Administrators</p>
          <strong>{loading ? "—" : adminCount}</strong>
          <span>Management accounts</span>
        </article>
      </section>

      <section className="users-table-panel">
        <div className="users-panel-heading">
          <div>
            <h2>User directory</h2>
            <p>Search accounts and review assigned roles.</p>
          </div>

          <button
            type="button"
            className="users-refresh-button"
            onClick={() => loadUsers(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        <div className="users-filters">
          <label className="users-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or phone..."
              aria-label="Search users"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter users by role"
          >
            <option value="ALL">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="HELPER">Helper</option>
            <option value="REQUESTER">Requester</option>
          </select>
        </div>

        <div className="users-table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>CONTACT</th>
                <th>ROLE</th>
                <th>ACCOUNT STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="users-table-empty">
                    Loading user accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="users-table-empty">
                    {search || roleFilter !== "ALL"
                      ? "No matching users found."
                      : "No user accounts found."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div className="users-name-cell">
                        <span className="users-avatar">
                          {(user.fullName || "U")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <div>
                          <strong>{user.fullName}</strong>
                          <span>Account #{user.userId}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="users-contact-cell">
                        <span>{user.email || "—"}</span>
                        <span>{user.phone || "No phone"}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`users-role role-${getRole(user).toLowerCase()}`}
                      >
                        {formatLabel(getRole(user))}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`users-status status-${getStatus(user).toLowerCase()}`}
                      >
                        {formatLabel(getStatus(user))}
                      </span>
                    </td>

                    <td>
                      <div className="users-row-actions">
                        <button
                          type="button"
                          className="users-edit-button"
                          onClick={() => openEditForm(user)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="users-delete-button"
                          disabled={deletingId === user.userId}
                          onClick={() => handleDelete(user)}
                        >
                          {deletingId === user.userId
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="users-table-footer">
          Showing {loading ? "—" : filteredUsers.length} of{" "}
          {loading ? "—" : users.length} users
        </div>
      </section>

      {showForm && (
        <div
          className="users-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="users-form-title"
          >
            <header className="users-modal-header">
              <div>
                <p className="users-eyebrow">USER MANAGEMENT</p>
                <h2 id="users-form-title">
                  {editingId ? "Edit user details" : "Add requester"}
                </h2>
                <p>
                  {editingId
                    ? "Update the user's contact information."
                    : "Create a new requester account."}
                </p>
              </div>

              <button
                type="button"
                className="users-close-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="users-form-grid">
                <label className="users-field full">
                  <span>Full name *</span>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    maxLength={120}
                    required
                    placeholder="Enter full name"
                  />
                </label>

                <label className="users-field">
                  <span>Email address *</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    maxLength={150}
                    required
                    placeholder="name@example.com"
                  />
                </label>

                <label className="users-field">
                  <span>Phone number *</span>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={20}
                    required
                    placeholder="Enter phone number"
                  />
                </label>

                <label className="users-field full">
                  <span>Address</span>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    maxLength={300}
                    placeholder="Enter address"
                  />
                </label>

                <label className="users-field full">
                  <span>Account role *</span>
                  <select
                    name="roleId"
                    value={form.roleId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select role</option>
                    <option value={2}>Requester</option>
                    <option value={3}>Helper</option>
                    <option value={1}>Administrator</option>
                  </select>
                </label>

                {!editingId && (
                  <>
                    <label className="users-field full">
                      <span>Password *</span>
                      <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        minLength={4}
                        required
                        autoComplete="new-password"
                        placeholder="Enter initial password"
                      />
                    </label>

                    <p className="users-form-note full">
                      Your current backend creates new accounts with
                      the REQUESTER role. Role changes are not
                      supported by the existing update endpoint.
                    </p>
                  </>
                )}
              </div>

              <div className="users-form-actions">
                <button
                  type="button"
                  className="users-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="users-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create requester"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default ManageUsers;
