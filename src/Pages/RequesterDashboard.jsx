
import { Link, useNavigate } from "react-router-dom";
import "./RequesterDashboard.css";

function RequesterDashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/login", { replace: true });
  }

  return (
    <main className="requester-dashboard">
      <header className="requester-header">
        <div>
          <p className="dashboard-label">DISASTERCONNECT</p>
          <h1>Requester Dashboard</h1>
          <p>
            Get help, manage your requests, and stay updated.
          </p>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </header>

      <section className="requester-welcome">
        <h2>Welcome back!</h2>
        <p>
          What do you need help with today?
        </p>
      </section>

      <section className="requester-actions">
        <article className="requester-card">
          <h2>Create a Help Request</h2>
          <p>
            Request essential assistance from your community.
          </p>
          <Link
            to="/requester/create-request"
            className="dashboard-button"
          >
            Create Request
          </Link>
        </article>

        <article className="requester-card">
          <h2>My Help Requests</h2>
          <p>
            View your requests and check their status.
          </p>
          <Link
            to="/requester/requests"
            className="dashboard-button"
          >
            View Requests
          </Link>
        </article>
      </section>
    </main>
  );
}

export default RequesterDashboard;
