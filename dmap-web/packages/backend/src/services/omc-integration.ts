/**
 * OMC(Oh-My-ClaudeCode) 통합 모듈 - OMC 에이전트 로딩 및 스킬 부스팅 패턴 주입
 *
 * OMC 에이전트 로딩 경로: ~/.claude/plugins/cache/omc/oh-my-claudecode/{version}/agents/
 * 자동으로 최신 버전 디렉토리를 감지하여 에이전트 .md 파일을 로드.
 *
 * ESSENTIAL_AGENTS 필터: 12개 핵심 에이전트만 선별 로드 (토큰 절약)
 * Windows 32KB CLI 한계 대응: full prompt 대신 description만 prompt로 사용
 *
 * 스킬 부스팅: SKILL.md에 /oh-my-claudecode:* 표기가 있으면
 * 해당 패턴을 모델이 직접 실행하도록 가이드 주입 (외부 스킬 호출이 아님)
 *
 * @module omc-integration
 */
import { readdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { parseFrontmatterField } from './agent-utils.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('OMC');

/** OMC 에이전트 정의 - SDK agents 옵션에 전달되는 에이전트 스펙 */
export interface OmcAgentDef {
  description: string;
  prompt: string;
  model?: string;
  disallowedTools?: string[];
}

/**
 * 필수 에이전트 화이트리스트 (12개)
 * 스킬 패턴(plan, ralph, analyze 등)에서 실제 참조하는 에이전트만 포함
 * 나머지 에이전트는 토큰 절약을 위해 로드하지 않음
 */
// 스킬 패턴에서 실제 참조하는 에이전트만 포함
const ESSENTIAL_AGENTS = new Set([
  'architect',         // ralplan, ralph, analyze
  'executor',          // ralph, ultraqa
  'explore',           // plan, analyze, deepsearch
  'planner',           // plan, ralplan
  'critic',            // ralplan, review
  'analyst',           // plan
  'build-fixer',       // build-fix
  'qa-tester',         // ultraqa
  'code-reviewer',     // code-review
  'security-reviewer', // security-review
  'researcher',        // research
  'scientist',         // research
]);


/** 에이전트별 기본 모델 매핑 - opus(심층 분석), sonnet(실행/검증), haiku(탐색) */
const AGENT_MODELS: Record<string, string> = {
  architect: 'opus',
  planner: 'opus',
  critic: 'opus',
  analyst: 'opus',
  'code-reviewer': 'opus',
  executor: 'sonnet',
  'build-fixer': 'sonnet',
  'qa-tester': 'sonnet',
  'security-reviewer': 'sonnet',
  scientist: 'sonnet',
  researcher: 'sonnet',
  explore: 'haiku',
};

/** 에이전트별 역할 설명 - loadOmcAgents()에서 prompt로도 재사용 (Windows 32KB 제한) */
const AGENT_DESCRIPTIONS: Record<string, string> = {
  architect: 'System design, code analysis, debugging, and verification (Opus)',
  executor: 'Code implementation, features, and refactoring (Sonnet)',
  explore: 'Fast codebase discovery and pattern matching (Haiku)',
  planner: 'Task sequencing, execution plans, and risk flags (Opus)',
  critic: 'Plan review, critical challenge, and evaluation (Opus)',
  analyst: 'Requirements clarity, hidden constraint analysis (Opus)',
  'build-fixer': 'Build and compilation error resolution (Sonnet)',
  'qa-tester': 'Interactive CLI testing and runtime validation (Sonnet)',
  'code-reviewer': 'Comprehensive code quality review (Opus)',
  'security-reviewer': 'Security vulnerability detection and OWASP audits (Sonnet)',
  scientist: 'Data analysis, statistics, and research (Sonnet)',
  researcher: 'External SDK/API/package evaluation and documentation research (Sonnet)',
};

/** AGENT.md 프론트매터에서 disallowedTools 필드를 파싱 - 콤마 구분 문자열 → 배열 변환 */
function parseFrontmatterDisallowedTools(content: string): string[] | undefined {
  const value = parseFrontmatterField(content, 'disallowedTools');
  if (!value) return undefined;
  return value.split(',').map((t) => t.trim()).filter(Boolean);
}

/** 시맨틱 버전 비교 (예: "1.2.3" vs "1.3.0") - findLatestVersion()에서 사용 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i++) {
    const aNum = aParts[i] || 0;
    const bNum = bParts[i] || 0;
    if (aNum !== bNum) {
      return aNum - bNum;
    }
  }
  return 0;
}

/** OMC 설치 디렉토리에서 최신 버전 디렉토리명 탐색 - 시맨틱 버전 정렬 후 마지막 선택 */
function findLatestVersion(basePath: string): string | null {
  if (!existsSync(basePath)) {
    return null;
  }

  const entries = readdirSync(basePath, { withFileTypes: true });
  const versionDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => /^\d+\.\d+\.\d+/.test(name))
    .sort(compareVersions);

  return versionDirs.length > 0 ? versionDirs[versionDirs.length - 1] : null;
}

