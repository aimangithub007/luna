import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Activity, Brain, Cpu, Database, Layers, 
  PieChart, Plus, Server, Settings, Zap, 
  UserPlus, CheckCircle, ChevronRight, Info, 
  Download, FileText, Search, X, Image as ImageIcon,
  Clock, Package, AlertCircle, Trash2, Pencil, RefreshCw
} from "lucide-react";
import { api } from "../lib/api";
import { NetworkGraph3D } from "../components/NetworkGraph3D";

export function InsightPage() {
  const [stats, setStats] = useState({
    version: "v0.1.0-alpha",
    model: "Nous Hermes 3 Llama 3 8B",
    memory: "1.2 GB",
    apps: 12,
    tasks: 45
  });

  const [showInstall, setShowInstall] = useState(false);
  
  // Real Profiles State
  const [profiles, setProfiles] = useState([]);
  const [activeProfilePath, setActiveProfilePath] = useState('');
  const [loadingProfs, setLoadingProfs] = useState(false);

  // Profile Mapping for Photos (LocalStorage Bridge)
  const [photoMap, setPhotoMap] = useState(() => {
    const saved = localStorage.getItem('hermes_photo_map');
    return saved ? JSON.parse(saved) : {};
  });

  // Creation State
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', img: '', clone: true, soul: '' });
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingProfileModal, setEditingProfileModal] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', img: '', model: '', soul: '' });
  const [loadingSoul, setLoadingSoul] = useState(false);

  // Detailed Modal State
  const [detailedProfile, setDetailedProfile] = useState(null);
  const [loadingDetailedSoul, setLoadingDetailedSoul] = useState(false);

  // Dynamic Neural Graph
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [splitRatio, setSplitRatio] = useState(52);
  const rightPanelRef = useRef(null);
  const TYPE_CSS = { core: '#e8a820', memory: '#4ab8d8', skill: '#38c870', session: '#9b72f0', tool: '#f08030' };

  const [sessions, setSessions] = useState([
    { day: "18 May", total: 45, hours: "12:00 - 18:00", percent: 85 },
    { day: "17 May", total: 32, hours: "10:00 - 15:00", percent: 60 },
    { day: "16 May", total: 12, hours: "09:00 - 11:00", percent: 25 },
    { day: "15 May", total: 55, hours: "08:00 - 20:00", percent: 100 },
    { day: "14 May", total: 28, hours: "14:00 - 17:00", percent: 50 },
  ]);

  const fetchData = useCallback(async () => {
    setLoadingProfs(true);
    try {
      const [profsData, statusData, analyticsData, gData] = await Promise.all([
        api.getProfiles(),
        api.getStatus(),
        api.getAnalytics(5),
        api.getGraph()
      ]);

      if (gData) setGraphData(gData);

      // Profiles
      const pList = Array.isArray(profsData) ? profsData : (profsData.profiles || []);
      setProfiles(pList);
      const currentPath = statusData?.hermes_home || '';
      setActiveProfilePath(currentPath);

      const activeProf = pList.find(p => currentPath === p.path || (p.is_default && currentPath.endsWith('.hermes')));
      const activeModel = activeProf?.model || statusData?.model;

      // Status
      if (statusData) {
        setStats(prev => ({
          ...prev,
          version: statusData.version || prev.version,
          model: activeModel || prev.model
        }));
      }

      // Analytics
      if (analyticsData && analyticsData.daily) {
        setSessions(analyticsData.daily.slice().reverse().map(d => ({
          day: d.day,
          total: d.sessions,
          hours: "Trace logged",
          percent: (d.sessions / 60) * 100
        })));
      }
    } catch (error) {
      console.error('Failed to fetch insight data:', error);
    } finally {
      setLoadingProfs(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      api.getGraph().then(gData => {
         if(gData) setGraphData(gData);
      }).catch(err => console.error("Graph fetch failed", err));
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    localStorage.setItem('hermes_photo_map', JSON.stringify(photoMap));
  }, [photoMap]);

  const handleUseProfile = async (name) => {
    try {
      await api.useProfile(name);
      await fetchData();
    } catch (error) {
      alert('Failed to switch: ' + error.message);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      await api.createProfile(createForm.name.trim(), createForm.clone);
      
      if (createForm.img) {
        setPhotoMap(prev => ({ ...prev, [createForm.name.trim()]: createForm.img }));
      }
      
      if (createForm.soul.trim()) {
        try { await api.updateProfileSoul(createForm.name.trim(), createForm.soul); } catch (e) { console.error('P.Soul error', e); }
      }
      
      setShowAddProfile(false);
      setCreateForm({ name: '', img: '', clone: true, soul: '' });
      await fetchData();
    } catch (error) {
      alert('Failed to create: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfileModal) return;
    const oldName = editingProfileModal.name;
    const newName = editForm.name.trim();

    try {
      // 1. Rename via API if name changed and not default
      if (oldName !== newName && !editingProfileModal.is_default) {
        await api.renameProfile(oldName, newName);
      }

      // 2. Update SOUL
      const finalName = editingProfileModal.is_default ? oldName : newName;
      try {
        await api.updateProfileSoul(finalName, editForm.soul);
      } catch (e) {
        console.error('P.Soul error', e);
      }

      // 3. Update photo mapping
      if (editForm.img !== (photoMap[oldName] || '')) {
        setPhotoMap(prev => {
          const m = { ...prev };
          m[finalName] = editForm.img;
          if (oldName !== finalName) delete m[oldName];
          return m;
        });
      } else if (oldName !== finalName && photoMap[oldName]) {
        // Just transfer if name changed but photo didn't
        setPhotoMap(prev => {
          const m = { ...prev };
          m[finalName] = m[oldName];
          delete m[oldName];
          return m;
        });
      }

      setEditingProfileModal(null);
      await fetchData();
    } catch (error) {
      alert('Failed to update: ' + error.message);
    }
  };

  const handleDelete = async (name) => {
    const prof = profiles.find(p => p.name === name);
    if (prof && prof.is_default) {
      alert("System profile cannot be deleted.");
      return;
    }
    if (!confirm(`Delete persona "${name}"?`)) return;
    try {
      await api.deleteProfile(name);
      await fetchData();
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  return (
    <div className="pg" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 32, maxWidth: 1200, margin: "0 auto" }}>
      
      {/* Install Banner */}
      {!showInstall ? (
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(94, 234, 212, 0.03)', border: '1px dashed var(--acb)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <Package size={18} style={{ color: 'var(--ac)' }} />
             <span style={{ fontSize: 13, color: 'var(--t2)' }}>Need to re-run installation scripts?</span>
           </div>
           <button className="btn ba" onClick={() => setShowInstall(true)} style={{ fontSize: 11, padding: '4px 12px' }}>Show Install Guide</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--s2)', animation: 'pgi 0.3s ease-out' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
               <Download size={18} style={{ color: 'var(--ac)' }} /> Installation Wizard
             </div>
             <button onClick={() => setShowInstall(false)} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor:'pointer' }}><X size={18} /></button>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ padding: 12, background: 'var(--s1)', borderRadius: 8, border: '1px solid var(--bd)', fontSize: 12 }}>
                 <div style={{ color: 'var(--t3)', marginBottom: 6 }}>Unix / macOS</div>
                 <code className="mono" style={{ color: 'var(--ac)' }}>curl -fsSL https://raw...install.sh | bash</code>
              </div>
              <div style={{ padding: 12, background: 'var(--s1)', borderRadius: 8, border: '1px solid var(--bd)', fontSize: 12 }}>
                 <div style={{ color: 'var(--t3)', marginBottom: 6 }}>Windows PowerShell</div>
                 <code className="mono" style={{ color: 'var(--ye)' }}>irm https://raw...install.ps1 | iex</code>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <section>
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--t1)", display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity size={28} className="ba" style={{ padding: 5, borderRadius: 8 }} />
            System Insights
          </h1>
          <p style={{ color: "var(--t3)", fontSize: 14 }}>Real-time telemetry and cognitive distribution mapping.</p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <StatusCard label="Hermes Version" value={stats.version} icon={Database} color="var(--ac)" />
          <StatusCard label="Active Model" value={stats.model} icon={Brain} color="var(--pu)" />
          <StatusCard label="Shared Memory" value={stats.memory} icon={Cpu} color="var(--bl)" />
          <StatusCard label="Plugin Apps" value={stats.apps} icon={Layers} color="var(--gr)" />
          <StatusCard label="Total Tasks" value={stats.tasks} icon={PieChart} color="var(--ye)" />
        </div>
      </section>

      {/* Memory & Connections */}
      <section style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div className="card" style={{ height: 460, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "stretch", position: "relative" }}>
             <NetworkGraph3D data={graphData} onNodeClick={setSelectedNode} style={{ borderRadius: 0, border: "none" }} />
          </div>
        </div>

        <div ref={rightPanelRef} className="card" style={{ padding: 0, display: "flex", flexDirection: "column", height: 460, overflow: 'hidden' }}>
          
          {/* Top Panel - Node Details */}
          <div style={{ flex: `0 0 ${splitRatio}%`, minHeight: 0, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t3)', fontWeight: 600 }}>Node Details</h2>
               {selectedNode && <X size={14} style={{ cursor: 'pointer', color: 'var(--t3)' }} onClick={() => setSelectedNode(null)} />}
             </div>
             
             {selectedNode ? (() => {
                const connectedEdges = graphData?.edges?.filter(e => e[0] === selectedNode.id || e[1] === selectedNode.id) || [];
                const connectedNodeIds = connectedEdges.map(e => e[0] === selectedNode.id ? e[1] : e[0]);
                const connectedNodes = graphData?.nodes?.filter(n => connectedNodeIds.includes(n.id)) || [];

                return (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', wordBreak: 'break-all', marginBottom: 12 }}>{selectedNode.name}</h3>
                     <div>
                       <span style={{ 
                          display: 'inline-block', padding: '4px 8px', borderRadius: 4, 
                          background: 'rgba(155, 114, 240, 0.15)', color: '#9b72f0', 
                          fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' 
                       }}>
                          {selectedNode.type}
                       </span>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ color: 'var(--t3)' }}>File size</span>
                           <span style={{ color: 'var(--t1)' }} className="mono">{Math.round((selectedNode.size || 0)/1024)} KB</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ color: 'var(--t3)' }}>Type</span>
                           <span style={{ color: 'var(--t1)', textTransform: 'uppercase' }}>{(selectedNode.type || 'TXT').slice(0,3)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ color: 'var(--t3)' }}>Modified</span>
                           <span style={{ color: 'var(--t1)' }}>{selectedNode.modified || 'unknown'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ color: 'var(--t3)' }}>Workspace</span>
                           <span style={{ color: 'var(--t1)' }}>{selectedNode.type === 'core' ? 'Brain' : selectedNode.type === 'skill' ? 'Capabilities' : selectedNode.type === 'session' ? 'History' : 'Context'}</span>
                        </div>
                     </div>

                     <div style={{ marginTop: 32 }}>
                        <h4 style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 16 }}>Connected Nodes</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                           {connectedNodes.length > 0 ? connectedNodes.map(cn => (
                               <div key={cn.id} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', background: 'var(--s1)', borderRadius: 6, border: '1px solid var(--bd)' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_CSS[cn.type] || '#fff' }} />
                                      <div style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 500, wordBreak: 'break-all' }}>{cn.name}</div>
                                   </div>
                                   <div style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 12 }}>
                                      {cn.type === 'core' ? 'Brain' : cn.type === 'skill' ? 'Capabilities' : 'Dev'} • {Math.round(cn.size/1024)} KB
                                   </div>
                               </div>
                           )) : <div style={{ fontSize: 12, color: 'var(--t3)' }}>No direct connections.</div>}
                        </div>
                     </div>
                  </div>
                );
             })() : (
                <div style={{ color: 'var(--t3)', fontSize: 13, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                   Select a node to view its properties and connections.
                </div>
             )}
          </div>

          {/* Resizer */}
          <div 
             onMouseDown={(e) => {
               e.preventDefault();
               const startY = e.clientY;
               const startRatio = splitRatio;
               const panelHeight = rightPanelRef.current.getBoundingClientRect().height;

               const onMouseMove = (moveEvent) => {
                  const deltaY = moveEvent.clientY - startY;
                  const deltaRatio = (deltaY / panelHeight) * 100;
                  let newRatio = startRatio + deltaRatio;
                  if (newRatio < 20) newRatio = 20;
                  if (newRatio > 80) newRatio = 80;
                  setSplitRatio(newRatio);
               };

               const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
               };

               document.addEventListener('mousemove', onMouseMove);
               document.addEventListener('mouseup', onMouseUp);
             }}
             style={{ height: 6, background: 'rgba(0,0,0,0.4)', cursor: 'row-resize', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }} 
          />

          {/* Bottom Panel - Summary / Connections */}
          <div style={{ flex: `1 1 0%`, minHeight: 0, padding: 24, overflowY: 'auto' }}>
             <h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t3)', fontWeight: 600, marginBottom: 20 }}>Graph Summary</h2>
             
             <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                   <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)' }}>{graphData?.nodes?.length || 0}</div>
                   <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase' }}>Active Nodes</div>
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--bl)' }}>{graphData?.edges?.length || 0}</div>
                   <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase' }}>Connections</div>
                </div>
             </div>

             <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t3)', fontWeight: 600, marginBottom: 16 }}>Node Distribution</h3>
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {Object.keys(TYPE_CSS).map(type => {
                   const count = graphData?.nodes?.filter(n => n.type === type).length || 0;
                   if (count === 0) return null;
                   return (
                     <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t1)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_CSS[type] }} />
                        <span style={{ textTransform: 'capitalize' }}>{type}</span>
                        <span style={{ color: 'var(--t3)', marginLeft: 'auto' }} className="mono">{count}</span>
                     </div>
                   )
                })}
             </div>
          </div>
        </div>
      </section>

      {/* Sessions & Personas */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Session Stats */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--t1)", marginBottom: 20 }}>Usage Trace</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sessions.map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--t2)" }}>{s.day}</span>
                  <span style={{ color: "var(--t3)" }} className="mono">{s.total} hits</span>
                </div>
                <div style={{ height: 4, background: "var(--s2)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${s.percent}%`, height: "100%", background: i === 0 ? 'var(--ac)' : 'var(--t3)', opacity: i === 0 ? 1 : 0.4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Persona Management */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--t1)" }}>Bridged Personas</h2>
              <p style={{ color: "var(--t3)", fontSize: 12 }}>Active identities across local environments.</p>
            </div>
            <button className="btn ba" onClick={() => { setCreateForm({ name: '', img: '', clone: true, soul: '' }); setShowAddProfile(true); }} style={{ fontSize: 11, padding: "5px 12px" }}>
              <UserPlus size={14} /> New Persona
            </button>
          </div>
          
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
            {profiles.map((p, idx) => {
              const isActive = activeProfilePath === p.path || (p.is_default && activeProfilePath.endsWith('.hermes'));
              const profilePhoto = photoMap[p.name] || `https://i.pravatar.cc/150?u=${p.name}`;
              
              return (
                <div 
                  key={idx} 
                  style={{ 
                    minWidth: 170, padding: 20, background: isActive ? "var(--acd)" : "var(--s2)", borderRadius: 16, border: "1px solid", borderColor: isActive ? 'var(--acb)' : 'var(--bd)',
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center", transition: 'transform 0.2s', position: 'relative', cursor: 'pointer'
                  }} 
                  className="persona-card"
                  onClick={async () => {
                    setDetailedProfile({ ...p, photo: profilePhoto, isActive, soul: 'Loading...' });
                    setLoadingDetailedSoul(true);
                    try {
                      const soulData = await api.getProfileSoul(p.name);
                      setDetailedProfile(prev => prev ? { ...prev, soul: soulData.content || 'No SOUL.md found.' } : null);
                    } catch (e) {
                      setDetailedProfile(prev => prev ? { ...prev, soul: 'Failed to load SOUL.md' } : null);
                    }
                    setLoadingDetailedSoul(false);
                  }}
                >
                  <div style={{ position: 'relative' }}>
                     <img src={profilePhoto} style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid var(--bd2)", objectFit: 'cover' }} />
                     {isActive && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, background: 'var(--gr)', border: '2px solid var(--s2)', borderRadius: '50%' }} />}
                  </div>

                  {/* Details are now shown in the detail modal, so we just show Name/Model here */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "var(--ac)" : "var(--t1)" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }} className="truncate">{p.model || 'Auto'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, opacity: 0.8 }} onClick={(e) => e.stopPropagation()}>
                     {!isActive && <button className="btn ba" style={{ fontSize: 9, padding: "2px 6px" }} onClick={() => handleUseProfile(p.name)}>Use</button>}
                     <button className="btn btg" style={{ fontSize: 9, padding: "2px 6px" }} onClick={async () => { 
                       setEditForm({ name: p.name, img: profilePhoto.includes('pravatar') ? '' : profilePhoto, model: p.model || '', soul: 'Loading...' });
                       setEditingProfileModal(p);
                       setLoadingSoul(true);
                       try {
                         const soulData = await api.getProfileSoul(p.name);
                         setEditForm(prev => ({ ...prev, soul: soulData.content || '' }));
                       } catch (e) {
                         setEditForm(prev => ({ ...prev, soul: 'No SOUL.md found.' }));
                       }
                       setLoadingSoul(false);
                     }}>Edit</button>
                     {!p.is_default && <button className="btn btg" style={{ fontSize: 9, padding: "2px 6px", color: 'var(--re)' }} onClick={() => handleDelete(p.name)}>Del</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add Profile Modal */}
      {showAddProfile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div className="card" style={{ width: '100%', maxWidth: 500, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, animation: 'pgi 0.3s ease-out', position: 'relative', overflow: 'hidden' }}>
              
              <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: 'var(--ac)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserPlus size={20} style={{ color: 'var(--ac)' }} /> Create Persona
                 </div>
                 <button onClick={() => setShowAddProfile(false)} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}><X size={20}/></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                 <div style={{ width: 80, height: 80, borderRadius: "50%", background: 'var(--s2)', border: "2px solid var(--acb)", display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {createForm.img ? <img src={createForm.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={28} style={{ color: 'var(--t3)' }} />}
                 </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, color: 'var(--t3)' }}>Name</label>
                      <input autoFocus placeholder="e.g. specialized-agent" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})} />
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, color: 'var(--t3)' }}>Photo URL (Bridged)</label>
                      <input placeholder="https://..." value={createForm.img} onChange={e => setCreateForm({...createForm, img: e.target.value})} />
                   </div>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--t3)' }}>System Prompt / SOUL</label>
                    <textarea 
                      placeholder="Define the identity, values, and core instructions..."
                      style={{ width: '100%', height: 120, resize: 'none', padding: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 13 }}
                      className="mono"
                      value={createForm.soul}
                      onChange={e => setCreateForm({...createForm, soul: e.target.value})}
                    />
                 </div>

                 <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginTop: 4}}>
                    <input type="checkbox" style={{width:16, height:16, margin:0}} checked={createForm.clone} onChange={e => setCreateForm({...createForm, clone: e.target.checked})} />
                    <span style={{fontSize:13, color:'var(--t2)'}}>Clone from base environment</span>
                 </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                 <button className="btn btg" style={{ flex: 1 }} onClick={() => setShowAddProfile(false)}>Cancel</button>
                 <button className="btn btp" style={{ flex: 1 }} onClick={handleCreate} disabled={creating || !createForm.name.trim()}>
                    {creating ? 'Creating...' : 'Create Persona'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Detailed Profile Modal (Read-Only) */}
      {detailedProfile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDetailedProfile(null)}>
           <div className="card" style={{ width: '100%', maxWidth: 500, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, animation: 'pgi 0.3s ease-out', position: 'relative', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
              
              <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: 'var(--ac)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                   <div style={{ position: 'relative' }}>
                     <div style={{ width: 80, height: 80, borderRadius: "50%", background: 'var(--s2)', border: "2px solid var(--acb)", display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {detailedProfile.photo ? <img src={detailedProfile.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={28} style={{ color: 'var(--t3)' }} />}
                     </div>
                     {detailedProfile.isActive && <div style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, background: 'var(--gr)', border: '2px solid var(--s2)', borderRadius: '50%' }} />}
                   </div>
                   <div>
                     <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)' }}>{detailedProfile.name}</h2>
                     <p style={{ color: 'var(--t3)', fontSize: 13, marginTop: 2 }}>{detailedProfile.model || 'Auto-select Model'}</p>
                     <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                       {detailedProfile.is_default && <span className="badge ba" style={{fontSize:9}}>DEFAULT LPU</span>}
                       {detailedProfile.has_env && <span className="badge bg" style={{fontSize:9}}>ENV</span>}
                     </div>
                   </div>
                 </div>
                 <button onClick={() => setDetailedProfile(null)} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}><X size={20}/></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, color: 'var(--t3)' }}>Name</label>
                      <input readOnly style={{ opacity: 0.7 }} value={detailedProfile.name} />
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, color: 'var(--t3)' }}>Photo URL (Bridged)</label>
                      <input readOnly style={{ opacity: 0.7 }} value={detailedProfile.photo.includes('pravatar') ? '' : detailedProfile.photo} placeholder="Default Avatar" />
                   </div>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>System Prompt / SOUL</span>
                      {loadingDetailedSoul && <span style={{ color: 'var(--ac)' }}>Loading...</span>}
                    </label>
                    <textarea 
                      readOnly
                      style={{ width: '100%', height: 120, resize: 'none', padding: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 13, opacity: loadingDetailedSoul ? 0.5 : 0.7 }}
                      className="mono"
                      value={detailedProfile.soul || ''}
                    />
                 </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                 {!detailedProfile.isActive && <button className="btn btp" style={{ flex: 1 }} onClick={() => { handleUseProfile(detailedProfile.name); setDetailedProfile(null); }}>Activate Persona</button>}
                 <button className="btn btg" style={{ flex: 1 }} onClick={() => setDetailedProfile(null)}>Close</button>
              </div>
           </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editingProfileModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div className="card" style={{ width: '100%', maxWidth: 500, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, animation: 'pgi 0.3s ease-out', position: 'relative', overflow: 'hidden' }}>
              
              <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: 'var(--ac)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                   <div style={{ position: 'relative' }}>
                     <div style={{ width: 80, height: 80, borderRadius: "50%", background: 'var(--s2)', border: "2px solid var(--acb)", display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {editForm.img ? <img src={editForm.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={28} style={{ color: 'var(--t3)' }} />}
                     </div>
                     {editingProfileModal.is_default && <div style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, background: 'var(--gr)', border: '2px solid var(--s2)', borderRadius: '50%' }} />}
                   </div>
                   <div>
                     <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)' }}>{editingProfileModal.name}</h2>
                     <p style={{ color: 'var(--t3)', fontSize: 13, marginTop: 2 }}>{editingProfileModal.model || 'Auto-select Model'}</p>
                     <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                       {editingProfileModal.is_default && <span className="badge ba" style={{fontSize:9}}>DEFAULT LPU</span>}
                     </div>
                   </div>
                 </div>
                 <button onClick={() => setEditingProfileModal(null)} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}><X size={20}/></button>
              </div>

              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, color: 'var(--t3)' }}>Name {editingProfileModal.is_default && <span style={{color:'var(--ye)'}}>(Locked)</span>}</label>
                      <input autoFocus={!editingProfileModal.is_default} disabled={editingProfileModal.is_default} style={{ opacity: editingProfileModal.is_default ? 0.6 : 1 }} placeholder="e.g. specialized-agent" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})} />
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, color: 'var(--t3)' }}>Photo URL (Bridged)</label>
                      <input autoFocus={editingProfileModal.is_default} placeholder="https://..." value={editForm.img} onChange={e => setEditForm({...editForm, img: e.target.value})} />
                   </div>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>System Prompt / SOUL</span>
                      {loadingSoul && <span style={{ color: 'var(--ac)' }}>Loading...</span>}
                    </label>
                    <textarea 
                      disabled={loadingSoul}
                      style={{ width: '100%', height: 120, resize: 'none', padding: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 13, opacity: loadingSoul ? 0.5 : 1 }}
                      className="mono"
                      value={editForm.soul}
                      onChange={e => setEditForm({...editForm, soul: e.target.value})}
                    />
                 </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                 <button className="btn btg" style={{ flex: 1 }} onClick={() => setEditingProfileModal(null)}>Cancel</button>
                 <button className="btn btp" style={{ flex: 1 }} onClick={handleUpdateProfile} disabled={!editForm.name.trim() || loadingSoul}>
                    Save Changes
                 </button>
              </div>
           </div>
        </div>
      )}


      {/* Styles */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        .persona-card:hover { transform: translateY(-5px); border-color: var(--acb) !important; }
        .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
}

function StatusCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--t1)' }}>{value}</div>
    </div>
  );
}

function ConnItem({ label, status, lat }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: status === 'connected' ? 'var(--gr)' : 'var(--re)', boxShadow: status === 'connected' ? '0 0 8px var(--gr)' : 'none' }} />
        <span style={{ fontSize: 13, color: "var(--t2)" }}>{label}</span>
      </div>
      <span className="mono" style={{ fontSize: 11, color: "var(--t3)" }}>{lat}</span>
    </div>
  );
}

function DataNode({ x, y, label }) {
  return (
    <div style={{ 
      position: "absolute", left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`,
      padding: "5px 12px", background: "rgba(11, 14, 26, 0.6)", backdropFilter: 'blur(4px)', border: "1px solid var(--bd2)", borderRadius: 20,
      fontSize: 10, color: "var(--t2)", textTransform: "uppercase", whiteSpace: "nowrap"
    }}>
      {label}
    </div>
  );
}
