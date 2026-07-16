import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      toast.success("Email verified! You can now log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-otp", { email });
      toast.success("New OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">📋 Attendyy</div>
        <p className="auth-subtitle">Check your email for the 6-digit OTP</p>

        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">OTP Code</label>
            <input
              className="form-input"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
              style={{ fontSize: 24, letterSpacing: 8, textAlign: "center" }}
            />
          </div>
          <button className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" /> : "Verify Email"}
          </button>
        </form>

        <div className="auth-footer">
          Didn't receive OTP?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
          >
            {resending ? "Sending..." : "Resend OTP"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Link to="/login" style={{ fontSize: 13 }}>← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
