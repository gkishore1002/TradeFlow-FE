"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StarBorder from "./StarBorder/StarBorder";
import { motion } from "framer-motion";

export default function AuthForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // Sign up form state
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!loginData.email.trim()) {
        setError("Email is required");
        setLoading(false);
        return;
      }

      if (!validateEmail(loginData.email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      if (!loginData.password) {
        setError("Password is required");
        setLoading(false);
        return;
      }

      // API Call
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: loginData.email.trim(),
            password: loginData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Store token and user data
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("email", data.user.email);
      localStorage.setItem("first_name", data.user.first_name);
      localStorage.setItem("last_name", data.user.last_name);
      localStorage.setItem("user_id", data.user.id);
      if (data.user.avatar_url) {
        localStorage.setItem("avatar_url", data.user.avatar_url);
      }

      setSuccess("Login successful! Redirecting...");

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setError("Network error. Is the backend running?");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!signupData.firstName.trim()) {
        setError("First name is required");
        setLoading(false);
        return;
      }

      if (!signupData.lastName.trim()) {
        setError("Last name is required");
        setLoading(false);
        return;
      }

      if (!signupData.email.trim()) {
        setError("Email is required");
        setLoading(false);
        return;
      }

      if (!validateEmail(signupData.email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      if (!signupData.password) {
        setError("Password is required");
        setLoading(false);
        return;
      }

      if (signupData.password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      if (signupData.password !== signupData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      // API Call
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: signupData.firstName.trim(),
            last_name: signupData.lastName.trim(),
            email: signupData.email.trim(),
            password: signupData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Sign up failed. Please try again.");
        setLoading(false);
        return;
      }

      // Store token and user data
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("email", data.user.email);
      localStorage.setItem("first_name", data.user.first_name);
      localStorage.setItem("last_name", data.user.last_name);
      localStorage.setItem("user_id", data.user.id);

      setSuccess("Account created successfully! Redirecting...");

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setError("Network error. Is the backend running?");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setLoginData({ email: "", password: "" });
    setSignupData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  return (
    <StarBorder as="div" className="w-full max-w-md mx-auto" color="#FF4500" thickness={4}>
      <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 border border-white/50 w-full transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(241,95,38,0.3)]">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium">
            {success}
          </div>
        )}

        {isSignUp ? (
          // SIGNUP FORM
          <form onSubmit={handleSignup} className="space-y-4">
            {/* First Name Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                First Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.02, borderColor: "#f15f26", boxShadow: "0 0 0 4px rgba(241, 95, 38, 0.1)" }}
                transition={{ duration: 0.2 }}
                type="text"
                name="firstName"
                value={signupData.firstName}
                onChange={handleSignupChange}
                placeholder="John"
                className="w-full rounded-xl border-2 border-slate-200 bg-white/50 p-3 sm:p-4 text-slate-800 placeholder-slate-400 focus:outline-none text-xs sm:text-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Last Name Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Last Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.02, borderColor: "#f15f26", boxShadow: "0 0 0 4px rgba(241, 95, 38, 0.1)" }}
                transition={{ duration: 0.2 }}
                type="text"
                name="lastName"
                value={signupData.lastName}
                onChange={handleSignupChange}
                placeholder="Doe"
                className="w-full rounded-xl border-2 border-slate-200 bg-white/50 p-3 sm:p-4 text-slate-800 placeholder-slate-400 focus:outline-none text-xs sm:text-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <motion.input
                whileFocus={{ scale: 1.02, borderColor: "#f15f26", boxShadow: "0 0 0 4px rgba(241, 95, 38, 0.1)" }}
                transition={{ duration: 0.2 }}
                type="email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-slate-200 bg-white/50 p-3 sm:p-4 text-slate-800 placeholder-slate-400 focus:outline-none text-xs sm:text-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.02, borderColor: "#f15f26", boxShadow: "0 0 0 4px rgba(241, 95, 38, 0.1)" }}
                  transition={{ duration: 0.2 }}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white/50 p-3 sm:p-4 text-slate-800 placeholder-slate-400 focus:outline-none text-xs sm:text-sm pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <motion.input
                whileFocus={{ scale: 1.02, borderColor: "#f15f26", boxShadow: "0 0 0 4px rgba(241, 95, 38, 0.1)" }}
                transition={{ duration: 0.2 }}
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                placeholder="••••••••"
                className="w-full rounded-xl border-2 border-slate-200 bg-white/50 p-3 sm:p-4 text-slate-800 placeholder-slate-400 focus:outline-none text-xs sm:text-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Sign Up Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(241, 95, 38, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#f15f26] text-white font-bold py-3 sm:py-4 rounded-xl shadow-lg hover:bg-[#d94e1f] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Sign Up"
              )}
            </motion.button>

            {/* Toggle to Login */}
            <p className="text-center text-xs sm:text-sm text-slate-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="text-[#f15f26] hover:text-[#d94e1f] font-semibold hover:underline transition-colors duration-200 disabled:opacity-50"
              >
                Sign in
              </button>
            </p>
          </form>
        ) : (
          // LOGIN FORM
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <motion.input
                whileFocus={{ scale: 1.02, borderColor: "#f15f26", boxShadow: "0 0 0 4px rgba(241, 95, 38, 0.1)" }}
                transition={{ duration: 0.2 }}
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-slate-200 bg-white/50 p-3 sm:p-4 text-slate-800 placeholder-slate-400 focus:outline-none text-xs sm:text-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.02, borderColor: "#f15f26", boxShadow: "0 0 0 4px rgba(241, 95, 38, 0.1)" }}
                  transition={{ duration: 0.2 }}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white/50 p-3 sm:p-4 text-slate-800 placeholder-slate-400 focus:outline-none text-xs sm:text-sm pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(241, 95, 38, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#f15f26] text-white font-bold py-3 sm:py-4 rounded-xl shadow-lg hover:bg-[#d94e1f] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </motion.button>

            {/* Toggle to Sign Up */}
            <p className="text-center text-xs sm:text-sm text-slate-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="text-[#f15f26] hover:text-[#d94e1f] font-semibold hover:underline transition-colors duration-200 disabled:opacity-50"
              >
                Sign up
              </button>
            </p>
          </form>
        )}
      </div>
    </StarBorder>
  );
}