/**
 * OMC 에이전트를 파일시스템에서 로드
 *
 * 경로: ~/.claude/plugins/cache/omc/oh-my-claudecode/{latestVersion}/agents/*.md
 * ESSENTIAL_AGENTS에 포함된 에이전트만 로드하고, omc- 접두사로 FQN 생성
 * Windows 32KB CLI 한계 대응으로 full prompt 대신 description을 prompt로 사용
 *
 * @returns 에이전트 맵(omc-{name} → OmcAgentDef) 또는 OMC 미설치 시 null
 */
export async function loadOmcAgents(): Promise<Record<
  string,
  OmcAgentDef
> | null> {
  try {
    const homedir = os.homedir();
    const basePath = path.join(
      homedir,
      '.claude',
      'plugins',
      'cache',
      'omc',
      'oh-my-claudecode'
    );

    const latestVersion = findLatestVersion(basePath);
    if (!latestVersion) {
      log.warn(
        'OMC not installed: no version found in',
        basePath
      );
      return null;
    }

    const agentsDir = path.join(basePath, latestVersion, 'agents');
    if (!existsSync(agentsDir)) {
      log.warn(
        'OMC agents directory not found:',
        agentsDir
      );
      return null;
    }

    const agentFiles = readdirSync(agentsDir).filter((f) =>
      f.endsWith('.md')
    );
    const agents: Record<string, OmcAgentDef> = {};

    for (const file of agentFiles) {
      const agentName = path.basename(file, '.md');
      if (!ESSENTIAL_AGENTS.has(agentName)) {
        continue;
      }

      const filePath = path.join(agentsDir, file);
      const content = readFileSync(filePath, 'utf-8');

      const disallowedTools = parseFrontmatterDisallowedTools(content);
      const model = AGENT_MODELS[agentName];
      const description = AGENT_DESCRIPTIONS[agentName] || agentName;

      // Windows 32KB CLI 한계 대응: description만 prompt로 사용
      const prompt = description;

      agents[`omc-${agentName}`] = {
        description,
        prompt,
        model,
        disallowedTools,
      };
    }

    log.info(
      `Loaded ${Object.keys(agents).length} OMC agents from ${latestVersion}`
    );
    return agents;
  } catch (error) {
    log.error('Failed to load OMC agents:', error);
    return null;
  }
}

/**
 * OMC 스킬 부스팅 패턴 가이드 생성 (OMC 에이전트 설치 시)
 *
 * SKILL.md에 /oh-my-claudecode:plan 등의 표기가 나타나면,
 * 모델이 외부 스킬을 호출하는 것이 아니라 이 가이드의 패턴을 직접 실행.
 * omc- 접두사 에이전트를 Task 도구로 위임하는 구체적 워크플로우 포함.
 */
