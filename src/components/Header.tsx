import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Page } from "../types";
import AuthModal from "./AuthModal";
import OrthodoxCross from "./OrthodoxCross";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isScrolled: boolean;
  onOpenSuggestion: () => void;
  /** Number of chants in the in-progress booklet. */
  bookletCount?: number;
  /** True when the booklet bubble is minimized into the navbar. */
  bookletMinimized?: boolean;
  /** Reopen the booklet bubble from the navbar icon. */
  onExpandBooklet?: () => void;
}

type AccountAction = "profile" | "saved" | "suggestion" | "settings" | "admin" | "signout";

const Header = ({
  currentPage,
  onNavigate,
  isScrolled,
  onOpenSuggestion,
  bookletCount = 0,
  bookletMinimized = false,
  onExpandBooklet,
}: HeaderProps) => {
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
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // The wordmark goes home, so the desktop nav leaves "Home" out; the phone menu keeps it.
  const navItems: { page: Page; label: string }[] = [
    { page: "library", label: "Library" },
    { page: "booklets", label: "Booklets" },
    { page: "services", label: "Services" },
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

  const handleAccountAction = (action: AccountAction) => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);

    if (action === "admin") return onNavigate("admin");
    if (action === "saved") return onNavigate("saved-items");
    if (action === "suggestion") return onOpenSuggestion();
    if (action === "profile") return window.alert("Profile page coming soon.");
    if (action === "settings") return window.alert("Account settings coming soon.");
    if (action === "signout") return signOut();
  };

  const accountItems: { action: AccountAction; label: string; show?: boolean }[] = [
    { action: "profile", label: "Profile" },
    { action: "saved", label: "Saved items" },
    { action: "suggestion", label: "Suggest a chant" },
    { action: "settings", label: "Settings" },
    { action: "admin", label: "Admin", show: isAdminAuthed },
  ];

  const accountMenuItems = (
    <>
      {accountItems
        .filter((item) => item.show !== false)
        .map((item) => (
          <button
            key={item.action}
            type="button"
            onClick={() => handleAccountAction(item.action)}
            className="account-menu-item"
          >
            <span>{item.label}</span>
          </button>
        ))}
    </>
  );

  const accountTrigger = (
    <button
      type="button"
      onClick={handleAccountClick}
      className="site-login account-trigger"
      aria-expanded={accountMenuOpen}
      aria-haspopup="menu"
    >
      <span aria-hidden="true" className="account-trigger__icon">
        <span className="account-trigger__bar" />
        <span className="account-trigger__bar" />
        <span className="account-trigger__bar" />
      </span>
      <span>Account</span>
    </button>
  );

  return (
    <>
      <header className={`site-header ${isScrolled || mobileMenuOpen ? "is-scrolled" : ""} ${
          currentPage === "home" && !isScrolled && !mobileMenuOpen ? "on-dark" : ""
        }`}>
        <div className="site-header__inner">
          <button type="button" className="site-brand" onClick={() => handleNavClick("home")} aria-label="Psaltikon Library, home">
            <OrthodoxCross size={22} />
            <span className="site-brand__name">Psaltikon Library</span>
          </button>

          <div className="site-header__right">
            <nav className="site-nav" aria-label="Main">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  type="button"
                  className={`site-nav__link ${currentPage === item.page ? "active" : ""}`}
                  aria-current={currentPage === item.page ? "page" : undefined}
                  onClick={() => handleNavClick(item.page)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="site-header__auth">
              {isUserAuthed ? (
                <div ref={accountMenuRef} className="account-menu-wrap">
                  {accountTrigger}

                  <AnimatePresence>
                    {accountMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="account-menu-panel"
                        role="menu"
                      >
                        <div className="account-menu-list">
                          {accountMenuItems}
                          <button
                            type="button"
                            onClick={() => handleAccountAction("signout")}
                            className="account-menu-item account-menu-item--signout"
                          >
                            <span>Sign out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button type="button" className="site-login" onClick={() => openAuth("login")}>
                  Log in
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {bookletCount > 0 && bookletMinimized && (
              <motion.button
                type="button"
                className="booklet-nav-btn"
                onClick={onExpandBooklet}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-label={`Open booklet builder, ${bookletCount} selected`}
                title="Booklet builder"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2z" />
                  <path d="M4 20a2 2 0 0 1 2-2h14" />
                </svg>
                <span className="booklet-nav-btn__count">{bookletCount}</span>
              </motion.button>
            )}
          </AnimatePresence>

          <button
            type="button"
            className="menu-button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="site-mobile-nav"
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.nav
              id="site-mobile-nav"
              className="mobile-nav"
              aria-label="Main"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {[{ page: "home" as Page, label: "Home" }, ...navItems].map((item) => (
                <button
                  key={item.page}
                  type="button"
                  className={`mobile-nav-link ${currentPage === item.page ? "active" : ""}`}
                  aria-current={currentPage === item.page ? "page" : undefined}
                  onClick={() => handleNavClick(item.page)}
                >
                  {item.label}
                </button>
              ))}

              <div className="mobile-auth">
                {isUserAuthed ? (
                  <>
                    {accountItems
                      .filter((item) => item.show !== false)
                      .map((item) => (
                        <button
                          key={item.action}
                          type="button"
                          className="mobile-auth__item"
                          onClick={() => handleAccountAction(item.action)}
                        >
                          {item.label}
                        </button>
                      ))}
                    <button type="button" className="mobile-auth__item" onClick={signOut}>
                      Sign out
                    </button>
                  </>
                ) : (
                  <button type="button" className="mobile-auth__item" onClick={() => openAuth("login")}>
                    Log in
                  </button>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

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
