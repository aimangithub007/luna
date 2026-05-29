import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { RefreshCw } from "lucide-react";

export function ChatViewer({ mini = false }) {
  const termRef = useRef(null);
  const xtermInstance = useRef(null);
  const wsRef = useRef(null);
  const [status, setStatus] = useState("disconnected");
  const [errorMsg, setErrorMsg] = useState(null);

  function connect() {
    if (!xtermInstance.current) return;
    const term = xtermInstance.current;

    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatus("connecting");
    setErrorMsg(null);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = "127.0.0.1:8119";
    const token = localStorage.getItem("hermes_token") || "";
    const wsUrl = `${protocol}//${host}/api/pty?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      setErrorMsg(null);
      try {
        ws.send(`\x1b[RESIZE:${term.cols};${term.rows}]`);
      } catch (_) {}
    };

    ws.onmessage = (ev) => {
      term.write(new Uint8Array(ev.data));
    };

    ws.onclose = (ev) => {
      setStatus("disconnected");
      if (ev.code === 4401) setErrorMsg("Auth gagal (4401). Silakan login ulang.");
      else if (ev.code === 4403) setErrorMsg("Forbidden (4403). Cek server.py chat flag.");
      else if (ev.code === 1011) setErrorMsg("Hermes TUI gagal start (1011). Cek logs backend.");
    };

    ws.onerror = () => {
      setStatus("error");
      setErrorMsg("Koneksi WebSocket gagal (127.0.0.1:8119).");
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  useEffect(() => {
    if (xtermInstance.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#0b0e1a",
        foreground: "#dde8ff",
        cursor: "#5eead4",
        selectionBackground: "rgba(94, 234, 212, 0.3)",
      },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: mini ? 11 : 13,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    xtermInstance.current = term;

    const timer = setTimeout(() => {
      if (!termRef.current) return;
      term.open(termRef.current);
      
      // Delay fit to ensure transition or layout is finished
      setTimeout(() => {
        try {
          fitAddon.fit();
          connect();
        } catch (_) {}
      }, 200);

      const ro = new ResizeObserver(() => {
        if (termRef.current?.offsetParent !== null) {
          // Use a small delay for smoother fit during transitions
          requestAnimationFrame(() => {
            try {
              fitAddon.fit();
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(`\x1b[RESIZE:${term.cols};${term.rows}]`);
              }
            } catch (_) {}
          });
        }
      });
      ro.observe(termRef.current);
      term._ro = ro;
    }, 100);

    return () => {
      if (term._ro) term._ro.disconnect();
    };
  }, []);

  const statusColors = {
    connected: "#4ade80",
    connecting: "#fbbf24",
    disconnected: "#94a3b8",
    error: "#f87171"
  };

  return (
    <div style={{ 
      height: "100%", 
      display: "flex", 
      flexDirection: "column",
      background: "var(--bg)",
      overflow: "hidden"
    }}>
      {/* Header mini info */}
      <div style={{ 
        padding: "8px 12px", 
        borderBottom: "1px solid var(--bd)", 
        display: "flex", 
        alignItems: "center", 
        gap: 12,
        background: "var(--s1)",
        flexShrink: 0
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColors[status] }} />
          <span style={{ fontSize: 10, color: "var(--t2)", textTransform: "uppercase", fontWeight: 700 }}>{status}</span>
        </div>
        <button onClick={connect} style={{ background: "none", border: "none", color: "var(--ac)", cursor: "pointer", display: "flex" }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: "6px 12px", background: "var(--red)", color: "var(--re)", fontSize: 10, borderBottom: "1px solid var(--bd)" }}>
          {errorMsg}
        </div>
      )}

      <div 
        ref={termRef} 
        style={{ 
          flex: 1, 
          padding: "10px 10px 15px 10px", // More bottom padding
          background: "#0b0e1a",
          overflow: "hidden"
        }} 
      />
      
      <style>{`
        .xterm-viewport::-webkit-scrollbar { width: 5px; }
        .xterm-viewport::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }
      `}</style>
    </div>
  );
}
