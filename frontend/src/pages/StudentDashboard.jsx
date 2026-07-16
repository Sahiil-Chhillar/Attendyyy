import { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import api from "../utils/api";
import toast from "react-hot-toast";
import jsQR from "jsqr";

const LINKS = [
  { to: "/student", icon: "🏠", label: "Dashboard" },
  { to: "/student/courses", icon: "📚", label: "My Courses" },
  { to: "/student/scan", icon: "📷", label: "Scan QR" },
  { to: "/student/history", icon: "📅", label: "Attendance" },
  { to: "/profile", icon: "👤", label: "Profile" },
];

// ── Enrolled Courses ─────────────────────────────────────────────────────────
function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get("/courses/enrolled").then(({ data }) => setCourses(data)).finally(() => setLoading(false));
  }, []);

  const viewMyAttendance = async (course) => {
    setSelectedCourse(course);
    setReport(null);
    try {
      const { data } = await api.get(`/courses/${course._id}/attendance`);
      setReport(data);
    } catch { toast.error("Failed to load attendance"); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-primary" /></div>;

  return (
    <div>
      <div className="page-header"><h1>My Courses</h1><p>{courses.length} courses enrolled</p></div>

      {report && selectedCourse && (() => {
        const me = report.studentSummary.find((s) => s.student._id);
        return (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>📊 My Attendance — {report.course.name}</strong>
              <button className="btn btn-outline btn-sm" onClick={() => setReport(null)}>✕ Close</button>
            </div>
            <div className="card-body">
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
                Total sessions held: <strong>{report.totalSessions}</strong>
              </p>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Attended</th><th>Total</th><th>%</th><th>Status</th></tr></thead>
                  <tbody>
                    {report.studentSummary.map((s) => (
                      <tr key={s.student._id} style={{ background: s.student._id === s.student._id ? "#fafafa" : "transparent" }}>
                        <td>{s.student.name}</td>
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
                        <td>{s.belowThreshold ? <span className="badge badge-danger">⚠ Below 75%</span> : <span className="badge badge-success">✅ Good</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {courses.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <p>You are not enrolled in any courses yet. Contact your admin.</p>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {courses.map((c) => (
            <div className="card" key={c._id}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{c.name}</h3>
                    <span className="badge badge-purple">{c.code}</span>
                    {c.department && <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{c.department}</span>}
                  </div>
                  <span className="badge badge-info">{c.semester} {c.academicYear}</span>
                </div>

                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                  👩‍🏫 {c.teacher?.name}
                </div>

                {c.schedule?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {c.schedule.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        📅 {s.day} at {s.time}{s.room ? ` · ${s.room}` : ""}
                      </div>
                    ))}
                  </div>
                )}

                <button className="btn btn-secondary btn-sm" onClick={() => viewMyAttendance(c)}>
                  📊 View My Attendance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── QR Scanner ───────────────────────────────────────────────────────────────
function ScanQR() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setScanning(true);
      intervalRef.current = setInterval(scanFrame, 300);
    } catch { toast.error("Camera access denied"); }
  };

  const stopCamera = () => {
    clearInterval(intervalRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    setScanning(false);
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) { stopCamera(); handleQRData(code.data); }
  };

  const handleQRData = (rawData) => {
    try {
      const { qrToken } = JSON.parse(rawData);
      markAttendance(qrToken);
    } catch { toast.error("Invalid QR code"); }
  };

  const markAttendance = (qrToken) => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await api.post("/attendance/mark", {
            qrToken,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setResult({ success: true, ...data });
          toast.success("Attendance marked!");
        } catch (err) {
          setResult({ success: false, message: err.response?.data?.message });
          toast.error(err.response?.data?.message || "Failed");
        } finally { setLoading(false); }
      },
      () => { toast.error("Location access required"); setLoading(false); }
    );
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div>
      <div className="page-header"><h1>Scan QR Code</h1><p>Point your camera at the teacher's QR code to mark attendance</p></div>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        {result ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>{result.success ? "✅" : "❌"}</div>
              <h3 style={{ marginBottom: 8 }}>{result.success ? "Attendance Marked!" : "Failed"}</h3>
              {result.subject && <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>Subject: <strong>{result.subject}</strong></p>}
              {result.distance != null && <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>Distance: {result.distance}m from class</p>}
              {!result.success && <p style={{ color: "var(--danger)", marginBottom: 16 }}>{result.message}</p>}
              <button className="btn btn-primary" onClick={() => setResult(null)}>Scan Again</button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div style={{ position: "relative", background: "#000", borderRadius: 8, overflow: "hidden", minHeight: 280 }}>
                <video ref={videoRef} style={{ width: "100%", display: "block" }} playsInline muted />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                {!scanning && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0005" }}>
                    <span style={{ color: "#fff", fontSize: 48 }}>📷</span>
                  </div>
                )}
                {scanning && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 180, height: 180, border: "3px solid var(--primary)", borderRadius: 8 }} />
                )}
              </div>
              <div style={{ marginTop: 20 }}>
                {loading ? (
                  <div style={{ textAlign: "center" }}>
                    <span className="spinner spinner-primary" />
                    <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>Marking attendance...</p>
                  </div>
                ) : scanning ? (
                  <button className="btn btn-danger btn-full" onClick={stopCamera}>Stop Camera</button>
                ) : (
                  <button className="btn btn-primary btn-full btn-lg" onClick={startCamera}>📷 Start Scanning</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Attendance History ────────────────────────────────────────────────────────
function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/attendance/my").then(({ data }) => setRecords(data)).finally(() => setLoading(false));
  }, []);

  const present = records.filter((r) => r.status === "present").length;

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-primary" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Attendance History</h1><p>{records.length} total records</p></div>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dcfce7" }}>✅</div>
          <div className="stat-value">{present}</div>
          <div className="stat-label">Present</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fee2e2" }}>❌</div>
          <div className="stat-value">{records.length - present}</div>
          <div className="stat-label">Rejected / Missed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dbeafe" }}>📊</div>
          <div className="stat-value">{records.length ? Math.round((present / records.length) * 100) : 0}%</div>
          <div className="stat-label">Overall Rate</div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>Teacher</th><th>Distance</th><th>Status</th><th>Date/Time</th></tr></thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.session?.subject}</strong></td>
                  <td>{r.session?.teacher?.name}</td>
                  <td>{r.distance}m</td>
                  <td><span className={`badge badge-${r.status === "present" ? "success" : "danger"}`}>{r.status}</span></td>
                  <td>{new Date(r.markedAt).toLocaleString()}</td>
                </tr>
              ))}
              {!records.length && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No attendance records yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Student Home ─────────────────────────────────────────────────────────────
function StudentHome() {
  const [courses, setCourses] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/courses/enrolled"), api.get("/attendance/my")])
      .then(([c, r]) => { setCourses(c.data); setRecords(r.data); });
  }, []);

  const present = records.filter((r) => r.status === "present").length;

  return (
    <div>
      <div className="page-header"><h1>Student Dashboard</h1><p>Your courses and attendance overview</p></div>
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: "Enrolled Courses", value: courses.length, icon: "📚", color: "#ede9fe" },
          { label: "Total Classes", value: records.length, icon: "📅", color: "#dbeafe" },
          { label: "Present", value: present, icon: "✅", color: "#dcfce7" },
          { label: "Attendance %", value: `${records.length ? Math.round((present / records.length) * 100) : 0}%`, icon: "📊", color: "#fef3c7" },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent courses */}
      {courses.length > 0 && (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>My Courses</h2>
          <div className="grid-2" style={{ marginBottom: 24 }}>
            {courses.slice(0, 4).map((c) => (
              <div className="card" key={c._id}>
                <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                    <span className="badge badge-purple">{c.code}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>👩‍🏫 {c.teacher?.name}</span>
                  </div>
                  <span className="badge badge-info">{c.semester}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <div className="layout">
      <Sidebar links={LINKS} />
      <main className="main-content">
        <Routes>
          <Route index element={<StudentHome />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="scan" element={<ScanQR />} />
          <Route path="history" element={<AttendanceHistory />} />
        </Routes>
      </main>
    </div>
  );
}
