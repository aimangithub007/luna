import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../lib/api";
import { fuzzySearch } from "../lib/utils";
import { 
  Zap, Puzzle, Search, Download, Trash2, 
  RefreshCw, CheckCircle, AlertCircle, Info, ExternalLink,
  Package, Wrench, Filter, Cpu, Globe, Shield, Eye, Paintbrush, Brain, Blocks, Code, X,
  ChevronRight
} from "lucide-react";

const CATEGORY_LABELS = {
  mlops: "MLOps",
  "mlops/cloud": "MLOps / Cloud",
  "mlops/evaluation": "MLOps / Evaluation",
  "mlops/inference": "MLOps / Inference",
  mcp: "MCP",
  ai: "AI",
};

const TOOLSET_ICONS = {
  computer: Cpu,
  web: Globe,
  security: Shield,
  vision: Eye,
  design: Paintbrush,
  ai: Brain,
  integration: Blocks,
  code: Code,
  automation: Zap,
};

function prettyCategory(raw, generalLabel = "General") {
  if (!raw) return generalLabel;
  if (CATEGORY_LABELS[raw]) return CATEGORY_LABELS[raw];
  return raw
    .split(/[-_/]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getToolsetIcon(name) {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(TOOLSET_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return Wrench;
}

export function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [toolsets, setToolsets] = useState([]);
  const [hubPlugins, setHubPlugins] = useState([]);
  const [view, setView] = useState("all"); 
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, tData] = await Promise.all([
        api.getSkills(),
        api.getToolsets ? api.getToolsets() : Promise.resolve([])
      ]);
      setSkills(sData || []);
      setToolsets(tData || []);
    } catch (e) {
      console.error("Failed to fetch:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadHub = async () => {
    try {
      const res = await api.getPluginsHub();
      setHubPlugins(res.plugins || []);
    } catch (e) {
      console.error("Failed:", e);
    }
  };

  useEffect(() => {
    if (view === "hub") loadHub();
  }, [view]);

  const handleToggle = async (skill) => {
    const name = skill.name;
    setActionLoading(prev => ({ ...prev, [name]: true }));
    try {
      await api.toggleSkill(name, !skill.enabled);
      await fetchData();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleInstall = async (plugin) => {
    const id = plugin.name;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await api.installAgentPlugin(plugin.source);
      await fetchData();
      if (view === "hub") loadHub();
    } catch (e) {
      alert(`Install error: ${e.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleUpdate = async (name) => {
    setActionLoading(prev => ({ ...prev, [name]: true }));
    try {
      await api.updateAgentPlugin(name);
      await fetchData();
    } catch (e) {
      alert(`Update error: ${e.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleRemove = async (name) => {
    if (!confirm(`Remove ${name}?`)) return;
    setActionLoading(prev => ({ ...prev, [name]: true }));
    try {
      await api.removeAgentPlugin(name);
      await fetchData();
      if (view === "hub") loadHub();
    } catch (e) {
      alert(`Remove error: ${e.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const categories = useMemo(() => {
    const cats = {};
    skills.forEach(s => {
      const cat = s.category || "__none__";
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return Object.entries(cats).sort().map(([key, count]) => ({
      key,
      name: prettyCategory(key === "__none__" ? null : key),
      count
    }));
  }, [skills]);

  const filteredSkills = useMemo(() => {
    let list = skills;
    if (activeCategory) {
      list = list.filter(s => (s.category || "__none__") === activeCategory);
    }
    return fuzzySearch(query, list, ['name', 'description', 'category']);
  }, [skills, activeCategory, query]);

  const filteredToolsets = useMemo(() => fuzzySearch(query, toolsets, ['name', 'label', 'description']), [toolsets, query]);
  const filteredHub = useMemo(() => fuzzySearch(query, hubPlugins, ['name', 'description']), [hubPlugins, query]);

  if (loading && skills.length === 0) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
        <RefreshCw className="spin" style={{color:'var(--t3)'}} />
      </div>
    );
  }

  return (
    <div className="pg" style={{padding:24, display:'flex', flexDirection:'column', gap:24}}>
      {/* Header Area */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:20, flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:22, fontWeight:700, color:'var(--t1)', display:'flex', alignItems:'center', gap:10}}>
            <Package style={{color:'var(--ac)'}} size={24} />
            Skills & Capabilities
          </div>
          <div style={{fontSize:13, color:'var(--t3)', marginTop:4}}>Extend your agent's functionality with powerful modules.</div>
        </div>
        <div style={{display:'flex', gap:12}}>
          <div style={{position:'relative', width:300}}>
            <Search size={14} style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--t3)'}} />
            <input 
              style={{paddingLeft:36}}
              placeholder="Fuzzy search skills..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{display:'flex', gap:24}}>
        {/* Sidebar Filters */}
        <div style={{width:240, display:'flex', flexDirection:'column', gap:24, flexShrink:0}}>
          <div className="card" style={{overflow:'hidden'}}>
             <div style={{padding:'10px 16px', background:'var(--s2)', borderBottom:'1px solid var(--bd)', fontSize:10, fontWeight:700, color:'var(--t3)', letterSpacing:'0.05em'}}>VIEW</div>
             <div style={{padding:8, display:'flex', flexDirection:'column', gap:2}}>
                <button 
                  onClick={() => { setView("all"); setActiveCategory(null); }}
                  className={`btn ${view === 'all' && !activeCategory ? 'btp' : 'btg'}`}
                  style={{justifyContent:'flex-start', width:'100%', padding:'8px 12px', border:'none'}}
                >
                  <Zap size={14} /> Installed Skills
                </button>
                <button 
                  onClick={() => { setView("toolsets"); setActiveCategory(null); }}
                  className={`btn ${view === 'toolsets' ? 'btp' : 'btg'}`}
                  style={{justifyContent:'flex-start', width:'100%', padding:'8px 12px', border:'none'}}
                >
                  <Wrench size={14} /> Toolsets
                </button>
                <button 
                  onClick={() => { setView("hub"); setActiveCategory(null); }}
                  className={`btn ${view === 'hub' ? 'btp' : 'btg'}`}
                  style={{justifyContent:'flex-start', width:'100%', padding:'8px 12px', border:'none'}}
                >
                  <Puzzle size={14} /> Plugin Hub
                </button>
             </div>

             {view === "all" && categories.length > 0 && (
               <>
                <div style={{padding:'10px 16px', background:'var(--s2)', borderTop:'1px solid var(--bd)', borderBottom:'1px solid var(--bd)', fontSize:10, fontWeight:700, color:'var(--t3)', letterSpacing:'0.05em'}}>CATEGORIES</div>
                <div style={{padding:8, display:'flex', flexDirection:'column', gap:2, maxHeight:400, overflowY:'auto'}}>
                   {categories.map(c => (
                     <button 
                       key={c.key}
                       onClick={() => setActiveCategory(activeCategory === c.key ? null : c.key)}
                       className={`btn ${activeCategory === c.key ? 'ba' : 'btg'}`}
                       style={{justifyContent:'flex-start', width:'100%', padding:'6px 12px', border:'none', fontSize:11.5}}
                     >
                       <span style={{flex:1, textAlign:'left'}} className="truncate">{c.name}</span>
                       <span style={{fontSize:10, opacity:0.6}}>{c.count}</span>
                     </button>
                   ))}
                </div>
               </>
             )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{flex:1, minWidth:0}}>
          {view === "all" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:16}}>
              {filteredSkills.map(s => (
                <div key={s.name} className="card" style={{padding:20, display:'flex', flexDirection:'column', gap:14, borderColor: s.enabled ? 'var(--acb)' : 'var(--bd)', position:'relative', borderLeft: s.enabled ? '3px solid var(--ac)' : '1px solid var(--bd)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontSize:10, fontWeight:700, color:'var(--ye)', textTransform:'uppercase'}} className="mono">{s.category || 'GENERAL'}</span>
                      <h3 style={{fontSize:16, fontWeight:600, color:s.enabled?'var(--ac)':'var(--t1)', marginTop:2}}>{s.name}</h3>
                    </div>
                    <div style={{display:'flex', gap:6}}>
                      <button className="btn btg" style={{padding:6}} onClick={() => handleUpdate(s.name)} disabled={actionLoading[s.name]}>
                        <RefreshCw size={14} className={actionLoading[s.name] ? 'spin' : ''} />
                      </button>
                      <button className="btn btg" style={{padding:6, color:'var(--re)'}} onClick={() => handleRemove(s.name)} disabled={actionLoading[s.name]}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p style={{fontSize:13, color:'var(--t2)', lineHeight:1.5, flex:1}}>{s.description}</p>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:'1px solid var(--bd2)'}}>
                    <span style={{fontSize:10, color:'var(--t3)'}} className="mono">ID: {s.name}</span>
                    <button 
                      className={`btn ${s.enabled ? 'btp' : 'btg'}`} 
                      style={{borderRadius:20, padding:'4px 14px', fontSize:10.5, fontWeight:700}}
                      onClick={() => handleToggle(s)}
                    >
                      {s.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "toolsets" && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16}}>
              {filteredToolsets.map(ts => {
                const Icon = getToolsetIcon(ts.name);
                return (
                  <div key={ts.name} className="card" style={{padding:20, display:'flex', flexDirection:'column', gap:12}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{width:38, height:38, borderRadius:10, background:'var(--acd)', color:'var(--ac)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                         <Icon size={20} />
                      </div>
                      <span className={`badge ${ts.enabled ? 'bg' : 'bn'}`} style={{fontSize:9}}>{ts.enabled ? 'ACTIVE' : 'INACTIVE'}</span>
                    </div>
                    <div>
                        <div style={{fontSize:15, fontWeight:600}}>{ts.label || ts.name}</div>
                        <div style={{fontSize:12, color:'var(--t3)', marginTop:4}}>{ts.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "hub" && (
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {filteredHub.map(p => {
                const installed = skills.find(s => s.name === p.name);
                return (
                  <div key={p.name} className="card" style={{padding:'16px 20px', display:'flex', alignItems:'center', gap:20}}>
                     <div style={{width:42, height:42, borderRadius:12, background:'var(--s2)', border:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)'}}>
                        <Puzzle size={22} />
                     </div>
                     <div style={{flex:1}}>
                        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                           <span style={{fontSize:15, fontWeight:600}}>{p.name}</span>
                           {installed && <span className="badge ba" style={{fontSize:9}}>INSTALLED</span>}
                        </div>
                        <div style={{fontSize:12.5, color:'var(--t3)'}}>{p.description}</div>
                     </div>
                     <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
                        {!installed ? (
                          <button className="btn btp" onClick={() => handleInstall(p)} disabled={actionLoading[p.name]}>
                            {actionLoading[p.name] ? <RefreshCw size={14} className="spin" /> : <Download size={14} />}
                            Install
                          </button>
                        ) : (
                          <div className="badge bg" style={{padding:'5px 12px'}}>Ready</div>
                        )}
                        <a href={p.source} target="_blank" rel="noreferrer" style={{fontSize:11, color:'var(--bl)', display:'flex', alignItems:'center', gap:4, textDecoration:'none'}}>Source <ExternalLink size={10} /></a>
                     </div>
                  </div>
                )
              })}
            </div>
          )}

          {(view === "all" ? filteredSkills : view === "toolsets" ? filteredToolsets : filteredHub).length === 0 && (
            <div className="card" style={{padding:80, textAlign:'center', color:'var(--t3)', display:'flex', flexDirection:'column', alignItems:'center', gap:10}}>
              <Search size={40} style={{opacity:0.2}} />
              <div style={{fontSize:16}}>No results for "{query}"</div>
              <button className="btn btg" onClick={() => {setQuery(""); setActiveCategory(null);}}>Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
