import { useState, useEffect, useRef } from "react";
import { X, Maximize2, Minimize2, Move, Search } from "lucide-react";
import { DocsViewer } from "./DocsViewer";

export function FloatingDocsModal({ isOpen, onClose, page, initialRight = 20 }) {

  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [pos, setPos] = useState(null); // null means use default CSS (right)
  const [size, setSize] = useState({ w: 520, h: 650 });
  
  const modalRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  // Reset position and maximized state when opened or page changes
  useEffect(() => {
    if (isOpen) {
      setIsMaximized(false);
      setIsMinimized(false);
      setPos(null); // Reset to dynamic initialRight
      setSize({ w: 520, h: 650 }); // Reset to initial size
    }
  }, [isOpen, page, initialRight]);


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
  }, [isOpen, pos, isMaximized]);

  // Resizing logic
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get current position (fallback to default if null)
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

      if (direction.includes('r')) {
        newW = startW + deltaX;
      }
      if (direction.includes('l')) {
        newW = startW - deltaX;
        newX = startPosX + deltaX;
      }
      if (direction.includes('b')) {
        newH = startH + deltaY;
      }
      if (direction.includes('t')) {
        newH = startH - deltaY;
        newY = startPosY + deltaY;
      }

      // Constrain minimum size
      if (newW < 300) {
        if (direction.includes('l')) newX = startPosX + (startW - 300);
        newW = 300;
      }
      if (newH < 300) {
        if (direction.includes('t')) newY = startPosY + (startH - 300);
        newH = 300;
      }

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

  const toggleMaximize = () => {
    if (isMaximized) {
      // Revert to initial size or keep current? 
      // The user usually wants a toggle. Let's revert to a decent default.
      setIsMaximized(false);
      setSize({ w: 520, h: 650 });
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
    zIndex: 1000 
  };



  return (
    <div ref={modalRef} className={`floating-modal ${isMaximized ? 'maximized' : ''}`} style={{ 
      position: "fixed",
      background: "var(--bg)",
      border: "1px solid var(--bd)",
      borderRadius: "12px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      ...modalStyle
    }}>
      {/* Title Bar */}
      <div ref={dragRef} className="modal-header" style={{ 
        height: "40px", 
        background: "var(--s2)", 
        borderBottom: "1px solid var(--bd)",
        display: "flex", 
        alignItems: "center", 
        padding: "0 12px", 
        cursor: "move",
        userSelect: "none"

      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, fontSize: "12px", fontWeight: 700, color: "var(--t1)" }}>
          <Book size={14} color="var(--ac)" />
          Documentation
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => setIsMinimized(!isMinimized)} className="m-btn">
            {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
          <button onClick={toggleMaximize} className="m-btn">
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={14} />}
          </button>

          <button onClick={onClose} className="m-btn close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div style={{ flex: 1, overflow: "hidden", pointerEvents: "auto" }}>
          <DocsViewer mini={true} />
        </div>
      )}

      {/* Resize Handles */}
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
        .floating-modal { transition: width 0.3s, height 0.3s, top 0.3s, left 0.3s, bottom 0.3s, right 0.3s; }
        .floating-modal.maximized { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .m-btn { background: none; border: none; color: var(--t3); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; }
        .m-btn:hover { background: var(--s3); color: var(--t1); }
        .m-btn.close:hover { background: #ef4444; color: #fff; }
        
        .modal-resize-handle { position: absolute; z-index: 1001; }
        .modal-resize-handle.t { top: 0; left: 0; width: 100%; height: 6px; cursor: ns-resize; }
        .modal-resize-handle.b { bottom: 0; left: 0; width: 100%; height: 6px; cursor: ns-resize; }
        .modal-resize-handle.l { top: 0; left: 0; width: 6px; height: 100%; cursor: ew-resize; }
        .modal-resize-handle.r { top: 0; right: 0; width: 6px; height: 100%; cursor: ew-resize; }
        .modal-resize-handle.tl { top: 0; left: 0; width: 12px; height: 12px; cursor: nwse-resize; z-index: 1002; }
        .modal-resize-handle.tr { top: 0; right: 0; width: 12px; height: 12px; cursor: nesw-resize; z-index: 1002; }
        .modal-resize-handle.bl { bottom: 0; left: 0; width: 12px; height: 12px; cursor: nesw-resize; z-index: 1002; }
        .modal-resize-handle.br { bottom: 0; right: 0; width: 12px; height: 12px; cursor: nwse-resize; z-index: 1002; }
      `}</style>
    </div>
  );
}

function Book({ size, color }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;
}
