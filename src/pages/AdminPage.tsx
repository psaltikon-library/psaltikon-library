import { useEffect } from "react";
import { Page } from "../types";

type Props = {
  onNavigate: (page: Page) => void;
};

export default function AdminPage({ onNavigate }: Props) {
  useEffect(() => {
    const ok = localStorage.getItem("psaltikon_admin_authed") === "true";
    if (!ok) onNavigate("home"); // or "admin-login" if you prefer
  }, [onNavigate]);

  const logout = () => {
    localStorage.removeItem("psaltikon_admin_authed");
    onNavigate("home");
  };

  return (
    <div className="container admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="section-title" style={{ marginBottom: 6 }}>Admin Dashboard</h1>
          <p className="section-subtitle" style={{ marginTop: 0 }}>
            (UI only for now) Manage chants + users later.
          </p>
        </div>

        <div className="admin-page__actions">
          <button className="button button-secondary" onClick={() => onNavigate("library")}>
            Go to Library
          </button>
          <button className="button button-primary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card admin-page__card">
        <div className="admin-page__card-title">Next step</div>
        <div className="admin-page__card-text">
          Add tabs: Chants (Upload Chant) + Users (toggle admin). We’ll wire DB later.
        </div>
      </div>
    </div>
  );
}