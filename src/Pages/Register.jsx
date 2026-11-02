import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  UserRound,
  Mail,
  Phone,
  MapPin,
  LockKeyhole,
  Eye,
  EyeOff,
  HeartHandshake,
} from "lucide-react";
import api from "../services/api";
import "./Register.css";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  roleName: "REQUESTER",
  password: "",
  confirmPassword: "",
};

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // The backend must expose POST /api/auth/register and accept these fields.
      // Only REQUESTER and HELPER are offered; ADMIN accounts must be assigned securely by an admin.
      await api.post("/api/auth/register", {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        roleName: form.roleName,
        password: form.password,
      });

      setSuccess("Your account was created. You can now sign in.");
      setForm(initialForm);
    } catch (err) {
      const responseData = err.response?.data;
      const backendMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message || responseData?.error;

      if (!err.response) {
        setError("Cannot connect to the server. Check that Spring Boot is running.");
      } else if (err.response.status === 404) {
        setError("The registration API is not available yet. Add POST /api/auth/register to the Spring Boot backend.");
      } else if (err.response.status === 409 || err.response.status === 400) {
        setError(backendMessage || "Please check your details. This email may already be registered.");
      } else {
        setError(backendMessage || `Account creation failed (HTTP ${err.response.status}).`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <aside className="register-aside">
          <Link to="/" className="register-brand">
            <ShieldCheck size={30} aria-hidden="true" />
            <span>DisasterConnect</span>
          </Link>

          <div className="register-aside-content">
            <div className="register-emblem">
              <HeartHandshake size={34} aria-hidden="true" />
            </div>
            <p className="register-eyebrow">JOIN YOUR COMMUNITY</p>
            <h1>Help can start with one account.</h1>
            <p>
              Create an account to request essential support or volunteer to
              help people in your community during difficult times.
            </p>
            <div className="register-security-note">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Your account role controls which areas you can access.</span>
            </div>
          </div>
        </aside>

        <section className="register-form-panel">
          <div className="register-heading">
            <p className="register-form-eyebrow">GET STARTED</p>
            <h2>Create your account</h2>
            <p>Enter your details below to join DisasterConnect.</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-field">
              <label htmlFor="register-name">Full name</label>
              <div className="register-input-wrap">
                <UserRound size={18} aria-hidden="true" />
                <input
                  id="register-name"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-email">Email address</label>
              <div className="register-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={150}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="register-grid">
              <div className="register-field">
                <label htmlFor="register-phone">Phone number</label>
                <div className="register-input-wrap">
                  <Phone size={18} aria-hidden="true" />
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone (optional)"
                    autoComplete="tel"
                    maxLength={20}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="register-role">I want to</label>
                <select
                  id="register-role"
                  name="roleName"
                  value={form.roleName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="REQUESTER">Request help</option>
                  <option value="HELPER">Volunteer as a helper</option>
                </select>
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-address">Address or area</label>
              <div className="register-input-wrap">
                <MapPin size={18} aria-hidden="true" />
                <input
                  id="register-address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Town, city, or area (optional)"
                  autoComplete="street-address"
                  maxLength={200}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-password">Password</label>
              <div className="register-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-confirm-password">Confirm password</label>
              <div className="register-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Hide confirmation" : "Show confirmation"}
                  aria-pressed={showConfirmPassword}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="register-alert register-error" role="alert">{error}</p>}
            {success && (
              <div className="register-alert register-success" role="status">
                <p>{success}</p>
                <button type="button" onClick={() => navigate("/login", { replace: true })}>
                  Continue to sign in
                </button>
              </div>
            )}

            <button className="register-submit" type="submit" disabled={loading || Boolean(success)}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="register-login-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          <Link to="/" className="register-back-link">← Back to homepage</Link>
        </section>
      </section>
    </main>
  );
}

export default Register;
