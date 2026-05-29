import { useState, useRef, useEffect } from "react";
import { 
  Package, Terminal as TerminalIcon, Copy, Play, 
  CheckCircle, Server, Monitor, Cpu, ChevronRight, 
  Info, AlertCircle, Download, Zap, X, Globe
} from "lucide-react";

export function InstallationPage() {
  const [installOutput, setInstallOutput] = useState([]);
  const [extensionOutput, setExtensionOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTerminal, setActiveTerminal] = useState(null); // 'install', 'extension', or null
  const activeTerminalRef = useRef(null);
  const [status, setStatus] = useState("disconnected");
  const [pendingCommand, setPendingCommand] = useState(null); // { cmd, label, section }
  
  const terminalEndRef = useRef(null);
  const wsRef = useRef(null);

  const connectTerminal = () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timed out (10s)"));
      }, 10000);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        clearTimeout(timeout);
        resolve(wsRef.current);
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
        ? `${window.location.hostname}:8119` 
        : window.location.host;
      const token = localStorage.getItem("hermes_token") || "";
      const wsUrl = `${protocol}//${host}/api/pty?token=${encodeURIComponent(token)}&mode=bash`;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer"; // Ensure we get ArrayBuffer instead of Blob
      wsRef.current = ws;

      ws.onopen = () => {
        clearTimeout(timeout);
        setStatus("connected");
        resolve(ws);
      };
      ws.onclose = () => {
        clearTimeout(timeout);
        setStatus("disconnected");
      };
      ws.onerror = (err) => {
        clearTimeout(timeout);
        setStatus("error");
        reject(err);
      };
      
      ws.onmessage = (event) => {
        let text = "";
        if (typeof event.data === 'string') {
          text = event.data;
        } else if (event.data instanceof ArrayBuffer) {
          text = new TextDecoder().decode(event.data);
        } else {
          return;
        }

        if (!text) return;

        const currentActive = activeTerminalRef.current;
        const setOutput = currentActive === 'install' ? setInstallOutput : (currentActive === 'extension' ? setExtensionOutput : null);
        
        if (!setOutput) return;

        setOutput(prev => {
          let newOutput = [...prev];
          // If previous output is empty, start fresh
          if (newOutput.length === 0) newOutput = [""];

          // Process the incoming text chunk
          // First, split by newlines
          const lines = text.split(/\n/);

          lines.forEach((line, i) => {
            if (i > 0) {
              // This part starts a new line
              newOutput.push("");
            }

            // Handle carriage returns within this line segment
            const segments = line.split('\r');
            segments.forEach((segment, j) => {
              if (j > 0) {
                // Only overwrite if specified; standard PTY behavior
                // For simplicity, we only overwrite if the segment is not empty
                if (segment.length > 0) {
                  newOutput[newOutput.length - 1] = segment;
                }
              } else {
                // Append to current line buffer
                newOutput[newOutput.length - 1] += segment;
              }
            });
          });

          // Limit lines to prevent memory bloat (e.g. 500 lines)
          if (newOutput.length > 500) {
            newOutput = newOutput.slice(newOutput.length - 500);
          }

          return newOutput;
        });
      };
    });
  };

  const closeTerminal = (section) => {
    if (activeTerminal === section) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setActiveTerminal(null);
      setIsRunning(false);
      setStatus("disconnected");
    }
  };

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [installOutput, extensionOutput]);

  const ConfirmationModal = ({ isOpen, onConfirm, onCancel, command, label }) => {
    if (!isOpen) return null;
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "pgi 0.3s ease-out"
      }}>
        <div className="card" style={{
          width: 450,
          padding: 24,
          background: "#0C111D",
          border: "1px solid var(--bd)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          gap: 20
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ 
              background: "rgba(240, 68, 56, 0.1)", 
              padding: 10, 
              borderRadius: "50%", 
              color: "#F04438",
              display: "flex"
            }}>
              <AlertCircle size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "white", marginBottom: 6 }}>
                Confirm Command Execution
              </h3>
              <p style={{ color: "var(--t3)", fontSize: 13, lineHeight: 1.5 }}>
                You are about to run a <strong style={{ color: "var(--pu)" }}>real command</strong> on your system. This will perform an actual operation (e.g., git clone).
              </p>
            </div>
          </div>

          <div style={{ 
            background: "black", 
            padding: 12, 
            borderRadius: 8, 
            border: "1px solid var(--bd)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "var(--ac)",
            wordBreak: "break-all"
          }}>
            {command}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button 
              className="btn" 
              style={{ background: "transparent", color: "var(--t3)", border: "1px solid var(--bd)" }}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              className="btn" 
              style={{ background: "#F04438", color: "white", borderColor: "#F04438" }}
              onClick={onConfirm}
            >
              Execute Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  const runCommand = async (cmd, label, section) => {
    if (isRunning) return;

    // Safety logic: Confirm real extension commands
    if (section === 'extension' && !pendingCommand) {
      setPendingCommand({ cmd, label, section });
      return;
    }
    
    // Clear pending if confirmed
    setPendingCommand(null);
    
    // If switching terminals, close previous
    if (activeTerminal && activeTerminal !== section) {
      if (wsRef.current) wsRef.current.close();
    }

    setIsRunning(true);
    setActiveTerminal(section);
    activeTerminalRef.current = section;
    
    if (section === 'install') setInstallOutput([]);
    else setExtensionOutput([]);

    try {
      const ws = await connectTerminal();
      
      let finalShellCmd = cmd;
      
      if (section === 'install') {
        const logFile = `mock-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-install.log`;
        const mockContent = [
          `➜ Initiating safe simulation for ${label}...`,
          `[INFO] Target: ${cmd}`,
          `[INFO] Writing mock installation state to ${logFile}...`,
          `[MOCK] This is a safe ECHO operation only.`,
          `SUCCESS: Log updated successfully.`,
          `\n➜ Setup complete (Simulated).`
        ].join('\\n');
        finalShellCmd = `LOG="${logFile}"; echo -e "${mockContent}" > $LOG && cat $LOG`;

        // Only show manual prompt for Mocks, for Real commands let bash do it
        const displayPrompt = `\x1b[38;2;94;234;212mHermes Luna@local:~\x1b[0m ${cmd}`;
        setInstallOutput(prev => [...prev, displayPrompt]);
      }

      // Small delay to ensure PTY is ready and onmessage is listening
      await new Promise(r => setTimeout(r, 200));
      ws.send(finalShellCmd + "\n");
      
    } catch (error) {
      const errorMsg = `\x1b[31m[ERROR] Failed to connect: ${error.message}\x1b[0m`;
      if (section === 'install') setInstallOutput(prev => [...prev, errorMsg]);
      else setExtensionOutput(prev => [...prev, errorMsg]);
    } finally {
      setTimeout(() => setIsRunning(false), 2000);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const FormatLine = ({ line }) => {
    // Strip [K (Erase Line) and other unsupported non-color sequences to avoid clutter
    const cleanLine = line.replace(/\x1b\[[0-9;]*K/g, '');
    const parts = cleanLine.split(/(\x1b\[[0-9;]*m)/);
    let currentColor = 'var(--t1)';
    let isBold = false;

    return (
      <div style={{ marginBottom: 4, minHeight: 18 }}>
        {parts.map((part, i) => {
          if (part.startsWith('\x1b[')) {
            if (part === '\x1b[0m') { currentColor = 'var(--t1)'; isBold = false; }
            else if (part.includes('32m')) currentColor = '#4ADE80';
            else if (part.includes('33m')) currentColor = '#FBBF24';
            else if (part.includes('34m')) currentColor = '#60A5FA';
            else if (part.includes('38;2;94;234;212m')) currentColor = '#5EEAD4';
            else if (part.includes('31m')) currentColor = '#F87171';
            else if (part.includes('1;37m')) { currentColor = '#FFFFFF'; isBold = true; }
            else if (part.includes('1;32m')) { currentColor = '#4ADE80'; isBold = true; }
            else if (part.includes('2m')) currentColor = 'var(--t3)';
            return null;
          }
          return (
            <span key={i} style={{ color: currentColor, fontWeight: isBold ? 600 : 400 }}>
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  const TerminalPanel = ({ section, output, isVisible, onClear, onClose }) => {
    if (!isVisible) return null;
    return (
      <div className="card" style={{ 
        animation: "pgi 0.4s ease-out", 
        background: "#06080F", 
        border: "1px solid var(--bd)", 
        borderRadius: 12, 
        overflow: "hidden", 
        marginTop: 16,
        marginBottom: 8,
        minHeight: 250, 
        display: "flex", 
        flexDirection: "column" 
      }}>
        <div style={{ background: "var(--s1)", borderBottom: "1px solid var(--bd)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F56" }}></div>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }}></div>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F" }}></div>
            </div>
            <span style={{ fontSize: 12, color: "var(--t3)", display: "flex", alignItems: "center", gap: 6, marginLeft: 10 }}>
              <TerminalIcon size={12} />
              {section === 'install' ? 'Installation Terminal' : 'Extension Terminal'} (Active)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button 
              onClick={onClear}
              className="nav-icon-btn"
              style={{ fontSize: 11, color: "var(--t3)", display: "flex", alignItems: "center", gap: 4, width: "auto", padding: "0 8px" }}
              title="Clear Output"
            >
              Clear
            </button>
            <button 
              onClick={() => onClose(section)}
              className="nav-icon-btn" 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                background: "rgba(255, 95, 86, 0.1)", 
                color: "#FF5F56", 
                border: "1px solid rgba(255, 95, 86, 0.2)",
                width: 28,
                height: 28
              }}
              title="Kill & Close Terminal"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div style={{ padding: 16, flex: 1, overflowY: "auto", maxHeight: 400, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
          {output.length === 0 && (
            <div style={{ color: "var(--t3)", fontStyle: "italic", opacity: 0.7, animation: "pulse 2s infinite" }}>
              {status === 'connected' ? '➜ System shell ready. Executing...' : ' Establishing secure connection...'}
            </div>
          )}
          {output.map((line, i) => (
            <FormatLine key={i} line={line} />
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>
    );
  };

  return (
    <div className="pg" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
      <ConfirmationModal 
        isOpen={!!pendingCommand}
        command={pendingCommand?.cmd}
        label={pendingCommand?.label}
        onCancel={() => setPendingCommand(null)}
        onConfirm={() => runCommand(pendingCommand.cmd, pendingCommand.label, pendingCommand.section)}
      />
      <div style={{ animation: "pgi 0.4s ease-out" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--t1)", marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Package size={32} className="ba" style={{ padding: 6, borderRadius: 8 }} />
          Installation & Setup
        </h1>
        <p style={{ color: "var(--t3)", fontSize: 15, lineHeight: 1.6 }}>
          Hermes is a self-improving AI agent designed to run anywhere. 
          Follow the instructions below to get started on your platform of choice.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Linux / macOS */}
        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, border: '1px solid var(--bd2)' }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Server size={18} style={{ color: "var(--bl)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--t1)" }}>Unix (Linux, macOS, WSL2)</h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5 }}>
            The standard one-liner installer for most POSIX-compliant systems.
          </p>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, border: "1px solid var(--bd)", padding: "12px 14px", position: "relative" }}>
            <code className="mono" style={{ fontSize: 12, color: "var(--ac)", display: "block", paddingRight: 40 }}>
              curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
            </code>
            <button 
              onClick={() => copyToClipboard('curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash')}
              className="nav-icon-btn" 
              style={{ position: "absolute", right: 8, top: 10 }}
              title="Copy Command"
            >
              <Copy size={14} />
            </button>
          </div>
          <button 
            className="btn btp" 
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => runCommand('curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash', 'Unix', 'install')}
            disabled={isRunning}
          >
            <Play size={14} />
            {isRunning && activeTerminal === 'install' ? 'Running Simulation...' : 'Run Mock Install'}
          </button>
        </div>

        {/* Windows */}
        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, border: '1px solid var(--bd2)' }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Monitor size={18} style={{ color: "var(--bl)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--t1)" }}>Windows (PowerShell)</h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5 }}>
            Native Windows support (Beta). Installs full environment including Python & Node.
          </p>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, border: "1px solid var(--bd)", padding: "12px 14px", position: "relative" }}>
            <code className="mono" style={{ fontSize: 12, color: "var(--ac)", display: "block", paddingRight: 40 }}>
              irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1 | iex
            </code>
            <button 
              onClick={() => copyToClipboard('irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1 | iex')}
              className="nav-icon-btn" 
              style={{ position: "absolute", right: 8, top: 10 }}
              title="Copy Command"
            >
              <Copy size={14} />
            </button>
          </div>
          <button 
            className="btn btg" 
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => runCommand('irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1 | iex', 'Windows', 'install')}
            disabled={isRunning}
          >
            <Play size={14} />
            {isRunning && activeTerminal === 'install' ? 'Running Simulation...' : 'Run Mock Install (PowerShell)'}
          </button>
        </div>
      </div>

      {/* Terminal for Installation Section */}
      <TerminalPanel 
        section="install"
        isVisible={activeTerminal === 'install'}
        output={installOutput}
        onClear={() => setInstallOutput([])}
        onClose={closeTerminal}
      />

      {/* Custom Component Section */}
      <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, border: '1px solid var(--bd2)', background: 'linear-gradient(to right, rgba(167, 139, 250, 0.05), transparent)' }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Download size={18} style={{ color: "var(--pu)" }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--t1)" }}>Custom Extension: Pi Mono Mock</h2>
        </div>
        <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5 }}>
          Enhance your Hermes instance with the Pi Mono Mock extension. This repository contains specialized mock components for development and testing.
        </p>
        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, border: "1px solid var(--bd)", padding: "12px 14px", position: "relative" }}>
          <code className="mono" style={{ fontSize: 12, color: "var(--ac)", display: "block", paddingRight: 40 }}>
            git clone https://github.com/aimangithub007/pi-mono-mock.git
          </code>
          <button 
            onClick={() => copyToClipboard('git clone https://github.com/aimangithub007/pi-mono-mock.git')}
            className="nav-icon-btn" 
            style={{ position: "absolute", right: 8, top: 10 }}
            title="Copy Command"
          >
            <Copy size={14} />
          </button>
        </div>
        <button 
          className="btn btp" 
          style={{ width: "fit-content", background: "var(--pu)", borderColor: "var(--pu)", color: "white" }}
          onClick={() => runCommand('git clone https://github.com/aimangithub007/pi-mono-mock.git', 'Pi-Mono-Mock', 'extension')}
          disabled={isRunning}
        >
          <Play size={14} />
          {isRunning && activeTerminal === 'extension' ? 'Cloning Repo...' : 'Run Clone Real'}
        </button>
      </div>

      {/* Terminal for Extension Section */}
      <TerminalPanel 
        section="extension"
        isVisible={activeTerminal === 'extension'}
        output={extensionOutput}
        onClear={() => setExtensionOutput([])}
        onClose={closeTerminal}
      />

      {/* Post Install Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 16, background: "rgba(94, 234, 212, 0.03)", border: "1px solid rgba(94, 234, 212, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Cpu size={16} style={{ color: "var(--ac)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>Self-Improving Loop</span>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--t3)", lineHeight: 1.5 }}>
            Hermes builds a deepening model of who you are across sessions and improves skills during use.
          </p>
        </div>
        <div className="card" style={{ padding: 16, background: "rgba(96, 165, 250, 0.03)", border: "1px solid rgba(96, 165, 250, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Globe size={16} style={{ color: "var(--bl)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>Run Anywhere</span>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--t3)", lineHeight: 1.5 }}>
            Deploy on a $5 VPS, GPU cluster, or serverless. Talk to it from Telegram, Discord, or CLI.
          </p>
        </div>
        <div className="card" style={{ padding: 16, background: "rgba(167, 139, 250, 0.03)", border: "1px solid rgba(167, 139, 250, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Zap size={16} style={{ color: "var(--pu)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>No Code Changes</span>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--t3)", lineHeight: 1.5 }}>
            Switch between 200+ models via OpenRouter, Nous Portal, or local endpoints seamlessly.
          </p>
        </div>
      </div>
    </div>
  );
}

