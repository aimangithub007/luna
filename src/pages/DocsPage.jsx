import { DocsViewer } from "../components/DocsViewer";

export function DocsPage() {
  return (
    <div className="pg" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - var(--hh) - 1px)" }}>
      {/* Top Header Navigation - Matching Official Docs style */}
      <div style={{ 
        height: "50px", 
        borderBottom: "1px solid var(--bd)", 
        background: "var(--bg)", 
        display: "flex", 
        alignItems: "center", 
        padding: "0 24px",
        gap: "32px",
        zIndex: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.2px" }}>
          <img src="/hermes-logo.png" style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--bd)" }} alt="" />
          <span style={{ fontSize: "15px" }}>Hermes</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <DocsViewer />
      </div>
    </div>
  );
}
