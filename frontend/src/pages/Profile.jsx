import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";
import Sidebar from "../components/shared/Sidebar";

const ROLE_LINKS = {
  teacher: [
    { to: "/teacher", icon: "🏠", label: "Dashboard" },
    { to: "/teacher/courses", icon: "📚", label: "My Courses" },
    { to: "/teacher/create", icon: "➕", label: "Create Session" },
    { to: "/teacher/sessions", icon: "📋", label: "My Sessions" },
    { to: "/profile", icon: "👤", label: "Profile" },
  ],
  student: [
    { to: "/student", icon: "🏠", label: "Dashboard" },
    { to: "/student/courses", icon: "📚", label: "My Courses" },
    { to: "/student/scan", icon: "📷", label: "Scan QR" },
    { to: "/student/history", icon: "📅", label: "Attendance" },
    { to: "/profile", icon: "👤", label: "Profile" },
  ],
  admin: [
    { to: "/admin", icon: "🏠", label: "Dashboard" },
    { to: "/admin/users", icon: "👥", label: "Users" },
    { to: "/admin/courses", icon: "📚", label: "Courses" },
    { to: "/admin/sessions", icon: "📋", label: "Sessions" },
    { to: "/profile", icon: "👤", label: "Profile" },
  ],
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proficiency, setProficiency] = useState(user?.proficiency || []);
  const [tagInput, setTagInput] = useState("");
  const fileRef = useRef();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/auth/me", { name, proficiency });
      updateUser({ name: data.name, proficiency: data.proficiency });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setUploading(true);
    try {
      const { data } = await api.post("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser({ avatar: data.avatar });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (proficiency.includes(tag)) return toast.error("Already added");
    setProficiency([...proficiency, tag]);
    setTagInput("");
  };

  const removeTag = (tag) => setProficiency(proficiency.filter((t) => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const links = ROLE_LINKS[user?.role] || ROLE_LINKS.student;

  return (
    <div className="layout">
      <Sidebar links={links} />
      <main className="main-content">
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Manage your account details</p>
        </div>

        <div style={{ maxWidth: 540 }}>
          {/* Avatar card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary-light)" }} />
              ) : (
                <div style={{ width: 90, height: 90, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "var(--primary)" }}>
                  {initials}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
              <button className="btn btn-outline btn-sm" onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? <><span className="spinner spinner-primary" /> Uploading...</> : "📷 Change Photo"}
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{user?.email}</div>
                <span className="badge badge-purple" style={{ marginTop: 6, textTransform: "capitalize" }}>{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="card">
            <div className="card-header"><strong>Edit Profile</strong></div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (cannot change)</label>
                  <input className="form-input" value={user?.email} disabled style={{ background: "#f8fafc", color: "var(--text-muted)" }} />
                </div>

                {/* Proficiency — only for teachers */}
                {user?.role === "teacher" && (
                  <div className="form-group">
                    <label className="form-label">Subject Proficiency</label>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                      Add subjects you are qualified to teach. Admin will see these when assigning courses.
                    </p>

                    {/* Tags */}
                    {proficiency.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                        {proficiency.map((tag) => (
                          <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "var(--primary-light)", color: "var(--primary-dark)", borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
                            >✕</button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="form-input"
                        placeholder="e.g. Data Structures, DBMS, OS..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />
                      <button type="button" className="btn btn-secondary" onClick={addTag}>+ Add</button>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Press Enter or click Add to save a tag</p>
                  </div>
                )}

                <button className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
