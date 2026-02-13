# Activity Panel Design Specification

- [Activity Panel Design Specification](#activity-panel-design-specification)
  - [1. Design Decisions](#1-design-decisions)
  - [2. Panel Architecture: Compact Rail + Expandable Panel](#2-panel-architecture-compact-rail--expandable-panel)
    - [2.1 Three Visual States](#21-three-visual-states)
    - [2.2 Layout Integration](#22-layout-integration)
  - [3. Section Layout and Information Architecture](#3-section-layout-and-information-architecture)
    - [3.1 Status Header (Pinned Top, ~56px)](#31-status-header-pinned-top-56px)
    - [3.2 Progress Section (진행상황)](#32-progress-section-진행상황)
    - [3.3 Agent Activity (에이전트 활동)](#33-agent-activity-에이전트-활동)
    - [3.4 Tool Activity (도구 활동)](#34-tool-activity-도구-활동)
    - [3.5 Usage Stats (사용량) - Pinned Bottom, ~80px](#35-usage-stats-사용량---pinned-bottom-80px)
  - [4. Visual Hierarchy](#4-visual-hierarchy)
  - [5. Interaction Design](#5-interaction-design)
    - [5.1 Panel Toggle](#51-panel-toggle)
    - [5.2 Section Collapse](#52-section-collapse)
    - [5.3 Tool Activity Sub-views](#53-tool-activity-sub-views)
    - [5.4 Animations](#54-animations)
  - [6. Responsive Behavior](#6-responsive-behavior)
  - [7. State Persistence](#7-state-persistence)
  - [8. Empty and Idle States](#8-empty-and-idle-states)
    - [8.1 No Skill Selected](#81-no-skill-selected)
    - [8.2 Skill Selected, Not Yet Executed](#82-skill-selected-not-yet-executed)
    - [8.3 After Execution Completes](#83-after-execution-completes)
    - [8.4 Error State](#84-error-state)
  - [9. Alternative Layout Considered](#9-alternative-layout-considered)
  - [10. Implementation Architecture](#10-implementation-architecture)
    - [10.1 New Files](#101-new-files)
    - [10.2 Modified Files](#102-modified-files)
    - [10.3 New Shared Types](#103-new-shared-types)
    - [10.4 Store Design (activityStore.ts)](#104-store-design-activitystorets)
    - [10.5 SSE Integration](#105-sse-integration)
  - [11. Phased Delivery](#11-phased-delivery)
  - [12. Visual Reference: Token-level Tailwind Classes](#12-visual-reference-token-level-tailwind-classes)
    - [12.1 Surfaces and Borders](#121-surfaces-and-borders)
    - [12.2 Typography](#122-typography)
    - [12.3 Status Colors](#123-status-colors)
    - [12.4 Agent Tier Badges](#124-agent-tier-badges)
    - [12.5 Quota Bar Colors](#125-quota-bar-colors)
  - [13. Wireframe (ASCII)](#13-wireframe-ascii)
    - [13.1 Full Open State](#131-full-open-state)
    - [13.2 Rail (Collapsed) State](#132-rail-collapsed-state)
  - [14. i18n Keys to Add](#14-i18n-keys-to-add)
  - [15. Keyboard Shortcut Map](#15-keyboard-shortcut-map)

---

## 1. Design Decisions

**Aesthetic direction**: Functional clarity within the existing system-font, gray-surface,
blue-accent design language. The panel should feel like a natural extension of the existing
sidebar rather than a bolted-on addition. No new fonts, no new color families. The panel's
visual identity comes from information density and smart use of color-coded status indicators
within the established palette.

**Key differentiator**: The **Compact Rail** mode. Unlike a simple show/hide toggle,
the Activity Panel has three states: a 40px vertical rail showing glanceable badges,
the full 320px expanded panel, and a responsive overlay mode. The rail gives users
persistent peripheral awareness of execution status, agent count, tool count, and quota
percentage without sacrificing any chat width. This is the single design decision that
separates this panel from a generic sidebar.

[Top](#activity-panel-design-specification)

---

## 2. Panel Architecture: Compact Rail + Expandable Panel

### 2.1 Three Visual States

| State | Width | Trigger | Behavior |
|-------|-------|---------|----------|
| **Rail (Collapsed)** | 40px | Default on first visit, or user collapses panel | Vertical strip: status dot, agent count badge, tool count badge, quota % arc. Click anywhere on rail to expand. |
| **Panel (Expanded)** | 320px | User clicks rail or toggle button or shortcut | Full panel with all 5 sections. Slides open from rail with 200ms ease-out. |
| **Overlay** | 320px | Viewport < 1024px and panel is opened | Panel overlays chat area with semi-transparent backdrop (`bg-black/20`). Click backdrop to close. |

### 2.2 Layout Integration

Current `Layout.tsx` structure:

```
[Sidebar 200-480px] [resize-handle] [ChatPanel flex-1]
```

Proposed structure:

```
[Sidebar 200-480px] [resize-handle] [ChatPanel flex-1] [ActivityPanel 40px|320px]
```

The Activity Panel sits at the right edge. The ChatPanel continues to be `flex-1` and
absorbs the width changes naturally. No second resize handle is needed; the panel
width is fixed at either 40px (rail) or 320px (expanded).

The panel shares the same surface background as the sidebar (`bg-white dark:bg-gray-900`)
and uses a left border (`border-l border-gray-200 dark:border-gray-800`) as its separator,
mirroring the sidebar's right border.

[Top](#activity-panel-design-specification)

---

## 3. Section Layout and Information Architecture

The expanded panel is divided into three zones:

```
+----------------------------------+
| STATUS HEADER (pinned, 56px)     |  <-- always visible
+----------------------------------+
| SCROLLABLE SECTIONS              |  <-- flex-1 overflow-y-auto
|   Progress (진행상황)              |
|   Agent Activity (에이전트 활동)    |
|   Tool Activity (도구 활동)        |
|   Skill Info (스킬 정보)           |
+----------------------------------+
| USAGE STATS (pinned, ~88px)      |  <-- always visible
+----------------------------------+
```

### 3.1 Status Header (Pinned Top, ~56px)

**Purpose**: At-a-glance execution state. The most critical information compressed
into the smallest space.

**Content**:
- Left side: animated status dot + status text ("Idle" / "Running..." / "Complete" / "Error")
- Right side: collapse-to-rail button (chevron-right icon)
- Below: thin indeterminate progress bar (2px height) visible only during streaming

**Status Dot Specifications**:

| State | Dot Color | Animation | Text |
|-------|-----------|-----------|------|
| Idle | `bg-gray-400` | None | "Idle" / "대기 중" |
| Running | `bg-blue-500` | `animate-pulse` | "Running..." / "실행 중..." |
| Complete | `bg-green-500` | None (fade to idle after 5s) | "Complete" / "완료" |
| Error | `bg-red-500` | None | "Error" / "오류" |

**Progress Bar**: Uses the same `bg-blue-500` as the status dot during streaming.
CSS-only indeterminate animation (left-to-right shimmer). Transitions to `bg-green-500`
filled at 100% on complete.

### 3.2 Progress Section (진행상황)

**Default state**: Expanded when streaming, collapsed when idle.

**Phase 1 (no backend parsing)**: Shows a simple view:
- Elapsed time counter (e.g., "2m 34s") during streaming
- "Execution in progress" text with animated dots
- On complete: "Completed in 3m 12s"

**Phase 2 (with backend parsing)**: Vertical step checklist:

```
  1. [check] Document analysis          Complete
  2. [check] DSL generation             Complete
  3. [spin]  Prototyping                In progress
  4. [gray]  Validation                 Pending
```

Each step has three visual states:
- **Pending**: Gray numbered circle, `text-gray-400 dark:text-gray-500`
- **Active**: Blue spinner (matching `ToolIndicator`), `text-blue-600 dark:text-blue-400`
- **Complete**: Green checkmark, `text-gray-600 dark:text-gray-300` (muted since done)
- **Error**: Red X icon, `text-red-600 dark:text-red-400`

Connector lines between steps: thin vertical line (`w-px bg-gray-200 dark:bg-gray-700`)
positioned left of the step content.

### 3.3 Agent Activity (에이전트 활동)

**Default state**: Expanded when streaming, collapsed when idle.

**Section header**: "AGENTS" with a count badge (e.g., "3")

**Each agent entry** (48px height):

```
[Tier Badge] agent-type-name       [status]
             model: sonnet          elapsed
```

- **Tier badge**: Small colored pill, 3 variants:
  - LOW: `bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400` - text "L"
  - MEDIUM: `bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300` - text "M"
  - HIGH: `bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300` - text "H"

- **Active agent**: Left border highlight `border-l-2 border-blue-500` + spinner icon
- **Completed agent**: Checkmark + muted opacity (`opacity-60`)
- **Agent type name**: Extracted from `subagent_type` (e.g., `oh-my-claudecode:executor` displays as "executor")
- **Model name**: `text-xs text-gray-400 dark:text-gray-500`

Agents stack vertically in chronological order (newest at bottom). If more than 5 agents,
the section scrolls internally with `max-h-[240px] overflow-y-auto`.

**Data source**: Requires adding agent events to SSE stream (Phase 2). When a `Task` tool
event is detected, the backend should emit an `agent` SSE event with `subagent_type`, `model`,
and `description`.

### 3.4 Tool Activity (도구 활동)

**Default state**: Collapsed (this is the most verbose section; users expand when debugging).

**Section header**: "TOOLS" with total count badge (e.g., "42")

**Two sub-views** toggled by small text tabs within the section:

**a) Summary View (default)**:

A compact horizontal grid showing tool name and invocation count:

```
Read     12    Write     3    Bash      5
Glob      8    Grep      2    Task      3
Edit      1    WebFetch  1
```

Each cell: tool icon (small, 14px) + name + count. Uses a CSS grid with
`grid-template-columns: repeat(auto-fill, minmax(90px, 1fr))` to flow naturally.

Count badge uses the same styling as sidebar category labels:
`text-xs font-mono text-gray-500 dark:text-gray-400`.

**b) Feed View**:

Scrollable chronological list of the last 30 tool invocations:

```
09:32:15  Read    src/components/App.tsx
09:32:16  Write   src/stores/appStore.ts
09:32:17  Bash    npm run build
```

Each entry: timestamp (`text-[10px] font-mono text-gray-400`) + tool name
(`text-xs font-semibold`) + description truncated (`text-xs text-gray-500 truncate`).

Auto-scrolls to bottom during streaming. The feed has `max-h-[300px] overflow-y-auto`
with the same custom scrollbar as `.chat-scroll`.

**Tool icon mapping** (small colored dots or minimal icons):

| Tool | Color |
|------|-------|
| Read | `text-green-500` |
| Write | `text-blue-500` |
| Edit | `text-blue-500` |
| Bash | `text-amber-500` |
| Glob, Grep | `text-purple-500` |
| Task (agent) | `text-orange-500` |
| WebFetch, WebSearch | `text-cyan-500` |
| Other | `text-gray-400` |

### 3.5 Usage Stats (사용량) - Pinned Bottom, ~88px

**Purpose**: Always-visible quota awareness. Users on Claude Max need to know their
5-hour and weekly utilization at a glance.

**Layout** (two stacked horizontal bars):

```
5h   [========----------]  62%   resets in 2h 15m
Week [=====--------------]  34%   resets in 3d 12h
─────────────────────────────────
Tokens: 125.4K in / 42.1K out    $0.32
```

**Bar specifications**:
- Height: 6px, `rounded-full`
- Track: `bg-gray-100 dark:bg-gray-800`
- Fill color by percentage:
  - 0-49%: `bg-green-500`
  - 50-79%: `bg-amber-500`
  - 80-100%: `bg-red-500`
- Percentage text: `text-xs font-mono` to the right of the bar
- Reset countdown: `text-[10px] text-gray-400 dark:text-gray-500` right-aligned

**Token/cost line**:
- `text-[10px] text-gray-400 dark:text-gray-500 font-mono`
- Shows per-session totals, resets when chat is cleared
- Cost shows only if `total_cost_usd` is available from SSE

**Data source**: OAuth Usage API polled every 30 seconds. Token counts accumulated
from SSE `complete` events (if per-call usage is added to SSE).

**Section border**: `border-t border-gray-200 dark:border-gray-800` separating it from
the scrollable area above.

[Top](#activity-panel-design-specification)

---

## 4. Visual Hierarchy

The panel uses a deliberate visual weight hierarchy to guide the eye:

| Priority | Element | Visual Treatment |
|----------|---------|-----------------|
| 1 (Highest) | Status dot + text | Color-coded dot with `text-sm font-medium` |
| 2 | Progress bar | Full-width colored bar, impossible to miss |
| 3 | Active agent | Left blue border + spinner, bolder text |
| 4 | Tool count badges | Numeric badges in section headers |
| 5 | Quota bars | Color-coded fill (green/amber/red) |
| 6 (Lowest) | Timestamps, model names | `text-[10px]` muted gray |

**Section header treatment** (consistent across all sections):
- `text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500`
- This exactly matches the sidebar category headers in `Sidebar.tsx`
- Count badge floats right: `text-[11px] font-normal tabular-nums`

**Collapse chevron**: `w-3.5 h-3.5 text-gray-400 transition-transform duration-200`
rotated `rotate-0` (expanded) to `-rotate-90` (collapsed).

[Top](#activity-panel-design-specification)

---

## 5. Interaction Design

### 5.1 Panel Toggle

**Toggle button location**: Inside the `ChatPanel` header, at the far right of the
existing button group (next to "Reset" and "Stop" buttons). A small icon button with
a right-sidebar icon (vertical bars).

```
Tailwind: p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
```

The button shows a "panel-right" icon when the panel is in rail mode, and a "panel-right-close"
icon when the panel is expanded. Alternatively, use the same icon with a subtle active state
(`bg-gray-100 dark:bg-gray-800`) when the panel is open.

**Keyboard shortcut**: `Ctrl+Shift+A` (Activity) on Windows/Linux, `Cmd+Shift+A` on macOS.
This avoids conflicting with common shortcuts (`Ctrl+.` is used by VS Code and may confuse
power users who also use an editor).

**Rail click**: Clicking anywhere on the 40px rail expands the panel. The entire rail
is a clickable button.

### 5.2 Section Collapse

Each section header row is a clickable `<button>` spanning the full width:

```
[Chevron] SECTION NAME                 [badge count]
```

Clicking toggles the section body between expanded and collapsed.

**Animation**: The section body uses `grid-template-rows` transition for smooth height
animation:

```css
.section-body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 200ms ease-out;
}
.section-body.collapsed {
  grid-template-rows: 0fr;
}
.section-body > div {
  overflow: hidden;
}
```

This is the most performant CSS-only collapse animation and avoids `max-height` hacks.

### 5.3 Tool Activity Sub-views

Within the Tool Activity section, two small text tabs sit below the section header:

```
[Summary]  [Feed]
```

These are styled as subtle text buttons:
- Active tab: `text-blue-600 dark:text-blue-400 font-medium border-b-2 border-blue-600`
- Inactive tab: `text-gray-400 dark:text-gray-500 hover:text-gray-600`
- Tab bar height: 28px
- No additional borders or backgrounds

### 5.4 Animations

All animations are CSS-only (no library dependencies):

| Animation | CSS | Duration |
|-----------|-----|----------|
| Panel slide (rail to open) | `transition: width 200ms ease-out` on the panel container | 200ms |
| Section collapse | `grid-template-rows` transition | 200ms |
| Chevron rotation | `transition: transform 200ms ease` | 200ms |
| Status dot pulse | `animate-pulse` (Tailwind built-in) | Continuous |
| Progress bar shimmer | `@keyframes shimmer` custom | 1.5s infinite |
| Overlay backdrop fade | `transition: opacity 150ms ease` | 150ms |
| Feed auto-scroll | `scrollIntoView({ behavior: 'smooth' })` | Browser default |

**New CSS keyframe** to add to `index.css`:

```css
@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.animate-progress-indeterminate {
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}
```

[Top](#activity-panel-design-specification)

---

## 6. Responsive Behavior

| Viewport Width | Panel Behavior |
|----------------|----------------|
| >= 1280px | Normal mode. Rail or expanded panel sits beside chat. |
| 1024px - 1279px | Panel defaults to rail mode. Can expand but chat gets narrow. |
| < 1024px | **Overlay mode**. Rail hidden. Toggle button in ChatPanel header opens panel as an overlay with backdrop. Panel slides in from the right edge with absolute positioning. |

**Overlay mode details**:
- Panel: `position: absolute; right: 0; top: 0; bottom: 0; z-index: 40`
- Backdrop: `position: absolute; inset: 0; bg-black/20; z-index: 30`
- Clicking backdrop closes the panel
- Panel width remains 320px in overlay mode
- ESC key also closes the panel in overlay mode

**Sidebar interaction on small screens**: The left sidebar and right activity panel
should never both be fully open at the same time on viewports < 1280px. When the
activity panel opens in overlay mode, it does not affect the sidebar (they are
independent). However, the minimum sidebar width (200px) plus the chat panel ensures
there is always enough room for the overlay to appear.

[Top](#activity-panel-design-specification)

---

## 7. State Persistence

The following keys are saved to `localStorage`:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dmap-activity-panel-mode` | `'rail' \| 'open'` | `'rail'` | Panel state on load |
| `dmap-activity-sections` | `JSON object` | See below | Collapsed state per section |
| `dmap-activity-tool-view` | `'summary' \| 'feed'` | `'summary'` | Tool activity sub-view |

**Default section states** (`dmap-activity-sections`):

```json
{
  "progress": true,
  "agents": true,
  "tools": false,
  "skillInfo": false
}
```

`true` = expanded, `false` = collapsed.

Note: The progress and agent sections default to expanded because they contain
the most actionable real-time information. Tools default to collapsed because the
summary badge in the section header provides enough at-a-glance info. Skill info
defaults to collapsed because it is reference data that rarely changes during execution.

**What is NOT persisted**:
- Activity data itself (tool events, agent events) -- ephemeral, lives only in Zustand
- Usage quota data -- always fetched fresh from API
- Streaming state -- derived from existing `appStore.isStreaming`

[Top](#activity-panel-design-specification)

---

## 8. Empty and Idle States

### 8.1 No Skill Selected

The panel shows the same empty state as the rest of the app. The status header reads
"Idle" with a gray dot. All sections show minimal placeholder text.

```
Progress:     "Select a skill to begin"
Agents:       (section hidden entirely)
Tools:        (section hidden entirely)
Skill Info:   (section hidden entirely)
Usage:        Shows quota bars (always relevant)
```

### 8.2 Skill Selected, Not Yet Executed

```
Progress:     "Ready to execute"
Agents:       (section hidden)
Tools:        (section hidden)
Skill Info:   Shows current skill name, icon, category, plugin name
Usage:        Shows quota bars
```

### 8.3 After Execution Completes

All sections retain data from the last execution until the user clears the chat
(via the "Reset" button) or selects a different skill.

```
Progress:     "Completed in 3m 12s" (with green status)
Agents:       Shows final agent list (all completed)
Tools:        Shows final tool summary
Skill Info:   Shows current skill info
Usage:        Shows updated quota bars + session token totals
```

The status header shows "Complete" with a green dot for 5 seconds, then transitions
to "Idle" with a gray dot.

### 8.4 Error State

```
Status:       Red dot, "Error"
Progress:     Shows elapsed time + "Execution failed"
Agents:       Shows agents with the failed one marked red
Tools:        Shows last tool activities
Usage:        Shows quota bars + partial session tokens
```

[Top](#activity-panel-design-specification)

---

## 9. Alternative Layout Considered

| Alternative | Description | Why Rejected |
|-------------|-------------|--------------|
| **Floating Inspector** | A card floating over chat content | Blocks chat messages, feels intrusive, positioning is fragile |
| **Bottom Drawer** | Horizontal panel pulling up from bottom | Competes with the bottom input bar, complex z-index, reduces chat vertical space |
| **Tab-integrated** | Activity as a tab within ChatPanel | Cannot see chat and activity simultaneously, defeats purpose of peripheral awareness |
| **Simple Show/Hide** | Standard 320px sidebar, hidden or shown | Loses all context when hidden. The **Compact Rail** approach (recommended) preserves glanceable status even when the panel is collapsed. |

**Recommendation**: The Compact Rail + Expandable Panel approach is superior because
it provides a continuous spectrum of information density. The rail gives you 4 data points
(status, agents, tools, quota) in only 40px of width. Users who want more detail expand
to the full panel. Users who want maximum chat space keep the rail and still have
peripheral awareness.

[Top](#activity-panel-design-specification)

---

## 10. Implementation Architecture

### 10.1 New Files

| File | Purpose |
|------|---------|
| `components/ActivityPanel.tsx` | Panel shell: rail/expanded/overlay states, section rendering, keyboard shortcuts |
| `components/activity/StatusHeader.tsx` | Pinned top status bar with dot, text, progress bar |
| `components/activity/ProgressSection.tsx` | Step checklist (Phase 2) or elapsed timer (Phase 1) |
| `components/activity/AgentSection.tsx` | Agent activity list with tier badges |
| `components/activity/ToolSection.tsx` | Tool summary grid + feed list with sub-view tabs |
| `components/activity/SkillInfoSection.tsx` | Current skill, plugin, session reference info |
| `components/activity/UsageFooter.tsx` | Pinned bottom quota bars + token counts |
| `components/activity/CollapsibleSection.tsx` | Reusable wrapper for section header + collapse animation |
| `components/activity/CompactRail.tsx` | 40px vertical rail with badge indicators |
| `stores/activityStore.ts` | Zustand store for activity data, panel state, section states |

### 10.2 Modified Files

| File | Change |
|------|--------|
| `components/Layout.tsx` | Add `ActivityPanel` as third column. Add keyboard shortcut listener for `Ctrl+Shift+A`. |
| `hooks/useSkillStream.ts` | In `handleSSEEvent`, dispatch tool events and (Phase 2) agent events to `activityStore`. On `complete`, record elapsed time and session totals. |
| `stores/appStore.ts` | No changes needed. Activity panel reads `isStreaming`, `selectedSkill`, `selectedPlugin`, `sessionId` from appStore but does not modify it. |
| `index.css` | Add `animate-progress-indeterminate` keyframe. Add `.activity-scroll` scrollbar styles (same as `.chat-scroll`). |
| `i18n/ko.ts` and `i18n/en.ts` | Add new i18n keys (see section 14). |
| `shared/src/types.ts` | Add new shared types (see section 10.3). |

### 10.3 New Shared Types

```typescript
// Activity Panel Types

export interface ActivityToolEvent {
  id: string;
  name: string;               // 'Read' | 'Write' | 'Bash' | etc.
  description?: string;
  timestamp: string;           // ISO string
}

export interface ActivityAgentEvent {
  id: string;
  subagentType: string;        // e.g., 'oh-my-claudecode:executor'
  displayName: string;         // extracted: 'executor'
  model: string;               // 'haiku' | 'sonnet' | 'opus'
  tier: 'low' | 'medium' | 'high';
  description?: string;
  status: 'active' | 'completed' | 'error';
  startedAt: string;
  completedAt?: string;
}

export interface QuotaInfo {
  utilizationPercent: number;  // 0-100
  resetInMs: number;           // milliseconds until reset
}

export interface UsageData {
  fiveHour: QuotaInfo | null;
  weekly: QuotaInfo | null;
  sessionTokensIn: number;
  sessionTokensOut: number;
  sessionCostUsd: number | null;
}

export interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}
```

### 10.4 Store Design (activityStore.ts)

```typescript
interface ActivityState {
  // Panel UI state
  panelMode: 'rail' | 'open';
  sectionStates: Record<string, boolean>;  // true = expanded
  toolView: 'summary' | 'feed';

  // Activity data (ephemeral, not persisted)
  toolEvents: ActivityToolEvent[];
  toolCounts: Record<string, number>;      // tool name -> count
  agentEvents: ActivityAgentEvent[];
  progressSteps: ProgressStep[];
  executionStartTime: string | null;
  executionElapsedMs: number;
  usage: UsageData;

  // Actions
  togglePanel: () => void;
  setPanelMode: (mode: 'rail' | 'open') => void;
  toggleSection: (sectionId: string) => void;
  setToolView: (view: 'summary' | 'feed') => void;

  addToolEvent: (event: Omit<ActivityToolEvent, 'id' | 'timestamp'>) => void;
  addAgentEvent: (event: Omit<ActivityAgentEvent, 'id'>) => void;
  updateAgentStatus: (id: string, status: 'completed' | 'error') => void;
  setProgressSteps: (steps: ProgressStep[]) => void;
  updateUsage: (usage: Partial<UsageData>) => void;

  startExecution: () => void;
  endExecution: () => void;
  clearActivity: () => void;
}
```

The store initializes `panelMode`, `sectionStates`, and `toolView` from localStorage
and writes back on change.

### 10.5 SSE Integration

In `useSkillStream.ts`, the `handleSSEEvent` callback gains these additions:

**On `tool` event**:
```
activityStore.addToolEvent({ name: data.name, description: data.description })
```

**On streaming start** (in `executeSkill`, before fetch):
```
activityStore.startExecution()
```

**On `complete` event**:
```
activityStore.endExecution()
```

**On `agent` event** (Phase 2, new SSE event type):
```
activityStore.addAgentEvent({
  subagentType: data.subagent_type,
  displayName: extractDisplayName(data.subagent_type),
  model: data.model,
  tier: deriveTier(data.model),
  description: data.description,
  status: 'active',
  startedAt: new Date().toISOString(),
})
```

**Usage API polling** (Phase 2): A `useEffect` in `ActivityPanel.tsx` sets up a
30-second interval that fetches `/api/usage` (new backend endpoint wrapping the
OAuth Usage API) and calls `activityStore.updateUsage()`.

[Top](#activity-panel-design-specification)

---

## 11. Phased Delivery

| Phase | Scope | SSE Changes | Backend Changes |
|-------|-------|-------------|-----------------|
| **Phase 1** | Panel shell, rail/expand, tool section (summary + feed), skill info section, status header (streaming/idle/complete), elapsed timer, section collapse, keyboard shortcut, responsive overlay, localStorage persistence | None -- uses existing `tool` events | None |
| **Phase 2** | Agent section (with tier badges), usage footer (quota bars + tokens), per-session cost tracking | Add `agent` SSE event type. Add `usage` fields to `complete` event. | New `/api/usage` endpoint for quota polling. Parse `Task` tool calls into agent events in `sse-handler.ts`. |
| **Phase 3** | Progress checklist (step parsing from text), compact rail badges (live counts) | None | Backend text parser that detects "Phase N:", "STEP N.", checklist patterns in streaming text and emits `progress` SSE events. |

Phase 1 can be built entirely with existing data and requires zero backend changes.
It delivers the core value proposition: a toggleable activity sidebar with tool
tracking and execution status.

[Top](#activity-panel-design-specification)

---

## 12. Visual Reference: Token-level Tailwind Classes

These classes ensure the Activity Panel exactly matches the existing design language
in `Sidebar.tsx`, `SkillCard.tsx`, `ChatPanel.tsx`, and `SettingsMenu.tsx`.

### 12.1 Surfaces and Borders

| Element | Classes |
|---------|---------|
| Panel background | `bg-white dark:bg-gray-900` |
| Panel left border | `border-l border-gray-200 dark:border-gray-800` |
| Section separator | `border-t border-gray-200 dark:border-gray-800` |
| Card within section | `bg-gray-50 dark:bg-gray-800/50 rounded-lg` |

### 12.2 Typography

| Element | Classes |
|---------|---------|
| Section header label | `text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500` |
| Section header badge | `text-[11px] font-normal tabular-nums text-gray-400 dark:text-gray-500` |
| Status text | `text-sm font-medium text-gray-700 dark:text-gray-300` |
| Agent name | `text-xs font-semibold text-gray-700 dark:text-gray-300` |
| Agent model | `text-[10px] text-gray-400 dark:text-gray-500` |
| Tool name | `text-xs font-medium text-gray-600 dark:text-gray-300` |
| Tool count | `text-xs font-mono text-gray-500 dark:text-gray-400` |
| Timestamp | `text-[10px] font-mono text-gray-400 dark:text-gray-500` |
| Quota label | `text-[10px] font-medium text-gray-500 dark:text-gray-400` |
| Quota countdown | `text-[10px] text-gray-400 dark:text-gray-500` |

### 12.3 Status Colors

| Status | Dot | Text Accent |
|--------|-----|-------------|
| Idle | `bg-gray-400` | `text-gray-500 dark:text-gray-400` |
| Running | `bg-blue-500 animate-pulse` | `text-blue-600 dark:text-blue-400` |
| Complete | `bg-green-500` | `text-green-600 dark:text-green-400` |
| Error | `bg-red-500` | `text-red-600 dark:text-red-400` |

### 12.4 Agent Tier Badges

| Tier | Badge Classes |
|------|---------------|
| LOW | `px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400` |
| MEDIUM | `px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300` |
| HIGH | `px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300` |

### 12.5 Quota Bar Colors

| Range | Bar Fill | Percentage Text |
|-------|----------|-----------------|
| 0-49% | `bg-green-500` | `text-green-600 dark:text-green-400` |
| 50-79% | `bg-amber-500` | `text-amber-600 dark:text-amber-400` |
| 80-100% | `bg-red-500` | `text-red-600 dark:text-red-400` |

Bar track (all states): `bg-gray-100 dark:bg-gray-800`

[Top](#activity-panel-design-specification)

---

## 13. Wireframe (ASCII)

### 13.1 Full Open State

```
+---Sidebar (288px)---+---ChatPanel (flex-1)--------------------+---Activity (320px)---+
| [Plugin Switcher]   | [Skill Name]              [Reset][Act] | Status: Running...   |
| Plugin description  | [Textarea: input]   [Run] [Attach]     | [====------] progress|
|                     |                                         |──────────────────────|
| CORE                | ...messages...                          | PROGRESS         [v] |
| [develop-plugin]    |  User: build a todo app                 |  Elapsed: 2m 34s     |
| [requirement-writer]|                                         |  Execution in progress|
|                     |  Assistant: I'll start by analyzing...  |──────────────────────|
| SETUP               |                                         | AGENTS           [v] |
| [setup]             |  [spin] Bash: npm run build              |  [M] executor  sonnet|
|                     |                                         |  [H] architect  opus  |
| UTILITY             |  I've completed the initial setup...    |──────────────────────|
| [help]              |                                         | TOOLS        42  [>] |
|                     |  [check] Read: src/App.tsx               |  (collapsed)         |
|                     |                                         |──────────────────────|
|                     |  ...more messages...                    | SKILL INFO       [>] |
|                     |                                         |  (collapsed)         |
|                     |  [bounce dots] Processing...            |======================|
|                     |                                         | 5h  [======----] 62% |
| dmap v1.0.0         | [Textarea: reply]         [Send][Att]  | Wk  [===-------] 34% |
|                     |                                         | 125K in / 42K out    |
+---------------------+-----------------------------------------+----------------------+
```

### 13.2 Rail (Collapsed) State

```
+---Sidebar (288px)---+---ChatPanel (flex-1)---------------------------+--Rail(40px)--+
| [Plugin Switcher]   | [Skill Name]                     [Reset][Act] |    [dot]     |
| Plugin description  | [Textarea: input]   [Run] [Attach]            |              |
|                     |                                                |    [2]       |
| CORE                | ...messages...                                 |   agents     |
| [develop-plugin]    |  User: build a todo app                        |              |
| [requirement-writer]|                                                |    [42]      |
|                     |  Assistant: I'll start by analyzing...         |   tools      |
| SETUP               |                                                |              |
| [setup]             |  [spin] Bash: npm run build                     |              |
|                     |                                                |              |
| UTILITY             |  I've completed the initial setup...           |   [62%]      |
| [help]              |                                                |   quota      |
|                     |                                                |              |
| dmap v1.0.0         | [Textarea: reply]               [Send][Att]   |              |
+---------------------+------------------------------------------------+--------------+
```

[Top](#activity-panel-design-specification)

---

## 14. i18n Keys to Add

```typescript
// Activity Panel - ko.ts additions
'activity.idle': '대기 중',
'activity.running': '실행 중...',
'activity.complete': '완료',
'activity.error': '오류',
'activity.toggle': '활동 패널',

'activity.progress': '진행상황',
'activity.progress.elapsed': '경과: {{time}}',
'activity.progress.completedIn': '{{time}} 만에 완료',
'activity.progress.inProgress': '실행 중',
'activity.progress.ready': '실행 준비됨',
'activity.progress.selectSkill': '스킬을 선택하세요',
'activity.progress.failed': '실행 실패',

'activity.agents': '에이전트',
'activity.agents.active': '실행 중',
'activity.agents.completed': '완료',

'activity.tools': '도구',
'activity.tools.summary': '요약',
'activity.tools.feed': '피드',

'activity.skillInfo': '스킬 정보',
'activity.skillInfo.plugin': '플러그인',
'activity.skillInfo.skill': '스킬',
'activity.skillInfo.session': '세션',
'activity.skillInfo.category': '카테고리',

'activity.usage': '사용량',
'activity.usage.fiveHour': '5시간',
'activity.usage.weekly': '주간',
'activity.usage.resetsIn': '{{time}} 후 초기화',
'activity.usage.tokensIn': '입력',
'activity.usage.tokensOut': '출력',
```

```typescript
// Activity Panel - en.ts additions
'activity.idle': 'Idle',
'activity.running': 'Running...',
'activity.complete': 'Complete',
'activity.error': 'Error',
'activity.toggle': 'Activity Panel',

'activity.progress': 'Progress',
'activity.progress.elapsed': 'Elapsed: {{time}}',
'activity.progress.completedIn': 'Completed in {{time}}',
'activity.progress.inProgress': 'Execution in progress',
'activity.progress.ready': 'Ready to execute',
'activity.progress.selectSkill': 'Select a skill to begin',
'activity.progress.failed': 'Execution failed',

'activity.agents': 'Agents',
'activity.agents.active': 'Active',
'activity.agents.completed': 'Completed',

'activity.tools': 'Tools',
'activity.tools.summary': 'Summary',
'activity.tools.feed': 'Feed',

'activity.skillInfo': 'Skill Info',
'activity.skillInfo.plugin': 'Plugin',
'activity.skillInfo.skill': 'Skill',
'activity.skillInfo.session': 'Session',
'activity.skillInfo.category': 'Category',

'activity.usage': 'Usage',
'activity.usage.fiveHour': '5-Hour',
'activity.usage.weekly': 'Weekly',
'activity.usage.resetsIn': 'Resets in {{time}}',
'activity.usage.tokensIn': 'In',
'activity.usage.tokensOut': 'Out',
```

[Top](#activity-panel-design-specification)

---

## 15. Keyboard Shortcut Map

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` / `Cmd+Shift+A` | Toggle panel between rail and open |
| `Escape` (when panel is in overlay mode) | Close panel to rail |

The shortcut listener is registered in `Layout.tsx` via a `useEffect` with
`document.addEventListener('keydown', ...)`, matching the existing pattern used
for the ESC double-tap to stop streaming in `ChatPanel.tsx`.

[Top](#activity-panel-design-specification)
