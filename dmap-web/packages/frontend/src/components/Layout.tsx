import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar.js';
import { ChatPanel } from './ChatPanel.js';
import { ActivityPanel } from './ActivityPanel.js';

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 288;
const STORAGE_KEY = 'dmap-sidebar-width';

function getInitialWidth(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const n = Number(stored);
    if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
  }
  return DEFAULT_WIDTH;
}

export function Layout() {
  const [sidebarWidth, setSidebarWidth] = useState(getInitialWidth);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Persist on release
      localStorage.setItem(STORAGE_KEY, String(Math.round(sidebarWidth)));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [sidebarWidth]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <div style={{ width: sidebarWidth }} className="flex-shrink-0">
        <Sidebar />
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 flex-shrink-0 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors bg-transparent group relative"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatPanel />
      </main>
      <ActivityPanel />
    </div>
  );
}
