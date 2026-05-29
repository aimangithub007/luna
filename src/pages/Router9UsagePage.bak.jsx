import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  Activity, BarChart3, Clock, DollarSign, 
  ExternalLink, Layers, RefreshCw, AlertCircle,
  Zap, ArrowUpRight, TrendingUp, Cpu, Server, Database,
  Terminal, Key
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { api } from "../lib/api";

const ConnectivityGraph = ({ stats }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      setDimensions({
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight
      });
    };
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    update();
    return () => ro.disconnect();
  }, []);

  const topology = useMemo(() => {
    const list = [];
    const activeIds = new Set();
    list.push({ id: '9router', name: '9ROUTER', type: 'router', icon: Activity, color: 'var(--ye)' });

    const inputs = new Map();
    const providers = new Map();

    if (stats?.activeRequests) {
      stats.activeRequests.forEach(r => {
        const inputId = r.account || 'luna';
        if (!inputs.has(inputId)) {
          inputs.set(inputId, { id: inputId, name: inputId.split(' ').pop(), type: 'input', icon: Zap, color: 'var(--ac)', active: true });
        }
        if (r.provider && !providers.has(r.provider)) {
          providers.set(r.provider, { id: r.provider, name: r.provider.toUpperCase(), type: 'provider', icon: Server, color: 'var(--pu)', active: true });
        }
        activeIds.add(inputId);
        activeIds.add(r.provider);
      });
    }

    if (inputs.size === 0 && stats?.recentRequests?.length > 0) {
      const top = stats.recentRequests[0];
      inputs.set('luna', { id: 'luna', name: 'Luna Client', type: 'input', icon: Zap, color: 'var(--ac)', active: false });
      if (top.provider && !providers.has(top.provider)) {
        providers.set(top.provider, { id: top.provider, name: top.provider.toUpperCase(), type: 'provider', icon: Server, color: 'var(--pu)', active: false });
      }
    }

    const inputList = Array.from(inputs.values()).slice(0, 3);
    const providerList = Array.from(providers.values()).slice(0, 3);
    const slots = [{ x: -200, y: 0 }, { x: -180, y: -90 }, { x: -180, y: 90 }, { x: 200, y: 0 }, { x: 180, y: -70 }, { x: 180, y: 70 }];
    inputList.forEach((it, i) => list.push({ ...it, ...slots[i] }));
    providerList.forEach((it, i) => list.push({ ...it, ...slots[i + 3] }));
    return { nodes: list, activeIds };
  }, [stats]);

  return (
    <div className="card" ref={containerRef} style={{ padding: 24, height: 380, display: 'flex', flexDirection: 'column', gap: 10, background: 'radial-gradient(circle at center, rgba(234, 88, 12, 0.05) 0%, transparent 70%)', border: '1px solid var(--bd)', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes dash { to { stroke-dashoffset: -20; } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}><Layers size={18} style={{ color: 'var(--ye)' }} /> Neural Connectivity</h2>
        <div className="badge bn" style={{ fontSize: 9, color: 'var(--ye)', background: 'rgba(234, 88, 12, 0.1)' }}>LIVE CLUSTER</div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
           {dimensions.w > 0 && topology.nodes.filter(n => n.id !== '9router').map(node => {
             const cx = dimensions.w / 2; const cy = (dimensions.h - 60) / 2; 
             const startX = cx + node.x; const startY = cy + node.y; const endX = cx; const endY = cy;
             const cp1x = startX + (endX - startX) * 0.6; const cp1y = startY; const cp2x = startX + (endX - startX) * 0.4; const cp2y = endY;
             const isActive = node.active;
             return (
               <path key={node.id} d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`} stroke={isActive ? (node.type === 'input' ? 'var(--ac)' : 'var(--pu)') : 'var(--bd)'} strokeWidth={isActive ? 2 : 1} fill="none" strokeDasharray={isActive ? "5 5" : "0"} style={{ animation: isActive ? 'dash 1.5s linear infinite' : 'none', opacity: isActive ? 0.6 : 0.2 }} />
             );
           })}
        </svg>
        {topology.nodes.map(node => (
          <div key={node.id} style={{ position: 'absolute', left: `calc(50% + ${node.x}px)`, top: `calc(50% + ${node.y}px)`, transform: 'translate(-50%, -50%)', zIndex: node.type === 'router' ? 10 : 5 }}>
            {node.type === 'router' ? (
              <div style={{ position: 'relative' }}>
                {stats?.activeRequests?.length > 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, border: '2px solid var(--ye)', animation: 'pulse-ring 2s infinite' }} />}
                <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--s1)', border: '2px solid var(--ye)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(234, 88, 12, 0.4)', gap: 6 }}>
                  <Activity size={32} style={{ color: 'var(--ye)' }} />
                  <span className="mono" style={{ fontSize: 10, fontWeight: 900, color: 'var(--ye)', letterSpacing: '0.05em' }}>9ROUTER</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(20, 20, 25, 0.95)', border: `1px solid ${node.active ? node.color : 'var(--bd)'}`, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', transition: 'all 0.3s ease' }}>
                <node.icon size={14} style={{ color: node.active ? node.color : '#555' }} />
                <span className="mono" style={{ fontSize: 11, color: node.active ? '#fff' : '#888', fontWeight: 800 }}>{node.name}</span>
                {node.active && <div className="dot dg" style={{ width: 6, height: 6, boxShadow: '0 0 10px var(--gr)' }} />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

export function Router9UsagePage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [keys, setKeys] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true); 
    // Don't show full-page loading spinner if we already have stats (polling/refresh)
    else if (!stats) setLoading(true);
    
    setError(null);
    try {
      if (activeTab === 'dashboard') {
        const [statsRes, chartRes] = await Promise.all([api.get9RouterStats(period), api.get9RouterChart(period)]);
        if (statsRes.error === 'router9_unavailable') { setError('9Router is not detected or offline.'); setStats(null); }
        else { setStats(statsRes); setChartData(chartRes || []); }
      } else {
        const [keysRes, settingsRes] = await Promise.all([api.get9RouterKeys(), api.get9RouterSettings()]);
        setKeys(keysRes.keys || []);
        setSettings(settingsRes || {});
      }
    } catch (err) { console.error('Failed to fetch 9Router data:', err); setError('An error occurred while connecting to 9Router.'); }
    finally { setLoading(false); setIsRefreshing(false); }
  }, [period, activeTab, stats]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time polling for Dashboard
  useEffect(() => {
    if (activeTab !== 'dashboard' || error) return;
    const interval = setInterval(() => { fetchData(); }, 3000);
    return () => clearInterval(interval);
  }, [activeTab, error, fetchData]);

  const topModels = useMemo(() => {
    if (!stats?.byModel) return [];
    return Object.entries(stats.byModel).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.requests - a.requests);
  }, [stats]);

  if (loading && !isRefreshing) {
    return (
      <div className="pg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <RefreshCw className="w-8 h-8 text-ac" style={{ animation: 'spin 1s linear infinite' }} />
        <span className="text-t2 mono" style={{ fontSize: 13, marginTop: 16 }}>Reordering neural pathways...</span>
      </div>
    );
  }

  const StatPanel = ({ label, val, color, sub }) => (
    <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, border: '1px solid var(--bd)', minWidth: 0, justifyContent: 'center' }}>
      <span className="mono" style={{ fontSize: 10, color: '#aaa', fontWeight: 800, letterSpacing: '0.04em' }}>{label}</span>
      <div style={{ fontSize: 26, fontWeight: 900, color: color || '#fff', lineHeight: 1 }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: '#888', fontWeight: 600, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div className="pg" style={{ padding: '12px 40px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 12, 
              background: 'linear-gradient(135deg, #E25E3E 0%, #C24914 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(194, 73, 20, 0.25)',
              flexShrink: 0
            }}>
              <HubIcon size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>9Router Proxy</h1>
              <div style={{ fontSize: 13, color: '#6B7BA3', marginTop: 1, fontWeight: 600 }}>v0.4.52</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 2 }}>
            <div style={{ color: 'var(--ye)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
               <ArrowUpRight size={14} /> New version available: v0.4.55
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn ba" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12 }}>Update now</button>
              <span className="mono" style={{ fontSize: 11, color: '#444' }}>npm i -g 9router@latest</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10, border: '1px solid var(--bd)' }}>
            <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'btn btp' : 'btn btg'} style={{ fontSize: 11, padding: '6px 16px', border: 'none', borderRadius: 8 }}>Dashboard</button>
            <button onClick={() => setActiveTab('endpoints')} className={activeTab === 'endpoints' ? 'btn btp' : 'btn btg'} style={{ fontSize: 11, padding: '6px 16px', border: 'none', borderRadius: 8 }}>Endpoints</button>
          </div>
          
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0a0a0c', padding: '4px 10px', borderRadius: 12, border: '1px solid var(--bd)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {PERIODS.map(p => (
                  <button key={p.value} onClick={() => setPeriod(p.value)} className={period === p.value ? 'btn btp' : 'btn btg'} style={{ fontSize: 10, padding: '4px 12px', border: 'none', borderRadius: 8, fontWeight: 700 }}>{p.label}</button>
                ))}
              </div>
              <div style={{ width: 1, height: 16, background: 'var(--bd)' }} />
              <button className="nav-icon-btn" onClick={() => fetchData(true)}><RefreshCw size={14} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} /></button>
            </div>
          )}
        </div>
      </div>

      {error ? (
         <div className="card" style={{ padding: 60, textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle size={48} style={{ color: 'var(--re)', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>9Router Connection Lost</h2>
            <button className="btn btp" style={{ marginTop: 24, padding: '10px 32px' }} onClick={() => fetchData(true)}>Handshake</button>
         </div>
      ) : activeTab === 'dashboard' ? (
        <>
          {/* Dashboard Tab Content */}
          <div style={{ display: 'flex', gap: 16 }}>
            <StatPanel label="TOTAL REQUESTS" val={stats?.totalRequests?.toLocaleString() || '0'} />
            <StatPanel label="TOTAL INPUT TOKENS" val={stats?.totalPromptTokens?.toLocaleString() || '0'} color="#ea580c" />
            <StatPanel label="OUTPUT TOKENS" val={stats?.totalCompletionTokens?.toLocaleString() || '0'} color="#10b981" />
            <StatPanel label="EST. COST" val={`~$${stats?.totalCost?.toFixed(2) || '0.00'}`} color="#f59e0b" sub="Estimated billing" />
          </div>

          <div style={{ display: 'flex', gap: 24, height: 380 }}>
            <div style={{ flex: 1 }}><ConnectivityGraph stats={stats} /></div>
            <div className="card" style={{ width: '30%', display: 'flex', flexDirection: 'column', border: '1px solid var(--bd)', overflow: 'hidden' }}>
               <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}><h2 style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>LIVE FEED</h2><Clock size={14} style={{ color: '#444' }} /></div>
               <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 20 }}>
                 {stats?.recentRequests?.map((r, i) => (
                   <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className={`dot ${r.status === 'ok' ? 'dg' : 'dr'}`} style={{ width: 4, height: 4 }} /><span className="mono" style={{ fontSize: 11, color: '#fff', fontWeight: 800 }}>{r.model.split('/').pop()}</span></div><span className="mono" style={{ fontSize: 10, color: '#888' }}>{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="mono" style={{ fontSize: 10, color: '#aaa', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 6 }}>{r.provider.toUpperCase()}</span><span className="mono" style={{ fontSize: 11, fontWeight: 800, color: 'var(--ye)' }}>{r.promptTokens.toLocaleString()}↑ <span style={{ color: 'var(--ac)' }}>{r.completionTokens.toLocaleString()}↓</span></span></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}><BarChart3 size={18} /> Volume Matrix</h2>
                <div className="badge bn" style={{ fontSize: 10 }}>{period.toUpperCase()} ACTIVITY</div>
              </div>
              <div style={{ width: '100%', height: 280 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="usageGradFinal5" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--ac)" stopOpacity={0.25}/><stop offset="95%" stopColor="var(--ac)" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 10, fontFamily: 'JetBrains Mono' }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} /><Tooltip contentStyle={{ background: '#000', border: '1px solid var(--bd)', borderRadius: 12, fontSize: 12 }} itemStyle={{ color: 'var(--ac)' }} /><Area type="monotone" dataKey="tokens" stroke="var(--ac)" strokeWidth={3} fillOpacity={1} fill="url(#usageGradFinal5)" animationDuration={1000} /></AreaChart></ResponsiveContainer></div>
            </div>
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Cluster Allocation</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                {topModels.slice(0, 6).map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="mono" style={{ fontSize: 11, color: '#fff', fontWeight: 800 }}>{m.name.split('/').pop()}</span><span className="mono" style={{ fontSize: 11, color: '#aaa' }}>{m.requests}</span></div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', background: 'linear-gradient(90deg, var(--ac) 0%, var(--pu) 100%)', width: `${(m.requests / stats.totalRequests) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Endpoints Tab Content */}
          <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}><Database size={20} style={{ color: 'var(--ye)' }} /> Global API Endpoints</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Local Entry', url: 'http://localhost:20128/v1', icon: Terminal, status: 'Active' },
                { label: 'External Proxy', url: 'https://proxy.9router.io/v1', icon: ExternalLink, status: 'Provisioned' }
              ].map((ep, i) => (
                <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 16 }}>
                   <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ep.icon size={18} style={{ color: 'var(--ac)' }} /></div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>{ep.label}</div>
                     <div className="mono" style={{ fontSize: 13, color: '#fff', marginTop: 4 }}>{ep.url}</div>
                   </div>
                   <div className="badge bg" style={{ fontSize: 10 }}>{ep.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
             <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}><Key size={20} style={{ color: 'var(--pu)' }} /> Neural Access Keys</h2>
             <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--bd)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '12px 20px', background: 'rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 800, color: '#888', letterSpacing: '0.05em' }}>
                  <span>KEY NAME</span>
                  <span>STATUS</span>
                  <span style={{ textAlign: 'right' }}>CREATED</span>
                </div>
                {keys.map((k, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px 20px', borderTop: '1px solid var(--bd)', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="dot dg" style={{ width: 6, height: 6 }} />
                      <span style={{ fontWeight: 600, color: '#fff' }}>{k.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: '#555' }}>9r_...{k.key?.slice(-4)}</span>
                    </div>
                    <div><span className="badge bn" style={{ fontSize: 10 }}>ACTIVE</span></div>
                    <div style={{ textAlign: 'right', color: '#777', fontSize: 12 }}>{new Date(k.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
                {keys.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>No active keys found.</div>}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

const HubIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="4" r="2" />
    <circle cx="12" cy="20" r="2" />
    <circle cx="4" cy="12" r="2" />
    <circle cx="20" cy="12" r="2" />
    <line x1="12" y1="7" x2="12" y2="9" />
    <line x1="12" y1="15" x2="12" y2="17" />
    <line x1="7" y1="12" x2="9" y2="12" />
    <line x1="15" y1="12" x2="17" y2="12" />
  </svg>
);
