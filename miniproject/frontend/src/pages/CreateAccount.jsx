import { useState } from "react";

const API_BASE = "http://localhost:4000/api";

export default function CreateAccount() {
  const [step, setStep] = useState("form"); // "form" -> "otp" -> "pending"
  const [form, setForm] = useState({ fname: "", lname: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fname || !form.lname || !form.email || !form.phone || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setInfo(`We sent a 6-digit code to ${form.email}.`);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp.trim()) {
      setError("Enter the code we emailed you.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStep("pending");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {step === "form" && (
          <>
            <h1>Create Account</h1>
            <p>Tell us a bit about yourself.</p>
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label>First Name</label>
                <div className="input-wrapper">
                  <input name="fname" value={form.fname} onChange={handleChange} placeholder="Jane" />
                </div>
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <div className="input-wrapper">
                  <input name="lname" value={form.lname} onChange={handleChange} placeholder="Smith" />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane.smith@company.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-wrapper">
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <input
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Sending code..." : "Send verification code"}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <h1>Check your email</h1>
            <p>{info}</p>
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label>Verification Code</label>
                <div className="input-wrapper">
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                  />
                </div>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify code"}
              </button>
            </form>
          </>
        )}

        {step === "pending" && (
          <>
            <h1>Request submitted</h1>
            <p>
              Your email is verified. An admin will review your details, and
              you'll get a confirmation email once your account is approved.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
