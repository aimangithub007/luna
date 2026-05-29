import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { AlertCircle, RefreshCw } from "lucide-react";

export function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [file, setFile] = useState('gateway');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const fetchLogs = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.getLogs(file, 200);
      setLogs(data.lines || []);
      setError(null);
    } catch (e) {
      setError(e.message);
      console.error("Failed fetching logs:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
    const intv = setInterval(fetchLogs, 4000);
    return () => clearInterval(intv);
  }, [file]);

  useEffect(() => {
    if (bottomRef.current && logs.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="pg" style={{padding: 18, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--hh) - 1px)', gap: 10}}>
      <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
        {['gateway', 'agent', 'errors'].map(f => (
          <button key={f} className={`btn ${file === f ? 'btp' : 'btg'}`} onClick={() => setFile(f)}>
            {f.toUpperCase()} LOGS
          </button>
        ))}
        <button className="btn btg" onClick={() => fetchLogs(true)} style={{marginLeft: 'auto'}}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }}/>
        </button>
      </div>

      {error && (
        <div style={{background: 'var(--red)', color: 'var(--re)', padding: '10px 15px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13}}>
          <AlertCircle size={16} />
          <span>Error: {error}</span>
        </div>
      )}

      <div className="card" style={{flex: 1, overflowY: 'auto', padding: 15, background: '#0b0e1a', display: 'flex', flexDirection: 'column'}}>
        {logs.length === 0 && !error && !loading && (
          <div style={{color: "var(--t3)", fontSize: 13, textAlign: 'center', marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center'}}>
            <span>No log entries found in <strong>{file}.log</strong></span>
            <span style={{fontSize: 11, maxWidth: 300, opacity: 0.7}}>Logs are created when Hermes operations occur (e.g. running a chat session or gateway startup).</span>
          </div>
        )}
        
        {loading && logs.length === 0 && <div style={{textAlign: 'center', padding: 40, color: 'var(--t3)'}}>Loading logs...</div>}

        {logs.map((line, i) => {
          let color = '--t2';
          if (line.includes('ERROR') || line.includes('FATAL') || line.includes('CRITICAL')) color = '--re';
          else if (line.includes('INFO') || line.includes('SUCCESS') || line.includes('OK')) color = '--gr';
          else if (line.includes('WARN')) color = '--ye';
          return (
            <div key={i} className="mono" style={{fontSize: 12, color: `var(${color})`, marginBottom: 3, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.4, borderLeft: (line.includes('ERROR') ? '2px solid var(--re)' : 'none'), paddingLeft: (line.includes('ERROR') ? 8 : 0)}}>
              {line}
            </div>
          );
        })}
        <div ref={bottomRef} style={{height: 1}} />
      </div>
    </div>
  );
}
