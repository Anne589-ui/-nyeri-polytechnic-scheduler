import React, { useState } from "react";
import { login } from "../api";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return setError("Please enter username and password.");
    setLoading(true);
    setError("");
    try {
      const data = await login(username, password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("full_name", data.full_name);
      onLogin({ role: data.role, full_name: data.full_name });
    } catch (e) {
      setError(e.response?.data?.detail ?? "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logo}>🏫</div>
          <h1 style={styles.h1}>Nyeri Polytechnic</h1>
          <p style={styles.sub}>Scheduling Engine · Sign In</p>
        </div>

        <div style={styles.roleBadges}>
          {[["admin","#3C3489"],["deputy_principal","#085041"],["instructor","#0C447C"]].map(([r, c]) => (
            <span key={r} style={{ ...styles.badge, background: c + "22", color: c }}>
              {r.replace("_", " ")}
            </span>
          ))}
        </div>

        <label style={styles.label}>Username</label>
        <input
          style={styles.input}
          placeholder="e.g. deputy"
          value={username}
          autoFocus
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />

        {error && <p style={styles.error}>⚠ {error}</p>}

        <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

      </div>
    </div>
  );
}

const styles = {
  page:      { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f5f7" },
  card:      { background: "#fff", borderRadius: 16, padding: "2.5rem 2rem", width: 380, boxShadow: "0 4px 24px rgba(0,0,0,.1)" },
  logoWrap:  { textAlign: "center", marginBottom: 20 },
  logo:      { fontSize: 36, marginBottom: 8 },
  h1:        { fontSize: 20, fontWeight: 700, margin: 0 },
  sub:       { fontSize: 13, color: "#888", margin: "4px 0 0" },
  roleBadges:{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 },
  badge:     { fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500 },
  label:     { fontSize: 12, color: "#555", display: "block", marginBottom: 5 },
  input:     { width: "100%", height: 42, padding: "0 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, marginBottom: 14 },
  error:     { fontSize: 12, color: "#c00", marginBottom: 10 },
  btn:       { width: "100%", height: 44, background: "#085041", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4 },
  hint:      { marginTop: 20, background: "#f7f7f7", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#666", lineHeight: 1.8 },
};