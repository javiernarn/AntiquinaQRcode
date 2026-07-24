import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import GoogleSignInButton from "../components/GoogleSignInButton";
import Footer from "../components/Footer";
import logo from "../assets/images/logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Sign in | QR Code Builder";
  }, []);

  const handleSuccess = useCallback(
    (profile) => {
      login(profile);
      // Route through the loading screen again — MainPage checks
      // isAuthenticated and will forward to /builder automatically.
      navigate("/", { replace: true, state: { from: "login" } });
    },
    [login, navigate]
  );

  const handleError = useCallback(() => {
    setError("Something went wrong signing in. Please try again.");
  }, []);

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 1px 1px, #1c2028 1.4px, transparent 1.4px) 0 0/22px 22px,
            radial-gradient(900px 500px at 100% -10%, rgba(94,234,212,0.10), transparent 60%),
            radial-gradient(900px 500px at -10% 110%, rgba(124,58,237,0.12), transparent 60%),
            var(--bg);
          padding: 24px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: var(--shadow);
          padding: 40px 32px 32px;
          text-align: center;
        }

        .login-card__logo {
          width: 84px;
          height: 84px;
          margin: 0 auto 18px;
          border-radius: 20px;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .login-card__logo img { width: 100%; height: 100%; object-fit: contain; }

        .login-card__chip {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 13px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
          background: rgba(94, 234, 212, 0.08);
          border: 1px solid rgba(94, 234, 212, 0.28);
          color: var(--accent);
          margin-bottom: 16px;
        }
        .login-card__chip .pulse { width: 7px; height: 7px; border-radius: 50%; background: #5eead4; }

        .login-card__title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
          color: var(--text);
        }
        .login-card__subtitle {
          font-size: 13.5px;
          color: var(--text-muted);
          margin: 0 0 28px;
          line-height: 1.5;
        }

        .google-btn-row { display: flex; justify-content: center; margin-bottom: 16px; }
        .google-btn-slot { min-height: 44px; display: flex; justify-content: center; }
        .google-btn-missing {
          font-size: 12.5px;
          color: var(--text-muted);
          background: var(--surface-2);
          border: 1px dashed var(--border-strong);
          border-radius: 10px;
          padding: 14px 16px;
          line-height: 1.6;
          text-align: left;
        }
        .google-btn-missing code {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 11.5px;
        }

        .login-error {
          font-size: 12.5px;
          color: #fecaca;
          background: rgba(248, 113, 113, 0.10);
          border: 1px solid rgba(248, 113, 113, 0.35);
          border-radius: 8px;
          padding: 9px 12px;
          margin-bottom: 16px;
        }

        .guest-link {
          display: block;
          margin-top: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-muted);
          background: none;
          border: none;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }
        .guest-link:hover { color: var(--text); }

        .login-divider { display: flex; align-items: center; gap: 10px; margin: 22px 0; }
        .login-divider .line { flex: 1; height: 1px; background: var(--border); }

        .login-tip {
          display: flex;
          gap: 10px;
          text-align: left;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .login-tip .icon { font-size: 16px; line-height: 1; }
        .login-tip .meta { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          <span className="login-card__chip">
            <span className="pulse" />
            Secure sign-in
          </span>

          <div className="login-card__logo">
            <img src={logo} alt="QR Code Builder" />
          </div>

          <h2 className="login-card__title">Welcome to QR Code Builder</h2>
          <p className="login-card__subtitle">
            Sign in with Google to save presets and pick up where you left off on any device.
          </p>

          {error && <div className="login-error">{error}</div>}

          <div className="google-btn-row">
            <GoogleSignInButton onSuccess={handleSuccess} onError={handleError} />
          </div>

          <div className="login-divider">
            <div className="line" />
            <div className="line" />
          </div>

          <div className="login-tip">
            <span className="icon">🔒</span>
            <div className="meta">
              Everything runs in this browser. Nothing is uploaded to a server —
              Google sign-in only identifies which local presets belong to you.
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
