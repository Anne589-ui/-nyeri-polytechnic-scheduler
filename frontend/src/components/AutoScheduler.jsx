import React, { useState } from "react";
import { generateTimetable } from "../api";

export default function AutoScheduler({ onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [confirm, setConfirm] = useState(false);

  const handleGenerate = async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setConfirm(false);
    try {
      const data = await generateTimetable();
      setResult(data);
      onGenerated();
    } catch (e) {
      setError(e.response?.data?.detail ?? "Failed to generate timetable.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => setConfirm(false);

  return (
    <div style={styles.card}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>⚡ Auto-Schedule</div>
          <div style={styles.sub}>
            Generates a full conflict-free timetable automatically using constraint satisfaction backtracking
          </div>
        </div>
        {!confirm && (
          <button
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate Timetable"}
          </button>
        )}
      </div>

      {/* Constraints info */}
      <div style={styles.constraints}>
        <span style={styles.constraint}>✓ No room double-booking</span>
        <span style={styles.constraint}>✓ No instructor clash</span>
        <span style={styles.constraint}>✓ No course repeated same day</span>
        <span style={styles.constraint}>✓ Room capacity respected</span>
      </div>

      {/* Confirm warning */}
      {confirm && (
        <div style={styles.confirmBox}>
          <p style={styles.confirmText}>
            ⚠ This will <strong>clear the current timetable</strong> and generate a new one.
            Are you sure?
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={styles.confirmBtn} onClick={handleGenerate}>
              Yes, generate new timetable
            </button>
            <button style={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          ⚠ {error}
        </div>
      )}

      {/* Success result */}
      {result && (
        <div style={styles.successBox}>
          <div style={styles.successTitle}>
            ✓ {result.message}
          </div>
          <div style={styles.resultGrid}>
            {["Monday","Tuesday","Wednesday","Thursday","Friday"].map(day => {
              const dayClasses = result.assignments.filter(a => a.day === day);
              if (dayClasses.length === 0) return null;
              return (
                <div key={day} style={styles.dayCard}>
                  <div style={styles.dayTitle}>{day}</div>
                  {dayClasses.map((a, i) => (
                    <div key={i} style={styles.classItem}>
                      <span style={styles.courseName}>{a.course_name}</span>
                      <span style={styles.classDetail}>{a.start_time}–{a.end_time}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  card:        { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "1.25rem", marginBottom: 24 },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  title:       { fontSize: 15, fontWeight: 600, marginBottom: 4, color: "var(--color-text-primary)" },
  sub:         { fontSize: 12, color: "var(--color-text-secondary)", maxWidth: 500 },
  btn:         { height: 38, padding: "0 20px", background: "#085041", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" },
  constraints: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 },
  constraint:  { fontSize: 11, color: "#1a6640", background: "#f0faf4", padding: "3px 10px", borderRadius: 12, border: "0.5px solid #b7dfca" },
  confirmBox:  { background: "#fffbe6", border: "1px solid #ffe066", borderRadius: 8, padding: "12px 14px", marginTop: 12 },
  confirmText: { fontSize: 13, color: "#7a5c00", margin: 0 },
  confirmBtn:  { height: 34, padding: "0 16px", background: "#085041", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer" },
  cancelBtn:   { height: 34, padding: "0 16px", background: "transparent", color: "var(--color-text-secondary)", border: "1px solid #ddd", borderRadius: 7, fontSize: 12, cursor: "pointer" },
  errorBox:    { background: "#fff5f5", border: "1px solid #f5c0c0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#a32d2d", marginTop: 12 },
  successBox:  { background: "#f0faf4", border: "1px solid #b7dfca", borderRadius: 8, padding: "12px 14px", marginTop: 12 },
  successTitle:{ fontSize: 13, fontWeight: 600, color: "#1a6640", marginBottom: 12 },
  resultGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 },
  dayCard:     { background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 8, padding: "8px 10px" },
  dayTitle:    { fontSize: 11, fontWeight: 600, color: "#085041", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  classItem:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderTop: "0.5px solid #f0f0f0", fontSize: 11 },
  courseName:  { color: "var(--color-text-primary)", fontWeight: 500 },
  classDetail: { color: "var(--color-text-secondary)" },
};