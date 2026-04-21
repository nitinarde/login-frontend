"use client";

import { useState, useRef, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authApi } from "@/modules/auth/api";

const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be 6+ characters")
    .required("Password is required"),
});

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError("");
        await authApi.login(values);
        setEmail(values.email);
        setStep("otp");
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Login failed");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleOtpSubmit = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const result = await authApi.verifyOtp({ email, otp: otpValue });
      if (result.access_token) {
        localStorage.setItem("token", result.access_token);
        localStorage.setItem("refreshToken", result.refresh_token || "");
        if (result.user) localStorage.setItem("user", JSON.stringify(result.user));
        if (rememberMe) localStorage.setItem("rememberEmail", email);
        const redirectUri = new URLSearchParams(window.location.search).get("redirect_uri");
        const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
        const targetUrl = new URL(`${appBaseUrl}/authenticated/dashboard`);
        if (redirectUri) targetUrl.searchParams.set("redirect_uri", redirectUri);
        targetUrl.searchParams.set("token", result.access_token);
        if (result.refresh_token) targetUrl.searchParams.set("refreshToken", result.refresh_token);
        window.location.href = targetUrl.toString();
      } else {
        setError("Login token not received.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      formik.setFieldValue("email", savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (step === "otp") inputsRef.current[0]?.focus();
  }, [step]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setTimer(30);
    setError("");
    try {
      await authApi.login({ email, password: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to resend OTP");
    }
  };

  const handleBack = () => {
    setStep("login");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  /* ── OTP Step ── */
  if (step === "otp") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", padding: "2rem", position: "relative", overflow: "hidden" }}>

        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "-160px", left: "-160px", width: "480px", height: "480px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", width: "100%", maxWidth: "420px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "20px", padding: "2.5rem", backdropFilter: "blur(20px)", zIndex: 1 }}>

          <div style={{ position: "absolute", top: 0, left: "10%", width: "80%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)", borderRadius: "9999px" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
            <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LockIcon />
            </div>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>SecureAuth</span>
          </div>

          <button onClick={handleBack} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: "13px", fontFamily: "inherit", padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to login
          </button>

          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.2, margin: "0 0 6px 0" }}>Check your inbox</h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", margin: "0 0 2rem 0", fontWeight: 400 }}>
            Enter the 6-digit code sent to{" "}
            <span style={{ color: "#a78bfa", fontWeight: 500 }}>{email}</span>
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem", justifyContent: "space-between" }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                value={digit}
                maxLength={1}
                inputMode="numeric"
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                style={{ flex: 1, minWidth: 0, height: "52px", textAlign: "center", fontSize: "20px", fontWeight: 700, background: digit ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.05)", border: `1px solid ${digit ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.1)"}`, borderRadius: "10px", color: "#ffffff", outline: "none", fontFamily: "inherit" }}
              />
            ))}
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "1.25rem", padding: "12px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", color: "#fca5a5", fontSize: "13px", lineHeight: 1.5 }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f87171", flexShrink: 0, marginTop: "4px" }} />
              {error}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
              {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive it?"}
            </span>
            {timer === 0 && (
              <button onClick={handleResendOtp} style={{ fontSize: "13px", color: "#818cf8", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                Resend code
              </button>
            )}
          </div>

          <button
            onClick={handleOtpSubmit}
            disabled={loading || otp.join("").length !== 6}
            style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", border: "none", borderRadius: "10px", color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: loading || otp.join("").length !== 6 ? "not-allowed" : "pointer", opacity: loading || otp.join("").length !== 6 ? 0.55 : 1, letterSpacing: "0.01em", fontFamily: "inherit" }}
          >
            {loading ? "Verifying…" : "Verify & continue →"}
          </button>
        </div>
      </div>
    );
  }

  /* ── Login Step ── */
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", padding: "2rem", position: "relative", overflow: "hidden" }}>

      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "-160px", left: "-160px", width: "480px", height: "480px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: "420px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "20px", padding: "2.5rem", backdropFilter: "blur(20px)", zIndex: 1 }}>

        <div style={{ position: "absolute", top: 0, left: "10%", width: "80%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)", borderRadius: "9999px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
          <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LockIcon />
          </div>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>SecureAuth</span>
        </div>

        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.2, margin: "0 0 6px 0" }}>Welcome back</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", margin: "0 0 2rem 0", fontWeight: 400 }}>Sign in to continue to your account</p>

        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "1.25rem", padding: "12px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", color: "#fca5a5", fontSize: "13px", lineHeight: 1.5 }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f87171", flexShrink: 0, marginTop: "4px" }} />
            {error}
          </div>
        )}

        <form onSubmit={formik.handleSubmit}>

          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "7px" }}>
              Email address
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="you@company.com"
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 42px 12px 14px", background: "rgba(255,255,255,0.05)", border: `1px solid ${formik.touched.email && formik.errors.email ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: "10px", color: "#ffffff", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
              />
              <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
            </div>
            {formik.touched.email && formik.errors.email && (
              <p style={{ color: "#f87171", fontSize: "11.5px", marginTop: "5px" }}>{formik.errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "7px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Min. 6 characters"
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 42px 12px 14px", background: "rgba(255,255,255,0.05)", border: `1px solid ${formik.touched.password && formik.errors.password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: "10px", color: "#ffffff", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p style={{ color: "#f87171", fontSize: "11.5px", marginTop: "5px" }}>{formik.errors.password}</p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: "15px", height: "15px", accentColor: "#6366f1", cursor: "pointer" }}
              />
              Remember me
            </label>
            <a href="#" style={{ fontSize: "13px", color: "#818cf8", textDecoration: "none", fontWeight: 500 }}>
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", border: "none", borderRadius: "10px", color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.55 : 1, letterSpacing: "0.01em", fontFamily: "inherit" }}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Protected by two-factor authentication
        </div>
      </div>
    </div>
  );
}