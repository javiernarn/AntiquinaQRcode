import { useCallback, useRef, useState } from "react";

// Lightweight toast queue: push(message, variant) shows a line for
// `duration` ms, then removes itself. No provider needed — each caller
// that needs toasts (currently just BuilderPage) mounts its own instance
// and renders <ToastStack toasts={toasts} /> wherever it wants them.
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, variant = "default", duration = 2600) => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, message, variant }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return { toasts, push, dismiss };
}
