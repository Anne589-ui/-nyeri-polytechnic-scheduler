import React, { useState } from "react";
import {
  addRoom, deleteRoom, addInstructor, deleteInstructor,
  createUser, deleteUser, addCourse, deleteCourse
} from "../api";

export default function ManagePanel({ rooms, instructors, users, courses, role, onRefresh }) {
  const [roomName, setRoomName]     = useState("");
  const [roomCap, setRoomCap]       = useState("");
  const [instName, setInstName]     = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDur, setCourseDur]   = useState("2");
  const [newUser, setNewUser]       = useState({ username: "", full_name: "", role: "instructor", password: "" });
  const [msg, setMsg]               = useState({ text: "", ok: true });

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: "", ok: true }), 4000);
  };

  const handleAddCourse = async () => {
    if (!courseName.trim()) return flash("⚠ Please enter a course name.", false);
    try {
      await addCourse({ name: courseName.trim(), duration_hrs: +courseDur });
      setCourseName(""); setCourseDur("2");
      onRefresh();
      flash("✓ Course added successfully.");
    } catch (e) {
      flash("⚠ " + (e.response?.data?.detail ?? "Failed to add course. Check the backend is running."), false);
    }
  };

  const handleAddRoom = async () => {
    if (!roomName.trim()) return flash("⚠ Please enter a room name.", false);
    if (!roomCap)         return flash("⚠ Please enter a room capacity.", false);
    try {
      await addRoom({ name: roomName.trim(), capacity: +roomCap });
      setRoomName(""); setRoomCap("");
      onRefresh();
      flash("✓ Room added successfully.");
    } catch (e) {
      flash("⚠ " + (e.response?.data?.detail ?? "Failed to add room. Check the backend is running."), false);
    }
  };

  const handleAddInstructor = async () => {
    if (!instName.trim()) return flash("⚠ Please enter an instructor name.", false);
    try {
      await addInstructor({ name: instName.trim() });
      setInstName("");
      onRefresh();
      flash("✓ Instructor added successfully.");
    } catch (e) {
      flash("⚠ " + (e.response?.data?.detail ?? "Failed to add instructor. Check the backend is running."), false);
    }
  };

  const handleAddUser = async () => {
    const { username, full_name, password } = newUser;
    if (!username || !full_name || !password) return flash("⚠ Please fill in all user fields.", false);
    try {
      await createUser(newUser);
      setNewUser({ username: "", full_name: "", role: "instructor", password: "" });
      onRefresh();
      flash("✓ User created successfully.");
    } catch (e) {
      flash("⚠ " + (e.response?.data?.detail ?? "Failed to create user."), false);
    }
  };

  return (
    <div>
      {/* Flash message */}
      {msg.text && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13,
          background: msg.ok ? "#f0faf4" : "#fff5f5",
          border: `1px solid ${msg.ok ? "#b7dfca" : "#f5c0c0"}`,
          color: msg.ok ? "#1a6640" : "#a32d2d",
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* Courses */}
        <Section title="📚 Courses">
          <div style={styles.row}>
            <input
              style={styles.inp}
              placeholder="Course name e.g. Driving Theory"
              value={courseName}
              onChange={e => setCourseName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddCourse()}
            />
            <select
              style={{ ...styles.inp, flex: "0 0 90px" }}
              value={courseDur}
              onChange={e => setCourseDur(e.target.value)}
            >
              {[1,2,3,4,5,6].map(h => (
                <option key={h} value={h}>{h}hr{h > 1 ? "s" : ""}</option>
              ))}
            </select>
            <button style={styles.addBtn} onClick={handleAddCourse}>Add</button>
          </div>
          {courses.length === 0 && <p style={styles.empty}>No courses yet.</p>}
          {courses.map(c => (
            <div key={c.id} style={styles.listItem}>
              <span>{c.name} <small style={{ color: "#888" }}>{c.duration_hrs}hrs</small></span>
              <button style={styles.del} onClick={async () => {
                await deleteCourse(c.id); onRefresh(); flash("✓ Course deleted.");
              }}>✕</button>
            </div>
          ))}
        </Section>

        {/* Rooms */}
        <Section title="🚪 Rooms">
          <div style={styles.row}>
            <input
              style={styles.inp}
              placeholder="Room name e.g. Room D"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddRoom()}
            />
            <input
              style={{ ...styles.inp, flex: "0 0 70px" }}
              placeholder="Cap."
              type="number"
              min="1"
              value={roomCap}
              onChange={e => setRoomCap(e.target.value)}
            />
            <button style={styles.addBtn} onClick={handleAddRoom}>Add</button>
          </div>
          {rooms.length === 0 && <p style={styles.empty}>No rooms yet.</p>}
          {rooms.map(r => (
            <div key={r.id} style={styles.listItem}>
              <span>{r.name} <small style={{ color: "#888" }}>cap: {r.capacity}</small></span>
              <button style={styles.del} onClick={async () => {
                await deleteRoom(r.id); onRefresh(); flash("✓ Room deleted.");
              }}>✕</button>
            </div>
          ))}
        </Section>

        {/* Instructors */}
        <Section title="👤 Instructors">
          <div style={styles.row}>
            <input
              style={styles.inp}
              placeholder="Full name e.g. Mr. Mwangi"
              value={instName}
              onChange={e => setInstName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddInstructor()}
            />
            <button style={styles.addBtn} onClick={handleAddInstructor}>Add</button>
          </div>
          {instructors.length === 0 && <p style={styles.empty}>No instructors yet.</p>}
          {instructors.map(i => (
            <div key={i.id} style={styles.listItem}>
              <span>{i.name}</span>
              <button style={styles.del} onClick={async () => {
                await deleteInstructor(i.id); onRefresh(); flash("✓ Instructor deleted.");
              }}>✕</button>
            </div>
          ))}
        </Section>

        {/* Users — admin only */}
        {role === "admin" && (
          <Section title="👥 Users" full>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 10 }}>
              {[["username","Username"],["full_name","Full name"],["password","Password"]].map(([k, ph]) => (
                <input
                  key={k}
                  style={styles.inp}
                  placeholder={ph}
                  type={k === "password" ? "password" : "text"}
                  value={newUser[k]}
                  onChange={e => setNewUser(u => ({ ...u, [k]: e.target.value }))}
                />
              ))}
              <select
                style={styles.inp}
                value={newUser.role}
                onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
              >
                <option value="admin">Admin</option>
                <option value="deputy_principal">Deputy Principal</option>
                <option value="instructor">Instructor</option>
              </select>
              <button style={styles.addBtn} onClick={handleAddUser}>Add</button>
            </div>
            {users.length === 0 && <p style={styles.empty}>No users yet.</p>}
            {users.map(u => (
              <div key={u.id} style={styles.listItem}>
                <span>
                  {u.full_name}
                  <small style={{ color: "#888" }}> @{u.username} · {u.role.replace("_", " ")}</small>
                </span>
                <button style={styles.del} onClick={async () => {
                  await deleteUser(u.id); onRefresh(); flash("✓ User deleted.");
                }}>✕</button>
              </div>
            ))}
          </Section>
        )}

      </div>
    </div>
  );
}

function Section({ title, children, full }) {
  return (
    <div style={{ ...styles.section, gridColumn: full ? "1 / -1" : undefined }}>
      <p style={styles.sTitle}>{title}</p>
      {children}
    </div>
  );
}

const styles = {
  section:  { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "1rem 1.25rem" },
  sTitle:   { margin: "0 0 12px", fontSize: 13, fontWeight: 600 },
  row:      { display: "flex", gap: 8, marginBottom: 10, alignItems: "center" },
  inp:      { flex: 1, height: 36, padding: "0 10px", border: "1px solid #ddd", borderRadius: 7, fontSize: 13 },
  addBtn:   { height: 36, padding: "0 16px", background: "#085041", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid #f5f5f5", fontSize: 13 },
  del:      { background: "none", border: "none", color: "#c00", cursor: "pointer", fontSize: 15, padding: "2px 6px" },
  empty:    { fontSize: 12, color: "#aaa", margin: "6px 0" },
};