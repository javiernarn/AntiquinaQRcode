import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/images/logo.png";

export default function MainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const justSignedIn = location.state?.from === "login";

  useEffect(() => {
    document.title = "Loading | QR Code Builder";
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      navigate(isAuthenticated ? "/builder" : "/login", { replace: true });
    }, 1400);
    return () => clearTimeout(t);
  }, [isAuthenticated, navigate]);

  return (
    <>
      <style>{`
        .mp-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          color: var(--text);
          background:
            radial-gradient(circle at 1px 1px, #1c2028 1.4px, transparent 1.4px) 0 0/22px 22px,
            radial-gradient(900px 500px at 100% -10%, rgba(94,234,212,0.10), transparent 60%),
            radial-gradient(900px 500px at -10% 110%, rgba(124,58,237,0.12), transparent 60%),
            var(--bg);
          padding: 24px;
        }

        .mp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.35;
          pointer-events: none;
          animation: mp-float 14s ease-in-out infinite;
        }
        .mp-blob-1 { width: 360px; height: 360px; background: #5eead4; top: -100px; left: -80px; }
        .mp-blob-2 { width: 420px; height: 420px; background: #7c9cff; bottom: -160px; right: -100px; animation-duration: 18s; }
        .mp-blob-3 { width: 260px; height: 260px; background: #fbbf6e; top: 40%; left: 60%; opacity: 0.22; animation-duration: 22s; }

        @keyframes mp-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-16px) scale(1.05); }
        }

        .mp-card {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 48px 40px;
          border-radius: 26px;
          max-width: 420px;
          width: 100%;
          background: rgba(17,20,27,0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          animation: mp-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .mp-chip {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
          background: rgba(94, 234, 212, 0.08);
          border: 1px solid rgba(94, 234, 212, 0.28);
          color: var(--accent);
          margin-bottom: 24px;
        }
        .mp-chip .pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: #5eead4;
          animation: mp-pulse 1.8s ease-in-out infinite;
        }
        @keyframes mp-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(94,234,212,0.6); }
          50%     { box-shadow: 0 0 0 10px rgba(94,234,212,0); }
        }

        .mp-logo-wrap {
          width: 120px;
          height: 120px;
          margin: 0 auto 22px;
          border-radius: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          animation: mp-logo-float 3s ease-in-out infinite;
        }
        .mp-logo-wrap img {
          width: 100%; height: 100%; object-fit: contain;
        }
        @keyframes mp-logo-float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-8px); }
        }

        .mp-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
        }
        .mp-title .grad {
          background: linear-gradient(135deg, var(--accent), var(--accent-2) 50%, var(--accent-3));
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
        }
        .mp-sub {
          margin: 0 0 28px;
          font-size: 14px;
          color: var(--text-muted);
        }

        .mp-loader {
          position: relative;
          width: 100%;
          height: 6px;
          border-radius: 4px;
          overflow: hidden;
          background: rgba(148, 163, 184, 0.14);
          margin-bottom: 12px;
        }
        .mp-loader::before {
          content: "";
          position: absolute; top: 0; left: 0; bottom: 0;
          width: 40%;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3));
          animation: mp-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes mp-slide {
          0%   { left: -40%; }
          100% { left: 100%; }
        }

        .mp-loading-text {
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }
        .mp-loading-text .dot { display: inline-block; animation: mp-blink 1.4s infinite; }
        .mp-loading-text .dot:nth-child(2) { animation-delay: 0.2s; }
        .mp-loading-text .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes mp-blink {
          0%, 80%, 100% { opacity: 0.3; }
          40%           { opacity: 1; }
        }

        @keyframes mp-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .mp-blob, .mp-logo-wrap, .mp-card, .mp-loader::before, .mp-loading-text .dot {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mp-wrapper">
        <span className="mp-blob mp-blob-1" />
        <span className="mp-blob mp-blob-2" />
        <span className="mp-blob mp-blob-3" />

        <div className="mp-card">
          <span className="mp-chip">
            <span className="pulse" />
            client-side · no backend
          </span>

          <div className="mp-logo-wrap">
            <img src={logo} alt="QR Code Builder" />
          </div>

          <h1 className="mp-title">
            QR Code <span className="grad">Builder</span>
          </h1>
          <p className="mp-sub">
            {justSignedIn ? "Signed in — preparing your workspace…" : "Preparing your workspace, please wait…"}
          </p>

          <div className="mp-loader" aria-hidden="true" />
          <div className="mp-loading-text">
            Loading<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
          </div>
        </div>
      </div>
    </>
  );
}
