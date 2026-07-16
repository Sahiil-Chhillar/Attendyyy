import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import api from "../utils/api";
import toast from "react-hot-toast";

const LINKS = [
  { to: "/admin", icon: "🏠", label: "Dashboard" },
  { to: "/admin/users", icon: "👥", label: "Users" },
  { to: "/admin/courses", icon: "📚", label: "Courses" },
  { to: "/admin/sessions", icon: "📋", label: "Sessions" },
  { to: "/profile", icon: "👤", label: "Profile" },
];

// ── Stats Home ───────────────────────────────────────────────────────────────
function AdminHome() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then(({ data }) => setStats(data)); }, []);
  if (!stats) return <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-primary" /></div>;
  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "#ede9fe" },
    { label: "Students", value: stats.students, icon: "🎓", color: "#dbeafe" },
    { label: "Teachers", value: stats.teachers, icon: "👩‍🏫", color: "#fef3c7" },
    { label: "Courses", value: stats.totalCourses, icon: "📚", color: "#dcfce7" },
    { label: "Sessions", value: stats.totalSessions, icon: "📋", color: "#f0fdf4" },
    { label: "Present", value: stats.totalPresent, icon: "✅", color: "#dcfce7" },
    { label: "Rejected", value: stats.totalRejected, icon: "❌", color: "#fee2e2" },
  ];
  return (
    <div>
      <div className="page-header"><h1>Admin Dashboard</h1><p>University attendance system overview</p></div>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-icon" style={{ background: c.color }}>{c.icon}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users (Teachers + Students tabs) ─────────────────────────────────────────
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("teachers"); // "teachers" | "students"
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/admin/users").then(({ data }) => setUsers(data)).finally(() => setLoading(false));
  }, []);

  const changeRole = async (id, role) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === id ? data : u)));
      toast.success("Role updated");
    } catch { toast.error("Failed"); }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User deleted");
    } catch { toast.error("Failed"); }
  };

  const teachers = users.filter((u) => u.role === "teacher" && (
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ));
  const students = users.filter((u) => u.role === "student" && (
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ));

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-primary" /></div>;

  const TabBtn = ({ value, label, count }) => (
    <button
      onClick={() => setTab(value)}
      style={{
        padding: "10px 24px",
        border: "none",
        borderBottom: tab === value ? "2.5px solid var(--primary)" : "2.5px solid transparent",
        background: "none",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: tab === value ? 600 : 400,
        color: tab === value ? "var(--primary)" : "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {label}
      <span style={{ padding: "2px 8px", background: tab === value ? "var(--primary-light)" : "var(--bg)", borderRadius: 999, fontSize: 12, fontWeight: 600, color: tab === value ? "var(--primary)" : "var(--text-muted)" }}>
        {count}
      </span>
    </button>
  );

  const UserTable = ({ list, showProficiency }) => (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            {showProficiency && <th>Proficiency</th>}
            <th>Role</th>
            <th>Verified</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((u) => (
            <tr key={u._id}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {u.avatar
                    ? <img src={u.avatar} alt="" className="avatar" style={{ width: 34, height: 34 }} />
                    : <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{u.name[0]}</div>}
                  <span style={{ fontWeight: 500 }}>{u.name}</span>
                </div>
              </td>
              <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{u.email}</td>
              {showProficiency && (
                <td>
                  {u.proficiency?.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {u.proficiency.map((p) => (
                        <span key={p} style={{ padding: "2px 8px", background: "var(--primary-light)", color: "var(--primary-dark)", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
              )}
              <td>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u._id, e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontFamily: "inherit" }}
                >
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td><span className={`badge badge-${u.isVerified ? "success" : "warning"}`}>{u.isVerified ? "Yes" : "No"}</span></td>
              <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td><button className="btn btn-danger btn-sm" onClick={() => deleteUser(u._id)}>Delete</button></td>
            </tr>
          ))}
          {!list.length && (
            <tr><td colSpan={showProficiency ? 7 : 6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No {tab} found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="page-header"><h1>Users</h1><p>{users.length} registered users</p></div>

      <div style={{ marginBottom: 16 }}>
        <input
          className="form-input"
          style={{ maxWidth: 300 }}
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", paddingLeft: 8 }}>
          <TabBtn value="teachers" label="👩‍🏫 Teachers" count={teachers.length} />
          <TabBtn value="students" label="🎓 Students" count={students.length} />
        </div>

        {tab === "teachers" && (
          <div>
            <div style={{ padding: "12px 20px", background: "#fafbff", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
              💡 Teachers can add subject proficiency from their Profile page. It helps you assign the right teacher to each course.
            </div>
            <UserTable list={teachers} showProficiency={true} />
          </div>
        )}

        {tab === "students" && (
          <UserTable list={students} showProficiency={false} />
        )}
      </div>
    </div>
  );
}

// ── Courses ──────────────────────────────────────────────────────────────────
function Courses() {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", department: "", academicYear: "2024-25", semester: "Odd", teacherId: "", studentIds: [], schedule: [] });
  const [scheduleRow, setScheduleRow] = useState({ day: "Monday", time: "09:00", room: "" });
  const [saving, setSaving] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    Promise.all([api.get("/courses"), api.get("/admin/users")])
      .then(([c, u]) => {
        setCourses(c.data);
        setUsers(u.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "student");

  const selectedTeacher = teachers.find((t) => t._id === form.teacherId);

  const filteredTeachers = teachers.filter((t) => {
    if (!teacherSearch.trim()) return true; // show all when empty
    const q = teacherSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (Array.isArray(t.proficiency) &&
        t.proficiency.some((p) => p.toLowerCase().includes(q)))
    );
  });

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const resetForm = () => {
    setForm({ name: "", code: "", department: "", academicYear: "2024-25", semester: "Odd", teacherId: "", studentIds: [], schedule: [] });
    setScheduleRow({ day: "Monday", time: "09:00", room: "" });
    setEditCourse(null);
    setShowForm(false);
    setTeacherSearch("");
    setStudentSearch("");
  };

  const openEdit = (course) => {
    setEditCourse(course);
    setForm({
      name: course.name, code: course.code, department: course.department || "",
      academicYear: course.academicYear, semester: course.semester,
      teacherId: course.teacher?._id || "",
      studentIds: course.students.map((s) => s._id),
      schedule: course.schedule || [],
    });
    setShowForm(true);
  };

  const addScheduleRow = () => {
    setForm((f) => ({ ...f, schedule: [...f.schedule, { ...scheduleRow }] }));
    setScheduleRow({ day: "Monday", time: "09:00", room: "" });
  };

  const toggleStudent = (id) => {
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id)
        ? f.studentIds.filter((s) => s !== id)
        : [...f.studentIds, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.teacherId) return toast.error("Please select a teacher");
    setSaving(true);
    try {
      if (editCourse) {
        const { data } = await api.put(`/courses/${editCourse._id}`, form);
        setCourses((prev) => prev.map((c) => (c._id === editCourse._id ? data : c)));
        toast.success("Course updated!");
      } else {
        const { data } = await api.post("/courses", form);
        setCourses((prev) => [data, ...prev]);
        toast.success("Course created!");
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const deleteCourse = async (id) => {
    if (!confirm("Delete this course?")) return;
    try {
      await api.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c._id !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const viewAttendance = async (course) => {
    try {
      const { data } = await api.get(`/courses/${course._id}/attendance`);
      setAttendanceReport(data);
    } catch { toast.error("Failed to load report"); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-primary" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><h1>Courses</h1><p>{courses.length} courses scheduled</p></div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>➕ New Course</button>
      </div>

      {/* Course Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{editCourse ? "Edit Course" : "Create New Course"}</strong>
            <button className="btn btn-outline btn-sm" onClick={resetForm}>✕ Cancel</button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Basic info */}
              <div className="grid-2" style={{ marginBottom: 4 }}>
                <div className="form-group">
                  <label className="form-label">Course Name</label>
                  <input className="form-input" placeholder="e.g. Data Structures" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Code</label>
                  <input className="form-input" placeholder="e.g. CS301" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" placeholder="e.g. Computer Science" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input className="form-input" placeholder="e.g. 2024-25" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-input form-select" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                    <option value="Odd">Odd</option>
                    <option value="Even">Even</option>
                  </select>
                </div>
              </div>

              {/* Teacher picker with proficiency */}
              <div className="form-group">
                <label className="form-label">Assign Teacher</label>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Search by name or subject proficiency</p>
                <input
                  className="form-input"
                  placeholder="Search teacher name or subject (e.g. 'DBMS')..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  style={{ marginBottom: 10 }}
                />
                <div style={{ maxHeight: 220, overflowY: "auto", border: "1.5px solid var(--border)", borderRadius: 8 }}>
                  {filteredTeachers.length === 0 && (
                    <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>No teachers found</div>
                  )}
                  {filteredTeachers.map((t) => (
                    <label
                      key={t._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                        background: form.teacherId === t._id ? "#f5f3ff" : "transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      <input
                        type="radio"
                        name="teacher"
                        checked={form.teacherId === t._id}
                        onChange={() => setForm({ ...form, teacherId: t._id })}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {t.avatar
                            ? <img src={t.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                            : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{t.name[0]}</div>}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.email}</div>
                          </div>
                        </div>
                        {t.proficiency?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6, paddingLeft: 36 }}>
                            {t.proficiency.map((p) => (
                              <span key={p} style={{ padding: "2px 8px", background: "var(--primary-light)", color: "var(--primary-dark)", borderRadius: 999, fontSize: 11, fontWeight: 500 }}>
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {form.teacherId === t._id && <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: 16 }}>✓</span>}
                    </label>
                  ))}
                </div>
                {selectedTeacher && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--success)", fontWeight: 500 }}>
                    ✅ Selected: {selectedTeacher.name}
                    {selectedTeacher.proficiency?.length > 0 && ` · Expert in: ${selectedTeacher.proficiency.join(", ")}`}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Class Schedule</label>
                {form.schedule.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    {form.schedule.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--bg)", borderRadius: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>📅 {s.day} at {s.time}{s.room ? ` — ${s.room}` : ""}</span>
                        <button type="button" style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 16 }} onClick={() => setForm((f) => ({ ...f, schedule: f.schedule.filter((_, idx) => idx !== i) }))}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select className="form-input form-select" style={{ maxWidth: 140 }} value={scheduleRow.day} onChange={(e) => setScheduleRow({ ...scheduleRow, day: e.target.value })}>
                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <input className="form-input" type="time" style={{ maxWidth: 130 }} value={scheduleRow.time} onChange={(e) => setScheduleRow({ ...scheduleRow, time: e.target.value })} />
                  <input className="form-input" placeholder="Room (optional)" style={{ maxWidth: 160 }} value={scheduleRow.room} onChange={(e) => setScheduleRow({ ...scheduleRow, room: e.target.value })} />
                  <button type="button" className="btn btn-secondary" onClick={addScheduleRow}>+ Add Slot</button>
                </div>
              </div>

              {/* Students */}
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Enroll Students ({form.studentIds.length} selected)</label>
                <input
                  className="form-input"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1.5px solid var(--border)", borderRadius: 8, padding: 12 }}>
                  {filteredStudents.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No students found</p>}
                  {filteredStudents.map((s) => (
                    <label key={s._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer", fontSize: 14 }}>
                      <input type="checkbox" checked={form.studentIds.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {s.avatar
                          ? <img src={s.avatar} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                          : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", border: "1px solid var(--border)" }}>{s.name[0]}</div>}
                        {s.name}
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>({s.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-lg" disabled={saving}>
                {saving ? <span className="spinner" /> : editCourse ? "Update Course" : "Create Course"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Report */}
      {attendanceReport && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>📊 {attendanceReport.course.name} ({attendanceReport.course.code}) — Attendance Report</strong>
            <button className="btn btn-outline btn-sm" onClick={() => setAttendanceReport(null)}>✕ Close</button>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: 16, color: "var(--text-muted)", fontSize: 14 }}>Total sessions held: <strong>{attendanceReport.totalSessions}</strong></p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Email</th><th>Attended</th><th>Total</th><th>%</th><th>Status</th></tr></thead>
                <tbody>
                  {attendanceReport.studentSummary.map((s) => (
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
                      <td>{s.belowThreshold ? <span className="badge badge-danger">⚠ Below 75%</span> : <span className="badge badge-success">✅ Good</span>}</td>
                    </tr>
                  ))}
                  {!attendanceReport.studentSummary.length && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No students enrolled</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Courses Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Course</th><th>Code</th><th>Teacher</th><th>Proficiency Match</th><th>Students</th><th>Schedule</th><th>Semester</th><th>Actions</th></tr></thead>
            <tbody>
              {courses.map((c) => {
                const teacherUser = users.find((u) => u._id === c.teacher?._id);
                return (
                  <tr key={c._id}>
                    <td><strong>{c.name}</strong>{c.department && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.department}</div>}</td>
                    <td><span className="badge badge-purple">{c.code}</span></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.teacher?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.teacher?.email}</div>
                    </td>
                    <td>
                      {teacherUser?.proficiency?.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {teacherUser.proficiency.map((p) => (
                            <span key={p} style={{ padding: "2px 6px", background: "var(--primary-light)", color: "var(--primary-dark)", borderRadius: 999, fontSize: 10, fontWeight: 600 }}>{p}</span>
                          ))}
                        </div>
                      ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}
                    </td>
                    <td>{c.students?.length || 0}</td>
                    <td style={{ fontSize: 12 }}>
                      {c.schedule?.length > 0
                        ? c.schedule.map((s, i) => <div key={i}>{s.day} {s.time}{s.room ? ` · ${s.room}` : ""}</div>)
                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td><span className="badge badge-info">{c.semester} {c.academicYear}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => viewAttendance(c)}>📊</button>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteCourse(c._id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!courses.length && <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No courses yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sessions ─────────────────────────────────────────────────────────────────
function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/admin/sessions").then(({ data }) => setSessions(data)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><span className="spinner spinner-primary" /></div>;
  return (
    <div>
      <div className="page-header"><h1>All Sessions</h1><p>{sessions.length} total sessions</p></div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>Course</th><th>Teacher</th><th>Radius</th><th>Expires</th><th>Status</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.subject}</strong></td>
                  <td>{s.course ? <span className="badge badge-purple">{s.course.code}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td>{s.teacher?.name}</td>
                  <td>{s.radiusMeters}m</td>
                  <td>{new Date(s.expiresAt).toLocaleString()}</td>
                  <td><span className={`badge badge-${s.isActive && new Date(s.expiresAt) > new Date() ? "success" : "danger"}`}>{s.isActive && new Date(s.expiresAt) > new Date() ? "Active" : "Expired"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="layout">
      <Sidebar links={LINKS} />
      <main className="main-content">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="users" element={<Users />} />
          <Route path="courses" element={<Courses />} />
          <Route path="sessions" element={<Sessions />} />
        </Routes>
      </main>
    </div>
  );
}
