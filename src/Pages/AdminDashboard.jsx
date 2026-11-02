
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminDashboard.css";

const menuItems = [
  { label: "Overview", path: "/admin-dashboard", icon: "⌂" },
  { label: "Help Requests", path: "/admin/requests", icon: "▤" },
  { label: "Disasters", path: "/admin/disasters", icon: "△" },
  { label: "Users", path: "/admin/users", icon: "♙" },
  { label: "Resources", path: "/admin/resources", icon: "▦" },
  { label: "Assignments", path: "/admin/assignments", icon: "⇄" },
  { label: "Reports", path: "/admin/reports", icon: "▥" },
];

const emptyDashboard = {
  requests: [],
  users: [],
  disasters: [],
  resources: [],
  assignments: [],
  reports: [],
};

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
}

function getStatus(item) {
  return String(item?.status || "UNKNOWN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function formatLabel(value) {
  return String(value || "Not specified")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTitle(request) {
  return (
    request.tittle ||
    request.title ||
    request.requestTitle ||
    request.requestTittle ||
    "Help request"
  );
}

function getRequestId(request) {
  return request.requestId ?? request.id ?? "—";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString();
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState("");
  const [search, setSearch] = useState("");

  // Load all dashboard data
  const loadDashboard = useCallback(async (isRefresh = false) => {
    // Only update these states when the user clicks Refresh.
    // Initial loading is already true in useState.
    if (isRefresh) {
      setRefreshing(true);
      setWarning("");
    }

    const endpoints = [
      ["requests", "/api/HelpRequest"],
      ["users", "/api/users"],
      ["disasters", "/api/disasters"],
      ["resources", "/api/resources"],
      ["assignments", "/api/RequestAssignment"],
      ["reports", "/api/Reports"],
    ];

    try {
      // Wait for all API requests to finish.
      const results = await Promise.allSettled(
        endpoints.map(([, url]) => api.get(url))
      );

      const nextDashboard = { ...emptyDashboard };
      const failed = [];

      results.forEach((result, index) => {
        const [key, url] = endpoints[index];

        if (result.status === "fulfilled") {
          nextDashboard[key] = getList(result.value.data);
        } else {
          failed.push({
            url,
            status: result.reason?.response?.status,
            message: result.reason?.message,
          });

          console.error("Admin API failed:", url, {
            status: result.reason?.response?.status,
            message: result.reason?.message,
            response: result.reason?.response?.data,
          });
        }
      });

      setDashboard(nextDashboard);

      // Check authentication failures.
      const hasUnauthorized = failed.some(
        (item) => item.status === 401
      );

      if (hasUnauthorized) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
        return;
      }

      // Check role permissions.
      const hasForbidden = failed.some(
        (item) => item.status === 403
      );

      if (hasForbidden) {
        setWarning(
          "Some data is restricted. Check your admin role and backend permissions."
        );
      } else if (failed.length > 0) {
        setWarning(
          "Some dashboard data could not be loaded. Check the browser console and backend endpoints."
        );
      }
    } catch (err) {
      console.error("Unable to load admin dashboard:", err);
      setWarning("Unable to load dashboard data.");
    } finally {
      // These updates happen after the asynchronous requests finish.
      setLoading(false);

      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, [navigate]);

  // Load dashboard data when the page opens.
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  }

  const requests = dashboard.requests;

  const pendingCount = requests.filter(
    (request) => getStatus(request) === "PENDING"
  ).length;

  const activeCount = requests.filter((request) =>
    ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"].includes(
      getStatus(request)
    )
  ).length;

  const completedCount = requests.filter(
    (request) => getStatus(request) === "COMPLETED"
  ).length;

  const recentRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...requests]
      .sort((a, b) => {
        const aId = Number(getRequestId(a)) || 0;
        const bId = Number(getRequestId(b)) || 0;
        return bId - aId;
      })
      .filter((request) => {
        const text = [
          getTitle(request),
          getRequestId(request),
          request.location,
          request.priority,
          request.helptype,
          request.helpType,
          request.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(term);
      })
      .slice(0, 6);
  }, [requests, search]);

  const stats = [
    {
      label: "Total help requests",
      value: requests.length,
      icon: "▤",
      color: "blue",
      note: "All recorded requests",
    },
    {
      label: "Awaiting response",
      value: pendingCount,
      icon: "◷",
      color: "amber",
      note: "Pending requests",
    },
    {
      label: "Active assignments",
      value: activeCount,
      icon: "⇄",
      color: "violet",
      note: "Assigned or in progress",
    },
    {
      label: "Completed requests",
      value: completedCount,
      icon: "✓",
      color: "green",
      note: "Resolved requests",
    },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">DC</div>
          <div>
            <h2>DisasterConnect</h2>
            <p>Response management</p>
          </div>
        </div>

        <div className="admin-nav-label">WORKSPACE</div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin-dashboard"}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="admin-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-help-box">
            <div className="admin-help-icon">i</div>
            <strong>Admin workspace</strong>
            <p>
              Monitor assistance and coordinate disaster response.
            </p>
          </div>

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            <span aria-hidden="true">↪</span>
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-breadcrumb">
              WORKSPACE <span>/</span> OVERVIEW
            </p>
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">
              Monitor requests, resources and response activity.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            <span aria-hidden="true">↻</span>
            {refreshing ? "Refreshing..." : "Refresh data"}
          </button>
        </header>

        {warning && (
          <div className="admin-warning" role="alert">
            <span>!</span>
            <p>{warning}</p>
            {warning.toLowerCase().includes("session") && (
              <NavLink to="/login">Login</NavLink>
            )}
          </div>
        )}

        <section className="admin-welcome">
          <div>
            <span className="admin-eyebrow">
              OPERATIONS OVERVIEW
            </span>
            <h2>Welcome to your workspace</h2>
            <p>
              Stay informed and coordinate community assistance from
              one place.
            </p>
          </div>

          <div className="admin-welcome-symbol" aria-hidden="true">
            <span>DC</span>
            <div />
            <div />
            <div />
          </div>
        </section>

        <section
          className="admin-stats-grid"
          aria-label="Request statistics"
        >
          {stats.map((stat) => (
            <article className="admin-stat-card" key={stat.label}>
              <div className={`admin-stat-icon ${stat.color}`}>
                {stat.icon}
              </div>

              <p className="admin-stat-label">{stat.label}</p>

              <div className="admin-stat-value">
                {loading ? "—" : stat.value.toLocaleString()}
              </div>

              <p className="admin-stat-note">{stat.note}</p>
            </article>
          ))}
        </section>

        <section className="admin-secondary-grid">
          <article className="admin-panel admin-breakdown">
            <div className="admin-panel-heading">
              <div>
                <h2>Response overview</h2>
                <p>Current help request status</p>
              </div>
              <span className="admin-panel-icon">◉</span>
            </div>

            {[
              {
                label: "Pending",
                count: pendingCount,
                color: "pending",
              },
              {
                label: "In progress",
                count: activeCount,
                color: "progress",
              },
              {
                label: "Completed",
                count: completedCount,
                color: "complete",
              },
            ].map((item) => {
              const percent =
                requests.length > 0
                  ? Math.round(
                      (item.count / requests.length) * 100
                    )
                  : 0;

              return (
                <div
                  className="admin-breakdown-row"
                  key={item.label}
                >
                  <div className="admin-breakdown-label">
                    <span>{item.label}</span>
                    <strong>{loading ? "—" : item.count}</strong>
                  </div>

                  <div className="admin-progress-track">
                    <div
                      className={`admin-progress-fill ${item.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {!loading && requests.length === 0 && (
              <p className="admin-inline-note">
                No request data is available yet.
              </p>
            )}
          </article>

          <article className="admin-panel admin-platform">
            <div className="admin-panel-heading">
              <div>
                <h2>Platform summary</h2>
                <p>Records across the system</p>
              </div>
              <span className="admin-panel-icon">▦</span>
            </div>

            <div className="admin-platform-row">
              <div className="admin-platform-symbol users">♙</div>
              <div>
                <strong>
                  {loading ? "—" : dashboard.users.length}
                </strong>
                <p>Registered users</p>
              </div>
              <NavLink to="/admin/users" aria-label="Manage users">
                View
              </NavLink>
            </div>

            <div className="admin-platform-row">
              <div className="admin-platform-symbol disasters">△</div>
              <div>
                <strong>
                  {loading ? "—" : dashboard.disasters.length}
                </strong>
                <p>Disaster records</p>
              </div>
              <NavLink
                to="/admin/disasters"
                aria-label="Manage disasters"
              >
                View
              </NavLink>
            </div>

            <div className="admin-platform-row">
              <div className="admin-platform-symbol resources">▦</div>
              <div>
                <strong>
                  {loading ? "—" : dashboard.resources.length}
                </strong>
                <p>Resource records</p>
              </div>
              <NavLink
                to="/admin/resources"
                aria-label="Manage resources"
              >
                View
              </NavLink>
            </div>
          </article>
        </section>

        <section className="admin-panel admin-recent">
          <div className="admin-panel-heading admin-recent-heading">
            <div>
              <h2>Recent help requests</h2>
              <p>Review the latest recorded requests.</p>
            </div>

            <div className="admin-recent-actions">
              <label className="admin-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search requests..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search help requests"
                />
              </label>

              <NavLink
                to="/admin/requests"
                className="admin-view-all"
              >
                View all →
              </NavLink>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>REQUEST</th>
                  <th>LOCATION</th>
                  <th>PRIORITY</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="admin-table-empty">
                      Loading help requests...
                    </td>
                  </tr>
                ) : recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-table-empty">
                      {search
                        ? "No requests match your search."
                        : "No help requests found."}
                    </td>
                  </tr>
                ) : (
                  recentRequests.map((request, index) => {
                    const status = getStatus(request);
                    const priority = String(
                      request.priority || "NORMAL"
                    )
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-");

                    return (
                      <tr
                        key={
                          request.requestId ?? request.id ?? index
                        }
                      >
                        <td>
                          <div className="admin-request-cell">
                            <span className="admin-request-id">
                              #{getRequestId(request)}
                            </span>
                            <strong>{getTitle(request)}</strong>
                          </div>
                        </td>

                        <td>{request.location || "—"}</td>

                        <td>
                          <span
                            className={`admin-priority priority-${priority}`}
                          >
                            {formatLabel(request.priority)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-status status-${status
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")}`}
                          >
                            {formatLabel(status)}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            request.createdAt || request.created_at
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="admin-footer">
          <span>DisasterConnect · Admin workspace</span>
          <span>
            Community assistance and response coordination
          </span>
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;
