import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import api from "../utils/api";
import toast from "react-hot-toast";

const LINKS = [
  { to: "/teacher", icon: "🏠", label: "Dashboard" },
  { to: "/teacher/courses", icon: "📚", label: "My Courses" },
  { to: "/teacher/create", icon: "➕", label: "Create Session" },
  { to: "/teacher/sessions", icon: "📋", label: "My Sessions" },
  { to: "/profile", icon: "👤", label: "Profile" },
];

// ── My Courses ───────────────────────────────────────────────────────────────
function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [report, setReport] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/courses/my").then(({ data }) => setCourses(data)).finally(() => setLoading(false));
  }, []);

  const viewReport = async (course) => {
    setSelectedCourse(course);
    setReport(null);
    try {
      const { data } = await api.get(`/courses/${course._id}/attendance`);
      setReport(data);
    } catch { toast.error("Failed to load report"); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-primary" /></div>;

  return (
    <div>
      <div className="page-header"><h1>My Courses</h1><p>{courses.length} courses assigned to you</p></div>

      {/* Attendance Report Panel */}
      {report && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>📊 {report.course.name} ({report.course.code}) — Attendance Report</strong>
            <button className="btn btn-outline btn-sm" onClick={() => setReport(null)}>✕ Close</button>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: 16, color: "var(--text-muted)", fontSize: 14 }}>
              Total sessions held: <strong>{report.totalSessions}</strong>
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Student</th><th>Email</th><th>Attended</th><th>Total</th><th>%</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {report.studentSummary.map((s) => (
                    <tr key={s.student._id}>
                      <td>{s.student.name}</td>
                      <td>{s.student.email}</td>
                      <td>{s.attended}</td>
                      <td>{s.totalSessions}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: "var(--border)", borderRadius: 3 }}>
                            <div style={{ width: `${s.percentage}%`, height: "100%", background: s.belowThreshold ? "var(--danger)" : "var(--success)", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{s.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        {s.belowThreshold
                          ? <span className="badge badge-danger">⚠ Below 75%</span>
                          : <span className="badge badge-success">✅ Good</span>}
                      </td>
                    </tr>
                  ))}
                  {!report.studentSummary.length && (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No students enrolled</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <p>No courses assigned yet. Ask your admin to assign courses to you.</p>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {courses.map((c) => (
            <div className="card" key={c._id}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{c.name}</h3>
                    <span className="badge badge-purple">{c.code}</span>
                    {c.department && <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{c.department}</span>}
                  </div>
                  <span className="badge badge-info">{c.semester} {c.academicYear}</span>
                </div>

                {/* Schedule */}
                {c.schedule?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Schedule</div>
                    {c.schedule.map((s, i) => (
                      <div key={i} style={{ fontSize: 13, color: "var(--text)", marginBottom: 3 }}>
                        📅 {s.day} at {s.time}{s.room ? ` · ${s.room}` : ""}
                      </div>
                    ))}
                  </div>
                )}

                {/* Students count */}
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                  👥 {c.students?.length || 0} students enrolled
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/teacher/create?courseId=${c._id}&subject=${encodeURIComponent(c.name)}`)}
                  >
                    ➕ Start Attendance
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => viewReport(c)}>
                    📊 Report
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create Session ───────────────────────────────────────────────────────────
function CreateSession() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ subject: "", radiusMeters: 100, durationMinutes: 15, courseId: "" });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/courses/my").then(({ data }) => setCourses(data));
    // Pre-fill from query params if coming from course card
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("courseId");
    const subject = params.get("subject");
    if (courseId || subject) {
      setForm((f) => ({ ...f, courseId: courseId || "", subject: subject || "" }));
    }
  }, []);

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
        toast.success("Location captured!");
      },
      () => { setLocating(false); toast.error("Could not get location. Please allow access."); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) return toast.error("Please capture your location first");
    setLoading(true);
    try {
      const payload = { ...form, ...location };
      if (!payload.courseId) delete payload.courseId;
      const { data } = await api.post("/qr/create", payload);
      setResult(data);
      toast.success("Session created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Create Session</h1>
        <p>Generate a QR code for students to mark attendance</p>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Link to Course (optional)</label>
                <select className="form-input form-select" value={form.courseId} onChange={(e) => {
                  const course = courses.find((c) => c._id === e.target.value);
                  setForm({ ...form, courseId: e.target.value, subject: course ? course.name : form.subject });
                }}>
                  <option value="">No course (standalone session)</option>
                  {courses.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject / Session Name</label>
                <input className="form-input" placeholder="e.g. Data Structures - Lecture 12" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Radius (metres)</label>
                <input className="form-input" type="number" min={10} max={1000} value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: +e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <select className="form-input form-select" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })}>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Your Location</label>
                {location ? (
                  <div style={{ padding: "10px 14px", background: "#dcfce7", borderRadius: 8, fontSize: 13, color: "#166534" }}>
                    ✅ Lat: {location.latitude.toFixed(5)}, Lng: {location.longitude.toFixed(5)}
                    <button type="button" style={{ marginLeft: 12, background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 12 }} onClick={() => setLocation(null)}>Re-capture</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-outline btn-full" onClick={getLocation} disabled={locating}>
                    {locating ? <><span className="spinner spinner-primary" /> Locating...</> : "📍 Capture My Location"}
                  </button>
                )}
              </div>
              <button className="btn btn-primary btn-full btn-lg" disabled={loading || !location}>
                {loading ? <span className="spinner" /> : "Generate QR Code"}
              </button>
            </form>
          </div>
        </div>

        {result && (
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: 4, fontWeight: 600 }}>QR Code Ready</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>{result.subject}</p>
              <div className="qr-container">
                <img src={result.qrCodeUrl} alt="QR Code" className="qr-img" style={{ width: 220, height: 220 }} />
                <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                  Expires at {new Date(result.expiresAt).toLocaleTimeString()}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => { const a = document.createElement("a"); a.href = result.qrCodeUrl; a.download = "qr.png"; a.click(); }}>
                    ⬇ Download
                  </button>
                  <button className="btn btn-outline" onClick={() => setResult(null)}>New Session</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sessions List ────────────────────────────────────────────────────────────
function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [qrSession, setQrSession] = useState(null);

  useEffect(() => {
    api.get("/qr/sessions").then(({ data }) => setSessions(data)).finally(() => setLoading(false));
  }, []);

  const deactivate = async (id) => {
    try {
      await api.patch(`/qr/sessions/${id}/deactivate`);
      setSessions((prev) => prev.map((s) => (s._id === id ? { ...s, isActive: false } : s)));
      toast.success("Session deactivated");
    } catch { toast.error("Failed to deactivate"); }
  };

  const viewAttendance = async (session) => {
    setSelectedSession(session);
    setAttendance(null);
    try {
      const { data } = await api.get(`/attendance/session/${session._id}`);
      setAttendance(data);
    } catch { toast.error("Failed to load attendance"); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-primary" /></div>;

  return (
    <div>
      <div className="page-header"><h1>My Sessions</h1><p>{sessions.length} sessions created</p></div>

      {qrSession && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>QR Code — {qrSession.subject}</strong>
            <button className="btn btn-outline btn-sm" onClick={() => setQrSession(null)}>✕ Close</button>
          </div>
          <div className="card-body">
            <div className="qr-container">
              {qrSession.qrCodeUrl ? (
                <>
                  <img src={qrSession.qrCodeUrl} alt="QR Code" className="qr-img" style={{ width: 220, height: 220 }} />
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Expires: {new Date(qrSession.expiresAt).toLocaleTimeString()}</div>
                  <span className={`badge badge-${qrSession.isActive && new Date(qrSession.expiresAt) > new Date() ? "success" : "danger"}`}>
                    {qrSession.isActive && new Date(qrSession.expiresAt) > new Date() ? "Active" : "Expired"}
                  </span>
                  <button className="btn btn-secondary" onClick={() => { const a = document.createElement("a"); a.href = qrSession.qrCodeUrl; a.download = `qr-${qrSession.subject}.png`; a.click(); }}>
                    ⬇ Download QR
                  </button>
                </>
              ) : (
                <p style={{ color: "var(--text-muted)" }}>QR not available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {attendance && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Attendance — {selectedSession?.subject}</strong>
            <button className="btn btn-outline btn-sm" onClick={() => setAttendance(null)}>✕ Close</button>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <span className="badge badge-success">Present: {attendance.present}</span>
              <span className="badge badge-danger">Rejected: {attendance.rejected}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Email</th><th>Distance</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {attendance.records.map((r) => (
                    <tr key={r._id}>
                      <td>{r.student?.name}</td>
                      <td>{r.student?.email}</td>
                      <td>{r.distance}m</td>
                      <td><span className={`badge badge-${r.status === "present" ? "success" : "danger"}`}>{r.status}</span></td>
                      <td>{new Date(r.markedAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                  {!attendance.records.length && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No records yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>Course</th><th>Radius</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.subject}</strong></td>
                  <td>{s.course ? <span className="badge badge-purple">{s.course.code}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td>{s.radiusMeters}m</td>
                  <td>{new Date(s.expiresAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${s.isActive && new Date(s.expiresAt) > new Date() ? "success" : "danger"}`}>
                      {s.isActive && new Date(s.expiresAt) > new Date() ? "Active" : "Expired"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => viewAttendance(s)}>📊</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setQrSession(s)}>🔲 QR</button>
                    {s.isActive && new Date(s.expiresAt) > new Date() && (
                      <button className="btn btn-danger btn-sm" onClick={() => deactivate(s._id)}>End</button>
                    )}
                  </td>
                </tr>
              ))}
              {!sessions.length && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No sessions yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Teacher Home ─────────────────────────────────────────────────────────────
function TeacherHome() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get("/courses/my"), api.get("/qr/sessions")])
      .then(([c, s]) => { setCourses(c.data); setSessions(s.data.slice(0, 5)); });
  }, []);

  const active = sessions.filter((s) => s.isActive && new Date(s.expiresAt) > new Date()).length;

  return (
    <div>
      <div className="page-header"><h1>Teacher Dashboard</h1><p>Manage your courses and attendance</p></div>
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: "My Courses", value: courses.length, icon: "📚", color: "#ede9fe" },
          { label: "Total Sessions", value: sessions.length, icon: "📋", color: "#dbeafe" },
          { label: "Active Now", value: active, icon: "🟢", color: "#dcfce7" },
          { label: "Expired", value: sessions.length - active, icon: "🔴", color: "#fee2e2" },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <button className="btn btn-primary" onClick={() => navigate("/teacher/courses")}>📚 My Courses</button>
        <button className="btn btn-secondary" onClick={() => navigate("/teacher/create")}>➕ New Session</button>
        <button className="btn btn-outline" onClick={() => navigate("/teacher/sessions")}>📋 All Sessions</button>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <div className="layout">
      <Sidebar links={LINKS} />
      <main className="main-content">
        <Routes>
          <Route index element={<TeacherHome />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="create" element={<CreateSession />} />
          <Route path="sessions" element={<Sessions />} />
        </Routes>
      </main>
    </div>
  );
}
