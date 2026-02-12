# OMC 에이전트 통합 레슨런

- [OMC 에이전트 통합 레슨런](#omc-에이전트-통합-레슨런)
  - [배경](#배경)
    - [문제: OMC가 SDK 환경에서 동작하지 않음](#문제-omc가-sdk-환경에서-동작하지-않음)
    - [해결 방향](#해결-방향)
  - [핵심 발견사항](#핵심-발견사항)
    - [1. Claude SDK의 `agents` 옵션 동작 방식](#1-claude-sdk의-agents-옵션-동작-방식)
    - [2. Windows ENAMETOOLONG 한계 (32KB)](#2-windows-enametoolong-한계-32kb)
    - [3. SDK에 존재하지 않는 옵션](#3-sdk에-존재하지-않는-옵션)
    - [4. 에이전트 이름 충돌 방지](#4-에이전트-이름-충돌-방지)
    - [5. 스킬 부스팅 FQN 매핑](#5-스킬-부스팅-fqn-매핑)
    - [6. 에이전트 선별 원칙](#6-에이전트-선별-원칙)
    - [7. 프롬프트 캐싱과 비용](#7-프롬프트-캐싱과-비용)
  - [실패 → 해결 과정](#실패--해결-과정)
    - [시도 1: 풀 프롬프트 (실패)](#시도-1-풀-프롬프트-실패)
    - [시도 2: 500자 요약 (실패)](#시도-2-500자-요약-실패)
    - [시도 3: description 한 줄 + 12개 에이전트 (성공)](#시도-3-description-한-줄--12개-에이전트-성공)
  - [최종 아키텍처](#최종-아키텍처)
    - [파일 구조](#파일-구조)
    - [데이터 흐름](#데이터-흐름)
    - [페이로드 크기 분석](#페이로드-크기-분석)
  - [런타임 검증 결과](#런타임-검증-결과)
  - [향후 참고사항](#향후-참고사항)

---

## 배경

### 문제: OMC가 SDK 환경에서 동작하지 않음

dmap-web은 Claude SDK(`@anthropic-ai/claude-code`)의 `query()` 함수로 DMAP 스킬을 실행함.
그런데 **OMC(oh-my-claudecode)의 에이전트, 스킬, 훅이 SDK 환경에서 전혀 동작하지 않는** 문제가 있었음.

**OMC가 SDK에서 동작하지 않는 이유:**

| 구분 | CLI 직접 실행 (`claude` 명령) | SDK `query()` 호출 |
|------|-------------------------------|-------------------|
| 플러그인 로딩 | `~/.claude/plugins/` 자동 스캔 및 로딩 | **로딩하지 않음** |
| OMC 에이전트 (32개) | Task 도구에서 FQN으로 사용 가능 (`oh-my-claudecode:architect`) | **사용 불가** — 등록되지 않음 |
| OMC 스킬 (ralph, ralplan 등) | Skill 도구로 호출 가능 | **Skill 도구 자체가 없음** |
| OMC 훅 (PreToolUse 등) | 자동 실행 | **실행되지 않음** |
| MCP 서버 | 플러그인이 등록한 MCP 서버 사용 가능 | **별도 설정 필요** |
| CLAUDE.md 내 OMC 지시사항 | 로딩되어 시스템 프롬프트에 포함 | **`appendSystemPrompt`로 직접 주입해야 함** |

**근본 원인:**
SDK의 `query()`는 내부적으로 `claude` CLI를 서브프로세스로 실행하지만,
**플러그인 시스템을 초기화하지 않음**. SDK는 경량 실행 모드로 설계되어,
`--agents`, `--model`, `--permissionMode` 등의 CLI 인자만 전달할 뿐,
`~/.claude/plugins/` 디렉토리를 스캔하여 플러그인을 로딩하는 과정이 생략됨.

따라서 OMC의 핵심 기능인 **32개 전문 에이전트**, **11개 오케스트레이션 스킬**,
**delegation enforcement 훅** 등이 모두 비활성화 상태가 됨.

### 해결 방향

SDK가 플러그인을 로딩하지 않으므로, **OMC의 핵심 기능을 수동으로 주입**하는 방식으로 해결:

1. **에이전트 주입**: OMC 에이전트 .md 파일을 직접 읽어 SDK의 `agents` 옵션으로 전달
2. **스킬 패턴 주입**: OMC 스킬(ralph, ralplan 등)의 행동 패턴을 `appendSystemPrompt`에 텍스트로 포함
3. **FQN 매핑**: SKILL.md의 `/oh-my-claudecode:ralplan` 같은 FQN 참조를 행동 패턴으로 매핑하는 테이블 제공
4. **훅 미지원**: delegation enforcement 등 훅 기능은 현재 미지원 (시스템 프롬프트 지시로 대체)

이 작업의 목적은 DMAP 스킬이 SDK를 통해 실행될 때도 OMC의 전문 에이전트를 활용하여
계획 수립(ralplan), 완료 보장 실행(ralph), 코드 리뷰, 보안 검토 등을 수행할 수 있게 하는 것임.

[Top](#omc-에이전트-통합-레슨런)

---

## 핵심 발견사항

### 1. Claude SDK의 `agents` 옵션 동작 방식

**SDK 소스 코드 분석 결과** (`sdk.mjs:6431`):

```
query() → options.agents → JSON.stringify() → --agents JSON_STRING → CLI 서브프로세스
```

- SDK는 `agents` 옵션을 **CLI 인자**(`--agents`)로 직렬화하여 자식 프로세스에 전달
- 파일 기반 전달, stdin, 환경변수 방식은 지원하지 않음
- 따라서 **전체 agents JSON이 명령줄 인자 크기 한계에 직접 영향**

**agents 옵션 포맷:**

```typescript
Record<string, {
  description: string;  // Task 도구에서 에이전트 선택 시 표시
  prompt: string;       // 서브에이전트의 시스템 프롬프트
  model?: string;       // 'opus' | 'sonnet' | 'haiku'
  disallowedTools?: string[];
}>
```

### 2. Windows ENAMETOOLONG 한계 (32KB)

**증상:**

```
Error: spawn ENAMETOOLONG
  errno: -4064, code: 'ENAMETOOLONG', syscall: 'spawn'
```

**원인:**
- Windows `CreateProcessW`의 `lpCommandLine` 매개변수 한계: **32,767자**
- Node.js `child_process.spawn`이 내부적으로 이 API 사용
- CLI 인자 = 기본 인자 + `--agents JSON` + `--appendSystemPrompt TEXT` + 기타 옵션
- 모두 합쳐 32KB를 초과하면 `ENAMETOOLONG` 발생

**핵심 교훈:**
- macOS/Linux에서는 ARG_MAX가 훨씬 큰 경우가 많아 (2MB+) 문제 없을 수 있으나,
  **Windows 환경에서는 반드시 페이로드 크기를 의식적으로 관리**해야 함
- `appendSystemPrompt`(SKILL.md + 스킬 패턴 + 지시사항)도 같은 명령줄에 포함되므로 합산 계산 필요

### 3. SDK에 존재하지 않는 옵션

| 옵션 | 존재 여부 | 비고 |
|------|----------|------|
| `agents` | O | 비공식이나 동작 확인 (`sdk.mjs:6431`) |
| `plugins` | X | SDK에 없음. 플러그인은 CLI 직접 실행 시에만 동작 |
| `@anthropic-ai/claude-agent-sdk` | X | 존재하지 않는 패키지. 실제는 `@anthropic-ai/claude-code` |

### 4. 에이전트 이름 충돌 방지

**문제:** `architect`, `executor` 같은 짧은 이름은 다른 플러그인 에이전트와 충돌 가능

**해결:** 모든 OMC 에이전트에 `omc-` 접두사 부여

```typescript
agents[`omc-${agentName}`] = { description, prompt, model, disallowedTools };
// 결과: "omc-architect", "omc-executor", "omc-explore" 등
```

**런타임 확인:**
SDK가 `blog-poster:researcher:researcher`(플러그인 자체 에이전트)를 못 찾았을 때,
에러 메시지에 사용 가능한 에이전트 목록을 표시:

```
Available agents: general-purpose, omc-analyst, omc-architect, omc-build-fixer,
omc-code-reviewer, omc-critic, omc-executor, omc-explore, omc-planner,
omc-qa-tester, omc-researcher, omc-scientist, omc-security-reviewer
```

### 5. 스킬 부스팅 FQN 매핑

**문제:**
DMAP SKILL.md에서 OMC 스킬을 FQN으로 참조:
`/oh-my-claudecode:ralplan`, `/oh-my-claudecode:ralph`, `ulw` 등.
그러나 SDK 컨텍스트에서는 `Skill` 도구를 사용할 수 없음.

**해결:** `getSkillPatterns()` 함수로 FQN → 행동 패턴 매핑 테이블 제공

```
| SKILL.md 표기                        | 실행 방법                           |
|--------------------------------------|-------------------------------------|
| `/oh-my-claudecode:ralplan`          | planner→architect→critic 합의 루프  |
| `/oh-my-claudecode:ralph`            | 완료까지 지속 실행                  |
| `ulw` 매직 키워드                    | 병렬 에이전트 위임 + 완료 보장      |
```

이 테이블은 `appendSystemPrompt`에 포함되어 모델이 FQN을 만나면 해당 패턴을 직접 수행.

### 6. 에이전트 선별 원칙

**원칙:** 스킬 패턴에서 **실제 참조하는 에이전트만** 포함

| 스킬 패턴 | 사용 에이전트 |
|-----------|-------------|
| plan | explore, analyst, planner |
| ralplan | planner, architect, critic |
| ralph | architect, executor |
| build-fix | build-fixer |
| ultraqa | qa-tester, executor |
| review | critic |
| analyze | explore, architect |
| deepsearch | explore |
| code-review | code-reviewer |
| security-review | security-reviewer |
| research | researcher, scientist |

**결과:** 16개 → 12개로 축소 (designer, writer, debugger, verifier 제거)

### 7. 프롬프트 캐싱과 비용

- `agents` JSON과 `appendSystemPrompt`는 매 호출마다 동일하므로 **프롬프트 캐싱** 적용
- 첫 호출: 정상 요금 (캐시 생성)
- 이후 호출: **0.1x 비용** (90% 할인)
- 12개 에이전트 description (~1.8KB) + 스킬 패턴 (~4KB) = ~6KB 추가 토큰
- 캐싱 적용 시 실질 추가 비용 미미

[Top](#omc-에이전트-통합-레슨런)

---

## 실패 → 해결 과정

### 시도 1: 풀 프롬프트 (실패)

```
16개 에이전트 × 5~13KB 프롬프트 = ~84KB → ENAMETOOLONG
```

OMC 에이전트 .md 파일의 전체 프롬프트를 그대로 넣으려 했으나,
Windows 32KB 한계를 크게 초과.

### 시도 2: 500자 요약 (실패)

```
3개 풀(architect, executor, planner) + 13개 × 500자 = ~22KB agents + ~16KB systemPrompt = ~38KB → ENAMETOOLONG
```

핵심 에이전트(architect, executor, planner)만 풀 프롬프트, 나머지는 500자 요약.
agents JSON만으로는 32KB 이내였지만, `appendSystemPrompt` 합산 시 초과.

### 시도 3: description 한 줄 + 12개 에이전트 (성공)

```
12개 × ~150B description = ~1.8KB agents + ~16KB systemPrompt = ~18KB → 성공
```

모든 에이전트의 prompt를 description 한 줄(50~80자)로 축소.
불필요 에이전트 4개 제거. 총 페이로드 ~18KB로 32KB 한계 내 안전.

**트레이드오프:**
- 서브에이전트가 풀 OMC 프롬프트를 받지 못함
- 그러나 description만으로도 역할 인지 충분 (런타임 검증 완료)
- 오케스트레이터(메인 Claude)가 스킬 패턴 지시사항으로 적절한 에이전트에 위임

[Top](#omc-에이전트-통합-레슨런)

---

## 최종 아키텍처

### 파일 구조

```
packages/backend/src/services/
├── omc-integration.ts    # OMC 에이전트 로딩 + 스킬 패턴 생성
└── claude-sdk-client.ts  # SDK query() 호출 (OMC 통합 포함)
```

### 데이터 흐름

```
1. executeSkill() 호출
2. loadOmcAgents() → ~/.claude/plugins/cache/omc/oh-my-claudecode/{version}/agents/*.md
3. 12개 에이전트 → { description, prompt: description, model, disallowedTools }
4. getSkillPatterns() → FQN 매핑 + 11개 스킬 패턴 텍스트
5. SDK query() 호출:
   - options.agents = omcAgents (CLI --agents 인자)
   - options.appendSystemPrompt = SKILL.md + 스킬 패턴 (CLI --appendSystemPrompt 인자)
6. Claude가 Task 도구로 omc-* 에이전트 위임
```

### 페이로드 크기 분석

| 구성 요소 | 크기 | 비고 |
|-----------|------|------|
| agents JSON | ~1.8KB | 12개 에이전트, description-only prompt |
| SKILL.md | 5~15KB | 스킬에 따라 다름 |
| 스킬 패턴 | ~4KB | getSkillPatterns() |
| ASK_USER 지시사항 | ~1.5KB | 구조화 질문 포맷 |
| 기타 지시사항 | ~0.5KB | 언어 오버라이드, 에이전트 위임 안내 |
| **합계** | **~13~23KB** | **32KB 한계 내 안전** |

콘솔 진단 로그:

```
[SDK] Payload: agents=1823B, systemPrompt=15420B, total=17243B
```

[Top](#omc-에이전트-통합-레슨런)

---

## 런타임 검증 결과

blog-poster 프로젝트에서 `write-post` 스킬 실행으로 검증:

| 검증 항목 | 결과 |
|-----------|------|
| ENAMETOOLONG 에러 | 해결 (발생하지 않음) |
| OMC 에이전트 등록 | 12개 모두 등록 확인 |
| omc-researcher 위임 | 성공 (Task 도구로 호출됨) |
| omc-executor 위임 | 성공 (Task 도구로 호출됨) |
| 에이전트 미발견 시 폴백 | 자동 (에러 메시지에 사용 가능 목록 표시) |
| 프롬프트 캐싱 | 동작 확인 (두 번째 호출부터 cache_read_input_tokens 증가) |

**로그 증거:**

```
[SDK] Loaded 12 OMC agents
omcAgentCount: 12
Available agents: general-purpose, omc-analyst, omc-architect, ...
subagent_type: "omc-researcher"  ← 실제 위임 발생
subagent_type: "omc-executor"    ← 실제 위임 발생
```

[Top](#omc-에이전트-통합-레슨런)

---

## 향후 참고사항

1. **에이전트 추가 시**: `ESSENTIAL_AGENTS`, `AGENT_MODELS`, `AGENT_DESCRIPTIONS` 3곳 모두 업데이트 필요.
   해당 에이전트를 참조하는 스킬 패턴도 `getSkillPatterns()`에 추가해야 함

2. **페이로드 한계 모니터링**: 콘솔의 `[SDK] Payload:` 로그로 크기 확인.
   total이 25KB 이상이면 주의, 30KB 이상이면 위험

3. **OMC 버전 업데이트 시**: `findLatestVersion()`이 자동으로 최신 버전 감지.
   에이전트 이름이 변경되면 `ESSENTIAL_AGENTS`도 동기화 필요

4. **description-only prompt의 한계**: 서브에이전트가 OMC 풀 프롬프트 없이 동작하므로,
   복잡한 행동 패턴(예: architect의 검증 체크리스트)은 오케스트레이터가 직접 지시해야 함.
   필요 시 특정 에이전트만 프롬프트를 늘리되, 페이로드 한계를 반드시 확인

5. **macOS/Linux 배포 시**: ENAMETOOLONG 제약이 완화되므로,
   필요하면 OS별로 프롬프트 크기 전략을 다르게 적용 가능

[Top](#omc-에이전트-통합-레슨런)