export function getSkillPatterns(): string {
  return `
## OMC 스킬 부스팅 해석 규칙

SKILL.md 워크플로우에 아래 OMC FQN 참조가 등장하면, 해당 패턴을 직접 실행하세요.
이것은 외부 도구 호출이 아니라, 아래 "OMC Skill Patterns" 섹션의 행동 패턴을 따르라는 의미입니다.

| SKILL.md 표기 | 실행 방법 |
|---------------|----------|
| \`/oh-my-claudecode:plan\` | 아래 **plan** 패턴을 따름 |
| \`/oh-my-claudecode:ralplan\` | 아래 **ralplan** 패턴을 따름 (planner→architect→critic 합의 루프) |
| \`/oh-my-claudecode:ralph\` | 아래 **ralph** 패턴을 따름 (완료까지 지속 실행) |
| \`/oh-my-claudecode:research\` | 아래 **research** 패턴을 따름 |
| \`/oh-my-claudecode:review\` | 아래 **review** 패턴을 따름 |
| \`/oh-my-claudecode:analyze\` | 아래 **analyze** 패턴을 따름 |
| \`/oh-my-claudecode:deepsearch\` | 아래 **deepsearch** 패턴을 따름 |
| \`/oh-my-claudecode:build-fix\` | 아래 **build-fix** 패턴을 따름 |
| \`/oh-my-claudecode:ultraqa\` | 아래 **ultraqa** 패턴을 따름 |
| \`/oh-my-claudecode:code-review\` | 아래 **code-review** 패턴을 따름 |
| \`/oh-my-claudecode:security-review\` | 아래 **security-review** 패턴을 따름 |
| \`/oh-my-claudecode:cancel\` | 현재 워크플로우 즉시 중단 |
| \`ulw\` 매직 키워드 | 해당 단계를 병렬 에이전트 위임 + 완료 보장으로 실행. Task 도구로 적절한 에이전트에 위임하고, 모든 하위 작업이 완료될 때까지 지속 |

**중요**: \`/oh-my-claudecode:*\` 표기는 외부 스킬 호출이 **아닙니다**. Skill 도구로 호출하면 안 됩니다.
이 표기가 나타나면, 아래 해당 패턴의 행동을 **당신이 직접** 수행해야 합니다.
예: SKILL.md에 \`/oh-my-claudecode:ralph\`가 있으면, 아래 "ralph — Persistent Execution" 섹션의 행동 패턴을 그대로 따르세요.
"스킬을 사용할 수 없다"거나 "다른 방법으로 대체한다"고 판단하지 마세요. 패턴은 항상 사용 가능합니다.

## OMC Skill Patterns

When the user requests one of these workflows, follow the corresponding pattern using the Task tool to delegate to specialized agents.
All OMC agents use the "omc-" prefix (e.g., "omc-architect", "omc-executor").

### plan — Planning Session
When user says "plan this", "plan the", or makes a broad/vague request:
1. Delegate to **omc-explore** agent to understand the codebase structure
2. Delegate to **omc-analyst** agent to identify requirements and constraints
3. Delegate to **omc-planner** agent to create an execution plan
4. Present the plan to the user for approval before proceeding

### ralplan — Iterative Planning Consensus
When user says "ralplan":
1. Delegate to **omc-planner** to create initial plan
2. Delegate to **omc-architect** to review technical feasibility
3. Delegate to **omc-critic** to challenge and evaluate the plan
4. If critic finds issues, iterate: omc-planner revises → omc-architect reviews → omc-critic evaluates
5. Continue until consensus reached (max 3 iterations)

### ralph — Persistent Execution
When user says "ralph", "don't stop", or "must complete":
1. Break the task into subtasks
2. Execute each subtask, delegating to appropriate omc- agents
3. After each subtask, verify completion
4. Do NOT stop until ALL subtasks are verified complete
5. Use **omc-architect** for final verification before claiming done

### build-fix — Build Error Resolution
When user says "build-fix" or build errors are detected:
1. Run build/type check command to collect all errors
2. Delegate to **omc-build-fixer** agent with the error list
3. Verify fix doesn't introduce new errors
4. Repeat until build passes clean

### ultraqa — QA Cycling
When user says "test", "QA", or "verify":
1. Delegate to **omc-qa-tester** to run tests and capture results
2. If failures found, delegate to **omc-executor** to fix
3. Re-run tests via **omc-qa-tester**
4. Repeat until all tests pass (max 5 cycles)

### review — Plan Review
When user says "review plan" or "review":
1. Delegate to **omc-critic** agent with the plan/code to review
2. Present critique findings to user

### analyze — Deep Analysis
When user says "analyze", "debug", or "investigate":
1. Delegate to **omc-explore** to gather relevant code context
2. Delegate to **omc-architect** for deep technical analysis
3. Present findings with root causes and recommendations

### deepsearch — Thorough Codebase Search
When user says "search", "find in codebase":
1. Delegate to **omc-explore** agent for broad pattern search
2. If needed, use multiple search strategies (grep, glob, AST)
3. Compile and present findings

### code-review — Code Review
When user says "code review" or "review code":
1. Delegate to **omc-code-reviewer** for comprehensive review
2. Include: logic errors, security issues, performance, style
3. Present severity-rated findings

### security-review — Security Review
When user says "security review" or "security audit":
1. Delegate to **omc-security-reviewer** for OWASP Top 10 analysis
2. Check: injection, auth, XSS, secrets, trust boundaries
3. Present vulnerability report with severity ratings

### research — Research
When user says "research" or "analyze data":
1. Delegate to **omc-researcher** for external documentation/API research
2. Optionally delegate to **omc-scientist** for data analysis
3. Compile research findings
`;
}

