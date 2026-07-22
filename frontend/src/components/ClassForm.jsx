import React, { useState } from "react";
import { addClass } from "../api";

const DAYS  = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const TIMES = ["08:00","10:00","12:00","14:00","16:00"];

export default function ClassForm({ courses, rooms, instructors, onAdded }) {
  const [form, setForm] = useState({
    course: "", room_id: "", instructor_id: "",
    day: DAYS[0], start_time: "08:00", end_time: "10:00",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.course)        return setError("Select a course.");
    if (!form.room_id)       return setError("Select a room.");
    if (!form.instructor_id) return setError("Select an instructor.");
    if (form.start_time >= form.end_time) return setError("End time must be after start time.");
    setLoading(true); setError("");
    try {
      await addClass({ ...form, room_id: +form.room_id, instructor_id: +form.instructor_id });
      onAdded();
    } catch (e) {
      setError(e.response?.data?.detail ?? "Failed to add class.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <p style={styles.title}>Add a class</p>
      <div style={styles.grid}>
        <Field label="Course">
          <select style={styles.input} value={form.course} onChange={e => set("course", e.target.value)}>
            <option value="">Select course</option>
            {courses.map(c => <option key={c.id} value={c.name}>{c.name} ({c.duration_hrs}hrs)</option>)}
          </select>
        </Field>
        <Field label="Room">
          <select style={styles.input} value={form.room_id} onChange={e => set("room_id", e.target.value)}>
            <option value="">Select room</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (cap: {r.capacity})</option>)}
          </select>
        </Field>
        <Field label="Instructor">
          <select style={styles.input} value={form.instructor_id} onChange={e => set("instructor_id", e.target.value)}>
            <option value="">Select instructor</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </Field>
        <Field label="Day">
          <select style={styles.input} value={form.day} onChange={e => set("day", e.target.value)}>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Start time">
          <select style={styles.input} value={form.start_time} onChange={e => set("start_time", e.target.value)}>
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="End time">
          <select style={styles.input} value={form.end_time} onChange={e => set("end_time", e.target.value)}>
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      {error && <p style={styles.error}>⚠ {error}</p>}
      <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={submit} disabled={loading}>
        {loading ? "Adding…" : "+ Add class"}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  card:  { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "1.25rem", marginBottom: 24 },
  title: { fontSize: 14, fontWeight: 600, marginBottom: 14, marginTop: 0 },
  grid:  { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 },
  input: { width: "100%", height: 38, padding: "0 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13 },
  error: { fontSize: 12, color: "#c00", marginBottom: 10 },
  btn:   { height: 38, padding: "0 20px", background: "#085041", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" },
};