import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm)
      return toast.error("Passwords do not match");
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: form.password,
      });
      toast.success("Password reset successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const EyeBtn = ({ show, toggle }) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 18,
        color: "var(--text-muted)",
        padding: 0,
        lineHeight: 1,
      }}
    >
      {show ? "🙈" : "👁️"}
    </button>
  );

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">📋 Attendyy</div>
        <p className="auth-subtitle">Enter your new password</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                type={showPass ? "text" : "password"}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{ paddingRight: 44 }}
              />
              <EyeBtn show={showPass} toggle={() => setShowPass(!showPass)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
                style={{ paddingRight: 44 }}
              />
              <EyeBtn
                show={showConfirm}
                toggle={() => setShowConfirm(!showConfirm)}
              />
            </div>
          </div>
          <button
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
