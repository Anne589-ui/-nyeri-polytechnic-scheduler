import React from "react";
import { deleteClass } from "../api";

const COURSE_COLORS = {
  "Driving Theory":    { bg: "#E6F1FB", color: "#0C447C" },
  "Plumbing":          { bg: "#E1F5EE", color: "#085041" },
  "Computer Literacy": { bg: "#EEEDFE", color: "#3C3489" },
};

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

export default function TimetableGrid({ classes, rooms, instructors, clashIds, canEdit, onRefresh }) {
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));
  const instMap = Object.fromEntries(instructors.map(i => [i.id, i]));

  const handleDelete = async (id) => {
    await deleteClass(id);
    onRefresh();
  };

  if (classes.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "1.5rem", textAlign: "center", color: "#999", fontSize: 14 }}>
        No classes scheduled yet. Use the form above to add one.
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Scheduled Classes</p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9f9f9" }}>
              {["Course","Room","Instructor","Day","Start","End", canEdit ? "Remove" : ""].map((h, i) => (
                <th key={i} style={{ padding: "10px 14px", textAlign: "left", borderBottom: "1px solid #eee", fontWeight: 500, color: "#555", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map(c => {
              const clash = clashIds.has(c.id);
              const col = COURSE_COLORS[c.course] ?? { bg: "#f5f5f5", color: "#333" };
              return (
                <tr key={c.id} style={{ background: clash ? "#fff5f5" : "transparent" }}>
                  <td style={styles.td}>
                    <span style={{ background: col.bg, color: col.color, padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                      {c.course}
                    </span>
                  </td>
                  <td style={styles.td}>{roomMap[c.room_id]?.name ?? `Room #${c.room_id}`}</td>
                  <td style={styles.td}>{instMap[c.instructor_id]?.name ?? `Instructor #${c.instructor_id}`}</td>
                  <td style={styles.td}>{c.day}</td>
                  <td style={styles.td}>{c.start_time}</td>
                  <td style={{ ...styles.td, color: clash ? "#c00" : "inherit" }}>
                    {c.end_time} {clash && "⚠"}
                  </td>
                  {canEdit && (
                    <td style={styles.td}>
                      <button onClick={() => handleDelete(c.id)} style={styles.del}>✕</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  td:  { padding: "10px 14px", borderBottom: "1px solid #f5f5f5", color: "#444" },
  del: { background: "none", border: "none", color: "#c00", cursor: "pointer", fontSize: 15, padding: "2px 6px" },
};