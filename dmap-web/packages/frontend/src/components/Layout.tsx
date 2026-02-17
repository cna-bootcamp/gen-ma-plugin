/**
 * 레이아웃 컴포넌트 - 3패널 구조: 리사이즈 가능한 사이드바 + 채팅 패널 + 활동 패널.
 * localStorage로 사이드바 너비 영속화
 * @module components/Layout
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar.js';
import { ChatPanel } from './ChatPanel.js';
import { ActivityPanel } from './ActivityPanel.js';

/** 사이드바 리사이즈 상수 - 최소/최대 너비(px), 기본 너비, localStorage 키 */
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 288;
const STORAGE_KEY = 'dmap-sidebar-width';

/**
 * 초기 사이드바 너비 - localStorage에서 복원하거나 기본값 반환
 */
function getInitialWidth(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const n = Number(stored);
    if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
  }
  return DEFAULT_WIDTH;
}

/**
 * 메인 레이아웃 - 사이드바(리사이즈) + 리사이즈 핸들(드래그) + 채팅 패널 + 활동 패널의 수평 3분할 구조
 */
export function Layout() {
  const [sidebarWidth, setSidebarWidth] = useState(getInitialWidth);
  const isDragging = useRef(false);

  /**
   * 리사이즈 핸들 마우스 다운 - 드래그 시작, 커서 변경
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // 마우스 X좌표를 사이드바 너비로 변환 (MIN~MAX 범위 제한)
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // 드래그 종료 시 localStorage에 너비 저장
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
      {/* 리사이즈 핸들 - 드래그로 사이드바 너비 조절, 투명 히트 영역 확장 */}
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
