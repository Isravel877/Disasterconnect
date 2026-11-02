import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./CreateHelpRequest.css";

function CreateHelpRequest() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    helptype: "",
    priority: "MEDIUM",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError(false);

    const token = localStorage.getItem("token");

    if (!token) {
      setError(true);
      setMessage("Please log in again. Your token was not found.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/HelpRequest", {
        // The backend currently spells the title field "tittle" (double t).
        tittle: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        helptype: form.helptype,
        priority: form.priority,
      });

      setMessage("Help request submitted successfully!");
      setError(false);

      setForm({
        title: "",
        description: "",
        location: "",
        helptype: "",
        priority: "MEDIUM",
      });
    } catch (err) {
      console.error("Create help request error:", err);
      setError(true);
      setMessage(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to submit the help request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="create-request-page">
      <div className="create-request-card">
        <Link to="/requester/dashboard">
          &larr; Back to Dashboard
        </Link>

        <h1>Create a Help Request</h1>
        <p>Describe the assistance you need.</p>

        {message && (
          <p
            role="status"
            style={{
              color: error ? "#b91c1c" : "#15803d",
              overflowWrap: "anywhere",
            }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Request Title</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Example: Need drinking water"
            required
            maxLength={150}
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Explain what help you need"
            rows={4}
            required
          />

          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Example: Chennai"
            required
          />

          <label htmlFor="helptype">Type of Help</label>
          <select
            id="helptype"
            name="helptype"
            value={form.helptype}
            onChange={handleChange}
            required
          >
            <option value="">Select the type of help</option>
            <option value="FOOD">Food</option>
            <option value="WATER">Water</option>
            <option value="MEDICAL">Medical</option>
            <option value="SHELTER">Shelter</option>
            <option value="RESCUE">Rescue</option>
            <option value="OTHER">Other</option>
          </select>

          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Help Request"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default CreateHelpRequest;
