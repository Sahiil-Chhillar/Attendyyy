import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Sidebar({ links }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">📋 Attendyy</div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span className="link-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="avatar" style={{ width: 36, height: 36 }} />
          ) : (
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{initials}</div>
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-outline btn-full btn-sm" onClick={handleLogout}>🚪 Logout</button>
      </div>
    </aside>
  );
}
