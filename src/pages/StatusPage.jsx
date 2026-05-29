import { useState, useEffect } from "react";
import { api } from "../lib/api";

export function StatusPage() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await api.getStatus();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };
    loadStatus();
    const intv = setInterval(loadStatus, 5000);
    return () => clearInterval(intv);
  }, []);

  if (error) return <div className="pg" style={{padding: 20, color: 'var(--re)'}}>Error connecting to Hermes API: {error}</div>;
  if (!status) return <div className="pg" style={{padding: 20, color: "var(--t3)"}}>Loading Live Status...</div>;

  return (
    <div className="pg" style={{padding: 18, display: 'flex', flexDirection: 'column', gap: 18}}>
      <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
        <div style={{fontSize: 20, fontWeight: 600, color: 'var(--t1)'}}>Agent Live Status</div>
        <div className={`badge ${status.gateway_running ? 'bg' : 'br'}`} style={{fontSize: 12, padding: "4px 10px"}}>
          {status.gateway_running ? "Gateway Online" : "Gateway Offline"}
        </div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10}}>
        <div className="card" style={{padding: '15px 17px'}}>
          <div style={{fontSize: 10.5, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6}}>Version</div>
          <div style={{fontSize: 26, fontWeight: 600, color: 'var(--ac)'}}>{status.version}</div>
        </div>
        <div className="card" style={{padding: '15px 17px'}}>
          <div style={{fontSize: 10.5, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6}}>Active Sessions</div>
          <div style={{fontSize: 26, fontWeight: 600, color: 'var(--bl)'}}>{status.active_sessions}</div>
        </div>
        <div className="card" style={{padding: '15px 17px'}}>
          <div style={{fontSize: 10.5, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6}}>Config Version</div>
          <div style={{fontSize: 26, fontWeight: 600, color: 'var(--ye)'}}>v{status.config_version}</div>
        </div>
        <div className="card" style={{padding: '15px 17px'}}>
          <div style={{fontSize: 10.5, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6}}>Exit Reason</div>
          <div style={{fontSize: 14, fontWeight: 600, color: 'var(--t2)', alignSelf: 'center', marginTop: 8}}>{status.gateway_exit_reason || "None"}</div>
        </div>
      </div>
      
      <div>
        <div style={{fontSize: 11, color: 'var(--t3)', marginBottom: 10, textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.06em'}}>Gateway Platforms</div>
        <div className="card" style={{padding: 15, display: 'flex', flexDirection: 'column', gap: 10}}>
          {Object.entries(status.gateway_platforms || {}).length === 0 && (
            <div style={{color: 'var(--t3)', fontSize: 13}}>No platforms connected or detected.</div>
          )}
          {Object.entries(status.gateway_platforms || {}).map(([key, val]) => (
            <div key={key} style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bd)', paddingBottom: 8, alignItems: 'center'}}>
              <span style={{color: 'var(--t1)', textTransform: 'capitalize', fontSize: 14}}>{key}</span>
              <span className={`badge ${val.state === 'connected' ? 'bg' : 'br'}`} style={{fontSize: 11}}>{val.state}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
