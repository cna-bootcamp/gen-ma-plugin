# 선언형 멀티에이전트 오케스트레이션 논문 제안서

- [선언형 멀티에이전트 오케스트레이션 논문 제안서](#선언형-멀티에이전트-오케스트레이션-논문-제안서)
  - [논문 개요](#논문-개요)
  - [연구 배경 및 동기](#연구-배경-및-동기)
    - [현황](#현황)
    - [문제점](#문제점)
  - [핵심 기여 (Contribution)](#핵심-기여-contribution)
  - [기존 프레임워크와의 차별성](#기존-프레임워크와의-차별성)
    - [비교 요약](#비교-요약)
    - [패러다임 전환 포인트](#패러다임-전환-포인트)
  - [아키텍처 분석](#아키텍처-분석)
    - [Clean Architecture 3대 원칙의 적용](#clean-architecture-3대-원칙의-적용)
    - [5-Layer 아키텍처](#5-layer-아키텍처)
    - [4-Tier 에이전트 모델](#4-tier-에이전트-모델)
    - [3계층 활성화 구조](#3계층-활성화-구조)
    - [에이전트 패키지 구조](#에이전트-패키지-구조)
    - [프롬프트 조립 3단계](#프롬프트-조립-3단계)
    - [Gateway의 추상-구체 분리](#gateway의-추상-구체-분리)
  - [설계 포인트](#설계-포인트)
  - [핵심 규칙 체계](#핵심-규칙-체계)
    - [MUST 규칙](#must-규칙)
    - [MUST NOT 규칙](#must-not-규칙)
  - [논문 구성안](#논문-구성안)
    - [제목 후보](#제목-후보)
    - [arXiv 카테고리](#arxiv-카테고리)
    - [섹션 구성](#섹션-구성)
    - [섹션별 상세 내용](#섹션별-상세-내용)
  - [발표 채널 제안](#발표-채널-제안)
  - [실증 사례](#실증-사례)
    - [OMC (Oh-My-ClaudeCode) 플러그인](#omc-oh-my-claudecode-플러그인)
    - [Abra 플러그인](#abra-플러그인)
  - [평가 프레임워크 (Evaluation)](#평가-프레임워크-evaluation)
  - [작성 로드맵](#작성-로드맵)

---

## 논문 개요

**제목:**
> **"Declarative Multi-Agent Orchestration:
> Applying Clean Architecture Principles to LLM Agent Systems
> via Markdown and YAML"**

**한국어 부제:**
> 선언형 멀티에이전트 오케스트레이션:
> 마크다운과 YAML로 Clean Architecture를 LLM 에이전트 시스템에 적용하다

**핵심 주장:**
LLM 기반 멀티에이전트 시스템에 소프트웨어 공학의 검증된 원칙(Clean Architecture)을
**코드가 아닌 선언형 명세(Markdown + YAML)**로 적용하여,
런타임 중립적이고 도메인 무관한 플러그인 아키텍처를 실현할 수 있음을 제안하고 실증함.

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 연구 배경 및 동기

### 현황

LLM 기반 멀티에이전트 시스템은 2023년 이후 급격히 성장하며,
AutoGen(Microsoft), CrewAI, LangGraph, MetaGPT, ChatDev 등
다양한 프레임워크가 등장함.

이들 프레임워크는 에이전트 간 협업, 역할 분담, 워크플로우 오케스트레이션 등
핵심 문제를 해결하고 있으나, 공통적인 구조적 한계를 가짐.

### 문제점

| 문제 | 설명 | 결과 |
|------|------|------|
| **코드 종속성** | Python/TypeScript SDK로만 에이전트 정의 가능 | 비개발자 진입 불가, 도메인 전문가 배제 |
| **런타임 결합** | 특정 프레임워크(LangChain, AutoGen 등)에 강결합 | 다른 런타임으로 이식 불가 |
| **역할 혼재** | 에이전트가 오케스트레이션과 실행을 동시 수행 | 관심사 분리 부재, 유지보수 어려움 |
| **추상화 부족** | 도구, 모델이 코드에 하드코딩 | 환경 변경 시 코드 수정 필요 |
| **도메인 한정** | 대부분 코드 생성/데이터 분석에 특화 | 교육, 문서화, 비즈니스 워크플로우 적용 어려움 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 핵심 기여 (Contribution)

본 연구의 핵심 기여는 다음 4가지임:

1. **선언형 에이전트 아키텍처 표준 제안**
   마크다운(프롬프트)과 YAML(설정)만으로 멀티에이전트 시스템을 정의하는
   범용 플러그인 표준을 제안함.
   코드 작성 없이 에이전트의 역할, 역량, 제약, 핸드오프를 선언적으로 명세함.
   에이전트 패키지는 AGENT.md(WHY+HOW 프롬프트) + agentcard.yaml(WHO+WHAT+WHEN 선언) +
   tools.yaml(추상 도구 인터페이스)의 3파일로 구성되며, 각 파일의 경계 원칙(중복 기술 금지)을 정의함.

2. **Clean Architecture의 AI 에이전트 시스템 이식**
   소프트웨어 공학에서 검증된 Loosely Coupling, High Cohesion,
   Dependency Inversion 원칙을 LLM 에이전트 오케스트레이션에 체계적으로 적용함.
   위임형 경로: Skills(Controller+UseCase) → Agents(Service) → Gateway(Infrastructure)의
   단방향 의존 흐름을 구현하고,
   직결형 경로: Skills → Gateway(Service 생략)로 YAGNI 원칙을 반영하여
   불필요한 Agent 계층 경유를 방지함.
   Hooks가 Cross-cutting(AOP) 역할로 모든 계층의 이벤트를 횡단적으로 가로챔.

3. **런타임 중립적 추상 계층 설계**
   `tier: HEAVY/HIGH/MEDIUM/LOW`의 4-Tier 모델, `forbidden_actions`,
   `tools.yaml` 등 추상 선언과 `runtime-mapping.yaml`의 구체 매핑을 분리하여
   Claude Code, Codex CLI, Gemini CLI 등 어떤 런타임에서도
   동일한 플러그인이 동작하는 이식성을 확보함.
   Gateway의 `runtime-mapping.yaml`은 tier_mapping(모델 매핑) +
   tool_mapping(도구 매핑) + action_mapping(금지 액션 매핑)의 3영역으로 구성되며,
   예산(budget)은 별도 파일 없이 런타임이 자체 관리함.

4. **실증적 검증**
   OMC 플러그인(39 Skills, 35 Agents, Hook 사용 오케스트레이션 플러그인)과
   Abra 플러그인(비즈니스 도메인, 일반 플러그인)의
   실제 운용 사례를 통해 표준의 실효성을 검증함.

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 기존 프레임워크와의 차별성

### 비교 요약

| 비교 항목 | LangChain/LangGraph | CrewAI | AutoGen | MetaGPT | **본 연구 (DMAP)** |
|-----------|:-------------------:|:------:|:-------:|:-------:|:-------------------:|
| **에이전트 정의 방식** | Python 코드 | Python 코드 | Python 코드 | Python 코드 | **Markdown + YAML** |
| **오케스트레이션** | 그래프 코드 | 순차/계층 코드 | 대화 프로토콜 | SOP 코드 | **스킬 프롬프트** |
| **런타임 종속성** | LangChain SDK | CrewAI SDK | AutoGen SDK | MetaGPT SDK | **런타임 중립** |
| **아키텍처 원칙** | 없음 (도구 체인) | 역할 기반 | 대화 기반 | SOP 기반 | **Clean Architecture** |
| **도구 추상화** | Tool 클래스 | Tool 데코레이터 | Function call | Tool 클래스 | **추상 선언 + Gateway 매핑** |
| **티어 관리** | 없음 | 없음 | 없음 | 없음 | **4-Tier + runtime-mapping.yaml** |
| **핸드오프/에스컬레이션** | 없음 | 위임 키워드 | 없음 | 없음 | **agentcard.yaml 선언** |
| **도메인 범용성** | 중간 | 중간 | 중간 | 코드 특화 | **완전 범용** |
| **비개발자 접근성** | 불가 | 불가 | 불가 | 불가 | **가능** |
| **이식성** | 낮음 | 낮음 | 낮음 | 낮음 | **높음** |

### 패러다임 전환 포인트

기존 프레임워크와의 근본적 차이는 **"코드로 구현"에서 "선언으로 명세"**로의 전환임:

```
기존: Developer writes Python code → Framework executes agents
본 연구: Anyone writes Markdown/YAML → Any Runtime executes agents
```

이는 다음과 같은 패러다임 전환을 의미함:

| 차원 | 기존 (Imperative) | 본 연구 (Declarative) |
|------|-------------------|----------------------|
| **에이전트 정의** | "어떻게 동작하는가" 코딩 | "무엇을 할 수 있는가" 선언 |
| **도구 연결** | 코드에서 도구 객체 생성 | tools.yaml에서 추상 인터페이스 선언 |
| **역할 제약** | if문으로 분기 | forbidden_actions 블랙리스트 |
| **모델 선택** | 코드에서 모델명 하드코딩 | tier 선언 → runtime-mapping.yaml이 해석 |
| **워크플로우** | 함수 호출 체인 | 프롬프트에 자연어로 기술 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 아키텍처 분석

### Clean Architecture 3대 원칙의 적용

| 원칙 | 전통적 소프트웨어 | 본 연구의 적용 | 구현 메커니즘 |
|------|-----------------|---------------|-------------|
| **Loosely Coupling** | 인터페이스를 통한 의존성 분리 | 추상 선언(agentcard.yaml/tools.yaml) ↔ 구체 구현(runtime-mapping.yaml) | 에이전트는 `file_read` 선언 → Gateway가 `Read` 도구로 매핑 |
| **High Cohesion** | 클래스가 단일 책임에 집중 | Skills=라우팅/오케스트레이션, Agents=자율 실행, Gateway=도구 매핑 | 각 컴포넌트가 자기 역할에만 집중 |
| **Dependency Inversion** | 상위 모듈이 추상에 의존 | 상위(Skills/Agents)가 추상에 의존, 하위(Gateway/Runtime)가 구체 제공 | `tier: HIGH` → runtime-mapping.yaml이 모델로 해석 |

### 5-Layer 아키텍처

```
┌─────────────────────────────────────────────┐
│  입력 (사용자)                                │
├─────────────────────────────────────────────┤
│  Controller + Use Case (Skills)              │
│  ├── 사용자 진입점 (슬래시 명령)              │
│  └── 워크플로우 오케스트레이션 (프롬프트)      │
├─────────────────────────────────────────────┤
│  Service (Agents)                            │
│  ├── 역할별 전문가 (AGENT.md)                │
│  ├── 역량/제약 선언 (agentcard.yaml)         │
│  ├── 추상 도구 인터페이스 (tools.yaml)       │
│  └── 4-Tier 변형 (HEAVY/HIGH/MEDIUM/LOW)    │
├─────────────────────────────────────────────┤
│  Gateway (도구 인프라)                        │
│  ├── runtime-mapping.yaml (추상→구체 변환)    │
│  │   ├── tier_mapping (모델 매핑)            │
│  │   ├── tool_mapping (도구 매핑)            │
│  │   └── action_mapping (액션 매핑)          │
│  ├── MCP Servers (외부 도구)                  │
│  ├── LSP Servers (코드 분석)                  │
│  └── Custom Tools (도메인 도구)               │
├─────────────────────────────────────────────┤
│  Cross-cutting: Hooks (AOP)                  │
│  └── 모든 계층의 이벤트를 횡단적으로 가로챔    │
├─────────────────────────────────────────────┤
│  Runtime (실행 환경)                          │
│  ├── 매핑 해석 → 컨텍스트 조립 → 에이전트 스폰│
│  └── Claude Code / Codex CLI / Gemini CLI    │
└─────────────────────────────────────────────┘
```

**스킬 실행 경로 (2가지):**

```
위임형:  Input → Skills(Controller) → Agents(Service) → Gateway → Runtime
직결형:  Input → Skills(Controller) ──────────────────→ Gateway → Runtime
                                                         ↑
                                              Hooks (Cross-cutting, AOP)
```

- **위임형**: LLM 추론이 필요한 작업 → Agent에 위임 (Core, Planning, Orchestrator 스킬)
- **직결형**: 절차적·결정론적 작업 → Gateway 도구 직접 사용 (Setup, Utility 스킬)
- **YAGNI 원칙**: Setup/Utility 스킬에 Agent 위임을 강제하지 않음 — 불필요한 LLM 호출 방지

### 4-Tier 에이전트 모델

동일 역할을 비용-역량 트레이드오프에 따라 티어별로 분리하는 범용 원칙.
티어는 LLM 모델 등급을 결정하는 추상 선언이며,
Gateway의 `runtime-mapping.yaml`이 실제 모델로 매핑함.
예산(budget)은 별도 파일 없이 런타임이 자체 관리함.

| 티어 | 특성 | LLM 예시 | 적합 작업 | 에스컬레이션 |
|------|------|----------|----------|-------------|
| **LOW** | 빠르고 저비용 | Haiku | 단건 조회, 간단한 수정 | 복잡도 초과 시 상위 티어로 보고 |
| **MEDIUM** | 균형 | Sonnet | 기능 구현, 일반 분석 | — |
| **HIGH** | 최고 역량, 고비용 | Opus | 복잡한 의사결정, 심층 분석 | — |
| **HEAVY** | 최고 역량 + 대규모 예산 | Opus (대규모 토큰·시간) | 장시간 추론, 대규모 멀티파일 작업 | — |

핵심 메커니즘:
- **에스컬레이션**: LOW가 자기 한계 인식 → 상위 티어로 보고
- **상속**: 티어 변형 에이전트가 기본 에이전트의 config를 상속, 오버라이드만 기술
- **런타임 매핑**: 스킬이 에이전트 호출 시 `tier_mapping`에서 실제 모델로 변환하여 전달

### 3계층 활성화 구조

스킬 활성화의 순환 의존 문제를 해결하는 구조:

```
런타임 상주 파일 (항상 로드, 예: CLAUDE.md)
  └── 라우팅 테이블: "이 요청은 어떤 플러그인의 어떤 스킬?"
       │
       ▼
핵심 스킬 (Core, 조건 매칭 시 로드)
  └── 오케스트레이션: runtime-mapping.yaml 참조, 에이전트 스폰
       │
       ▼
에이전트 (위임받아 실행)
  └── 자율적 작업 수행, 결과 반환
```

**해결하는 문제:**
활성화 조건이 스킬 안에만 있으면, 스킬을 로드하려면 조건을 알아야 하는 순환 문제 발생.
런타임 상주 파일(CLAUDE.md)에 라우팅 테이블을 분리하여 이 문제를 해결함.

**Setup 스킬의 역할:**
Setup 스킬이 플러그인 설치 시 런타임 상주 파일에 Core 스킬의 활성화 조건을
라우팅 테이블로 등록함.

### 에이전트 패키지 구조

에이전트는 독립된 디렉토리 패키지로 구성되며, 3파일의 역할이 명확히 분리됨:

```
agents/{agent-name}/
├── AGENT.md          # [필수] WHY(목표) + HOW(워크플로우, 출력형식, 검증) — 프롬프트
├── agentcard.yaml    # [필수] WHO(정체성) + WHAT(역량·제약) + WHEN(핸드오프) — 기계 판독
├── tools.yaml        # [선택] 추상 도구 인터페이스 선언 ({tool:name} 표기법)
├── references/       # [선택] 전문 지식, 가이드라인, 참조 문서
└── templates/        # [선택] 출력 포맷 규격
```

| 파일 | 독자 | 관점 | 내용 |
|------|------|------|------|
| **AGENT.md** | LLM (프롬프트 주입) | WHY + HOW | 목표, 워크플로우, 출력 형식, 검증 |
| **agentcard.yaml** | 런타임 (기계 판독) | WHO + WHAT + WHEN | 정체성(is/is_not), 역량, 제약(forbidden_actions), 핸드오프(target+when+reason), 에스컬레이션 |
| **tools.yaml** | 런타임 (매칭 참조) | WHAT (도구) | 추상 도구 인터페이스: name, description, input, output |

**경계 원칙**: 두 파일에 동일 정보를 중복 기술하지 않음.
AGENT.md에서는 `{tool:name}` 표기법으로 tools.yaml에 정의된 추상 도구를 참조함.
AGENT.md에 모델명·구체 도구명을 하드코딩하지 않음.

### 프롬프트 조립 3단계

위임형 스킬이 에이전트를 스폰할 때 프롬프트를 조립하는 순서.
런타임의 prefix 캐시 적중률 극대화를 목적으로 설계됨:

| 순서 | 단계 | 내용 | 캐시 특성 |
|------|------|------|----------|
| 1 | **공통 정적** | runtime-mapping.yaml (tier, tool, action 매핑) | 모든 에이전트 공통 → 높은 캐시 적중률 |
| 2 | **에이전트별 정적** | AGENT.md + agentcard.yaml + tools.yaml (3파일) | 에이전트별 고정 → 동일 에이전트 호출 시 캐시 적중 |
| 3 | **동적** | 작업 지시 (TASK, EXPECTED OUTCOME 등 5항목) | 매 호출마다 변경 → 캐시 미적중 |

### Gateway의 추상-구체 분리

Gateway는 install.yaml과 runtime-mapping.yaml의 2파일로 구성됨:

```
에이전트 패키지 (추상)            Gateway (구체)
─────────────────────           ─────────────────────
agentcard.yaml                  runtime-mapping.yaml
  tier: HIGH          ──매핑──→   tier_mapping:
                                    HIGH: claude-opus-4-6

  forbidden_actions:             action_mapping:
    file_write        ──매핑──→     file_write: [Write, Edit]

tools.yaml                      runtime-mapping.yaml
  code_search         ──매핑──→   tool_mapping:
                                    code_search:
                                      - type: lsp
                                        tools: [lsp_workspace_symbols]
```

**3단 분리 (install.yaml ↔ setup 스킬 ↔ 런타임):**

```
install.yaml  = 데이터 (WHAT)   — "context7 MCP를 user 범위로 등록"
setup 스킬    = 지시 (HOW)      — "install.yaml을 읽고 설치를 수행하라"
런타임        = 실행 (DO)       — Bash로 명령 실행
```

**runtime-mapping.yaml 3영역:**

| 영역 | 역할 | 입력 | 출력 |
|------|------|------|------|
| **tier_mapping** | 티어 → 모델 매핑 | agentcard.yaml의 `tier` | 실제 LLM 모델명 |
| **tool_mapping** | 추상 도구 → 실제 도구 매핑 | tools.yaml의 도구 선언 | lsp/mcp/custom 도구 |
| **action_mapping** | 금지 액션 → 실제 도구 매핑 | agentcard.yaml의 `forbidden_actions` | 제외할 실제 도구 목록 |

> tool_mapping에는 lsp, mcp, custom 타입만 매핑함.
> builtin 도구(Read, Write, Bash 등)는 런타임이 내장 처리하므로 생략.

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 설계 포인트

| # | 포인트 | 설명 | 소프트웨어 공학 대응 개념 |
|---|--------|------|------------------------|
| 1 | **런타임 중립성** | `tier: HIGH`라는 추상 선언으로 LLM, 클라우드, 인력 등 도메인 무관 적용 | Dependency Inversion Principle |
| 2 | **3계층 활성화** | 런타임 상주 파일(라우팅) → 핵심 스킬(오케스트레이션) → 에이전트(실행)의 순환 의존 해결 | Layered Architecture |
| 3 | **프롬프트 깊이 차등화** | 라우팅/분기는 상세히, 에이전트 위임은 간결하게 (WHAT만, HOW는 에이전트 자율) | Interface Segregation / 자율 팀 |
| 4 | **위임 표기법** | Agent 위임 5항목(TASK/EXPECTED OUTCOME/MUST DO/MUST NOT DO/CONTEXT),  Skill 위임 3항목(INTENT/ARGS/RETURN) | Command Pattern |
| 5 | **에스컬레이션** | LOW 티어가 자기 한계 인식 → 상위 티어 위임 | L1→L2→L3 지원 체계 |
| 6 | **install.yaml ↔ setup 스킬 분리** | 데이터(WHAT) / 지시(HOW) / 실행(DO) 3단 분리 | CQRS |
| 7 | **핸드오프 선언** | agentcard.yaml에 `target + when + reason`으로 역할 경계 명시 | Service Contract |
| 8 | **액션 카테고리 추상화** | `file_write` 선언 → runtime-mapping.yaml이 `Write, Edit` 매핑 | Adapter Pattern |
| 9 | **에이전트 패키지 경계 원칙** | AGENT.md(WHY+HOW)와 agentcard.yaml(WHO+WHAT+WHEN)에 동일 정보 중복 금지 | Separation of Concerns |
| 10 | **직결형 경로 (YAGNI)** | Setup/Utility 스킬은 Agent 계층 불필요 → Gateway 직접 접근 | YAGNI (XP) |
| 11 | **프롬프트 조립 순서** | 공통 정적 → 에이전트별 정적 → 동적 순서로 prefix 캐시 적중률 극대화 | Cache Optimization |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 핵심 규칙 체계

### MUST 규칙

| # | 규칙 | 근거 |
|---|------|------|
| 1 | 모든 플러그인은 `.claude-plugin/plugin.json`과 `.claude-plugin/marketplace.json` 포함 | 런타임 인식 진입점 및 배포 메타데이터 |
| 2 | 모든 에이전트는 AGENT.md(프롬프트) + agentcard.yaml(메타데이터) 쌍으로 구성 | 프롬프트/메타데이터 분리 (경계 원칙) |
| 3 | tier는 HEAVY / HIGH / MEDIUM / LOW 중 하나만 사용 | 4-Tier 런타임 매핑 표준 |
| 4 | 위임형 스킬(Core, Planning, Orchestrator)은 라우팅+오케스트레이션만 수행,  작업 실행은 에이전트에 위임. 직결형 스킬(Setup, Utility)은 Gateway 직접 사용 허용 | 관심사 분리 + YAGNI |
| 5 | 추상 선언(tools.yaml)과 구체 매핑(runtime-mapping.yaml) 분리 | Dependency Inversion |
| 6 | setup 스킬과 core 스킬 반드시 포함. 플러그인당 core 스킬 1개 | 설치/라우팅 등록 |
| 7 | AGENT.md에 도구 명세 금지 — tools.yaml에 분리. `{tool:name}` 추상 참조만 허용 | 프롬프트/도구 분리 |
| 8 | 위임형 스킬: 프롬프트 구성 순서를 공통 정적 → 에이전트별 정적 → 동적 순서로 배치 | prefix 캐시 최적화 |

### MUST NOT 규칙

| # | 금지 사항 | 이유 |
|---|----------|------|
| 1 | 스킬이 직접 애플리케이션 코드 작성·수정 (직결형 스킬의 설정 파일·문서 작업은 예외) | 에이전트의 역할 침범 |
| 2 | 에이전트가 직접 라우팅·오케스트레이션 | 스킬의 역할 침범 |
| 3 | AGENT.md에 모델명·도구명 하드코딩 | 런타임 중립성 위반 |
| 4 | agentcard.yaml에 프롬프트 내용 포함 | 기계 판독용 데이터와 프롬프트 혼재 |
| 5 | 일반 플러그인에서 Hook 사용 | 오케스트레이션 플러그인(OMC) 전용 영역 |
| 6 | AGENT.md와 agentcard.yaml에 동일 정보 중복 기술 | WHY+HOW / WHO+WHAT+WHEN 경계 원칙 위반 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 논문 구성안

### 제목 후보

**영문 (Primary):**
> **"Declarative Multi-Agent Orchestration:
> Applying Clean Architecture Principles to LLM Agent Systems
> via Markdown and YAML"**

**영문 (Alternative):**
> **"Beyond Code: A Runtime-Neutral Plugin Architecture
> for LLM Multi-Agent Systems Based on Clean Architecture"**

**한국어:**
> **"선언형 멀티에이전트 오케스트레이션:
> 마크다운과 YAML 기반 Clean Architecture의 LLM 에이전트 시스템 적용"**

### arXiv 카테고리

- **Primary:** `cs.SE` (Software Engineering)
- **Secondary:** `cs.AI` (Artificial Intelligence), `cs.MA` (Multiagent Systems)

### 섹션 구성

| Section | 제목 | 예상 분량 | 핵심 내용 |
|---------|------|----------|----------|
| **Abstract** | — | 250 words | 문제, 접근법, 기여, 결과 요약 |
| **1** | Introduction | 2 pages | LLM 에이전트 오케스트레이션 현황, 문제점, 연구 목적 |
| **2** | Related Work | 2 pages | LangChain, CrewAI, AutoGen, MetaGPT, ChatDev 비교 분석 |
| **3** | Architecture | 3 pages | 5-Layer 구조, 위임형/직결형 경로, 4-Tier 모델, 3계층 활성화 |
| **4** | Design Principles | 2 pages | Loosely Coupling, High Cohesion, DI, YAGNI의 구체적 적용 |
| **5** | Implementation | 3 pages | 5가지 스킬 유형, 에이전트 패키지(AGENT.md + agentcard.yaml + tools.yaml),  위임 표기법, Gateway(install.yaml + runtime-mapping.yaml), 프롬프트 조립 3단계 |
| **6** | Case Study | 2 pages | OMC(39 Skills/35 Agents, 오케스트레이션 플러그인) + Abra(비즈니스 도메인, 일반 플러그인) 실증 |
| **7** | Evaluation | 2 pages | 정량/정성 비교 (진입장벽, 이식성, 확장성, 토큰 효율) |
| **8** | Discussion | 1 page | 한계점, 위협 요소, 향후 연구 방향 |
| **9** | Conclusion | 0.5 page | 기여 요약, 임팩트 |
| | **총계** | **~17 pages** | |

### 섹션별 상세 내용

**Section 1. Introduction**
- LLM 에이전트 시스템의 급성장 (2023~2025)
- 기존 프레임워크의 공통 한계 (코드 종속, 런타임 결합, 역할 혼재)
- 연구 질문: "소프트웨어 공학 원칙을 코드 없이 AI 에이전트에 적용할 수 있는가?"
- 기여 요약 4가지

**Section 2. Related Work**
- LangChain/LangGraph: 도구 체인 → 그래프 기반 워크플로우
- CrewAI: 역할 기반 에이전트 팀
- AutoGen (Microsoft): 대화 프로토콜 기반 멀티에이전트
- MetaGPT: SOP(Standard Operating Procedure) 기반
- ChatDev: 소프트웨어 회사 시뮬레이션
- 공통 한계: 코드 SDK 종속, 런타임 결합, 추상화 부족

**Section 3. Architecture**
- 5-Layer 구조 (Input → Controller+UseCase → Service → Gateway → Runtime)
- **위임형 경로**: Input → Skills(Controller) → Agents(Service) → Gateway → Runtime
- **직결형 경로**: Input → Skills(Controller) → Gateway → Runtime (Service 생략, YAGNI)
- Hooks의 횡단적 개입 (AOP Aspect) — 오케스트레이션 플러그인 전용
- 단방향 호출 흐름: Skills → Agents → Gateway
- 4-Tier 에이전트 모델 (HEAVY/HIGH/MEDIUM/LOW)
- 3계층 활성화 구조 (런타임 상주 파일 → Core 스킬 → 에이전트)

**Section 4. Design Principles**
- Loosely Coupling: 추상 선언 ↔ 구체 매핑 분리
- High Cohesion: 컴포넌트별 단일 책임
- Dependency Inversion: 상위가 추상에 의존, 하위가 구체 제공
- YAGNI: 직결형 스킬에 Agent 위임을 강제하지 않음
- 추가 원칙: 프롬프트 깊이 차등화, 에스컬레이션, 핸드오프, 경계 원칙

**Section 5. Implementation**
- **스킬 5가지 유형**:
  - Core (핵심스킬) — 위임형, 라우팅, 필수, 플러그인당 1개
  - Setup (설정스킬) — 직결형, 설치 마법사, 필수
  - Planning (계획스킬) — 위임형, 전략 계획 수립
  - Orchestrator (지휘자스킬) — 위임형, 워크플로우 조율
  - Utility (유틸리티스킬) — 직결형, 보조 기능
- **에이전트 패키지**: AGENT.md(WHY+HOW) + agentcard.yaml(WHO+WHAT+WHEN) + tools.yaml(추상 도구)
  - AGENT.md: Frontmatter → 목표 → 참조 → 워크플로우 → 출력 형식 → 검증
  - agentcard.yaml: name, version, tier, capabilities(role, identity, restrictions), handoff, escalation
  - tools.yaml: 추상 도구 선언 (name, description, input, output)
  - 경계 원칙: 두 파일에 동일 정보 중복 기술 금지
  - `{tool:name}` 표기법으로 추상 도구 참조
- **위임 표기법**:
  - Agent 위임 5항목: TASK, EXPECTED OUTCOME, MUST DO, MUST NOT DO, CONTEXT
  - Skill 위임 3항목: INTENT, ARGS, RETURN
- **Gateway**: install.yaml(설치 매니페스트) + runtime-mapping.yaml(3영역 매핑)
  - tier_mapping: default + 에이전트별 예외, HEAVY/HIGH/MEDIUM/LOW → model
  - tool_mapping: lsp/mcp/custom 타입만 (builtin 제외)
  - action_mapping: forbidden_actions → 실제 도구 매핑
- **프롬프트 조립 3단계**: 공통 정적 → 에이전트별 정적 → 동적
- **네임스페이스**: 스킬 `{plugin}:{skill-dir-name}`, 에이전트 FQN `{plugin}:{디렉토리명}:{frontmatter-name}`
- **플러그인 디렉토리 구조**:
  ```
  my-plugin/
  ├── .claude-plugin/          # 메타데이터
  │   ├── plugin.json          # 매니페스트
  │   └── marketplace.json     # 배포
  ├── skills/                  # 스킬 (5유형)
  ├── agents/                  # 에이전트 패키지
  ├── gateway/                 # 도구 인프라
  │   ├── install.yaml
  │   └── runtime-mapping.yaml
  ├── commands/                # 슬래시 명령 진입점
  ├── hooks/                   # 이벤트 핸들러 (선택, 오케스트레이션 플러그인 전용)
  └── README.md
  ```

**Section 6. Case Study**
- OMC: 39 Skills, 35 Agents, 4-Tier 모델, Hook 사용 (오케스트레이션 플러그인이므로 Hook 사용 가능)
- Abra: AI Agent 개발 워크플로우 (시나리오→DSL→프로토타입→개발) 사례 (일반 플러그인, Hook 미사용)
- 정량 데이터: 스킬 수, 에이전트 수, 티어별 분포, 핸드오프 패턴

**Section 7. Evaluation**
- 비교 축: 진입장벽, 이식성, 확장성, 토큰 효율, 관심사 분리도
- 정량 비교: 에이전트 정의에 필요한 코드 라인 vs 마크다운 라인
- 정성 비교: 비개발자 접근성, 도메인 적용 범위

**Section 8. Discussion**
- 한계점: LLM 런타임의 프롬프트 해석 정확도 의존
- 위협 요소: 선언만으로는 복잡한 로직 표현에 한계
- 향후 연구: 런타임 자동 매핑, 표준화 기구 제안, 벤치마크 구축

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 발표 채널 제안

| 채널 | 유형 | 특징 | 적합도 | 비고 |
|------|------|------|:------:|------|
| **arXiv (cs.SE + cs.AI)** | 프리프린트 | 사전 심사 없이 빠른 공개, 인용 가능 | ★★★★★ | 1차 목표 |
| **ACM SIGSOFT (ICSE/FSE)** | 학회 | 소프트웨어 공학 최고 학회 | ★★★★☆ | 장기 목표 |
| **AAAI Workshop** | 워크숍 | AI 에이전트 워크숍 트랙 | ★★★★☆ | 피드백 수집 |
| **NeurIPS Workshop** | 워크숍 | LLM Agents 워크숍 | ★★★★☆ | 커뮤니티 반응 |
| **IEEE Software** | 저널 | 실무 소프트웨어 공학 저널 | ★★★☆☆ | 확장 버전 |
| **Medium / Dev.to** | 블로그 | 기술 블로그로 반응 테스트 | ★★★☆☆ | 선행 공개용 |
| **한국정보과학회** | 국내 학회 | 한국어 논문 발표 | ★★★☆☆ | 국내 확산 |

**추천 전략:**
1. **Medium/Dev.to**에 핵심 아이디어 블로그 포스트 → 반응 테스트
2. **arXiv**에 정식 논문 업로드 → 학술적 인용 기반 확보
3. **AAAI/NeurIPS Workshop**에 short paper 투고 → 피드백 수집
4. 피드백 반영 후 **ICSE/FSE**에 full paper 투고 → 최종 목표

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 실증 사례

### OMC (Oh-My-ClaudeCode) 플러그인

오케스트레이션 전문 플러그인으로, 본 표준의 원천 사례.
**오케스트레이션 플러그인이므로 Hook 사용이 허용됨** (일반 플러그인에서는 Hook 사용 금지).

| 항목 | 수치 |
|------|------|
| Skills | 39개 (5가지 유형: Core, Setup, Planning, Orchestrator, Utility) |
| Agents | 35개 (12개 도메인 × 4-Tier: HEAVY/HIGH/MEDIUM/LOW) |
| Hook 이벤트 | 8종 (UserPromptSubmit, SessionStart 등) — 오케스트레이션 플러그인 전용 |
| MCP Tools | 15개 (LSP 12 + AST 2 + REPL 1) |
| Gateway 매핑 | tier_mapping + tool_mapping(lsp/mcp/custom) + action_mapping |

### Abra 플러그인

비즈니스 도메인(AI Agent 개발 워크플로우) 적용 사례.
**일반 플러그인이므로 Hook 미사용.**

| 항목 | 내용 |
|------|------|
| 도메인 | AI Agent 개발 파이프라인 |
| Skills | setup(설정), core(핵심), scenario(계획), dsl-generate(지휘자),  prototype(지휘자), dev-plan(계획), develop(지휘자), orchestrate(지휘자) |
| Agents | scenario-analyst, dsl-architect, agent-developer, plan-writer, prototype-runner |
| 에이전트 패키지 | 각 에이전트: AGENT.md + agentcard.yaml + tools.yaml |
| 워크플로우 | 시나리오 정의 → DSL 생성 → 프로토타이핑 → 개발계획 → 코드 개발 |
| Gateway | install.yaml + runtime-mapping.yaml (tier_mapping + tool_mapping + action_mapping) |
| 네임스페이스 | `abra:{skill-name}` (스킬), `abra:{agent}:{agent}` (에이전트 FQN) |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 평가 프레임워크 (Evaluation)

논문에서 사용할 비교 평가 기준:

| 평가 축 | 측정 방법 | 비교 대상 |
|---------|----------|----------|
| **진입 장벽** | 첫 에이전트 정의까지 필요한 단계 수, 필요 기술 스택 | LangChain, CrewAI, AutoGen |
| **이식성** | 다른 런타임으로 이식 시 변경 필요한 파일 수 | 전체 재작성 vs runtime-mapping.yaml만 변경 |
| **확장성** | 새 에이전트/스킬 추가 시 기존 코드 변경 필요 여부 | Open-Closed Principle 준수도 |
| **관심사 분리도** | 컴포넌트 간 의존 방향 수, 순환 의존 유무 | Coupling 지표 |
| **토큰 효율** | 동일 작업 수행 시 소비 토큰 비교 | 4-Tier 라우팅 + 프롬프트 조립 캐시 효과 |
| **도메인 범용성** | 적용 가능 도메인 수 (코드, 교육, 문서, 비즈니스) | 프레임워크별 사례 수 |
| **선언 밀도** | 에이전트 하나 정의에 필요한 라인 수 (코드 vs 선언) | LoC 비교 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 작성 로드맵

| 단계 | 산출물 | 내용 |
|------|--------|------|
| **1단계** | 본 제안서 | 논문 구조, 핵심 기여, 비교 프레임워크 정의 (현재 문서) |
| **2단계** | 한국어 초안 | 전체 섹션 한국어로 작성 (~17 pages) |
| **3단계** | 영문 번역 | arXiv 투고용 영문 변환 |
| **4단계** | 리뷰 | 내부 검토 및 피드백 반영 |
| **5단계** | 투고 | arXiv 업로드 + 블로그 선행 공개 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)
