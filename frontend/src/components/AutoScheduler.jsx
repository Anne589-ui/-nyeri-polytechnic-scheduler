import React, { useState } from "react";
import { generateTimetable } from "../api";

export default function AutoScheduler({ onGenerated }) {
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleGenerate = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setConfirmed(false);
    try {
      const data = await generateTimetable();
      setResult(data);
      onGenerated();
    } catch (e) {
      const status = e.response?.status ?? "";
      const detail = e.response?.data?.detail ?? e.message ?? "Failed to generate timetable.";
      setError(`${status ? "Error " + status + ": " : ""}${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <p style={styles.title}>⚡ Auto-Generate Timetable</p>
          <p style={styles.sub}>
            Constraint satisfaction algorithm — generates a fully conflict-free
            schedule from your courses, rooms and instructors.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            ...styles.btn,
            background: confirmed ? "#a32d2d" : "#085041",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Generating…"
            : confirmed
            ? "⚠ Confirm — clears existing timetable"
            : "⚡ Generate timetable"}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>⚠ {error}</div>
      )}

      {confirmed && !loading && (
        <div style={styles.warnBox}>
          ⚠ This will <strong>clear the existing timetable</strong> and replace
          it with a new auto-generated one. Click the button again to confirm.
        </div>
      )}

      {result && (
        <div style={styles.resultBox}>
          <div style={styles.statsRow}>
            <Stat label="Total courses" value={result.stats?.total ?? 0} />
            <Stat label="Scheduled"     value={result.stats?.scheduled ?? 0}   color="#085041" />
            <Stat label="Not placed"    value={result.stats?.unscheduled ?? 0} color={(result.stats?.unscheduled ?? 0) > 0 ? "#a32d2d" : "#085041"} />
          </div>

          <p style={styles.message}>✓ {result.message}</p>

          {Array.isArray(result.unscheduled) && result.unscheduled.length > 0 && (
            <div style={styles.unscheduledBox}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#a32d2d", marginBottom: 6 }}>
                Could not schedule:
              </p>
              {result.unscheduled.map((u, i) => (
                <p key={i} style={{ fontSize: 12, color: "#a32d2d", marginBottom: 3 }}>
                  • {u.course ?? u} — {u.reason ?? ""}
                </p>
              ))}
            </div>
          )}

          {Array.isArray(result.scheduled) && result.scheduled.length > 0 && (
            <div style={styles.preview}>
              <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: "#333" }}>
                Generated schedule preview ({result.scheduled.length} classes):
              </p>
              <div style={{ maxHeight: 180, overflowY: "auto" }}>
                {result.scheduled.map((c, i) => (
                  <div key={i} style={styles.previewRow}>
                    <span style={styles.courseBadge}>{c.course}</span>
                    <span style={styles.detail}>{c.day}</span>
                    <span style={styles.detail}>{c.start_time}–{c.end_time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", background: "#f5f5f5", borderRadius: 8, padding: "10px 16px" }}>
      <div style={{ fontSize: 22, fontWeight: 500, color: color ?? "#111" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{label}</div>
    </div>
  );
}

const styles = {
  card:           { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "1.25rem", marginBottom: 24 },
  header:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 },
  title:          { fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: "#111" },
  sub:            { fontSize: 12, color: "#888", margin: 0, maxWidth: 480 },
  btn:            { height: 40, padding: "0 18px", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" },
  errorBox:       { background: "#fff5f5", border: "1px solid #f5c0c0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#a32d2d", marginTop: 8 },
  warnBox:        { background: "#fffbe6", border: "1px solid #ffe066", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#7a5c00", marginTop: 8 },
  resultBox:      { marginTop: 14, borderTop: "1px solid #f0f0f0", paddingTop: 14 },
  statsRow:       { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 },
  message:        { fontSize: 13, color: "#085041", fontWeight: 500, marginBottom: 10 },
  unscheduledBox: { background: "#fff5f5", border: "1px solid #f5c0c0", borderRadius: 8, padding: "10px 14px", marginBottom: 12 },
  preview:        { background: "#f7f7f7", borderRadius: 8, padding: "10px 14px" },
  previewRow:     { display: "flex", gap: 12, alignItems: "center", padding: "4px 0", borderBottom: "1px solid #eee", fontSize: 12 },
  courseBadge:    { background: "#E1F5EE", color: "#085041", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 500, minWidth: 120 },
  detail:         { color: "#888", minWidth: 80 },
};