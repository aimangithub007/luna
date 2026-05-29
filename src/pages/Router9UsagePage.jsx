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

// ─── Node dimension constants (module-level, never change) ───────────────────
const CG_NW = 152, CG_NH = 46;   // outer node: width, height
const CG_RW = 128, CG_RH = 44;   // router node: width, height

// Simplified provider mapping to mimic 9Router's native behavior
const KNOWN_PROVIDERS = {
  "gemini-cli": { name: "Gemini CLI", color: "#4285F4", textIcon: ">" },
  "opencode": { name: "OpenCode Free", color: "#E87040", textIcon: "OC" },
  "sumonineone": { name: "SumoNineOne", color: "#7C3AED", textIcon: "OP" },
  "openai": { name: "OpenAI", color: "#10A37F", textIcon: "OA" },
  "gemini": { name: "Gemini", color: "#4285F4", textIcon: "GE" },
  "claude": { name: "Claude", color: "#D97757", textIcon: "CC" },
  "ollama": { name: "Ollama Cloud", color: "#ffffffff", textIcon: "OL" },
  "ollama-local": { name: "Ollama Local", color: "#ffffffff", textIcon: "OL" },
  "deepseek": { name: "DeepSeek", color: "#4D6BFE", textIcon: "DS" }
};

const getProviderProps = (providerId, customName) => {
  const normalizedId = providerId?.toLowerCase();
  const config = KNOWN_PROVIDERS[normalizedId] || {};
  let label = config.name || customName || providerId;
  const isCompatible = normalizedId?.includes('openai-compatible') || normalizedId?.includes('anthropic-compatible');
  if (isCompatible && customName) {
    label = customName;
  }
  return {
    label,
    color: config.color || "#6b7280",
    textIcon: config.textIcon || (providerId || "?").slice(0, 2).toUpperCase(),
    imageUrl: `http://localhost:20128/providers/${providerId}.png`
  };
};

