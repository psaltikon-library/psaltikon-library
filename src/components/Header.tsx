import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Page } from "../types";
import AuthModal from "./AuthModal";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isScrolled: boolean;
}

const Header = ({ currentPage, onNavigate, isScrolled }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isUserAuthed, setIsUserAuthed] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncAuthState = () => {
      setIsUserAuthed(localStorage.getItem("psaltikon_user_authed") === "true");
      setIsAdminAuthed(localStorage.getItem("psaltikon_admin_authed") === "true");
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems: { page: Page; label: string }[] = [
    { page: "home", label: "Home" },
    { page: "library", label: "Library" },
    { page: "phonetics", label: "Phonetics" },
    { page: "compositions", label: "Compositions" },
    { page: "about", label: "About" },
  ];


  const handleNavClick = (page: Page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const signOut = () => {
    localStorage.removeItem("psaltikon_user_authed");
    localStorage.removeItem("psaltikon_admin_authed");
    setIsUserAuthed(false);
    setIsAdminAuthed(false);
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    // simple + reliable for now
    window.location.reload();
  };

  const handleAccountClick = () => {
    setIsAdminAuthed(localStorage.getItem("psaltikon_admin_authed") === "true");
    setAccountMenuOpen((prev) => !prev);
  };

  const handleAccountAction = (action: string) => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);

    if (action === "admin") {
      onNavigate("admin");
      return;
    }

    if (action === "profile") {
      window.alert("Profile page coming soon.");
      return;
    }

    if (action === "saved") {
      window.alert("Saved items coming soon.");
      return;
    }

    if (action === "settings") {
      window.alert("Account settings coming soon.");
      return;
    }

    if (action === "signout") {
      signOut();
    }
  };

  return (
    <>
      <motion.header
        className={`header ${isScrolled ? "scrolled" : ""}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container">
          <div className="header-inner">
            <motion.div
              className="logo"
              onClick={() => onNavigate("home")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="logo-icon"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                ☦
              </motion.div>
              <div>
                <div className="logo-text">Psaltikon</div>
                <div className="logo-tagline">Sacred Treasury</div>
              </div>
            </motion.div>

            <div className="nav-group">
              <nav className="nav">
                {navItems.map((item, index) => (
                  <motion.span
                    key={item.page}
                    className={`nav-link ${currentPage === item.page ? "active" : ""}`}
                    onClick={() => handleNavClick(item.page)}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                  >
                    {item.label}
                  </motion.span>
                ))}
              </nav>

              {/* Desktop: Login OR Account */}
              {isUserAuthed ? (
                <div ref={accountMenuRef} className="account-menu-wrap">
                  <motion.button
                    type="button"
                    onClick={handleAccountClick}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="auth-btn auth-btn--ghost account-trigger"
                  >
                    <span aria-hidden="true" className="account-trigger__icon">
                      <span className="account-trigger__bar" />
                      <span className="account-trigger__bar" />
                      <span className="account-trigger__bar" />
                    </span>
                    <span>Account</span>
                  </motion.button>

                  <AnimatePresence>
                    {accountMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="account-menu-panel"
                      >
                        <div className="account-menu-label">
                          My Account
                        </div>

                        <div className="account-menu-list">
                          <button
                            type="button"
                            onClick={() => handleAccountAction("profile")}
                            className="account-menu-item"
                          >
                            <span>Profile</span>
                            <span aria-hidden="true">›</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccountAction("saved")}
                            className="account-menu-item"
                          >
                            <span>Saved Items</span>
                            <span aria-hidden="true">›</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccountAction("settings")}
                            className="account-menu-item"
                          >
                            <span>Settings</span>
                            <span aria-hidden="true">›</span>
                          </button>
                          {isAdminAuthed && (
                            <button
                              type="button"
                              onClick={() => handleAccountAction("admin")}
                              className="account-menu-item"
                            >
                              <span>Admin</span>
                              <span aria-hidden="true">›</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAccountAction("signout")}
                            className="account-menu-item account-menu-item--signout"
                          >
                            <span>Sign out</span>
                            <span aria-hidden="true">↗</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  type="button"
                  className="auth-btn auth-btn--ghost"
                  onClick={() => openAuth("login")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Login
                </motion.button>
              )}
            </div>

            <motion.button
              className="menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="menu-icon">
                <motion.span
                  animate={{
                    rotate: mobileMenuOpen ? 45 : 0,
                    y: mobileMenuOpen ? 6 : 0,
                  }}
                />
                <motion.span animate={{ opacity: mobileMenuOpen ? 0 : 1 }} />
                <motion.span
                  animate={{
                    rotate: mobileMenuOpen ? -45 : 0,
                    y: mobileMenuOpen ? -6 : 0,
                  }}
                />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu */}
            <motion.nav
              className="mobile-nav"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {navItems.map((item, index) => (
                <motion.span
                  key={item.page}
                  className={`mobile-nav-link ${currentPage === item.page ? "active" : ""}`}
                  onClick={() => handleNavClick(item.page)}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * index, duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              ))}

              {/* Mobile: Login OR Account at bottom */}
              <div className="mobile-auth">
                {isUserAuthed ? (
                  <>
                    <motion.button
                      type="button"
                      onClick={handleAccountClick}
                      whileTap={{ scale: 0.98 }}
                      className="mobile-auth-btn mobile-auth-btn--ghost account-trigger account-trigger--mobile"
                    >
                      <span aria-hidden="true" className="account-trigger__icon">
                        <span className="account-trigger__bar" />
                        <span className="account-trigger__bar" />
                        <span className="account-trigger__bar" />
                      </span>
                      <span>Account</span>
                    </motion.button>

                    <AnimatePresence>
                      {accountMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          className="account-menu-panel account-menu-panel--mobile"
                        >
                          <button
                            type="button"
                            onClick={() => handleAccountAction("profile")}
                            className="account-menu-item"
                          >
                            <span>Profile</span>
                            <span aria-hidden="true">›</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccountAction("saved")}
                            className="account-menu-item"
                          >
                            <span>Saved Items</span>
                            <span aria-hidden="true">›</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccountAction("settings")}
                            className="account-menu-item"
                          >
                            <span>Settings</span>
                            <span aria-hidden="true">›</span>
                          </button>
                          {isAdminAuthed && (
                            <button
                              type="button"
                              onClick={() => handleAccountAction("admin")}
                              className="account-menu-item"
                            >
                              <span>Admin</span>
                              <span aria-hidden="true">›</span>
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <motion.button
                    type="button"
                    className="mobile-auth-btn mobile-auth-btn--ghost"
                    onClick={() => openAuth("login")}
                    whileTap={{ scale: 0.98 }}
                  >
                    Login
                  </motion.button>
                )}

                {/* Optional: Sign out button directly visible on mobile menu */}
                {isUserAuthed && (
                  <motion.button
                    type="button"
                    className="mobile-auth-btn"
                    onClick={signOut}
                    whileTap={{ scale: 0.98 }}
                    style={{ marginTop: 10 }}
                  >
                    Sign out
                  </motion.button>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={(m) => setAuthMode(m)}
      />
    </>
  );
};

export default Header;