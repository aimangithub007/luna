import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export function TerminalPage() {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (xtermRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#0b0e1a",
        foreground: "#dde8ff",
        cursor: "#5eead4",
        selectionBackground: "rgba(94, 234, 212, 0.3)",
      },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = `127.0.0.1:8119`;
    const token = localStorage.getItem("hermes_token") || "";
    const wsUrl = `${protocol}//${host}/api/pty?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      term.write("\x1b[32mConnected to Hermes Backend PTY\x1b[0m\r\n");
    };

    ws.onmessage = (event) => {
      term.write(new Uint8Array(event.data));
    };

    // Forward terminal input to WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // ResizeObserver for visibility-based fitting
    const ro = new ResizeObserver(() => {
      if (terminalRef.current?.offsetParent !== null) {
        try { fitAddon.fit(); } catch (_) {}
      }
    });
    ro.observe(terminalRef.current);

    return () => {
      // Keep-alive in App.jsx
    };
  }, []);

  return (
    <div className="pg" style={{ padding: 18, display: "flex", flexDirection: "column", height: "calc(100vh - var(--hh) - 1px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, color: "var(--t1)", fontWeight: 600 }}>Interactive Terminal</div>
          <div style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>Full access to Hermes CLI & processes.</div>
        </div>
      </div>
      <div 
        className="card" 
        style={{ flex: 1, padding: 10, background: "#0b0e1a", overflow: "hidden" }}
        ref={terminalRef}
      />
    </div>
  );
}
