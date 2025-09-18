// src/Login.tsx
import React, { useState, useEffect } from "react";
import "./Login.profile.css";

const Login: React.FC<{ onLogin?: (userData: any) => void; onSuccess?: () => void }> = ({ onLogin, onSuccess }) => {
  // State for password change after confirmation
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState<string | null>(
    null
  );
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<
    string | null
  >(null);
  // Confirmation for forgot password
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  // State variables remain the same
  // Registration page toggle
  const [showRegisterPage, setShowRegisterPage] = useState(false);
  const [registerUserType, setRegisterUserType] = useState<"user" | "admin">(
    "user"
  );
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerInfo, setRegisterInfo] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [userType, setUserType] = useState<"user" | "admin">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalAnimation, setModalAnimation] = useState(false);
  // Forgot password modal state
  const [resetEmail, setResetEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Email validation
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Keyboard support for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowForgotPassword(false);
      }
    };

    if (showForgotPassword) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showForgotPassword]);

  // Modal animations
  useEffect(() => {
    if (showForgotPassword) {
      setModalAnimation(true);
    }
  }, [showForgotPassword]);

  // Handle forgot password
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!validateEmail(resetEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setShowConfirm(true);
  }

  async function handleConfirmForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (confirmText.trim().toLowerCase() !== "yes") {
      setEmailError("Please type 'yes' to confirm.");
      return;
    }
    setShowChangePassword(true);
    setShowConfirm(false);
    setEmailError("");
    setConfirmText("");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
    if (!newPassword || !confirmNewPassword) {
      setChangePasswordError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      // You may need to adjust the endpoint and payload to match your backend
      const res = await fetch("http://localhost:3001/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }
      setChangePasswordSuccess(
        "Password changed successfully! You can now log in."
      );
      setShowChangePassword(false);
      setShowForgotPassword(false);
      setResetEmail("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setChangePasswordError(err.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle login
  async function submitLogin() {
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, userType }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      console.log("Login request:", { email, userType });
      console.log("Login response:", { ...data, token: "[HIDDEN]" });

      if (!res.ok) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        throw new Error(data?.error || `Login failed (HTTP ${res.status})`);
      }

      localStorage.setItem("authToken", data.token);
      setFailedAttempts(0);
      if (onLogin) {
        onLogin(data);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || "Request failed");
    }
  }

  // Form submission handler
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await submitLogin();
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!showForgotPassword) {
      setName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setError(null);
      setInfo(null);
    }
  }, [showForgotPassword]);

  return (
    <div className="login-container">
      {/* Left Panel - Login or Register Form */}
      <div className="login-left-panel">
        <div className="login-form-wrapper">
          {!showRegisterPage ? (
            <form onSubmit={onSubmit}>
              <h1 className="login-title">Log In</h1>
              <p className="login-subtitle">Log in to access your account</p>
              {/* ...existing code for login form... */}
              <div className="user-type-selector">
                <button
                  type="button"
                  onClick={() => setUserType("user")}
                  className={`user-type-button ${userType === "user" ? "user" : "inactive"
                    }`}
                >
                  <span>👤</span>User
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("admin")}
                  className={`user-type-button ${userType === "admin" ? "admin" : "inactive"
                    }`}
                >
                  <span>👑</span>Admin
                </button>
              </div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
              {failedAttempts >= 3 && (
                <div className="warning-message">
                  <span>⚠️</span>Too many failed attempts. Please use the forgot
                  password option.
                </div>
              )}
              <div style={{ marginBottom: "16px", textAlign: "right" }}>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="forgot-password-link"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="remember-me-container">
                <input
                  type="checkbox"
                  id="remember"
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="remember" className="remember-me-label">
                  Remember Me
                </label>
              </div>
              {error && <div className="error-message">{error}</div>}
              {info && <div className="info-message">{info}</div>}
              <button disabled={loading} type="submit" className="button">
                <span>👤</span>
                {loading ? "Logging in..." : "Log In"}
              </button>
              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">OR</span>
                <div className="divider-line"></div>
              </div>
              <button type="button" className="button social">
                <span className="social-icon facebook">f</span>Sign in with
                Facebook
              </button>
              <button type="button" className="button social">
                <span className="social-icon google">G</span>Sign in with Google
              </button>
              <div className="register-button-container">
                <button
                  type="button"
                  onClick={() => setShowRegisterPage(true)}
                  className="register-button"
                >
                  <span>👤</span>Register New Account
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setRegisterError(null);
                setRegisterInfo(null);
                setRegisterLoading(true);
                try {
                  if (
                    !registerName ||
                    !registerEmail ||
                    !registerPassword ||
                    !registerConfirm
                  ) {
                    throw new Error("All fields are required.");
                  }
                  if (registerPassword !== registerConfirm) {
                    throw new Error("Passwords do not match");
                  }
                  const registrationData = {
                    name: registerName,
                    email: registerEmail,
                    password: registerPassword,
                    role: registerUserType,
                  };
                  const res = await fetch("http://localhost:3001/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(registrationData),
                  });
                  const text = await res.text();
                  let data: any = {};
                  try {
                    data = text ? JSON.parse(text) : {};
                  } catch { }
                  if (!res.ok) {
                    throw new Error(
                      data?.error || `Registration failed (HTTP ${res.status})`
                    );
                  }
                  setEmail(registerEmail);
                  setPassword(registerPassword);
                  setRegisterInfo("Account created. Logging you in...");
                  // Automatically log in after registration
                  setTimeout(async () => {
                    setLoading(true);
                    try {
                      const loginRes = await fetch("http://localhost:3001/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: registerEmail,
                          password: registerPassword,
                          userType: registerUserType,
                        }),
                      });
                      const loginText = await loginRes.text();
                      let loginData: any = {};
                      try {
                        loginData = loginText ? JSON.parse(loginText) : {};
                      } catch { }
                      if (!loginRes.ok)
                        throw new Error(
                          loginData?.error ||
                          `Login failed (HTTP ${loginRes.status})`
                        );
                      localStorage.setItem("authToken", loginData.token);
                      setFailedAttempts(0);
                      if (onLogin) {
                        onLogin(loginData);
                      } else if (onSuccess) {
                        onSuccess();
                      }
                    } catch (err: any) {
                      setError(
                        err?.message ||
                        "Auto-login failed. Please log in manually."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }, 500);
                } catch (err: any) {
                  setRegisterError(err?.message || "Request failed");
                } finally {
                  setRegisterLoading(false);
                }
              }}
            >
              <h1 className="login-title">Register</h1>
              <p className="login-subtitle">
                Create a new account to access your personalized dashboard
              </p>
              <div className="user-type-selector">
                <button
                  type="button"
                  onClick={() => setRegisterUserType("user")}
                  className={`user-type-button ${registerUserType === "user" ? "user" : "inactive"
                    }`}
                >
                  <span>👤</span>User
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterUserType("admin")}
                  className={`user-type-button ${registerUserType === "admin" ? "admin" : "inactive"
                    }`}
                >
                  <span>👑</span>Admin
                </button>
              </div>
              <label className="form-label">Name</label>
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="form-input"
                placeholder="Enter your name"
                required
              />
              <label className="form-label">Email</label>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
              <label className="form-label">Password</label>
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={registerConfirm}
                onChange={(e) => setRegisterConfirm(e.target.value)}
                className="form-input"
                placeholder="Confirm your password"
                required
              />
              {registerError && (
                <div className="error-message">{registerError}</div>
              )}
              {registerInfo && (
                <div className="info-message">{registerInfo}</div>
              )}
              <button
                type="submit"
                disabled={registerLoading}
                className="button"
              >
                {registerLoading ? "Creating Account..." : "Register"}
              </button>
              <div className="register-button-container">
                <button
                  type="button"
                  onClick={() => setShowRegisterPage(false)}
                  className="button secondary"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Panel - Info Section */}
      <div className="login-right-panel">
        <div className="info-content">
          <h1 className="brand-title">AyaSync</h1>
          <div className="brand-accent"></div>
          <p className="brand-description">
            Welcome back! Log in to access your personalized dashboard where
            real-time data and tasks are just a click away.
          </p>

          {/* User Type Info Card */}
          <div
            className={`user-info-card ${userType === "admin" ? "admin" : ""}`}
          >
            <div className="user-info-icon">
              {userType === "admin" ? "👑" : "👤"}
            </div>
            <h3 className="user-info-title">
              {userType === "admin" ? "Admin Access" : "User Access"}
            </h3>
            <p className="user-info-description">
              {userType === "admin"
                ? "Full system control, user management, analytics, and administrative tools. Any email can be used for admin registration."
                : "Personal dashboard, task management, and collaboration features."}
            </p>
          </div>
          <h3 className="trusted-companies-title">Our Trusted Companies:</h3>
          <div className="trusted-companies-container">
            <div className="company-info">
              <div className="company-logo">S</div>
              <div>
                <div className="company-name">MAKERSPACE</div>
                <div className="company-subtitle">INNOVHUB</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay">
          <div className={`modal-content ${modalAnimation ? "show" : ""}`}>
            <div className="modal-header">
              <h2 className="modal-title">Reset Password</h2>
              <p className="modal-description">
                Enter your email and we'll send you a link to reset your
                password.
              </p>
            </div>
            <div className="modal-body">
              {!showConfirm ? (
                <form onSubmit={handleForgotPassword}>
                  <div className="modal-form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setEmailError("");
                      }}
                      className="form-input"
                      placeholder="Enter your email"
                      required
                    />
                    {emailError && (
                      <div className="error-message">{emailError}</div>
                    )}
                  </div>
                  {(error || info) && (
                    <div
                      className={`message-box ${error ? "error" : "success"}`}
                    >
                      {error || info}
                    </div>
                  )}
                  <div className="modal-footer">
                    <div className="modal-button-group">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="button"
                      >
                        {isSubmitting ? "Checking..." : "Next"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setError(null);
                          setInfo(null);
                          setEmailError("");
                          setShowConfirm(false);
                          setConfirmText("");
                        }}
                        className="button secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : showChangePassword ? (
                <form onSubmit={handleChangePassword}>
                  <div className="modal-form-group">
                    <label className="form-label">
                      Enter new password for <b>{resetEmail}</b>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-input"
                      placeholder="New password"
                      required
                    />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="form-input"
                      placeholder="Confirm new password"
                      required
                    />
                    {changePasswordError && (
                      <div className="error-message">{changePasswordError}</div>
                    )}
                    {changePasswordSuccess && (
                      <div className="info-message">
                        {changePasswordSuccess}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <div className="modal-button-group">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="button"
                      >
                        {isSubmitting ? "Changing..." : "Change Password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setShowChangePassword(false);
                          setError(null);
                          setInfo(null);
                          setEmailError("");
                          setShowConfirm(false);
                          setConfirmText("");
                          setNewPassword("");
                          setConfirmNewPassword("");
                        }}
                        className="button secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmForgotPassword}>
                  <div className="modal-form-group">
                    <label className="form-label">
                      Type 'yes' to confirm sending reset email to{" "}
                      <b>{resetEmail}</b>
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="form-input"
                      placeholder="Type 'yes' to confirm"
                      required
                    />
                    {emailError && (
                      <div className="error-message">{emailError}</div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <div className="modal-button-group">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="button"
                      >
                        {isSubmitting ? "Next..." : "Next"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setShowConfirm(false);
                          setConfirmText("");
                          setError(null);
                          setInfo(null);
                          setEmailError("");
                        }}
                        className="button secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
