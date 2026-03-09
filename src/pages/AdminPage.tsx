import { useEffect } from "react";
import { Page } from "../types";

type Props = {
  onNavigate: (page: Page) => void;
};

export default function AdminPage({ onNavigate }: Props) {
  useEffect(() => {
    const ok = localStorage.getItem("psaltikon_admin_authed") === "true";
    if (!ok) onNavigate("home"); // kicks out if not authed
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
            Manage chants + users (UI first, DB later).
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="button button-secondary" onClick={() => onNavigate("library")}>
            Back to Library
          </button>
          <button className="button button-primary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Coming next</div>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9 }}>
          <li>Chants tab + “Upload Chant”</li>
          <li>Users tab + toggle admin</li>
        </ul>
      </div>
    </div>
  );
}