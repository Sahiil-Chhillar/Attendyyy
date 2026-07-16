import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 80 }}>404</div>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Page Not Found</h1>
      <p style={{ color: "var(--text-muted)" }}>The page you're looking for doesn't exist.</p>
      <button className="btn btn-primary" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );
}
