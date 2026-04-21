"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authApi } from "@/modules/auth/api";

const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be 6+ chars")
    .required("Password required"),
});

const otpSchema = Yup.object().shape({
  otp: Yup.string()
    .length(6, "OTP must be 6 digits")
    .required("OTP is required"),
});

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(22);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
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
        setError(err.message || "Login failed");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleOtpSubmit = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await authApi.verifyOtp({
        email,
        otp: otpValue,
      });

      if (result.access_token) {
        // Save auth data
        localStorage.setItem("token", result.access_token);
        localStorage.setItem("refreshToken", result.refresh_token || "");

        if (result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
        }

        // Redirect to ERP dashboard with token in URL (since different origins)
        const appBaseUrl =
          process.env.NEXT_PUBLIC_APP_URL;

        const targetUrl = new URL(`${appBaseUrl}/authenticated/dashboard`);
        targetUrl.searchParams.set("token", result.access_token);
        if (result.refresh_token) {
          targetUrl.searchParams.set("refreshToken", result.refresh_token);
        }

        window.location.href = targetUrl.toString();
      } else {
        setError("Login token not received.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (step === "otp") {
      inputsRef.current[0]?.focus();
    }
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
    setTimer(22);
    setError("");
    try {
      await authApi.login({ email, password: "" });
    } catch (err: any) {
    }
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Verify OTP</h1>
          <p className="text-sm text-gray-600 mb-4">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium">{email}</span>
          </p>
          <div className="flex justify-between gap-2 mb-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                value={digit}
                maxLength={1}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-12 h-12 text-center text-xl border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            ))}
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="text-right text-sm text-gray-500 mb-4">
            {timer > 0 ? (
              <span>Resend in {timer}s</span>
            ) : (
              <button onClick={handleResendOtp} className="text-indigo-600">
                Resend OTP
              </button>
            )}
          </div>
          <button
            onClick={handleOtpSubmit}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600">Auth Service</h1>
          <p className="text-gray-500">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
              placeholder="Enter your email"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none"
              placeholder="Enter your password"
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {formik.errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
