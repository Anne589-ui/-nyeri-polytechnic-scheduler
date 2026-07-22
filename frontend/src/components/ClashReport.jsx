import React from "react";

export default function ClashReport({ clashes }) {
  if (clashes.length === 0) {
    return (
      <div style={styles.ok}>
        ✓ No clashes detected — timetable is clear for this fortnight.
      </div>
    );
  }
  return (
    <div style={styles.warn}>
      <p style={styles.title}>⚠ {clashes.length} clash{clashes.length > 1 ? "es" : ""} detected — resolve before publishing</p>
      {clashes.map((cl, i) => (
        <div key={i} style={styles.item}>
          <span style={styles.tag(cl.type)}>{cl.type === "room" ? "Room" : "Instructor"}</span>
          <span>{cl.day} &nbsp;{cl.start_time}–{cl.end_time} &nbsp;·&nbsp; {cl.detail}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  ok:    { background: "#f0faf4", border: "1px solid #b7dfca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#1a6640", marginBottom: 20 },
  warn:  { background: "#fff5f5", border: "1px solid #f5c0c0", borderRadius: 10, padding: "14px 16px", marginBottom: 20 },
  title: { fontSize: 13, fontWeight: 700, color: "#a32d2d", marginBottom: 10, marginTop: 0 },
  item:  { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#a32d2d", marginBottom: 6 },
  tag:   (t) => ({ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: t === "room" ? "#fde8e8" : "#fef3e2", color: t === "room" ? "#a32d2d" : "#7a5000" }),
};