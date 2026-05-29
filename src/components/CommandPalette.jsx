import { useState, useEffect, useRef } from "react";
import { Search, ChevronRight, Command } from "lucide-react";

export function CommandPalette({ isOpen, onClose, items, onSelect }) {
  const [query, setQuery] = useState("");
  const [selIdx, setSelIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = items.filter(it => 
    it.label.toLowerCase().includes(query.toLowerCase()) ||
    it.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelIdx(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelIdx(prev => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelIdx(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      if (filtered[selIdx]) {
        onSelect(filtered[selIdx].id);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: 600,
          background: "var(--s1)",
          border: "1px solid var(--bd)",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          overflow: "hidden",
          animation: "cmdFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--bd)" }}>
          <Search size={20} color="var(--ac)" />
          <input 
            ref={inputRef}
            type="text"
            placeholder="Search commands or pages..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ 
              flex: 1, 
              background: "transparent", 
              border: "none", 
              outline: "none", 
              fontSize: 18, 
              color: "var(--t1)",
              fontWeight: 400
            }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            <span style={{ fontSize: 11, background: "var(--s2)", padding: "2px 6px", borderRadius: 4, color: "var(--t3)", border: "1px solid var(--bd)" }}>ESC</span>
          </div>
        </div>

        <div ref={listRef} style={{ maxHeight: 400, overflowY: "auto", padding: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--t3)" }}>
              No results found for "{query}"
            </div>
          ) : (
            filtered.map((it, idx) => (
              <div 
                key={it.id}
                onClick={() => { onSelect(it.id); onClose(); }}
                onMouseEnter={() => setSelIdx(idx)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                  background: idx === selIdx ? "var(--acd)" : "transparent",
                  color: idx === selIdx ? "var(--ac)" : "var(--t2)",
                  transition: "all 0.1s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: idx === selIdx ? "rgba(94,234,212,0.1)" : "var(--s2)" }}>
                   <it.Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: idx === selIdx ? "var(--ac)" : "var(--t1)" }}>{it.label}</div>
                  <div style={{ fontSize: 11, color: idx === selIdx ? "var(--ac)" : "var(--t3)", opacity: 0.8 }}>Navigate to {it.label} page</div>
                </div>
                {idx === selIdx && <ChevronRight size={14} />}
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "12px 20px", background: "var(--s2)", borderTop: "1px solid var(--bd)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--t3)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ChevronRight size={10} /> to select</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Command size={10} /> + K to toggle</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--ac)", fontWeight: 600 }}>{filtered.length} Results</div>
        </div>
      </div>
      <style>{`
        @keyframes cmdFade {
          from { opacity: 0; transform: scale(0.98) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
