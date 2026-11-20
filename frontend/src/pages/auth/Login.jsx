
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import branding from "../../config/branding.js";

function CompanyLogo() {
  return (
    <div className="luminest-brand">
      <svg
        className="luminest-mark"
        viewBox="0 0 120 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M8 53 L48 12 L68 33 L88 12 L112 53"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 55 L48 31 L61 44"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M12 64 Q59 48 108 64"
          stroke="#C9A86A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="55" y="42" width="7" height="7" fill="currentColor" />
        <rect x="66" y="42" width="7" height="7" fill="currentColor" />
        <rect x="55" y="53" width="7" height="7" fill="currentColor" />
        <rect x="66" y="53" width="7" height="7" fill="currentColor" />
      </svg>

      <div className="luminest-wordmark">
        <span>{branding.companyName.toUpperCase()}</span>
        <small>REAL ESTATE</small>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Remember Me UI is ready.
      // Persistent session support will be connected later.
      const response = await login(email.trim(), password);

      const roleRoutes = {
        admin: "/admin",
        executive: "/executive",
        inside_sales: "/inside-sales",
        outside_sales: "/outside-sales",
      };

      const destination = roleRoutes[response.user.role];

      if (!destination) {
        throw new Error("Unrecognized employee role");
      }

      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Password recovery will be connected later.
  };

  return (
    <main className="luminest-login">

      {/* LEFT ARCHITECTURAL IMAGE PANEL */}
      <section className="login-visual">
        <div className="login-visual-overlay" />

        <header className="login-brand-header">
          <CompanyLogo />
        </header>

        <div className="login-hero-content">
          <span className="login-eyebrow">
            WELCOME TO {branding.companyName.toUpperCase()}
          </span>

          <h1>{branding.tagline}</h1>

          <p>{branding.subtitle}</p>

          <div className="login-slide-indicator">
            <span />
            <i />
            <i />
          </div>
        </div>

        <div className="login-visual-footer">
          <span>PROPERTY MANAGEMENT</span>
          <span>PEOPLE · PROPERTY · PROGRESS</span>
        </div>
      </section>

      {/* RIGHT LOGIN PANEL */}
      <section className="login-form-panel">

        <div className="login-top-brand">
          <CompanyLogo />
          <span>EMPLOYEE PORTAL</span>
        </div>

        <div className="login-form-container">

          <div className="login-heading">
            <h2>
              Welcome Back to
              <br />
              <span>{branding.companyName}!</span>
            </h2>

            <p>Sign in to your employee account</p>
          </div>

          {/* LOGIN ERROR */}
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* EMPLOYEE EMAIL */}
            <div className="luminest-form-group">
              <label htmlFor="email">Employee Email</label>

              <div className="luminest-input-wrapper">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M4 7L12 13L20 7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="luminest-form-group">
              <label htmlFor="password">Password</label>

              <div className="luminest-input-wrapper">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M8 10V7a4 4 0 018 0v3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="15"
                    r="1.3"
                    fill="currentColor"
                  />
                </svg>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="luminest-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* REMEMBER ME AND FORGOT PASSWORD */}
            <div className="login-form-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                className="forgot-password-label"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            {/* SIGN IN */}
            <button
              type="submit"
              className="luminest-login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}

              {!loading && (
                <span aria-hidden="true">→</span>
              )}
            </button>

          </form>

          <div className="login-security-note">
            <span className="security-dot" />
            Secure Employee Access
          </div>

        </div>

        {/* COPYRIGHT */}
        <footer className="login-copyright">
          © {new Date().getFullYear()} {branding.companyName}.
          All rights reserved.
        </footer>

      </section>
    </main>
  );
}