// ─── ConnectivityGraph ───────────────────────────────────────────────────────
const ConnectivityGraph = ({ stats, providers = [] }) => {
  const wrapperRef = useRef(null);
  const [dim, setDim] = useState({ w: 700, h: 294 });

  // Track graph canvas size
  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const upd = () => setDim({ w: el.offsetWidth, h: el.offsetHeight });
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    upd();
    return () => ro.disconnect();
  }, []);

  // Build graph: node positions + bezier edge endpoints
  const graph = useMemo(() => {
    // ── Collect providers ─────────────────────────────────
    const provMap = new Map();

    // 1. Add all configured/known providers
    providers.forEach(p => {
      const props = getProviderProps(p.provider, p.name);
      provMap.set(p.provider, { id: p.provider, active: false, side: 'provider', ...props });
    });

    // 2. Mark active ones & add any missing ones from traffic
    (stats?.activeRequests ?? []).forEach(r => {
      if (r.provider) {
        if (provMap.has(r.provider)) {
          provMap.get(r.provider).active = true;
        } else {
          const props = getProviderProps(r.provider, r.provider);
          provMap.set(r.provider, { id: r.provider, active: true, side: 'provider', ...props });
        }
      }
    });

    // 3. Always add missing ones from recent requests so they don't disappear
    (stats?.recentRequests ?? []).forEach(r => {
      if (r.provider && !provMap.has(r.provider)) {
        const props = getProviderProps(r.provider, r.provider);
        provMap.set(r.provider, { id: r.provider, active: false, side: 'provider', ...props });
      }
    });

    // Limit to 6 nodes maximum for the graph spread nicely
    const outer = [...provMap.values()].slice(0, 6);

    // ── Position nodes radially from top, clockwise ────────────────
    const cx = dim.w / 2;
    const cy = dim.h / 2;

    // Elliptical radii: generous horizontal spread, constrained vertical
    const Rx = Math.min(dim.w * 0.30, 265);
    const Ry = Math.min(dim.h * 0.38, 128);

    const positioned = outer.map((n, i, arr) => {
      // Start at -π/2 (top), step clockwise by (2π / count)
      const angle = -Math.PI / 2 + (arr.length > 1 ? (2 * Math.PI * i) / arr.length : 0);
      return {
        ...n,
        x: cx + Math.cos(angle) * Rx,
        y: cy + Math.sin(angle) * Ry,
      };
    });

    // ── Compute edge connection points on node boundaries ──────────
    // Rule: horizontal connection when |dx| >= |dy|, else vertical
    const edges = positioned.map(n => {
      const dx = cx - n.x;
      const dy = cy - n.y;
      let from, to;
      if (Math.abs(dx) >= Math.abs(dy)) {
        // Connect via left/right faces
        const s = Math.sign(dx);
        from = { x: n.x + s * CG_NW / 2, y: n.y };
        to   = { x: cx  - s * CG_RW / 2, y: cy  };
      } else {
        // Connect via top/bottom faces
        const s = Math.sign(dy);
        from = { x: n.x, y: n.y + s * CG_NH / 2 };
        to   = { x: cx,  y: cy  - s * CG_RH / 2 };
      }
      return { key: n.id, from, to, active: n.active };
    });

    return { cx, cy, outerNodes: positioned, edges };
  }, [stats, dim]);

  // Build cubic bezier path string from pre-computed edge endpoints
  const bezier = ({ from, to }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      // Horizontal S-curve
      const cp = Math.abs(dx) * 0.5 * Math.sign(dx);
      return `M ${from.x} ${from.y} C ${from.x + cp} ${from.y}, ${to.x - cp} ${to.y}, ${to.x} ${to.y}`;
    }
    // Vertical S-curve
    const cp = Math.abs(dy) * 0.5 * Math.sign(dy);
    return `M ${from.x} ${from.y} C ${from.x} ${from.y + cp}, ${to.x} ${to.y - cp}, ${to.x} ${to.y}`;
  };

  const hasActive = (stats?.activeRequests?.length ?? 0) > 0;

  return (
    <div
      className="card"
      style={{
        padding: 0,
        height: 380,
        display: 'flex',
        flexDirection: 'column',
        background: '#07070f',
        border: '1px solid var(--bd)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes cg-flow  { to { stroke-dashoffset: -18; } }
        @keyframes cg-pulse { 0% { opacity: .65; transform: scale(1); } 100% { opacity: 0; transform: scale(1.55); } }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        padding: '13px 18px',
        height: 46,
        boxSizing: 'border-box',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <h2 style={{
          fontSize: 14, fontWeight: 800, color: '#fff', margin: 0,
          display: 'flex', alignItems: 'center', gap: 9,
        }}>
          <Layers size={16} style={{ color: 'var(--ye)' }} />
          Neural Connectivity
        </h2>
        <div className="badge bn" style={{ fontSize: 9, color: 'var(--ye)', background: 'rgba(234,88,12,0.1)' }}>
          LIVE CLUSTER
        </div>
      </div>

      {/* ── Graph canvas ── */}
      <div ref={wrapperRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* SVG layer: dot grid + bezier edges */}
        <svg style={{ position: 'absolute', inset: 0 }} width={dim.w} height={dim.h}>
          <defs>
            <pattern id="cg-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.048)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cg-grid)" />

          {graph.edges.map(e => (
            <g key={e.key}>
              {/* Soft glow behind active edges */}
              {e.active && (
                <path
                  d={bezier(e)}
                  stroke="#e76e2e"
                  strokeWidth={6}
                  fill="none"
                  strokeOpacity={0.10}
                />
              )}
              {/* Main edge line */}
              <path
                d={bezier(e)}
                stroke={e.active ? '#e76e2e' : 'rgba(255,255,255,0.07)'}
                strokeWidth={e.active ? 1.8 : 1.2}
                fill="none"
                strokeDasharray={e.active ? '5 4' : undefined}
                style={e.active ? { animation: 'cg-flow 1.1s linear infinite' } : undefined}
              />
            </g>
          ))}
        </svg>

        {/* ── Outer nodes (clients / providers) ── */}
        {graph.outerNodes.map(node => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, -50%)',
              width: CG_NW,
              height: CG_NH,
              background: '#0c0c18',
              border: `1px solid ${node.active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.055)'}`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '0 12px',
              zIndex: 10,
              boxShadow: node.active
                ? '0 4px 20px rgba(0,0,0,0.72)'
                : '0 2px 10px rgba(0,0,0,0.45)',
            }}
          >
            {/* Node icon badge */}
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              flexShrink: 0,
              background: `rgba(255,255,255,0.05)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img 
                src={node.imageUrl} 
                alt={node.label} 
                style={{ width: 18, height: 18, objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 800, color: node.color, display: 'none' }}>
                {node.textIcon}
              </span>
            </div>

            {/* Label */}
            <span className="mono" style={{
              fontSize: 11,
              fontWeight: 800,
              color: node.active ? '#fff' : '#dde3f0',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {node.label}
            </span>

            {/* Active indicator dot */}
            {node.active && (
              <div style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 5px #22c55e',
                flexShrink: 0,
              }} />
            )}
          </div>
        ))}

        {/* ── Router node (center hub) ── */}
        <div style={{
          position: 'absolute',
          left: graph.cx,
          top: graph.cy,
          transform: 'translate(-50%, -50%)',
          width: CG_RW,
          height: CG_RH,
          background: '#0c0c18',
          border: '1.5px solid #e76e2e',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '0 12px',
          zIndex: 20,
          boxShadow: '0 0 28px rgba(231,110,46,0.14), 0 4px 18px rgba(0,0,0,0.72)',
        }}>
          {/* Pulse ring when active */}
          {hasActive && (
            <div style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 14,
              border: '1px solid rgba(231,110,46,0.22)',
              animation: 'cg-pulse 2.5s ease-out infinite',
              pointerEvents: 'none',
            }} />
          )}

          {/* "9" orange badge */}
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            flexShrink: 0,
            background: '#e76e2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 13,
            color: '#fff',
          }}>
            9
          </div>

          <span className="mono" style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
            9Router
          </span>
        </div>

        {/* ── Zoom controls (decorative, matches image 2) ── */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 30,
        }}>
          {[
            { icon: '+',  title: 'Zoom in'    },
            { icon: '−',  title: 'Zoom out'   },
            { icon: '⤢',  title: 'Fit to view'},
          ].map(({ icon, title }, i) => (
            <button
              key={i}
              title={title}
              style={{
                width: 26,
                height: 26,
                background: 'rgba(8,8,18,0.90)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: i === 0 ? '5px 5px 0 0' : i === 2 ? '0 0 5px 5px' : 0,
                color: '#505070',
                fontSize: i === 2 ? 9 : 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default',
                lineHeight: 1,
              }}
            >
              {icon}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

// ─── Period selector options ──────────────────────────────────────────────────
const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: '24h',   label: '24h'   },
  { value: '7d',    label: '7D'    },
  { value: '30d',   label: '30D'   },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export function Router9UsagePage() {
  const [stats,        setStats]        = useState(null);
  const [chartData,    setChartData]    = useState([]);
  const [keys,         setKeys]         = useState([]);
  const [providers,    setProviders]    = useState([]);
  const [settings,     setSettings]     = useState(null);
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [period,       setPeriod]       = useState('7d');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else if (!stats) setLoading(true);
    setError(null);
    try {
      if (activeTab === 'dashboard') {
        const [statsRes, chartRes, provRes] = await Promise.all([
          api.get9RouterStats(period),
          api.get9RouterChart(period),
          api.get9RouterProviders(),
        ]);
        if (statsRes.error === 'router9_unavailable') {
          setError('9Router is not detected or offline.');
          setStats(null);
        } else {
          setStats(statsRes);
          setChartData(chartRes || []);
          if (provRes?.connections) {
            setProviders(provRes.connections);
          }
        }
      } else {
        const [keysRes, settingsRes] = await Promise.all([
          api.get9RouterKeys(),
          api.get9RouterSettings(),
        ]);
        setKeys(keysRes.keys || []);
        setSettings(settingsRes || {});
      }
    } catch (err) {
      console.error('Failed to fetch 9Router data:', err);
      setError('An error occurred while connecting to 9Router.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [period, activeTab, stats]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time synchronization via Server-Sent Events (SSE)
  useEffect(() => {
    if (activeTab !== 'dashboard' || error) return;
    
    const es = new EventSource("/api/9router/usage/stream");
    
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.error) return;
        
        setStats(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            activeRequests: data.activeRequests,
            recentRequests: data.recentRequests,
          };
        });
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    return () => es.close();
  }, [activeTab, error]);

  const topModels = useMemo(() => {
    if (!stats?.byModel) return [];
    return Object.entries(stats.byModel)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.requests - a.requests);
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

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #E25E3E 0%, #C24914 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(194, 73, 20, 0.25)',
              flexShrink: 0,
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
              <button className="nav-icon-btn" onClick={() => fetchData(true)}>
                <RefreshCw size={14} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Error state ── */}
      {error ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertCircle size={48} style={{ color: 'var(--re)', margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>9Router Connection Lost</h2>
          <button className="btn btp" style={{ marginTop: 24, padding: '10px 32px' }} onClick={() => fetchData(true)}>Handshake</button>
        </div>

      ) : activeTab === 'dashboard' ? (
        <>
          {/* ── Stat panels ── */}
          <div style={{ display: 'flex', gap: 16 }}>
            <StatPanel label="TOTAL REQUESTS"     val={stats?.totalRequests?.toLocaleString()      || '0'} />
            <StatPanel label="TOTAL INPUT TOKENS"  val={stats?.totalPromptTokens?.toLocaleString()  || '0'} color="#ea580c" />
            <StatPanel label="OUTPUT TOKENS"       val={stats?.totalCompletionTokens?.toLocaleString() || '0'} color="#10b981" />
            <StatPanel label="EST. COST"            val={`~$${stats?.totalCost?.toFixed(2) || '0.00'}`} color="#f59e0b" sub="Estimated billing" />
          </div>

          {/* ── Connectivity graph + live feed ── */}
          <div style={{ display: 'flex', gap: 24, height: 380 }}>
            <div style={{ flex: 1 }}>
              <ConnectivityGraph stats={stats} providers={providers} />
            </div>
            <div className="card" style={{ width: '30%', display: 'flex', flexDirection: 'column', border: '1px solid var(--bd)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <h2 style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>LIVE FEED</h2>
                <Clock size={14} style={{ color: '#444' }} />
              </div>
              <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 20 }}>
                {stats?.recentRequests?.map((r, i) => (
                  <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={`dot ${r.status === 'ok' ? 'dg' : 'dr'}`} style={{ width: 4, height: 4 }} />
                        <span className="mono" style={{ fontSize: 11, color: '#fff', fontWeight: 800 }}>{r.model.split('/').pop()}</span>
                      </div>
                      <span className="mono" style={{ fontSize: 10, color: '#888' }}>
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{ fontSize: 10, color: '#aaa', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 6 }}>
                        {r.provider.toUpperCase()}
                      </span>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 800, color: 'var(--ye)' }}>
                        {r.promptTokens.toLocaleString()}↑{' '}
                        <span style={{ color: 'var(--ac)' }}>{r.completionTokens.toLocaleString()}↓</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Charts row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BarChart3 size={18} /> Volume Matrix
                </h2>
                <div className="badge bn" style={{ fontSize: 10 }}>{period.toUpperCase()} ACTIVITY</div>
              </div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usageGradFinal5" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--ac)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--ac)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                    <Tooltip contentStyle={{ background: '#000', border: '1px solid var(--bd)', borderRadius: 12, fontSize: 12 }} itemStyle={{ color: 'var(--ac)' }} />
                    <Area type="monotone" dataKey="tokens" stroke="var(--ac)" strokeWidth={3} fillOpacity={1} fill="url(#usageGradFinal5)" animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Cluster Allocation</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                {topModels.slice(0, 6).map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{ fontSize: 11, color: '#fff', fontWeight: 800 }}>{m.name.split('/').pop()}</span>
                      <span className="mono" style={{ fontSize: 11, color: '#aaa' }}>{m.requests}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--ac) 0%, var(--pu) 100%)', width: `${(m.requests / stats.totalRequests) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>

      ) : (
        /* ── Endpoints tab ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Database size={20} style={{ color: 'var(--ye)' }} /> Global API Endpoints
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Local Entry',    url: 'http://localhost:20128/v1',    icon: Terminal,    status: 'Active'       },
                { label: 'External Proxy', url: 'https://proxy.9router.io/v1', icon: ExternalLink, status: 'Provisioned' },
              ].map((ep, i) => (
                <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ep.icon size={18} style={{ color: 'var(--ac)' }} />
                  </div>
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
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Key size={20} style={{ color: 'var(--pu)' }} /> Neural Access Keys
            </h2>
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
              {keys.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>No active keys found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HubIcon SVG ─────────────────────────────────────────────────────────────
const HubIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="4"  r="2" />
    <circle cx="12" cy="20" r="2" />
    <circle cx="4"  cy="12" r="2" />
    <circle cx="20" cy="12" r="2" />
    <line x1="12" y1="7"  x2="12" y2="9"  />
    <line x1="12" y1="15" x2="12" y2="17" />
    <line x1="7"  y1="12" x2="9"  y2="12" />
    <line x1="15" y1="12" x2="17" y2="12" />
  </svg>
);