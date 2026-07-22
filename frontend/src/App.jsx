import AutoScheduler from "./components/AutoScheduler";
import React, { useEffect, useState } from "react";
import {
  getRooms, getInstructors, getClasses,
  getClashes, getUsers, getCourses
} from "./api";
import LoginPage     from "./components/LoginPage";
import ClashReport   from "./components/ClashReport";
import ClassForm     from "./components/ClassForm";
import TimetableGrid from "./components/TimetableGrid";
import ManagePanel   from "./components/ManagePanel";
import ExportPDF     from "./components/ExportPDF";

const ROLE_LABELS = {
  admin: "Administrator",
  deputy_principal: "Deputy Principal",
  instructor: "Instructor",
};
const ROLE_COLORS = {
  admin: "#3C3489",
  deputy_principal: "#085041",
  instructor: "#0C447C",
};
const TABS = ["Timetable", "Manage"];

export default function App() {
  const [user, setUser] = useState(() => {
    const role      = localStorage.getItem("role");
    const full_name = localStorage.getItem("full_name");
    return role ? { role, full_name } : null;
  });

  const [tab, setTab]               = useState("Timetable");
  const [rooms, setRooms]           = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses]       = useState([]);
  const [classes, setClasses]       = useState([]);
  const [clashes, setClashes]       = useState([]);
  const [users, setUsers]           = useState([]);

  const refresh = async () => {
    const [r, i, c, cl, co] = await Promise.all([
      getRooms(), getInstructors(), getClasses(), getClashes(), getCourses()
    ]);
    setRooms(r); setInstructors(i); setClasses(c); setClashes(cl); setCourses(co);
    if (user?.role === "admin") {
      const u = await getUsers();
      setUsers(u);
    }
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  const logout = () => { localStorage.clear(); setUser(null); };

  const canEdit  = user && ["admin", "deputy_principal"].includes(user.role);
  const clashIds = new Set(clashes.flatMap(c => c.class_ids));

  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7" }}>

      {/* Nav bar */}
      <div style={styles.nav}>
        <div style={styles.navLeft}>
          <span style={{ fontSize: 26 }}>🏫</span>
          <div>
            <div style={styles.navTitle}>Nyeri Polytechnic</div>
            <div style={styles.navSub}>Scheduling Engine</div>
          </div>
        </div>
        <div style={styles.navRight}>
          <div style={{ textAlign: "right", marginRight: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user.full_name}</div>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 12, fontWeight: 500,
              background: ROLE_COLORS[user.role] + "22", color: ROLE_COLORS[user.role]
            }}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>Sign out</button>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>

        {/* Read-only banner */}
        {!canEdit && (
          <div style={styles.banner}>
            👁 You are viewing as <strong>Instructor</strong> — read-only access.
          </div>
        )}

        {/* Tabs */}
        {canEdit && (
          <div style={styles.tabs}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}>
                {t}
              </button>
            ))}
          </div>
        )}

        <ClashReport clashes={clashes} />

        {(!canEdit || tab === "Timetable") && (
  <>
    {canEdit && (
      <AutoScheduler onGenerated={refresh} />
    )}
    {canEdit && (
      <ClassForm
        courses={courses}
        rooms={rooms}
        instructors={instructors}
        onAdded={refresh}
      />
    )}

            {/* Timetable header with PDF button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                Scheduled Classes ({classes.length})
              </p>
              <ExportPDF classes={classes} rooms={rooms} instructors={instructors} />
            </div>

            <TimetableGrid
              classes={classes}
              rooms={rooms}
              instructors={instructors}
              clashIds={clashIds}
              canEdit={canEdit}
              onRefresh={refresh}
            />
          </>
        )}

        {canEdit && tab === "Manage" && (
          <ManagePanel
            rooms={rooms}
            instructors={instructors}
            users={users}
            courses={courses}
            role={user.role}
            onRefresh={refresh}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  nav:       { background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "0 2rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLeft:   { display: "flex", alignItems: "center", gap: 12 },
  navTitle:  { fontSize: 15, fontWeight: 700 },
  navSub:    { fontSize: 11, color: "#888" },
  navRight:  { display: "flex", alignItems: "center" },
  logoutBtn: { height: 34, padding: "0 14px", border: "1px solid #ddd", borderRadius: 7, fontSize: 13, cursor: "pointer", background: "transparent", marginLeft: 12 },
  body:      { maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem" },
  banner:    { background: "#fffbe6", border: "1px solid #ffe066", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#7a5c00", marginBottom: 20 },
  tabs:      { display: "flex", gap: 4, marginBottom: 20 },
  tab:       { height: 36, padding: "0 18px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, cursor: "pointer", background: "transparent", color: "#555" },
  tabActive: { background: "#085041", color: "#fff", border: "1px solid #085041" },
};