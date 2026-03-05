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
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 6 }}>Admin Dashboard</h1>
          <p className="section-subtitle" style={{ marginTop: 0 }}>
            (UI only for now) Manage chants + users later.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="button button-secondary" onClick={() => onNavigate("library")}>
            Go to Library
          </button>
          <button className="button button-primary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Next step</div>
        <div style={{ opacity: 0.85 }}>
          Add tabs: Chants (Upload Chant) + Users (toggle admin). We’ll wire DB later.
        </div>
      </div>
    </div>
  );
}