/**
 * OMC 스킬 부스팅 패턴 가이드 (OMC 미설치 시 fallback)
 *
 * omc- 에이전트 없이도 동일한 워크플로우를 수행할 수 있도록
 * built-in 에이전트(general-purpose, Explore, Bash)와 직접 수행으로 대체하는 가이드
 */
/**
 * OMC 에이전트 미설치 시에도 스킬 부스팅 표기를 해석할 수 있도록 최소 가이드 제공.
 * omc- 에이전트 대신 built-in 에이전트(general-purpose, Explore, Bash)와 직접 수행으로 대체.
 */
export function getSkillPatternsFallback(): string {
  return `
## OMC 스킬 부스팅 해석 규칙 (Fallback)

SKILL.md 워크플로우에 \`/oh-my-claudecode:*\` 참조가 등장하면, 해당 패턴을 직접 실행하세요.
이것은 외부 도구 호출이 **아닙니다**. Skill 도구로 호출하면 안 됩니다.

**중요**: "스킬을 사용할 수 없다"거나 "다른 방법으로 대체한다"고 판단하지 마세요.
아래 패턴은 OMC 에이전트 없이도 **항상 사용 가능**합니다.
OMC 전용 에이전트(omc-*)가 없으므로, built-in 에이전트(general-purpose, Explore, Bash)를 활용하거나 직접 수행하세요.

| SKILL.md 표기 | 실행 방법 |
|---------------|----------|
| \`/oh-my-claudecode:plan\` | 코드베이스 탐색 → 요구사항 분석 → 실행 계획 작성 → 사용자 승인 |
| \`/oh-my-claudecode:ralplan\` | 계획 작성 → 기술 검토 → 비판적 평가 → 합의까지 반복 (최대 3회) |
| \`/oh-my-claudecode:ralph\` | 작업을 하위 작업으로 분해 → 순차 실행 → 각 단계 검증 → 전체 완료까지 중단 없이 지속 |
| \`/oh-my-claudecode:build-fix\` | 빌드/타입 체크 실행 → 에러 수집 → 수정 → 새 에러 없을 때까지 반복 |
| \`/oh-my-claudecode:ultraqa\` | 테스트 실행 → 실패 수정 → 재실행 → 전체 통과까지 반복 (최대 5회) |
| \`/oh-my-claudecode:review\` | 코드/계획 비판적 검토 → 결과 제시 |
| \`/oh-my-claudecode:analyze\` | 코드 컨텍스트 수집 → 기술 분석 → 근본 원인 및 권장사항 제시 |
| \`/oh-my-claudecode:deepsearch\` | 다양한 검색 전략(grep, glob, AST)으로 코드베이스 탐색 → 결과 종합 |
| \`/oh-my-claudecode:code-review\` | 로직 오류, 보안, 성능, 스타일 종합 코드 리뷰 → 심각도별 결과 제시 |
| \`/oh-my-claudecode:security-review\` | OWASP Top 10 기반 보안 분석 → 취약점 보고서 작성 |
| \`/oh-my-claudecode:research\` | 외부 문서/API 리서치 → 데이터 분석 → 결과 종합 |
| \`/oh-my-claudecode:cancel\` | 현재 워크플로우 즉시 중단 |
| \`ulw\` 매직 키워드 | 해당 단계를 병렬 에이전트 위임 + 완료 보장으로 실행 |
`;
}
