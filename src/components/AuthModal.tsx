import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../lib/supabase";

type AuthMode = "login" | "signup";

type AuthModalProps = {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
};

export default function AuthModal({ open, mode, onClose, onSwitchMode }: AuthModalProps) {
  const isSignup = mode === "signup";

  // LOGIN fields (username or email + password)
  const [identifier, setIdentifier] = useState(""); // username OR email
  const [password, setPassword] = useState("");

  // SIGNUP fields
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  // UX
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const resetFields = () => {
    setIdentifier("");
    setPassword("");

    setSignupFirstName("");
    setSignupLastName("");
    setSignupUsername("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirmPassword("");

    setShowPassword(false);
    setShowSignupPassword(false);
    setShowSignupConfirmPassword(false);
    setIsSubmitting(false);
    setAuthError("");
  };

  // ESC to close
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        resetFields();
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  // Clear fields when modal closes
  useEffect(() => {
    if (!open) resetFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Clear fields when switching mode
  useEffect(() => {
    if (!open) return;
    resetFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, open]);

  const signupPasswordsMatch = useMemo(() => {
    if (!isSignup) return true;
    if (!signupPassword || !signupConfirmPassword) return true;
    return signupPassword === signupConfirmPassword;
  }, [isSignup, signupPassword, signupConfirmPassword]);

  const syncLegacyAuthFlags = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      localStorage.removeItem("psaltikon_user_authed");
      localStorage.removeItem("psaltikon_admin_authed");
      return;
    }

    localStorage.setItem("psaltikon_user_authed", "true");

    const { data: profile } = await supabase
      .from("profiles")
      .select("admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.admin) {
      localStorage.setItem("psaltikon_admin_authed", "true");
    } else {
      localStorage.removeItem("psaltikon_admin_authed");
    }
  };

  // Shared inline styles to force full-width inputs (fixes the shrink issue)
  const passwordWrapStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
  };

  const eyeBtnStyle: React.CSSProperties = {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    width: 30,
    height: 30,
    borderRadius: 10,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    opacity: 0.9,
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`auth-modal-overlay ${isSignup ? "auth-modal-overlay--signup" : "auth-modal-overlay--login"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="auth-modal-backdrop"
            onClick={() => {
              resetFields();
              onClose();
            }}
            aria-label="Close modal"
          />

          <motion.div
            className={`auth-modal ${isSignup ? "auth-modal--signup" : "auth-modal--login"}`}
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
                    {isSignup ? "Create an account to continue." : "Log in with your email and password."}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetFields();
                  onClose();
                }}
                className="auth-modal-close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form
              className="auth-modal-body"
              onSubmit={async (e) => {
                e.preventDefault();
                setAuthError("");
                setIsSubmitting(true);

                try {
                  if (!isSignup) {
                    const trimmedIdentifier = identifier.trim().toLowerCase();

                    const { error } = await supabase.auth.signInWithPassword({
                      email: trimmedIdentifier,
                      password,
                    });

                    if (error) {
                      setAuthError(error.message || "Unable to log in.");
                      setIsSubmitting(false);
                      return;
                    }

                    await syncLegacyAuthFlags();
                    resetFields();
                    onClose();
                    window.location.reload();
                    return;
                  }

                  if (!signupPasswordsMatch) {
                    setAuthError("Passwords do not match.");
                    setIsSubmitting(false);
                    return;
                  }

                  const trimmedEmail = signupEmail.trim().toLowerCase();
                  const trimmedUsername = signupUsername.trim();
                  const trimmedFirstName = signupFirstName.trim();
                  const trimmedLastName = signupLastName.trim();

                  const { data, error } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: signupPassword,
                    options: {
                      data: {
                        first_name: trimmedFirstName,
                        last_name: trimmedLastName,
                        username: trimmedUsername,
                      },
                    },
                  });

                  if (error) {
                    setAuthError(error.message || "Unable to create account.");
                    setIsSubmitting(false);
                    return;
                  }

                  const userId = data.user?.id;

                  if (userId) {
                    const { error: profileError } = await supabase.from("profiles").upsert({
                      id: userId,
                      username: trimmedUsername,
                      first_name: trimmedFirstName || null,
                      last_name: trimmedLastName || null,
                      admin: false,
                    });

                    if (profileError) {
                      setAuthError(profileError.message || "Account created, but profile setup failed.");
                      setIsSubmitting(false);
                      return;
                    }
                  }

                  await syncLegacyAuthFlags();
                  resetFields();
                  onClose();
                  window.location.reload();
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Something went wrong.";
                  setAuthError(message);
                  setIsSubmitting(false);
                }
              }}
            >
              {/* LOGIN MODE */}
              {!isSignup && (
                <>
                  <div className="auth-field">
                    <label className="auth-label">Email</label>
                    <input
                      className="auth-input"
                      type="text"
                      required
                      placeholder="you@example.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <div style={passwordWrapStyle}>
                      <input
                        className="auth-input"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        style={{ paddingRight: 44, width: "100%" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide" : "Show"}
                        style={eyeBtnStyle}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <div className="auth-row">
                    <label className="auth-remember">
                      <input type="checkbox" />
                      Remember me
                    </label>

                    <button
                      type="button"
                      className="auth-link"
                      onClick={() => alert("Forgot password (UI only).")}
                    >
                      Forgot password?
                    </button>
                  </div>
                </>
              )}

              {/* SIGNUP MODE */}
              {isSignup && (
                <>
                  {/* Order: First, Last, Username, Email */}
                  <div className="auth-field">
                    <label className="auth-label">First name</label>
                    <input
                      className="auth-input"
                      type="text"
                      required
                      placeholder="First name"
                      value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Last name</label>
                    <input
                      className="auth-input"
                      type="text"
                      required
                      placeholder="Last name"
                      value={signupLastName}
                      onChange={(e) => setSignupLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Username</label>
                    <input
                      className="auth-input"
                      type="text"
                      required
                      placeholder="choose a username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Email</label>
                    <input
                      className="auth-input"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <div style={passwordWrapStyle}>
                      <input
                        className="auth-input"
                        type={showSignupPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        autoComplete="new-password"
                        style={{ paddingRight: 44, width: "100%" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((v) => !v)}
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                        title={showSignupPassword ? "Hide" : "Show"}
                        style={eyeBtnStyle}
                      >
                        {showSignupPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Confirm password</label>
                    <div style={passwordWrapStyle}>
                      <input
                        className="auth-input"
                        type={showSignupConfirmPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        style={{ paddingRight: 44, width: "100%" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupConfirmPassword((v) => !v)}
                        aria-label={showSignupConfirmPassword ? "Hide password" : "Show password"}
                        title={showSignupConfirmPassword ? "Hide" : "Show"}
                        style={eyeBtnStyle}
                      >
                        {showSignupConfirmPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    {!signupPasswordsMatch && (
                      <div style={{ marginTop: 6, fontSize: 13, color: "var(--burgundy)" }}>
                        Passwords do not match.
                      </div>
                    )}
                  </div>
                </>
              )}

              {authError && (
                <div style={{ color: "var(--burgundy)", fontSize: 13, marginTop: -4 }}>
                  {authError}
                </div>
              )}
              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting || (isSignup && !signupPasswordsMatch)}
              >
                {isSubmitting ? (isSignup ? "Creating Account..." : "Logging In...") : isSignup ? "Create Account" : "Log In"}
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