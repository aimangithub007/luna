import { useState } from "react";
import {
  RefreshCw,
  Zap,
  Shield,
  HardDrive,
  Cpu,
  ExternalLink,
} from "lucide-react";
import { api } from "../lib/api";

export function SettingsPage() {
  const [loading, setLoading] = useState(null);

  const handleAction = async (action, fn) => {
    if (!confirm(`Are you sure you want to ${action}?`)) return;
    setLoading(action);
    try {
      await fn();
      alert(`${action} triggered successfully.`);
    } catch (e) {
      alert(`Failed to ${action}: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="pg"
      style={{
        padding: 24,
        maxWidth: 1000,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      <header>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          Dashboard Settings
        </h1>
        <p style={{ color: "var(--t3)", fontSize: 14 }}>
          Manage your Luna - Hermes Dashboard configuration and system
          maintenance.
        </p>
      </header>

      {/* System Maintenance Section */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <Shield size={20} color="var(--ac)" />
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>System Maintenance</h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {/* Restart Gateway */}
          <div
            className="card"
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 15,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--acd)",
                  display: "flex",
                  alignItems: "center",
                  justifyCenter: "center",
                  color: "var(--ac)",
                }}
              >
                <RefreshCw size={20} style={{ margin: "0 auto" }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  Restart Gateway
                </div>
                <div style={{ fontSize: 12, color: "var(--t3)" }}>
                  Reinitialize the API bridge and connections.
                </div>
              </div>
            </div>
            <button
              className="btn btg"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() =>
                handleAction("Restart Gateway", api.restartGateway)
              }
              disabled={loading === "Restart Gateway"}
            >
              {loading === "Restart Gateway" ? (
                <RefreshCw size={14} className="spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              <span>Restart Now</span>
            </button>
          </div>

          {/* Update Hermes */}
          <div
            className="card"
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 15,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(96,165,250,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyCenter: "center",
                  color: "var(--bl)",
                }}
              >
                <Zap size={20} style={{ margin: "0 auto" }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  Update Hermes
                </div>
                <div style={{ fontSize: 12, color: "var(--t3)" }}>
                  Fetch latest updates from the repository.
                </div>
              </div>
            </div>
            <button
              className="btn btp"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => handleAction("Update Hermes", api.updateHermes)}
              disabled={loading === "Update Hermes"}
            >
              {loading === "Update Hermes" ? (
                <RefreshCw size={14} className="spin" />
              ) : (
                <Zap size={14} />
              )}
              <span>Update Version</span>
            </button>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <HardDrive size={20} color="var(--pu)" />
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            Instance Information
          </h2>
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 20px",
              background: "var(--s2)",
              borderBottom: "1px solid var(--bd)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <span style={{ color: "var(--t3)" }}>Instance Name</span>
            <span style={{ fontWeight: 600 }}>Hermes Production</span>
          </div>
          <div
            style={{
              padding: "12px 20px",
              background: "transparent",
              borderBottom: "1px solid var(--bd)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <span style={{ color: "var(--t3)" }}>Version</span>
            <span style={{ fontWeight: 600 }}>v0.1.0-alpha</span>
          </div>
          <div
            style={{
              padding: "12px 20px",
              background: "var(--s2)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <span style={{ color: "var(--t3)" }}>Dashboard Build</span>
            <span style={{ fontWeight: 600 }}>2026-05-17.04</span>
          </div>
        </div>
      </section>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
