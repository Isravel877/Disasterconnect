
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  LifeBuoy,
  Users,
} from "lucide-react";
import { loginUser } from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await loginUser({
        email: email.trim(),
        password,
      });

      // Read the JWT from the backend response.
      const token =
        data.token ??
        data.accessToken ??
        data.jwt;

      if (typeof token !== "string" || !token.trim()) {
        setError(
          "Login response does not contain a JWT token. Check your backend response."
        );
        return;
      }

      // Read the user's role.
      const rawRole =
        data.roleName ??
        data.role ??
        data.user?.roleName ??
        data.user?.role;

      const role =
        typeof rawRole === "string"
          ? rawRole
          : rawRole?.roleName ?? rawRole?.name;

      const normalizedRole =
        typeof role === "string"
          ? role.replace(/^ROLE_/, "").toUpperCase()
          : "";

      // Select the correct dashboard.
      const dashboardRoutes = {
        ADMIN: "/admin-dashboard",
        REQUESTER: "/requester/dashboard",
        HELPER: "/helper/dashboard",
      };

      if (!dashboardRoutes[normalizedRole]) {
        setError(
          "Login succeeded, but the account role is missing or invalid."
        );
        return;
      }

      // Save the authenticated session information.
      localStorage.setItem("token", token);
      localStorage.setItem("role", normalizedRole);

      // Redirect according to the user's role.
      navigate(dashboardRoutes[normalizedRole], {
        replace: true,
      });
    } catch (err) {
      if (err.response) {
        setError(
          err.response.data?.message ||
            err.response.data?.error ||
            `Login failed. HTTP status: ${err.response.status}`
        );
      } else {
        setError(
          "Unable to connect to the server. Check Spring Boot and your CORS configuration."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        {/* Left panel */}
        <aside className="auth-intro">
          <Link to="/" className="auth-brand">
            <ShieldCheck size={30} />
            <span>DisasterConnect</span>
          </Link>

          <p className="auth-eyebrow">WELCOME BACK</p>

          <h1>Support starts with staying connected.</h1>

          <p className="auth-intro-description">
            Sign in to access your account, manage help requests,
            and follow updates from your DisasterConnect dashboard.
          </p>

          <div className="auth-benefits">
            <div className="auth-benefit">
              <div className="auth-benefit-icon">
                <LifeBuoy size={21} />
              </div>

              <div>
                <h3>Help when it matters</h3>
                <p>Keep track of assistance requests.</p>
              </div>
            </div>

            <div className="auth-benefit">
              <div className="auth-benefit-icon">
                <Users size={21} />
              </div>

              <div>
                <h3>Work together</h3>
                <p>Connect with your community.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right panel */}
        <section className="auth-form-panel">
          <div className="auth-heading">
            <h2>Sign in to your account</h2>
            <p>Enter your account details to continue.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">
                Email address
              </label>

              <div className="auth-input-wrapper">
                <Mail size={19} aria-hidden="true" />

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={19} aria-hidden="true" />

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="auth-message" role="status">
                {message}
              </p>
            )}
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/createAcount">Create an account</Link>
          </p>

          <div className="auth-form-note">
            <ShieldCheck size={17} />
            <span>
              Use the credentials associated with your account.
            </span>
          </div>

          <Link to="/" className="auth-back-link">
            Back to homepage
          </Link>
        </section>
      </section>
    </main>
  );
}

export default Login;
