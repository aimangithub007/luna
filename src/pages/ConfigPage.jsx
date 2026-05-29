import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Save } from "lucide-react";

export function ConfigPage() {
  const [configText, setConfigText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.getConfig().then(data => {
      setConfigText(JSON.stringify(data, null, 4));
      setLoading(false);
    }).catch(e => setError(e.message));
  }, []);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(configText);
      await api.saveConfig(parsed);
      setMsg("Saved successfully! It will take effect on next session.");
      setTimeout(() => setMsg(""), 4000);
    } catch (e) {
      setError("Error saving: " + e.message);
    }
  };

  if (loading) return <div className="pg" style={{padding: 20, color: 'var(--t3)'}}>Loading Config...</div>;

  return (
    <div className="pg" style={{padding: 18, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--hh) - 1px)', gap: 14}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0}}>
        <div>
          <div style={{fontSize: 20, color: 'var(--t1)', fontWeight: 600}}>System Configuration</div>
          <div style={{fontSize: 12.5, color: 'var(--t3)', marginTop: 4}}>Directly modify your hermes configuration (config.yaml equivalent).</div>
        </div>
        <button className="btn btp" onClick={handleSave} style={{padding: "8px 16px"}}>
          <Save size={15}/> Save Settings
        </button>
      </div>
      
      {error && <div style={{color: 'var(--re)', background: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, flexShrink: 0}}>{error}</div>}
      {msg && <div style={{color: 'var(--gr)', background: 'var(--grd)', padding: '10px 14px', borderRadius: 8, fontSize: 13, flexShrink: 0}}>{msg}</div>}

      <div className="card" style={{flex: 1, display: 'flex', overflow: 'hidden', border: '1px solid var(--bd2)'}}>
        <textarea 
          className="mono"
          value={configText} 
          onChange={e => { setConfigText(e.target.value); setError(null); }}
          spellCheck={false}
          style={{flex: 1, resize: 'none', border: 'none', borderRadius: 12, padding: 20, margin: 0, height: '100%', fontSize: 13, background: 'var(--s2)', lineHeight: 1.5, color: 'var(--t1)'}} 
        />
      </div>
    </div>
  );
}
