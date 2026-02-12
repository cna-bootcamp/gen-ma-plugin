import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

interface DraggableResizableDialogProps {
  children: ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  storageKey?: string;
  onClose: () => void;
}

export function DraggableResizableDialog({
  children,
  initialWidth = 480,
  initialHeight,
  minWidth = 320,
  minHeight = 280,
  storageKey,
  onClose,
}: DraggableResizableDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number | null }>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`dmap-dialog-size-${storageKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { w: parsed.w ?? initialWidth, h: parsed.h ?? initialHeight ?? null };
        }
      } catch { /* ignore */ }
    }
    return { w: initialWidth, h: initialHeight ?? null };
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number; origX: number; origY: number; dir: string } | null>(null);

  // Center on mount
  useEffect(() => {
    if (!pos) {
      const x = Math.max(0, (window.innerWidth - size.w) / 2);
      const h = size.h ?? 400;
      const y = Math.max(0, (window.innerHeight - h) / 2);
      setPos({ x, y });
    }
  }, []);

  // --- Drag (move) ---
  const onDragStart = useCallback((e: React.MouseEvent) => {
    // Only left button, only on header area (data-drag-handle)
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) return;
    // Don't drag if clicking on a button or input inside header
    if (target.closest('button') || target.closest('input')) return;

    e.preventDefault();
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 40, dragRef.current.origY + dy)),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // --- Resize ---
  const onResizeStart = useCallback((e: React.MouseEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: rect.width, origH: rect.height, origX: rect.left, origY: rect.top, dir };

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      const d = resizeRef.current.dir;
      const { origW, origH, origX, origY } = resizeRef.current;

      // Calculate new size
      let newW = origW;
      let newH = origH;
      if (d.includes('e')) newW = Math.max(minWidth, origW + dx);
      if (d.includes('w')) newW = Math.max(minWidth, origW - dx);
      if (d.includes('s')) newH = Math.max(minHeight, origH + dy);
      if (d.includes('n')) newH = Math.max(minHeight, origH - dy);

      setSize({ w: newW, h: newH });

      // Calculate new position: keep opposite edge fixed
      let newX = origX;
      let newY = origY;
      if (d.includes('w')) newX = origX + origW - newW;
      if (d.includes('n')) newY = origY + origH - newH;

      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      // Persist size to localStorage
      if (storageKey) {
        setSize((cur) => {
          try {
            localStorage.setItem(`dmap-dialog-size-${storageKey}`, JSON.stringify({ w: cur.w, h: cur.h }));
          } catch { /* ignore */ }
          return cur;
        });
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [minWidth, minHeight, storageKey]);

  if (!pos) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: pos.x,
    top: pos.y,
    width: size.w,
    ...(size.h ? { height: size.h } : {}),
    maxHeight: '90vh',
    zIndex: 100,
  };

  return (
    <div className="fixed inset-0 z-[99] bg-black/40">
      <div
        ref={dialogRef}
        style={style}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onMouseDown={onDragStart}
      >
        {children}

        {/* Resize handles */}
        {/* Right */}
        <div
          className="absolute top-0 right-0 w-1.5 h-full cursor-e-resize hover:bg-blue-400/20"
          onMouseDown={(e) => onResizeStart(e, 'e')}
        />
        {/* Bottom */}
        <div
          className="absolute bottom-0 left-0 w-full h-1.5 cursor-s-resize hover:bg-blue-400/20"
          onMouseDown={(e) => onResizeStart(e, 's')}
        />
        {/* Left */}
        <div
          className="absolute top-0 left-0 w-1.5 h-full cursor-w-resize hover:bg-blue-400/20"
          onMouseDown={(e) => onResizeStart(e, 'w')}
        />
        {/* Top */}
        <div
          className="absolute top-0 left-0 w-full h-1.5 cursor-n-resize hover:bg-blue-400/20"
          onMouseDown={(e) => onResizeStart(e, 'n')}
        />
        {/* Bottom-right corner */}
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-400/30"
          onMouseDown={(e) => onResizeStart(e, 'se')}
        />
        {/* Bottom-left corner */}
        <div
          className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-400/30"
          onMouseDown={(e) => onResizeStart(e, 'sw')}
        />
      </div>
    </div>
  );
}
