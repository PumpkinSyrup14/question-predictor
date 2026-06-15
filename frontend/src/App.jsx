import { useState } from "react";
import axios from "axios";
import UploadForm from "./UploadForm";
import Results from "./Results";
import "./index.css";

const API_URL = "https://qpred-backend.onrender.com";

function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <div className="error-state-icon">⚠</div>
      <h3>Something went wrong</h3>
      <p>{message}</p>
      <button className="btn-retry" onClick={onRetry}>← Try Again</button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("form");   // "form" | "loading" | "results" | "error"
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [currentModule, setCurrentModule] = useState("");

  const handleSubmit = async ({ subject, modules, pastPapers, moduleNotes }) => {
    setError("");
    setView("loading");
    setCurrentModule(modules[0] || "");

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("module_names", JSON.stringify(modules));

      const allNotes = modules.flatMap((m) => moduleNotes[m] || []);
      const notesMap = {};
      for (const mod of modules) {
        const files = moduleNotes[mod] || [];
        notesMap[mod] = files.map((f) => f.name);
        for (const f of files) {
          formData.append("module_notes", f);
        }
      }

      if (allNotes.length === 0) {
        formData.append("module_notes", new Blob([], { type: "application/pdf" }), "__empty__.pdf");
      }

      for (const f of pastPapers) {
        formData.append("past_papers", f);
      }
      if (pastPapers.length === 0) {
        formData.append("past_papers", new Blob([], { type: "application/pdf" }), "__empty__.pdf");
      }

      formData.append("module_notes_map", JSON.stringify(notesMap));

      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // 2 min timeout
        onUploadProgress: (e) => {
          if (e.loaded === e.total) setCurrentModule("Analyzing with Gemini…");
        },
      });

      // Check if all modules failed to parse
      const predictions = response.data.predictions;
      const allFailed = Object.values(predictions).every((m) => m?.parse_error);
      if (allFailed) {
        setError("Gemini returned unreadable responses for all modules. Try again.");
        setView("error");
        return;
      }

      setResults(response.data);
      setView("results");
    } catch (err) {
      let msg = "Something went wrong. Make sure the backend is running.";

      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        msg = "Request timed out — Gemini took too long. Try with fewer modules or smaller files.";
      } else if (err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
        msg = "Cannot reach the backend. Make sure it's running on http://localhost:8000.";
      } else if (err?.response?.status === 429) {
        msg = "Gemini API rate limit hit. Wait a minute and try again.";
      } else if (err?.response?.status === 500) {
        msg = err?.response?.data?.detail || "Backend error. Check the terminal for details.";
      } else if (err?.response?.data?.detail) {
        msg = err.response.data.detail;
      }

      setError(msg);
      setView("error");
    }
  };

  const reset = () => {
    setResults(null);
    setError("");
    setView("form");
  };

  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-logo">QPred</span>
        <span className="nav-tag">Beta</span>
      </nav>

      <main className="main">
        {view === "form" && (
          <>
            <div className="hero">
              <h1>Predict your<br /><span>exam questions.</span></h1>
              <p>Upload past papers and module notes. Get likely questions for each module — before the exam.</p>
            </div>
            <UploadForm onSubmit={handleSubmit} loading={false} />
          </>
        )}

        {view === "loading" && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Analyzing papers and predicting questions…</p>
            {currentModule && (
              <p className="loading-module">
                {currentModule}
              </p>
            )}
            <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-dimmer)" }}>
              This can take 15–30 seconds per module
            </p>
          </div>
        )}

        {view === "error" && (
          <ErrorState message={error} onRetry={reset} />
        )}

        {view === "results" && results && (
          <Results data={results} onBack={reset} />
        )}
      </main>
    </div>
  );
}