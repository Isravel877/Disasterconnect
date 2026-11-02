
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./HelperDashboard.css";

function MyAssignments() {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    async function loadAssignments() {
      try {
        const response = await api.get(
          "/api/RequestAssignment/my"
        );

        setAssignments(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Please log in again.");
        } else if (err.response?.status === 403) {
          setError("Only helpers can view their assignments.");
        } else {
          setError("Unable to load your assignments.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, []);

  async function handleComplete(assignmentId) {
    try {
      setCompletingId(assignmentId);
      setError("");
      setSuccess("");

      const response = await api.put(
        `/api/RequestAssignment/${assignmentId}/complete`
      );

      const updated = response.data;

      setAssignments((current) =>
        current.map((assignment) =>
          String(assignment.assignmentId) ===
          String(assignmentId)
            ? {
                ...assignment,
                status: updated.status || "COMPLETED",
                completedAt: updated.completedAt,
              }
            : assignment
        )
      );

      setSuccess(
        `Assignment #${assignmentId} completed successfully.`
      );
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to complete this assignment.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to complete the assignment."
        );
      }
    } finally {
      setCompletingId(null);
    }
  }

  function formatLabel(value) {
    if (!value) return "Not specified";

    return String(value)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatDate(value) {
    if (!value) return "Not recorded";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Not recorded"
      : date.toLocaleString();
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  }

  return (
    <main className="helper-page">
      <header className="helper-header">
        <div>
          <p className="helper-brand">DISASTERCONNECT</p>
          <h1>My Assignments</h1>
          <p>Track and complete the help requests you accepted.</p>
          <p>
            <Link to="/helper/dashboard">
              Back to Helper Dashboard
            </Link>
          </p>
        </div>

        <button
          type="button"
          className="helper-logout"
          onClick={handleLogout}
        >
          Log out
        </button>
      </header>

      <section className="helper-content">
        <div className="helper-section-heading">
          <div>
            <h2>Your Assigned Work</h2>
            <p>
              Review your accepted requests and update their progress.
            </p>
          </div>
        </div>

        {loading && <p>Loading assignments...</p>}

        {error && (
          <p className="helper-error" role="alert">
            {error}{" "}
            {error.toLowerCase().includes("log in") && (
              <Link to="/login">Login</Link>
            )}
          </p>
        )}

        {success && (
          <p className="helper-success" role="status">
            {success}
          </p>
        )}

        {!loading && !error && assignments.length === 0 && (
          <p className="helper-empty">
            You have no assignments yet. Accept a help request to get started.
          </p>
        )}

        <div className="helper-request-list">
          {assignments.map((assignment) => (
            <article
              className="helper-request-card"
              key={assignment.assignmentId}
            >
              <div className="helper-card-heading">
                <h3>
                  {assignment.requestTitle ||
                    assignment.requestTittle ||
                    `Help Request #${assignment.requestId}`}
                </h3>

                <span
                  className={`helper-status helper-status-${String(
                    assignment.status || ""
                  ).toLowerCase()}`}
                >
                  {formatLabel(assignment.status)}
                </span>
              </div>

              <div className="helper-details">
                <p>
                  <strong>Assignment ID:</strong>
                  {assignment.assignmentId}
                </p>

                <p>
                  <strong>Request ID:</strong>
                  {assignment.requestId}
                </p>

                <p>
                  <strong>Accepted at:</strong>
                  {formatDate(assignment.acceptedAt)}
                </p>

                <p>
                  <strong>Completed at:</strong>
                  {formatDate(assignment.completedAt)}
                </p>
              </div>

              {String(assignment.status).toUpperCase() ===
                "ACCEPTED" && (
                <button
                  type="button"
                  className="helper-accept-btn"
                  onClick={() =>
                    handleComplete(assignment.assignmentId)
                  }
                  disabled={completingId !== null}
                >
                  {String(completingId) ===
                  String(assignment.assignmentId)
                    ? "Completing..."
                    : "Mark as Completed"}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default MyAssignments;
