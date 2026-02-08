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
    - [3-Tier 에이전트 모델](#3-tier-에이전트-모델)
    - [3계층 활성화 구조](#3계층-활성화-구조)
    - [Gateway의 추상-구체 분리](#gateway의-추상-구체-분리)
  - [인상 깊은 설계 포인트](#인상-깊은-설계-포인트)
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
| **추상화 부족** | 도구, 모델, 예산이 코드에 하드코딩 | 환경 변경 시 코드 수정 필요 |
| **도메인 한정** | 대부분 코드 생성/데이터 분석에 특화 | 교육, 문서화, 비즈니스 워크플로우 적용 어려움 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 핵심 기여 (Contribution)

본 연구의 핵심 기여는 다음 4가지임:

1. **선언형 에이전트 아키텍처 표준 제안**
   마크다운(프롬프트)과 YAML(설정)만으로 멀티에이전트 시스템을 정의하는
   범용 플러그인 표준을 제안함.
   코드 작성 없이 에이전트의 역할, 역량, 제약, 핸드오프를 선언적으로 명세함.

2. **Clean Architecture의 AI 에이전트 시스템 이식**
   소프트웨어 공학에서 검증된 Loosely Coupling, High Cohesion,
   Dependency Inversion 원칙을 LLM 에이전트 오케스트레이션에 체계적으로 적용함.
   Skills(Controller+UseCase) → Agents(Service) → Gateway(Infrastructure)의
   단방향 의존 흐름을 구현함.

3. **런타임 중립적 추상 계층 설계**
   `tier: HIGH/MEDIUM/LOW`, `forbidden_actions`, `tools.yaml` 등
   추상 선언과 `runtime-mapping.yaml`의 구체 매핑을 분리하여
   Claude Code, Codex CLI, Gemini CLI 등 어떤 런타임에서도
   동일한 플러그인이 동작하는 이식성을 확보함.

4. **실증적 검증**
   OMC 플러그인(39 Skills, 35 Agents)과 Abra 플러그인(비즈니스 도메인)의
   실제 운용 사례를 통해 표준의 실효성을 검증함.

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 기존 프레임워크와의 차별성

### 비교 요약

| 비교 항목 | LangChain/LangGraph | CrewAI | AutoGen | MetaGPT | **본 연구 (Plugin Standard)** |
|-----------|:-------------------:|:------:|:-------:|:-------:|:----------------------------:|
| **에이전트 정의 방식** | Python 코드 | Python 코드 | Python 코드 | Python 코드 | **Markdown + YAML** |
| **오케스트레이션** | 그래프 코드 | 순차/계층 코드 | 대화 프로토콜 | SOP 코드 | **스킬 프롬프트** |
| **런타임 종속성** | LangChain SDK | CrewAI SDK | AutoGen SDK | MetaGPT SDK | **런타임 중립** |
| **아키텍처 원칙** | 없음 (도구 체인) | 역할 기반 | 대화 기반 | SOP 기반 | **Clean Architecture** |
| **도구 추상화** | Tool 클래스 | Tool 데코레이터 | Function call | Tool 클래스 | **추상 선언 + 매핑** |
| **티어/예산 관리** | 없음 | 없음 | 없음 | 없음 | **3-Tier + budget.yaml** |
| **핸드오프/에스컬레이션** | 없음 | 위임 키워드 | 없음 | 없음 | **config.yaml 선언** |
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
| **도구 연결** | 코드에서 도구 객체 생성 | YAML에서 추상 인터페이스 선언 |
| **역할 제약** | if문으로 분기 | forbidden_actions 블랙리스트 |
| **모델 선택** | 코드에서 모델명 하드코딩 | tier 선언 → 런타임이 해석 |
| **워크플로우** | 함수 호출 체인 | 프롬프트에 자연어로 기술 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 아키텍처 분석

### Clean Architecture 3대 원칙의 적용

| 원칙 | 전통적 소프트웨어 | 본 연구의 적용 | 구현 메커니즘 |
|------|-----------------|---------------|-------------|
| **Loosely Coupling** | 인터페이스를 통한 의존성 분리 | 추상 선언(config/tools.yaml) ↔ 구체 구현(runtime-mapping.yaml) | 에이전트는 `file_read` 선언 → 런타임이 `Read` 도구로 매핑 |
| **High Cohesion** | 클래스가 단일 책임에 집중 | Skills=라우팅, Agents=실행, Gateway=도구 | 각 컴포넌트가 자기 역할에만 집중 |
| **Dependency Inversion** | 상위 모듈이 추상에 의존 | 상위(Skills/Agents)가 추상에 의존, 하위(Gateway/Runtime)가 구체 제공 | `tier: HIGH` → 런타임이 모델로 해석 |

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
│  ├── 역량/제약 선언 (config.yaml)            │
│  └── 3-Tier 변형 (HIGH/MEDIUM/LOW)          │
├─────────────────────────────────────────────┤
│  Gateway (도구 인프라)                        │
│  ├── runtime-mapping.yaml (추상→구체 변환)    │
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

### 3-Tier 에이전트 모델

동일 역할을 비용-역량 트레이드오프에 따라 티어별로 분리하는 범용 원칙:

| 티어 | 특성 | LLM 예시 | 클라우드 예시 | 고객지원 예시 |
|------|------|----------|-------------|-------------|
| **LOW** | 빠르고 저비용 | Haiku | t2.micro | L1 스크립트 응대 |
| **MEDIUM** | 균형 | Sonnet | m5.large | L2 전문가 |
| **HIGH** | 최고 역량 | Opus | p3.xlarge | L3 엔지니어 |

핵심 메커니즘:
- **에스컬레이션**: LOW가 자기 한계 인식 → 상위 티어로 보고
- **상속**: 티어 변형 에이전트가 기본 에이전트의 config를 상속, 오버라이드만 기술
- **런타임 매핑**: `tier: HIGH` → `runtime-mapping.yaml`이 실제 모델로 변환

### 3계층 활성화 구조

스킬 활성화의 순환 의존 문제를 해결하는 구조:

```
CLAUDE.md (항상 로드)
  └── 라우팅 테이블: "이 요청은 어떤 플러그인의 어떤 스킬?"
       │
       ▼
핵심 스킬 (조건 매칭 시 로드)
  └── 오케스트레이션: runtime-mapping.yaml 참조, 에이전트 스폰
       │
       ▼
에이전트 (위임받아 실행)
  └── 자율적 작업 수행, 결과 반환
```

**해결하는 문제:**
활성화 조건이 스킬 안에만 있으면, 스킬을 로드하려면 조건을 알아야 하는 순환 문제 발생.
CLAUDE.md에 라우팅을 분리하여 이 문제를 해결함.

### Gateway의 추상-구체 분리

```
Plugin Layer (추상)              Gateway (구체)
─────────────────────           ─────────────────────
config.yaml                     runtime-mapping.yaml
  tier: HIGH          ──매핑──→   HIGH: claude-opus-4-6
  forbidden: file_write ──매핑──→   file_write: [Write, Edit]

tools.yaml                      runtime-mapping.yaml
  code_search         ──매핑──→   lsp: lsp_workspace_symbols
  code_diagnostics    ──매핑──→   lsp: lsp_diagnostics

budget.yaml                     Runtime
  max_tokens: 8192    ──적용──→   에이전트 실행 시 예산 제한
```

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 인상 깊은 설계 포인트

| # | 포인트 | 설명 | 소프트웨어 공학 대응 개념 |
|---|--------|------|------------------------|
| 1 | **런타임 중립성** | `tier: HIGH`라는 추상 선언으로 LLM, 클라우드, 인력 등 도메인 무관 적용 | Dependency Inversion Principle |
| 2 | **3계층 활성화** | CLAUDE.md(라우팅) → 핵심 스킬(오케스트레이션) → 에이전트(실행)의 순환 의존 해결 | Layered Architecture |
| 3 | **프롬프트 깊이 차등화** | 스킬은 WHAT만, 에이전트는 HOW를 자율 결정 | Interface Segregation / 자율 팀 |
| 4 | **에스컬레이션** | LOW 티어가 자기 한계 인식 → 상위 티어 위임 | L1→L2→L3 지원 체계 |
| 5 | **install.yaml ↔ setup 스킬 분리** | 데이터(WHAT) / 지시(HOW) / 실행(DO) 3단 분리 | Command Pattern / CQRS |
| 6 | **핸드오프 선언** | config.yaml에 `target + when + reason`으로 역할 경계 명시 | Service Contract |
| 7 | **액션 카테고리 추상화** | `file_write` 선언 → 런타임이 `Write, Edit` 매핑 | Adapter Pattern |

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
| **3** | Architecture | 3 pages | 5-Layer 구조, 컴포넌트별 역할, 단방향 의존 흐름 |
| **4** | Design Principles | 2 pages | Loosely Coupling, High Cohesion, DI의 구체적 적용 |
| **5** | Implementation | 2 pages | 플러그인 표준 명세 (SKILL.md, AGENT.md, config.yaml, Gateway) |
| **6** | Case Study | 2 pages | OMC(39 Skills/35 Agents) + Abra(비즈니스 도메인) 실증 |
| **7** | Evaluation | 2 pages | 정량/정성 비교 (진입장벽, 이식성, 확장성, 토큰 효율) |
| **8** | Discussion | 1 page | 한계점, 위협 요소, 향후 연구 방향 |
| **9** | Conclusion | 0.5 page | 기여 요약, 임팩트 |
| | **총계** | **~16 pages** | |

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
- Skills의 이중 역할 (Controller + UseCase 겸임)
- Hooks의 횡단적 개입 (AOP Aspect)
- 단방향 호출 흐름: Skills → Agents → Gateway

**Section 4. Design Principles**
- Loosely Coupling: 추상 선언 ↔ 구체 매핑 분리
- High Cohesion: 컴포넌트별 단일 책임
- Dependency Inversion: 상위가 추상에 의존, 하위가 구체 제공
- 추가 원칙: 프롬프트 깊이 차등화, 에스컬레이션, 핸드오프

**Section 5. Implementation**
- SKILL.md: 7가지 유형 (Core, Setup, Planning, Orchestrator, Executor, Supervisor, Utility)
- AGENT.md + config.yaml: 프롬프트와 메타데이터 분리
- tools.yaml + budget.yaml: 도구와 예산의 선언적 명세
- Gateway: install.yaml + runtime-mapping.yaml

**Section 6. Case Study**
- OMC: 39 Skills, 35 Agents, 3-Tier 모델 운용 사례
- Abra: AI Agent 개발 워크플로우 (시나리오→DSL→프로토타입→개발) 사례
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

오케스트레이션 전문 플러그인으로, 본 표준의 원천 사례:

| 항목 | 수치 |
|------|------|
| Skills | 39개 (7가지 유형 전체 포함) |
| Agents | 35개 (12개 도메인 × 3 티어) |
| Hook 이벤트 | 8종 (UserPromptSubmit, SessionStart 등) |
| MCP Tools | 15개 (LSP 11 + AST 2 + REPL 1 + Session 1) |
| Gateway 도구 유형 | 7종 (File, Shell, Web, MCP, Language, Bridge, Custom) |

### Abra 플러그인

비즈니스 도메인(AI Agent 개발 워크플로우) 적용 사례:

| 항목 | 내용 |
|------|------|
| 도메인 | AI Agent 개발 파이프라인 |
| Skills | scenario, dsl-generate, prototype, dev-plan, develop, orchestrate, setup |
| Agents | scenario-analyst, dsl-architect, agent-developer, plan-writer, prototype-runner |
| 워크플로우 | 시나리오 정의 → DSL 생성 → 프로토타이핑 → 개발계획 → 코드 개발 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 평가 프레임워크 (Evaluation)

논문에서 사용할 비교 평가 기준:

| 평가 축 | 측정 방법 | 비교 대상 |
|---------|----------|----------|
| **진입 장벽** | 첫 에이전트 정의까지 필요한 단계 수, 필요 기술 스택 | LangChain, CrewAI, AutoGen |
| **이식성** | 다른 런타임으로 이식 시 변경 필요한 파일 수 | 전체 재작성 vs config만 변경 |
| **확장성** | 새 에이전트/스킬 추가 시 기존 코드 변경 필요 여부 | Open-Closed Principle 준수도 |
| **관심사 분리도** | 컴포넌트 간 의존 방향 수, 순환 의존 유무 | Coupling 지표 |
| **토큰 효율** | 동일 작업 수행 시 소비 토큰 비교 | 3-Tier 라우팅 효과 |
| **도메인 범용성** | 적용 가능 도메인 수 (코드, 교육, 문서, 비즈니스) | 프레임워크별 사례 수 |
| **선언 밀도** | 에이전트 하나 정의에 필요한 라인 수 (코드 vs 선언) | LoC 비교 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)

---

## 작성 로드맵

| 단계 | 산출물 | 내용 |
|------|--------|------|
| **1단계** | 본 제안서 | 논문 구조, 핵심 기여, 비교 프레임워크 정의 (현재 문서) |
| **2단계** | 한국어 초안 | 전체 섹션 한국어로 작성 (~16 pages) |
| **3단계** | 영문 번역 | arXiv 투고용 영문 변환 |
| **4단계** | 리뷰 | 내부 검토 및 피드백 반영 |
| **5단계** | 투고 | arXiv 업로드 + 블로그 선행 공개 |

[Top](#선언형-멀티에이전트-오케스트레이션-논문-제안서)
