import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { fuzzySearch } from "../lib/utils";
import { Key, Trash2, Plus, Eye, EyeOff, Search, ShieldCheck, RefreshCw } from "lucide-react";

export function KeysPage() {
  const [keys, setKeys] = useState({});
  const [query, setQuery] = useState("");
  const [revealed, setRevealed] = useState({}); // { key: value }
  const [loading, setLoading] = useState({}); // { key: bool }
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  
  const loadKeys = () => api.getEnvVars().then(setKeys).catch(console.error);
  useEffect(() => { loadKeys(); }, []);

  const handleReveal = async (k) => {
    if (revealed[k]) {
      const next = { ...revealed };
      delete next[k];
      setRevealed(next);
      return;
    }
    
    setLoading(prev => ({ ...prev, [k]: true }));
    try {
      const res = await api.revealEnvVar(k);
      setRevealed(prev => ({ ...prev, [k]: res.value }));
    } catch (e) {
      alert(`Failed to reveal: ${e.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [k]: false }));
    }
  };

  const handleDelete = async (k) => {
    if (confirm(`Are you sure you want to delete ${k}?`)) {
      await api.deleteEnvVar(k);
      loadKeys();
    }
  };

  const handleSet = async (e) => {
    e?.preventDefault();
    if (newKey && newVal) {
      await api.setEnvVar(newKey, newVal);
      setNewKey(""); setNewVal("");
      loadKeys();
    }
  };

  // Process data
  const entries = Object.entries(keys).map(([k, v]) => ({ key: k, ...v }));
  const visibleEntries = entries.filter(m => !m.advanced || m.is_set);
  const filtered = fuzzySearch(query, visibleEntries, ['key', 'description', 'category']);

  // Grouping
  const groups = filtered.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const sortedCats = Object.keys(groups).sort((a, b) => {
    if (a === 'General') return 1;
    if (b === 'General') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="pg" style={{padding: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap'}}>
        <div>
          <div style={{fontSize: 20, color: 'var(--t1)', fontWeight: 600}}>API Keys & Credentials</div>
          <div style={{fontSize: 12.5, color: 'var(--t3)', marginTop: 4}}>Manage your keys (.env secrets) and provider credentials safely.</div>
        </div>
        <div style={{position: 'relative', width: 260, minWidth: 200}}>
          <Search size={14} style={{position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)'}} />
          <input 
            placeholder="Fuzzy search (amn -> aiman)..." 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            style={{paddingLeft: 34, fontSize: 12.5}}
          />
        </div>
      </div>

      <form className="card" onSubmit={handleSet} style={{padding: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap'}}>
        <input placeholder="Key Name (e.g. ANTHROPIC_API_KEY)" value={newKey} onChange={e=>setNewKey(e.target.value)} style={{flex: 1, minWidth: 200, padding: "10px 14px"}} required />
        <input placeholder="Secret Value" value={newVal} onChange={e=>setNewVal(e.target.value)} type="password" style={{flex: 2, minWidth: 200, padding: "10px 14px"}} required />
        <button type="submit" className="btn btp" style={{padding: "11px 18px"}}><Plus size={16} /> Add / Update</button>
      </form>

      {sortedCats.map(cat => (
        <div key={cat} style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <div style={{fontSize: 11, fontWeight: 600, color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 6}}>
             <ShieldCheck size={12} /> {cat}
          </div>
          <div className="card" style={{display: 'flex', flexDirection: 'column'}}>
            {groups[cat].map((meta, i) => (
              <div key={meta.key} style={{display: 'flex', gap: 15, padding: '14px 18px', borderBottom: i < groups[cat].length - 1 ? '1px solid var(--bd)' : 'none', alignItems: 'center', flexWrap: 'wrap'}}>
                <Key size={16} style={{color: meta.is_set ? 'var(--gr)' : 'var(--t3)', flexShrink: 0}} />
                <div style={{flex: 1, minWidth: 200}}>
                  <div style={{fontSize: 14.5, color: 'var(--t1)', fontWeight: 500}}>{meta.key}</div>
                  <div style={{fontSize: 11.5, color: 'var(--t3)', marginTop: 4, lineHeight: 1.4}}>{meta.description || 'Custom Env Var'}</div>
                </div>
                
                <div className="mono" style={{fontSize: 12.5, color: 'var(--ye)', background: 'rgba(251,191,36,0.04)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 160, justifyContent: 'space-between'}}>
                  <span style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{revealed[meta.key] ? revealed[meta.key] : meta.is_set ? meta.redacted_value : 'Not Set'}</span>
                  {meta.is_set && (
                    <button 
                      type="button"
                      onClick={() => handleReveal(meta.key)}
                      style={{background: 'none', border: 'none', padding: "0 4px", cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', transition: 'color 0.2s'}}
                    >
                      {loading[meta.key] ? <RefreshCw size={12} style={{animation: 'spin 1.5s linear infinite'}} /> : revealed[meta.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  )}
                </div>

                <div style={{display: 'flex', gap: 6}}>
                  {meta.is_set ? (
                    <button className="btn" style={{padding: '7px 11px', background: 'var(--red)', color: 'var(--re)'}} onClick={() => handleDelete(meta.key)} title="Delete Key">
                      <Trash2 size={13} />
                    </button>
                  ) : (
                    <button className="btn btg" style={{padding: '7px 11px', fontSize: 12}} onClick={() => { setNewKey(meta.key); setNewVal(''); }}>
                      <Plus size={13} /> Setup
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {sortedCats.length === 0 && (
        <div style={{padding: 60, textAlign: 'center', color: 'var(--t3)', fontSize: 13.5}} className="card">
          No keys found matching "{query}"
        </div>
      )}
    </div>
  );
}
