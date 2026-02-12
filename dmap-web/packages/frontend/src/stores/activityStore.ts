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

  togglePanel: () => set((state) => {
    const next = state.panelMode === 'rail' ? 'open' : 'rail';
    localStorage.setItem(PANEL_MODE_KEY, next);
    return { panelMode: next };
  }),

  setPanelMode: (mode) => {
    localStorage.setItem(PANEL_MODE_KEY, mode);
    set({ panelMode: mode });
  },

  toggleSection: (sectionId) => set((state) => {
    const next = { ...state.sectionStates, [sectionId]: !state.sectionStates[sectionId] };
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
    return { sectionStates: next };
  }),

  setToolView: (view) => {
    localStorage.setItem(TOOL_VIEW_KEY, view);
    set({ toolView: view });
  },

  addToolEvent: (name, description) => set((state) => ({
    toolEvents: [...state.toolEvents, {
      id: crypto.randomUUID(),
      name,
      description,
      timestamp: new Date().toISOString(),
    }],
    toolCounts: { ...state.toolCounts, [name]: (state.toolCounts[name] || 0) + 1 },
  })),

  addAgentEvent: (id, subagentType, model, description) => set((state) => ({
    agentEvents: [...state.agentEvents, { id, subagentType, model, description, timestamp: new Date().toISOString() }],
  })),

  setUsage: (usage) => set({ usage }),

  setProgressSteps: (steps) => set({
    progressSteps: steps.map((s, i) => ({
      ...s,
      status: i === 0 ? 'active' as const : 'pending' as const,
    })),
    activeStep: 1,
  }),

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

  endExecution: () => set({ executionEndTime: new Date().toISOString() }),

  completeAllSteps: () => set((state) => ({
    progressSteps: state.progressSteps.map((s) => ({
      ...s,
      status: 'complete' as const,
    })),
  })),

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
