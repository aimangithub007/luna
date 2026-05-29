import { ChatViewer } from "../components/ChatViewer";

export function ChatPage() {
  return (
    <div className="pg" style={{ height: "calc(100vh - var(--hh) - 1px)", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Header Bar */}
      <div style={{ 
        padding: "10px 20px", 
        borderBottom: "1px solid var(--bd)", 
        display: "flex", 
        alignItems: "center", 
        gap: 15,
        background: "var(--s1)"
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Hermes AI Chat</div>
          <div style={{ fontSize: 11, color: "var(--t3)" }}>Interactive Terminal Interface</div>
        </div>
      </div>

      <ChatViewer mini={false} />
    </div>
  );
}
