import { useState } from "react";
import { api } from "../lib/api";
import { Search } from "lucide-react";

export function SessionsSearchPage() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!q) return;
    setSearching(true);
    try {
      const data = await api.searchSessions(q);
      setRes(data.results || []);
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
  };

  return (
    <div className="pg" style={{padding: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{fontSize: 20, color: 'var(--t1)', fontWeight: 600}}>Advanced FTS5 Session Search</div>
      
      <form onSubmit={handleSearch} style={{display: 'flex', gap: 10}}>
        <div style={{flex: 1, position: 'relative'}}>
          <Search size={16} style={{position: 'absolute', left: 16, top: 12, color: 'var(--ac)'}}/>
          <input 
            placeholder="Search across all historical conversations and memories..." 
            value={q} 
            onChange={e=>setQ(e.target.value)} 
            style={{paddingLeft: 42, padding: "10px 14px 10px 42px", fontSize: 13}}
          />
        </div>
        <button type="submit" className="btn btp" style={{padding: "10px 20px"}}>Search Memory</button>
      </form>

      {searching && <div style={{padding: 20, color: 'var(--t3)'}}>Scanning gigabytes of databases...</div>}

      <div className="card" style={{display: 'flex', flexDirection: 'column'}}>
        {res.length === 0 && !searching && q && <div style={{padding: 20, color: 'var(--ye)'}}>No historical context found matching "{q}"</div>}
        {res.length === 0 && !searching && !q && <div style={{padding: 20, color: 'var(--t3)'}}>Search memory using the bar above.</div>}
        {res.map((r, i) => (
          <div key={i} style={{padding: '16px 20px', borderBottom: '1px solid var(--bd)'}}>
            <div style={{display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12}}>
              <span className={`badge ${r.role === 'assistant' ? 'bg' : 'bp'}`}>{r.role}</span>
              <span style={{fontSize: 12, color: 'var(--t3)'}}>Session ID: <span className="mono" style={{color: 'var(--t2)'}}>{r.session_id.split('-')[0]}</span></span>
              <span style={{fontSize: 12, color: 'var(--t3)'}}>Source: {r.source}</span>
            </div>
            <div style={{fontSize: 14, color: 'var(--t1)', lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 8}}>
              <div dangerouslySetInnerHTML={{__html: r.snippet.replace(/<b>/g, '<span style="color:var(--ye); font-weight:bold; background: rgba(251,191,36,0.1); padding: 0 4px; border-radius: 4px;">').replace(/<\/b>/g, '</span>')}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
