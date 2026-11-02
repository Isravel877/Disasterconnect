import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./MyRequests.css";

// "HIGH" -> "High", "IN_PROGRESS" -> "In progress"
function toLabel(value) {
  if (!value) return "";

  const text = String(value).replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The backend sends a LocalDateTime such as 2026-10-20T13:42:48.123456
function formatDate(value) {
  if (!value) return "";

  const date = new Date(String(value).slice(0, 19));
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    async function loadRequests() {
      try {
        const response = await api.get("/api/HelpRequest/my");
        setRequests(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        if (err.response?.status === 401) {
          setSessionExpired(true);
          setError("Your session has expired.");
        } else {
          setError(
            err.response?.data?.message ||
              "We could not load your help requests. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  return (
    <main className="myreq-page">
      <div className="myreq-container">
        <Link to="/requester/dashboard">&larr; Back to Dashboard</Link>

        <div className="myreq-header">
          <h1>My Help Requests</h1>

          <Link to="/requester/create-request" className="myreq-new-button">
            New request
          </Link>
        </div>

        {loading && <p className="myreq-note">Loading your requests...</p>}

        {error && (
          <p className="myreq-error" role="alert">
            {error}{" "}
            {!sessionExpired && <Link to="/login">Log in again</Link>}
          </p>
        )}

        {!loading && !error && requests.length === 0 && (
          <p className="myreq-note">
            You have not created a help request yet.{" "}
            <Link to="/requester/create-request">
              Create your first request
            </Link>
          </p>
        )}

        <section className="myreq-list">
          {requests.map((request) => (
            <article key={request.requestId} className="myreq-card">
              <div className="myreq-card-top">
                <h2>{request.tittle}</h2>

                <span
                  className={`myreq-badge myreq-status-${String(
                    request.status || ""
                  ).toLowerCase()}`}
                >
                  {toLabel(request.status)}
                </span>
              </div>

              <p className="myreq-description">{request.description}</p>

              <dl className="myreq-meta">
                <div>
                  <dt>Location</dt>
                  <dd>{request.location}</dd>
                </div>

                <div>
                  <dt>Type of help</dt>
                  <dd>{toLabel(request.helptype)}</dd>
                </div>

                <div>
                  <dt>Priority</dt>
                  <dd>{toLabel(request.priority)}</dd>
                </div>

                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(request.createdAt)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default MyRequests;
