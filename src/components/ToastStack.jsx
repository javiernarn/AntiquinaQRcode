import React from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  default: Info,
};

// Fixed-position stack of transient status messages, used to confirm
// actions (saved, downloaded, copied…) without interrupting the flow
// with a blocking dialog.
export default function ToastStack({ toasts }) {
  if (!toasts.length) return null;

  return (
    <>
      <style>{`
        .toast-stack{
          position: fixed;
          top: calc(16px + env(safe-area-inset-top));
          right: 16px;
          z-index: 200;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: min(340px, calc(100vw - 32px));
          pointer-events: none;
        }
        .toast{
          display:flex; align-items:flex-start; gap:9px;
          background: rgba(17,20,27,0.96);
          border:1px solid var(--border-strong);
          border-radius: 11px;
          padding: 11px 13px;
          box-shadow: var(--shadow);
          font-size: 12.5px;
          color: var(--text);
          animation: toast-in 0.22s cubic-bezier(0.22,1,0.36,1) both;
        }
        .toast svg{ flex-shrink:0; margin-top:1px; }
        .toast.success svg{ color: var(--accent); }
        .toast.warning svg{ color: var(--accent-3); }
        .toast.default svg{ color: var(--accent-2); }
        @keyframes toast-in{
          from{ opacity:0; transform: translateY(-8px) scale(0.98); }
          to{ opacity:1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce){ .toast{ animation:none; } }
        @media (max-width: 640px){
          .toast-stack{ left: 16px; right: 16px; max-width: none; align-items: stretch; }
        }
      `}</style>
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant] || ICONS.default;
          return (
            <div className={"toast " + (t.variant || "default")} key={t.id}>
              <Icon size={15} />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
