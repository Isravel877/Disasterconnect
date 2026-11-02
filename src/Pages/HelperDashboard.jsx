import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./HelperDashboard.css";

function HelperDashboard() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        const response = await api.get("/api/HelpRequest");

        setRequests(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Please log in again.");
        } else if (err.response?.status === 403) {
          setError(
            "Only helpers and admins can view these requests."
          );
        } else {
          setError("Unable to load help requests.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  }

  async function handleAccept(requestId) {
    try {
      setAcceptingId(requestId);
      setError("");
      setSuccess("");

      await api.post("/api/RequestAssignment/accept", {
        requestId: requestId,
      });

      setRequests((currentRequests) =>
        currentRequests.filter(
          (request) =>
            String(request.requestId) !== String(requestId)
        )
      );

      setSuccess(
        `Help request #${requestId} accepted successfully.`
      );
    } catch (err) {
      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else if (err.response?.status === 403) {
        setError(
          "You do not have permission to accept this request."
        );
      } else {
        setError(
          err.response?.data?.message ||
          "Unable to accept the help request."
        );
      }
    } finally {
      setAcceptingId(null);
    }
  }

  function formatLabel(value) {
    if (!value) return "Not specified";

    return String(value)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  const availableRequests = requests.filter(
    (request) =>
      String(request.status || "").toUpperCase() === "PENDING"
  );

  return (
    <main className="helper-page">
      <header className="helper-header">
        <div>
          <p className="helper-brand">DISASTERCONNECT</p>
          <h1>Helper Dashboard</h1>
          <p>Find people who need your assistance.</p>
        </div>

          <Link
          to="/helper/assignments"
          className="helper-my-assignments"
        >
          My Assignments
        </Link>

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
            <h2>Available Help Requests</h2>
            <p>
              Review requests and prepare to assist your community.
            </p>
          </div>
        </div>

        {loading && <p>Loading requests...</p>}

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

        {!loading &&
          !error &&
          availableRequests.length === 0 && (
            <p className="helper-empty">
              No pending help requests are available right now.
            </p>
          )}

        <div className="helper-request-list">
          {availableRequests.map((request) => (
            <article
              className="helper-request-card"
              key={request.requestId}
            >
              <div className="helper-card-heading">
                <h3>{request.tittle}</h3>

                <span
                  className={`helper-status helper-status-${String(
                    request.status || ""
                  ).toLowerCase()}`}
                >
                  {formatLabel(request.status)}
                </span>
              </div>

              <p>
                {request.description || "No description provided."}
              </p>

              <div className="helper-details">
                <p>
                  <strong>Request ID:</strong>
                  {request.requestId}
                </p>

                <p>
                  <strong>Location:</strong>
                  {request.location || "Not specified"}
                </p>

                <p>
                  <strong>Help type:</strong>
                  {formatLabel(request.helptype)}
                </p>

                <p>
                  <strong>Priority:</strong>
                  {formatLabel(request.priority)}
                </p>

                <p>
                  <strong>Status:</strong>
                  {formatLabel(request.status)}
                </p>
              </div>

              <button
                type="button"
                className="helper-accept-btn"
                onClick={() => handleAccept(request.requestId)}
                disabled={acceptingId !== null}
              >
                {String(acceptingId) ===
                  String(request.requestId)
                  ? "Accepting..."
                  : "Accept Request"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HelperDashboard;