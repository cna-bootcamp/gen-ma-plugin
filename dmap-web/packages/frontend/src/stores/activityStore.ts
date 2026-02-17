/**
 * 활동 패널 스토어 (Zustand) - 스킬 실행 중 도구/에이전트/진행률/사용량 추적
 *
 * 관리 영역:
 * - 패널 UI: 모드(rail/open), 섹션 접기/펼치기, 도구 뷰 모드
 * - 도구 이벤트: 호출 내역 + 이름별 카운트 집계
 * - 에이전트 이벤트: Task 위임 내역
 * - 진행률: Phase/Step 단계 추적 (pending → active → complete)
 * - 사용량: 토큰 수/비용/실행 시간
 *
 * localStorage 연동: 패널 모드, 섹션 상태, 도구 뷰 모드 영속화
 *
 * @module stores/activityStore
 */
import { create } from 'zustand';
import type { ActivityToolEvent } from '@dmap-web/shared';

const PANEL_MODE_KEY = 'dmap-activity-panel-mode';
const SECTIONS_KEY = 'dmap-activity-sections';
const TOOL_VIEW_KEY = 'dmap-activity-tool-view';

const DEFAULT_SECTIONS: Record<string, boolean> = {
  progress: true,
  agents: true,
  tools: false,
  skillInfo: false,
};

function loadSections(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(SECTIONS_KEY);
    if (stored) return { ...DEFAULT_SECTIONS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SECTIONS };
}

/** 활동 패널 상태 + 액션 인터페이스 */
interface ActivityState {
  // Panel UI
  panelMode: 'rail' | 'open';
  sectionStates: Record<string, boolean>;
  toolView: 'summary' | 'feed';

  // Activity data
  toolEvents: ActivityToolEvent[];
  toolCounts: Record<string, number>;
  agentEvents: Array<{ id: string; subagentType: string; model: string; description?: string; timestamp: string }>;
  usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number; totalCostUsd: number; durationMs: number; numTurns: number } | null;
  executionStartTime: string | null;
  executionEndTime: string | null;
  progressSteps: Array<{ step: number; label: string; status: 'pending' | 'active' | 'complete' }>;
  activeStep: number;

  // Actions
  togglePanel: () => void;
  setPanelMode: (mode: 'rail' | 'open') => void;
  toggleSection: (sectionId: string) => void;
  setToolView: (view: 'summary' | 'feed') => void;
  addToolEvent: (name: string, description?: string) => void;
  addAgentEvent: (id: string, subagentType: string, model: string, description?: string) => void;
  setUsage: (usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number; totalCostUsd: number; durationMs: number; numTurns: number }) => void;
  setProgressSteps: (steps: Array<{ step: number; label: string }>) => void;
  setActiveStep: (step: number) => void;
  advanceStep: () => void;
  startExecution: () => void;
  endExecution: () => void;
  completeAllSteps: () => void;
  clearActivity: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  panelMode: (localStorage.getItem(PANEL_MODE_KEY) as 'rail' | 'open') || 'rail',
  sectionStates: loadSections(),
  toolView: (localStorage.getItem(TOOL_VIEW_KEY) as 'summary' | 'feed') || 'summary',

  toolEvents: [],
  toolCounts: {},
  agentEvents: [],
  usage: null,
  executionStartTime: null,
  executionEndTime: null,
  progressSteps: [],
  activeStep: 0,

  /** 패널 모드 토글: rail ↔ open (localStorage 영속화) */
  togglePanel: () => set((state) => {
    const next = state.panelMode === 'rail' ? 'open' : 'rail';
    localStorage.setItem(PANEL_MODE_KEY, next);
    return { panelMode: next };
  }),

  setPanelMode: (mode) => {
    localStorage.setItem(PANEL_MODE_KEY, mode);
    set({ panelMode: mode });
  },

  /** 섹션 접기/펼치기 토글 (localStorage 영속화) */
  toggleSection: (sectionId) => set((state) => {
    const next = { ...state.sectionStates, [sectionId]: !state.sectionStates[sectionId] };
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
    return { sectionStates: next };
  }),

  setToolView: (view) => {
    localStorage.setItem(TOOL_VIEW_KEY, view);
    set({ toolView: view });
  },

  /** 도구 호출 이벤트 추가 - toolEvents 배열 + toolCounts 카운트 동시 업데이트 */
  addToolEvent: (name, description) => set((state) => ({
    toolEvents: [...state.toolEvents, {
      id: crypto.randomUUID(),
      name,
      description,
      timestamp: new Date().toISOString(),
    }],
    toolCounts: { ...state.toolCounts, [name]: (state.toolCounts[name] || 0) + 1 },
  })),

  /** 에이전트 위임 이벤트 추가 - subagentType과 model로 UI에 표시 */
  addAgentEvent: (id, subagentType, model, description) => set((state) => ({
    agentEvents: [...state.agentEvents, { id, subagentType, model, description, timestamp: new Date().toISOString() }],
  })),

  setUsage: (usage) => set({ usage }),

  /** 진행률 단계 초기화 - 첫 번째 단계를 active로 설정 */
  setProgressSteps: (steps) => set({
    progressSteps: steps.map((s, i) => ({
      ...s,
      status: i === 0 ? 'active' as const : 'pending' as const,
    })),
    activeStep: 1,
  }),

  /** 활성 단계 설정 - 이전 단계는 complete, 현재는 active, 이후는 pending */
  setActiveStep: (step) => set((state) => {
    if (state.progressSteps.length === 0) return state;
    return {
      activeStep: step,
      progressSteps: state.progressSteps.map((s) => ({
        ...s,
        status: s.step < step ? 'complete' as const : s.step === step ? 'active' as const : 'pending' as const,
      })),
    };
  }),

  advanceStep: () => set((state) => {
    if (state.progressSteps.length === 0) return state;
    const next = state.activeStep + 1;
    return {
      activeStep: next,
      progressSteps: state.progressSteps.map((s, i) => ({
        ...s,
        status: i < next - 1 ? 'complete' as const : i === next - 1 ? 'active' as const : 'pending' as const,
      })),
    };
  }),

  /** 실행 시작 - 모든 활동 데이터 초기화 + 시작 시간 기록 */
  startExecution: () => set({
    executionStartTime: new Date().toISOString(),
    executionEndTime: null,
    toolEvents: [],
    toolCounts: {},
    agentEvents: [],
    usage: null,
    progressSteps: [],
    activeStep: 0,
  }),

  /** 실행 종료 - 종료 시간만 기록 (나머지 데이터는 유지) */
  endExecution: () => set({ executionEndTime: new Date().toISOString() }),

  /** 모든 진행 단계를 complete로 설정 - 스킬 정상 완료 시 호출 */
  completeAllSteps: () => set((state) => ({
    progressSteps: state.progressSteps.map((s) => ({
      ...s,
      status: 'complete' as const,
    })),
  })),

  /** 전체 활동 데이터 초기화 - 플러그인/스킬 전환 시 appStore에서 호출 */
  clearActivity: () => set({
    toolEvents: [],
    toolCounts: {},
    agentEvents: [],
    usage: null,
    executionStartTime: null,
    executionEndTime: null,
    progressSteps: [],
    activeStep: 0,
  }),
}));
