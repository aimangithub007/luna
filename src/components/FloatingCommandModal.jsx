import { useState, useEffect, useRef } from "react";
import { X, Maximize2, Minimize2, Terminal, Search } from "lucide-react";
import { api } from "../lib/api";

export function FloatingCommandModal({ isOpen, onClose, page, initialRight = 1030 }) {


  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [pos, setPos] = useState(null); 
  const [size, setSize] = useState({ w: 400, h: 500 });
  const [commands, setCommands] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  const modalRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadCommands();
      setIsMaximized(false);
      setIsMinimized(false);
      setPos(null); // Reset to dynamic initialRight
      setSize({ w: 400, h: 500 }); // Reset to initial size
    }
  }, [isOpen, page, initialRight]);



  async function loadCommands() {
    setLoading(true);
    try {
      const resp = await api.getCommands();
      console.log("FloatingCommandModal: resp =", resp);
      setCommands(resp.sections || []);
    } catch (e) {
      console.error("Failed to load commands", e);
    } finally {
      setLoading(false);
    }
  }

  // Resizing logic
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = modalRef.current.getBoundingClientRect();
    const startW = size.w;
    const startH = size.h;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = pos ? pos.x : rect.left;
    const startPosY = pos ? pos.y : rect.top;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newW = startW;
      let newH = startH;
      let newX = startPosX;
      let newY = startPosY;

      if (direction.includes('r')) newW = startW + deltaX;
      if (direction.includes('l')) { newW = startW - deltaX; newX = startPosX + deltaX; }
      if (direction.includes('b')) newH = startH + deltaY;
      if (direction.includes('t')) { newH = startH - deltaY; newY = startPosY + deltaY; }

      if (newW < 300) { if (direction.includes('l')) newX = startPosX + (startW - 300); newW = 300; }
      if (newH < 300) { if (direction.includes('t')) newY = startPosY + (startH - 300); newH = 300; }

      setSize({ w: newW, h: newH });
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Dragging logic
  useEffect(() => {
    if (!isOpen) return;

    
    const handleMouseDown = (e) => {
      if (e.target.closest('.modal-resize-handle')) return;
      const rect = modalRef.current.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      const handleMouseMove = (moveEvent) => {
        setPos({
          x: moveEvent.clientX - startX,
          y: moveEvent.clientY - startY
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const header = dragRef.current;
    if (header) header.addEventListener("mousedown", handleMouseDown);
    return () => header?.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, pos]);

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setSize({ w: 400, h: 500 });
      setPos(null);
    } else {
      setIsMaximized(true);
      const w = window.innerWidth * 0.66;
      const h = window.innerHeight * 0.66;
      setSize({ w, h });
      setPos({
        x: (window.innerWidth - w) / 2,
        y: (window.innerHeight - h) / 2
      });

    }
  };


  if (!isOpen) return null;

  const modalStyle = { 
    top: pos ? pos.y : 60, 
    left: (pos && pos.x !== undefined) ? pos.x : undefined, 
    right: (pos && pos.x !== undefined) ? undefined : initialRight,
    width: size.w, 
    height: isMinimized ? 40 : size.h, 
    zIndex: 1200 
  };



  // Simple fuzzy match helper for command names
  const fuzzyMatch = (str, pattern) => {
    pattern = pattern.toLowerCase();
    str = str.toLowerCase();
    let i = 0, j = 0;
    while (i < str.length && j < pattern.length) {
      if (str[i] === pattern[j]) j++;
      i++;
    }
    return j === pattern.length;
  };

  const filteredCommands = commands.flatMap(s => s.commands || []).map(c => {
    const q = searchQuery.toLowerCase();
    const name = (c.name || "").toLowerCase();
    const cleanName = name.startsWith('/') ? name.substring(1) : name;
    const desc = (c.desc || c.description || "").toLowerCase();
    
    let score = -1;
    if (name === q || cleanName === q) score = 1000;
    else if (name.includes(q) || cleanName.includes(q)) score = 500;
    else if (fuzzyMatch(name, q) || fuzzyMatch(cleanName, q)) score = 100;
    else if (desc.includes(q)) score = 10;

    return { ...c, searchScore: score };
  })
  .filter(c => c.searchScore > -1 || !searchQuery)
  .sort((a, b) => b.searchScore - a.searchScore);



  return (
    <div ref={modalRef} className="floating-modal cmd-m" style={{ 
      position: "fixed", background: "var(--bg)", border: "1px solid var(--bd)", borderRadius: "12px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", overflow: "hidden", ...modalStyle
    }}>
      <div ref={dragRef} className="modal-header">
        <div className="header-title">
          <Terminal size={14} color="var(--ac)" />
          Quick Commands
        </div>
        <div className="header-actions">
          <button onClick={() => setIsMinimized(!isMinimized)} className="m-btn">
            {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
          <button onClick={toggleMaximize} className="m-btn">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={14} />}
          </button>

          <button onClick={onClose} className="m-btn close"><X size={14} /></button>
        </div>
      </div>

      {!isMinimized && (
        <div className="modal-content">
          <div className="cmd-search">
            <Search size={14} />
            <input 
              type="text" placeholder="Search commands..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="cmd-list">
            {loading ? <div className="cmd-msg">Loading...</div> : 
             filteredCommands.length > 0 ? (
               filteredCommands.map((cmd, i) => (
                 <div key={i} className="cmd-item">
                   <div className="cmd-name">{cmd.name}</div>
                   {cmd.usage && <div className="cmd-usage"><code>{cmd.usage}</code></div>}
                   <div className="cmd-desc">{cmd.desc || cmd.description}</div>
                 </div>
               ))
             ) : (
               <div className="cmd-msg">No commands found</div>
             )}
          </div>
        </div>
      )}

      {!isMinimized && (

        <>
          <div className="modal-resize-handle t" onMouseDown={(e) => handleResizeStart(e, 't')} />
          <div className="modal-resize-handle b" onMouseDown={(e) => handleResizeStart(e, 'b')} />
          <div className="modal-resize-handle l" onMouseDown={(e) => handleResizeStart(e, 'l')} />
          <div className="modal-resize-handle r" onMouseDown={(e) => handleResizeStart(e, 'r')} />
          <div className="modal-resize-handle tl" onMouseDown={(e) => handleResizeStart(e, 'tl')} />
          <div className="modal-resize-handle tr" onMouseDown={(e) => handleResizeStart(e, 'tr')} />
          <div className="modal-resize-handle bl" onMouseDown={(e) => handleResizeStart(e, 'bl')} />
          <div className="modal-resize-handle br" onMouseDown={(e) => handleResizeStart(e, 'br')} />
        </>
      )}

      <style>{`
        .cmd-m { transition: width 0.3s, height 0.3s, top 0.3s, left 0.3s, right 0.3s, bottom 0.3s; }
        .modal-header { 
          height: 40px; background: var(--s2); border-bottom: 1px solid var(--bd); 
          display: flex; align-items: center; padding: 0 12px; cursor: move; user-select: none;
        }
        .header-title { flex: 1; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--t1); margin-top: 10px;}
        .header-actions { display: flex; gap: 8; align-items: center; }
        .m-btn { background: none; border: none; color: var(--t3); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; }
        .m-btn:hover { background: var(--s3); color: var(--t1); }
        .m-btn.close:hover { background: #ef4444; color: #fff; }
        
        .modal-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 10px; gap: 10px; }
        .cmd-search { position: relative; }
        .cmd-search svg { position: absolute; left: 10px; top: 10px; color: var(--t3); }
        .cmd-search input { width: 100%; height: 34px; background: var(--s2); border: 1px solid var(--bd); border-radius: 6px; padding-left: 30px; font-size: 12px; color: var(--t1); }
        
        .cmd-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .cmd-item { padding: 12px; background: var(--s1); border: 1px solid var(--bd); border-radius: 8px; display: flex; flex-direction: column; gap: 4px; }
        .cmd-name { font-size: 13px; font-weight: 700; color: var(--ac); font-family: monospace; }
        .cmd-usage { font-size: 11px; color: var(--t2); padding: 4px 8px; background: #000; border-radius: 4px; }
        .cmd-desc { font-size: 12px; color: var(--t3); line-height: 1.4; }
        .cmd-msg { text-align: center; padding: 40px; color: var(--t3); font-size: 12px; }

        .modal-resize-handle { position: absolute; z-index: 1201; }
        .modal-resize-handle.t { top: 0; left: 0; width: 100%; height: 6px; cursor: ns-resize; }
        .modal-resize-handle.b { bottom: 0; left: 0; width: 100%; height: 6px; cursor: ns-resize; }
        .modal-resize-handle.l { top: 0; left: 0; width: 6px; height: 100%; cursor: ew-resize; }
        .modal-resize-handle.r { top: 0; right: 0; width: 6px; height: 100%; cursor: ew-resize; }
        .modal-resize-handle.tl { top: 0; left: 0; width: 12px; height: 12px; cursor: nwse-resize; z-index: 1202; }
        .modal-resize-handle.tr { top: 0; right: 0; width: 12px; height: 12px; cursor: nesw-resize; z-index: 1202; }
        .modal-resize-handle.bl { bottom: 0; left: 0; width: 12px; height: 12px; cursor: nesw-resize; z-index: 1202; }
        .modal-resize-handle.br { bottom: 0; right: 0; width: 12px; height: 12px; cursor: nwse-resize; z-index: 1202; }
      `}</style>
    </div>
  );
}
