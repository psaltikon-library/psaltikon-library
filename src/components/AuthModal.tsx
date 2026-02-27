import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type AuthMode = "login" | "signup";

type AuthModalProps = {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
};

export default function AuthModal({
  open,
  mode,
  onClose,
  onSwitchMode,
}: AuthModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isSignup = mode === "signup";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          {/* backdrop */}
          <button
            type="button"
            className="auth-modal-backdrop"
            onClick={onClose}
            aria-label="Close modal"
          />

          {/* modal */}
          <motion.div
            className="auth-modal"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="auth-modal-header">
              <div className="auth-modal-brand">
                <div className="auth-modal-icon">☦</div>
                <div>
                  <div className="auth-modal-app">Psaltikon Library</div>
                  <div className="auth-modal-title">
                    {isSignup ? "Create an account" : "Welcome back"}
                  </div>
                  <div className="auth-modal-subtitle">
                    {isSignup ? "Create an account to continue." : "Log in to continue."}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="auth-modal-close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form
              className="auth-modal-body"
              onSubmit={(e) => {
                e.preventDefault();
                // UI only for now
              }}
            >
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input className="auth-input" type="email" required placeholder="you@example.com" />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input className="auth-input" type="password" required placeholder="••••••••" />
              </div>

              {isSignup && (
                <div className="auth-field">
                  <label className="auth-label">Confirm password</label>
                  <input className="auth-input" type="password" required placeholder="••••••••" />
                </div>
              )}

              <div className="auth-row">
                <label className="auth-remember">
                  <input type="checkbox" />
                  Remember me
                </label>

                {!isSignup && (
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => alert("Forgot password (UI only).")}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <button type="submit" className="auth-submit">
                {isSignup ? "Create Account" : "Log In"}
              </button>

              <div className="auth-switch">
                {isSignup ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="auth-link"
                      onClick={() => onSwitchMode("login")}
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    Don’t have an account?{" "}
                    <button
                      type="button"
                      className="auth-link"
                      onClick={() => onSwitchMode("signup")}
                    >
                      Create an account
                    </button>
                  </>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}