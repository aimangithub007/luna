import { useState, useEffect } from "react";
import { 
  Palette, Search, ChevronUp, ChevronDown, Check, ChevronsUpDown, 
  Terminal, MessageSquare, Book, Layout, Maximize2, Move, AlertCircle, Info, Package
} from "lucide-react";

// ── Components for Demo ──

const CustomNumberInput = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 200 }}>
    <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>{label}</div>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        style={{ paddingRight: 40 }}
      />
      <div style={{ 
        position: 'absolute', right: 1, top: 1, bottom: 1, width: 32, 
        display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--bd2)',
        background: 'var(--s1)', borderRadius: '0 7px 7px 0'
      }}>
        <button 
          onClick={() => onChange(value + 1)}
          style={{ flex: 1, border: 'none', background: 'none', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--bd)' }}
        >
          <ChevronUp size={12} />
        </button>
        <button 
          onClick={() => onChange(value - 1)}
          style={{ flex: 1, border: 'none', background: 'none', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  </div>
);

const SearchableSelect = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 300, position: 'relative' }}>
      <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>{label}</div>
      <div 
        onClick={() => setOpen(!open)}
        style={{ 
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--bd)', borderRadius: 8, 
          padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          color: value ? 'var(--t1)' : 'var(--t3)', fontSize: 13
        }}
      >
        {value || "Select option..."}
        <ChevronsUpDown size={14} color="var(--t3)" />
      </div>
      
      {open && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, 
          background: 'var(--s2)', border: '1px solid var(--bd2)', borderRadius: 8, 
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden'
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--bd)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 8, top: 10, color: 'var(--t3)' }} />
              <input 
                autoFocus placeholder="Search..." value={q} onChange={e => setQ(e.target.value)}
                style={{ paddingLeft: 28, height: 32, fontSize: 12, background: 'var(--s3)' }}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(o => (
              <div 
                key={o} onClick={(e) => { e.stopPropagation(); onChange(o); setOpen(false); }}
                style={{ 
                  padding: '10px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  background: value === o ? 'var(--acb)' : 'transparent', color: value === o ? 'var(--ac)' : 'var(--t2)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = value === o ? 'var(--acb)' : 'transparent'}
              >
                {o}
                {value === o && <Check size={14} />}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Page ──

export function UIPage() {
  const [count, setCount] = useState(10);
  const [selected, setSelected] = useState("");
  const [listQ, setListQ] = useState("");
  
  const items = ["Overview", "System Status", "Analytics", "Project Documentation", "Task Scheduler", "Agent Core", "Memory Export"];

  return (
    <div className="pg" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Palette size={32} color="var(--ac)" />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Hermes UI Kit</h1>
        </div>
        <p style={{ color: 'var(--t3)', marginTop: 8, fontSize: 15 }}>
          The Single Source of Truth for building consistent, high-fidelity interfaces in the Hermes ecosystem.
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--bd)', margin: 0 }} />

      {/* Inputs Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h2 style={{ fontSize: 18, color: 'var(--ac)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Layout size={18} /> Form Elements
        </h2>
        
        <div className="card" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, marginBottom: 6 }}>Standard Input</div>
              <input type="text" placeholder="Type something..." />
            </div>
            
            <CustomNumberInput label="Integer Input (Elegant Controls)" value={count} onChange={setCount} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SearchableSelect 
              label="Searchable Combo Box" 
              options={["Next.js", "React", "Vue.js", "Angular", "Svelte", "Remix", "Solid"]} 
              value={selected} 
              onChange={setSelected}
            />
            
            <div>
              <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, marginBottom: 6 }}>Standard Select</div>
              <select style={{ cursor: 'pointer' }}>
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Lists Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h2 style={{ fontSize: 18, color: 'var(--ac)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Terminal size={18} /> Interactive Lists
        </h2>
        
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--s2)' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Searchable List Example</div>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--t3)' }} />
              <input 
                value={listQ} onChange={e => setListQ(e.target.value)}
                placeholder="Filter items..." 
                style={{ paddingLeft: 30, height: 34, background: 'var(--s1)', fontSize: 12 }} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.filter(i => i.toLowerCase().includes(listQ.toLowerCase())).map((item, idx) => (
              <div key={idx} className="trow" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="dot dg" />
                  {item}
                </div>
                <div className="badge bn">v1.2.0</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorial Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h2 style={{ fontSize: 18, color: 'var(--ac)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Book size={18} /> Development Guide
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Maximize2 size={16} /> Creating Floating Modals
            </h3>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
              Modal di Hermes menggunakan sistem <strong>Absolute Positioning</strong> dengan 8-handle resizing.
            </p>
            <pre className="mono" style={{ 
              background: '#000', padding: 16, borderRadius: 8, fontSize: 11, color: 'var(--ac)', 
              overflowX: 'auto', border: '1px solid var(--bd)' 
            }}>
{`// Template Modal Basic
export function MyModal({ isOpen }) {
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ w: 400, h: 500 });
  
  // Gunakan initialRight untuk stacking otomatis
  // (Docs: 20, Chat: 560, Cmd: 1030)
}`}
            </pre>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ye)', fontSize: 12 }}>
              <AlertCircle size={14} />
              <span>Gunakan Draggable logic pada Title Bar.</span>
            </div>
          </div>
          
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Info size={16} /> Architecture Patterns
            </h3>
            <ul style={{ fontSize: 13, color: 'var(--t2)', paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li><strong>Overview Page</strong>: Gunakan Grid Stats di bagian atas + Main Content (Logs/List) di bawahnya.</li>
              <li><strong>Search Priority</strong>: Selalu gunakan Hierarchical Scoring untuk hasil pencarian (Contiguous Match &gt; Fuzzy Match).</li>
              <li><strong>Resizing</strong>: Gunakan 2/3 viewport untuk mode Maximize agar tetap bisa ditarik.</li>
              <li><strong>Navigation</strong>: Tambahkan elemen baru ke <code>NAV</code> array di <code>App.jsx</code>.</li>
            </ul>
          </div>
        </div>
      </section>

      <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', borderTop: '1px solid var(--bd)' }}>
        Hermes Luna Dashboard — UI v2.4.0
      </div>

    </div>
  );
}
