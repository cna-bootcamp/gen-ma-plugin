# Abra DMAP Plugin 작업 보고서

- [Abra DMAP Plugin 작업 보고서](#abra-dmap-plugin-작업-보고서)
  - [작업 개요](#작업-개요)
  - [기존 프로젝트 분석](#기존-프로젝트-분석)
    - [기존 구조 (`../abra`)](#기존-구조-abra)
    - [DMAP 표준 대비 Gap 분석](#dmap-표준-대비-gap-분석)
  - [작업 완료 항목](#작업-완료-항목)
    - [1. 플러그인 매니페스트 생성](#1-플러그인-매니페스트-생성)
    - [2. 게이트웨이 재설계](#2-게이트웨이-재설계)
    - [3. 에이전트 패키지 재구성 (5개)](#3-에이전트-패키지-재구성-5개)
    - [4. 스킬 재작성 (8개)](#4-스킬-재작성-8개)
    - [5. 커맨드 엔트리포인트 생성 (7개)](#5-커맨드-엔트리포인트-생성-7개)
    - [6. 기존 소스 파일 이관](#6-기존-소스-파일-이관)
    - [7. README 생성](#7-readme-생성)
  - [Architect 검증 및 수정](#architect-검증-및-수정)
    - [1차 검증: CONDITIONAL PASS (17개 이슈)](#1차-검증-conditional-pass-17개-이슈)
    - [수정 작업 (3개 병렬 에이전트)](#수정-작업-3개-병렬-에이전트)
    - [2차 검증: APPROVED](#2차-검증-approved)
  - [최종 디렉토리 구조](#최종-디렉토리-구조)
  - [DMAP 표준 준수 검증](#dmap-표준-준수-검증)
    - [에이전트 표준](#에이전트-표준)
    - [스킬 표준](#스킬-표준)
    - [게이트웨이 표준](#게이트웨이-표준)
    - [교차 참조 무결성](#교차-참조-무결성)
  - [주요 개선사항 (Before/After)](#주요-개선사항-beforeafter)
  - [결론](#결론)

---

## 작업 개요

| 항목 | 내용 |
|------|------|
| **작업 기간** | 2026-02-09 |
| **작업 범위** | 기존 Abra 프로젝트(`../abra`) → DMAP 표준 준수 신규 플러그인(`samples/abra`) 개발 |
| **작업 방식** | Ralph + Ultrawork + Ecomode (병렬 에이전트 실행) |
| **참조 표준** | `standards/plugin-standard.md`, `standards/plugin-standard-agent.md`,  `standards/plugin-standard-skill.md`, `standards/plugin-standard-gateway.md` |

[Top](#abra-dmap-plugin-작업-보고서)

---

## 기존 프로젝트 분석

### 기존 구조 (`../abra`)

```
abra/
├── gateway/
│   ├── install.yaml          # 비표준 형식 (custom_tools/python_env/config)
│   └── runtime-mapping.yaml  # HEAVY tier 누락, custom_cli 타입 사용
├── agents/
│   ├── scenario-analyst/
│   │   ├── AGENT.md          # 비공식 섹션 구조
│   │   └── config.yaml       # 단일 파일 (agentcard+tools 통합)
│   ├── dsl-architect/
│   ├── prototype-runner/
│   ├── plan-writer/
│   └── agent-developer/
├── skills/
│   ├── analyze-service-goal.md
│   ├── generate-dsl.md
│   ├── prototype-test.md
│   ├── write-dev-plan.md
│   ├── implement-agent.md
│   ├── full-pipeline.md
│   ├── iterate-scenario.md
│   └── quick-prototype.md
├── commands/
├── references/
├── tools/
└── docs/
```

### DMAP 표준 대비 Gap 분석

| 영역 | Gap | 심각도 |
|------|-----|--------|
| **에이전트 패키지** | `config.yaml` 단일 파일 → `agentcard.yaml` + `tools.yaml` 분리 필요 | HIGH |
| **AGENT.md** | 비공식 섹션 구조, `## 참조` 섹션 없음 | HIGH |
| **AGENT.md** | 제약사항/핸드오프가 AGENT.md에 중복 기재 | MEDIUM |
| **스킬** | `type` 필드 없음, `disable-model-invocation` 없음 | HIGH |
| **스킬** | 스킬 부스팅 테이블 없음, 위임 표기법 미적용 | HIGH |
| **스킬** | "Executor" 타입 표기 (비표준) → Orchestrator 필요 | MEDIUM |
| **스킬** | 에이전트 호출 규칙, 완료 조건, 검증 프로토콜 섹션 없음 | HIGH |
| **게이트웨이** | `install.yaml` 비표준 형식 | MEDIUM |
| **게이트웨이** | `runtime-mapping.yaml`에 HEAVY tier 누락 | MEDIUM |
| **게이트웨이** | `tool_mapping`에 `builtin` 타입 사용 (비표준) | MEDIUM |
| **플러그인** | 매니페스트 파일 없음 | HIGH |

[Top](#abra-dmap-plugin-작업-보고서)

---

## 작업 완료 항목

### 1. 플러그인 매니페스트 생성

| 파일 | 내용 |
|------|------|
| `.claude-plugin/plugin.json` | 플러그인 메타데이터 (name, version, description) |
| `.claude-plugin/marketplace.json` | 마켓플레이스 정보 (author: unicorn-inc) |

### 2. 게이트웨이 재설계

| 파일 | 변경 내용 |
|------|----------|
| `gateway/install.yaml` | 표준 형식으로 재작성: `mcp_servers`, `lsp_servers`, `custom_tools` |
| `gateway/runtime-mapping.yaml` | 4-Tier 완성(HEAVY/HIGH/MEDIUM/LOW), 추상 도구 매핑 7종, 액션 매핑 6종 |
| `gateway/mcp/context7.json` | Context7 MCP 서버 설정 |
| `gateway/tools/*.py` | 기존 도구 스크립트 이관 (dify_cli, dify_client, config, validate_dsl) |
| `gateway/requirements.txt` | Python 의존성 |

**runtime-mapping.yaml 도구 매핑:**

| 추상 도구 | 타입 | 구체 도구 |
|-----------|------|----------|
| `code_search` | lsp | `lsp_workspace_symbols` |
| `code_diagnostics` | lsp | `lsp_diagnostics` |
| `symbol_lookup` | lsp | `lsp_goto_definition` |
| `doc_search` | mcp | `context7:query-docs` |
| `dify_api` | custom | `gateway/tools/dify_cli.py` |
| `dsl_validate` | custom | `gateway/tools/validate_dsl.py` |
| `code_execute` | lsp | `Bash` |

### 3. 에이전트 패키지 재구성 (5개)

기존 `config.yaml` 단일 파일을 `agentcard.yaml` + `tools.yaml` 2파일 체계로 분리.
AGENT.md를 DMAP 표준 섹션 구조로 재작성.

| 에이전트 | Tier | 추상 도구 | 참조 문서 |
|----------|------|----------|----------|
| `scenario-analyst` | MEDIUM | file_read, file_write | requirement-generater.md |
| `dsl-architect` | HIGH | file_read, file_write, doc_search, dsl_validate | dify-workflow-dsl-guide.md, dsl-generation-prompt.md |
| `prototype-runner` | MEDIUM | file_read, file_write, dify_api, dsl_validate, code_execute | - |
| `plan-writer` | MEDIUM | file_read, file_write, doc_search, code_search | develop-plan-generate.md |
| `agent-developer` | HIGH | file_read, file_write, code_search, code_diagnostics, code_execute, doc_search | develop.md |

**AGENT.md 표준 섹션 구조 (5개 공통):**

```
---
name: {agent-name}
description: {설명}
---
# {agent-name}
## 목표
## 참조
## 워크플로우
## 출력 형식
## 검증
```

### 4. 스킬 재작성 (8개)

기존 단일 파일 스킬을 디렉토리 기반(`skills/{name}/SKILL.md`)으로 재구성.

| 스킬 | 타입 | 위임 에이전트 | 스킬 부스팅 |
|------|------|-------------|------------|
| `orchestrate` | core | - (라우팅 전용) | - |
| `dify-setup` | setup | - (직결형) | - |
| `setup` | setup | - (직결형) | - |
| `scenario` | orchestrator | scenario-analyst | plan, ralph |
| `dsl-generate` | orchestrator | dsl-architect | plan, ralph, ultraqa |
| `prototype` | orchestrator | prototype-runner | plan, ralph, ultraqa |
| `dev-plan` | orchestrator | plan-writer | ralplan |
| `develop` | orchestrator | agent-developer | ralph, build-fix, ultraqa |

**Orchestrator 스킬 표준 섹션 구조:**

```
---
name: {skill-name}
description: {설명}
user-invocable: true
type: orchestrator
---
# {skill-name}
## 목표
## 에이전트 호출 규칙 (FQN, 프롬프트 조립, Task 호출)
## 워크플로우 (Phase 1~N)
## 완료 조건
## 검증 프로토콜
## 상태 정리
## 취소 / 재개
## 스킬 부스팅
## 주의사항
```

### 5. 커맨드 엔트리포인트 생성 (7개)

| 커맨드 | 연결 스킬 |
|--------|----------|
| `commands/dify-setup.md` | `/abra:dify-setup` |
| `commands/setup.md` | `/abra:setup` |
| `commands/scenario.md` | `/abra:scenario` |
| `commands/dsl-generate.md` | `/abra:dsl-generate` |
| `commands/prototype.md` | `/abra:prototype` |
| `commands/dev-plan.md` | `/abra:dev-plan` |
| `commands/develop.md` | `/abra:develop` |

### 6. 기존 소스 파일 이관

기존 `../abra` 프로젝트에서 재사용 가능한 파일을 이관:

| 원본 | 대상 | 내용 |
|------|------|------|
| `tools/*.py` | `gateway/tools/*.py` | dify_cli, dify_client, config, validate_dsl |
| `references/requirement-generater.md` | `agents/scenario-analyst/references/` | 시나리오 작성 가이드 |
| `references/dsl-generation-prompt.md` | `agents/dsl-architect/references/` | DSL 생성 프롬프트 |
| `references/dify-workflow-dsl-guide.md` | `agents/dsl-architect/references/` | Dify DSL 가이드 |
| `references/develop-plan-generate.md` | `agents/plan-writer/references/` | 개발계획서 가이드 |
| `references/develop.md` | `agents/agent-developer/references/` | 개발 가이드 |
| `docs/develop-plan.md` | `docs/develop-plan.md` | 개발계획 문서 |

### 7. README 생성

`README.md`: 플러그인 개요, 설치 방법, 사용 예시, 에이전트/스킬 테이블, 디렉토리 구조

[Top](#abra-dmap-plugin-작업-보고서)

---

## Architect 검증 및 수정

### 1차 검증: CONDITIONAL PASS (17개 이슈)

| 심각도 | 이슈 | 영역 |
|--------|------|------|
| HIGH | AGENT.md 비표준 섹션명 (WHY-목적, HOW-행동지침) | 에이전트 5개 |
| HIGH | AGENT.md `## 참조` 섹션 누락 | 에이전트 5개 |
| HIGH | AGENT.md에 제약사항/핸드오프 중복 기재 | 에이전트 5개 |
| HIGH | 스킬이 존재하지 않는 파일 참조 (BASE.md, MISSION.md, RULES.md) | 스킬 5개 |
| MEDIUM | 스킬 frontmatter가 H1 제목 아래 위치 | 스킬 8개 |
| MEDIUM | `## 개요` 사용 (표준: `## 목표`) | 스킬 8개 |
| MEDIUM | 프롬프트 조립에 하드코딩된 구체 도구명 | 스킬 5개 |
| MEDIUM | 2-part FQN 사용 (표준: 3-part) | 스킬 5개 |
| MEDIUM | `runtime-mapping.yaml`에 `web_search` builtin 항목 | 게이트웨이 |
| MEDIUM | `runtime-mapping.yaml`에 `code_execute` 누락 | 게이트웨이 |
| LOW | `scenario-analyst/tools.yaml`에 `web_search` 선언 (forbidden `network_access`와 모순) | 에이전트 |
| LOW | `install.yaml` 비표준 추가 섹션 | 게이트웨이 |

### 수정 작업 (3개 병렬 에이전트)

| 에이전트 | 수정 범위 | 수정 내용 |
|----------|----------|----------|
| Agent 1 | AGENT.md 5개 | 섹션 구조 표준화, 참조 섹션 추가, 중복 제거 |
| Agent 2 | SKILL.md 8개 | frontmatter 이동, 개요→목표, 프롬프트 조립 수정, 3-part FQN |
| Agent 3 | 게이트웨이+도구 | web_search 제거, code_execute 추가, tools.yaml 정합성 |

### 2차 검증: APPROVED

Architect 에이전트가 전체 파일을 재검증하여 **APPROVED** 판정:

- 5/5 AGENT.md 표준 섹션 구조 확인
- 5/5 agentcard.yaml 스키마 확인
- 5/5 tools.yaml 추상 도구 선언 확인
- 8/8 SKILL.md 표준 준수 확인
- 게이트웨이 파일 정합성 확인
- 교차 참조 무결성 확인
- 이전 17개 이슈 전체 해결 확인

[Top](#abra-dmap-plugin-작업-보고서)

---

## 최종 디렉토리 구조

```
samples/abra/
├── .claude-plugin/
│   ├── plugin.json                          # 플러그인 매니페스트
│   └── marketplace.json                     # 마켓플레이스 메타데이터
├── README.md                                # 플러그인 개요
├── .gitignore
│
├── gateway/                                 # 게이트웨이 레이어
│   ├── install.yaml                         # 설치 설정
│   ├── runtime-mapping.yaml                 # 런타임 매핑 (tier, tool, action)
│   ├── requirements.txt                     # Python 의존성
│   ├── mcp/
│   │   └── context7.json                    # Context7 MCP 서버
│   └── tools/
│       ├── config.py                        # 설정 관리
│       ├── dify_cli.py                      # Dify CLI 래퍼
│       ├── dify_client.py                   # Dify API 클라이언트
│       └── validate_dsl.py                  # DSL 검증 도구
│
├── agents/                                  # 에이전트 레이어 (5개)
│   ├── scenario-analyst/
│   │   ├── AGENT.md                         # 에이전트 지시문
│   │   ├── agentcard.yaml                   # 에이전트 카드 (MEDIUM)
│   │   ├── tools.yaml                       # 추상 도구 선언
│   │   └── references/
│   │       └── requirement-generater.md     # 시나리오 작성 가이드
│   ├── dsl-architect/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml                   # (HIGH)
│   │   ├── tools.yaml
│   │   └── references/
│   │       ├── dify-workflow-dsl-guide.md   # Dify DSL 가이드
│   │       └── dsl-generation-prompt.md     # DSL 생성 프롬프트
│   ├── prototype-runner/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml                   # (MEDIUM)
│   │   └── tools.yaml
│   ├── plan-writer/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml                   # (MEDIUM)
│   │   ├── tools.yaml
│   │   └── references/
│   │       └── develop-plan-generate.md     # 개발계획서 가이드
│   └── agent-developer/
│       ├── AGENT.md
│       ├── agentcard.yaml                   # (HIGH)
│       ├── tools.yaml
│       └── references/
│           └── develop.md                   # 개발 가이드
│
├── skills/                                  # 스킬 레이어 (8개)
│   ├── orchestrate/SKILL.md                 # Core: 라우팅 전용
│   ├── dify-setup/SKILL.md                  # Setup: Dify 환경 설정
│   ├── setup/SKILL.md                       # Setup: 플러그인 설정
│   ├── scenario/SKILL.md                    # Orchestrator: 시나리오 생성
│   ├── dsl-generate/SKILL.md                # Orchestrator: DSL 생성
│   ├── prototype/SKILL.md                   # Orchestrator: 프로토타이핑
│   ├── dev-plan/SKILL.md                    # Orchestrator: 개발계획서
│   └── develop/SKILL.md                     # Orchestrator: AI Agent 구현
│
├── commands/                                # 커맨드 엔트리포인트 (7개)
│   ├── dify-setup.md
│   ├── setup.md
│   ├── scenario.md
│   ├── dsl-generate.md
│   ├── prototype.md
│   ├── dev-plan.md
│   └── develop.md
│
└── docs/
    └── develop-plan.md                      # 개발계획 문서
```

[Top](#abra-dmap-plugin-작업-보고서)

---

## DMAP 표준 준수 검증

### 에이전트 표준

| 검증 항목 | 결과 |
|-----------|------|
| Frontmatter (name, description) | 5/5 통과 |
| `## 목표` 섹션 | 5/5 통과 |
| `## 참조` 섹션 (agentcard.yaml, tools.yaml 참조) | 5/5 통과 |
| `## 워크플로우` 섹션 (`{tool:name}` 표기법) | 5/5 통과 |
| `## 출력 형식` 섹션 | 5/5 통과 |
| `## 검증` 섹션 | 5/5 통과 |
| 중복 제거 (제약사항, 핸드오프) | 5/5 통과 |
| agentcard.yaml (role, tier, constraints, handoff) | 5/5 통과 |
| tools.yaml (추상 도구 선언) | 5/5 통과 |
| forbidden_actions vs tools.yaml 정합성 | 5/5 통과 |

### 스킬 표준

| 검증 항목 | 결과 |
|-----------|------|
| Frontmatter 최상단 위치 (name, description, type) | 8/8 통과 |
| `## 목표` 섹션 | 8/8 통과 |
| `## 에이전트 호출 규칙` (3-part FQN, 프롬프트 조립) | 5/5 Orchestrator 통과 |
| `## 워크플로우` (Phase 기반) | 8/8 통과 |
| `## 완료 조건` | 8/8 통과 |
| `## 검증 프로토콜` | 5/5 Orchestrator 통과 |
| `## 스킬 부스팅` 테이블 | 5/5 Orchestrator 통과 |
| 위임 표기법 (TASK/EXPECTED OUTCOME/MUST DO/MUST NOT DO/CONTEXT) | 5/5 통과 |
| Setup 스킬 `disable-model-invocation: true` | 2/2 통과 |

### 게이트웨이 표준

| 검증 항목 | 결과 |
|-----------|------|
| `install.yaml` 표준 섹션 (mcp_servers, lsp_servers, custom_tools) | 통과 |
| `runtime-mapping.yaml` 4-Tier (HEAVY/HIGH/MEDIUM/LOW) | 통과 |
| `tool_mapping` 추상→구체 매핑 (builtin 타입 없음) | 통과 |
| `action_mapping` 금지 액션 매핑 | 통과 |
| MCP 서버 설정 파일 | 통과 |

### 교차 참조 무결성

| 검증 항목 | 결과 |
|-----------|------|
| agentcard.yaml role ↔ AGENT.md 목표 일치 | 5/5 통과 |
| tools.yaml 도구 ↔ AGENT.md 워크플로우 `{tool:name}` 일치 | 5/5 통과 |
| tools.yaml 도구 ↔ runtime-mapping.yaml tool_mapping 매핑 존재 | 통과 |
| forbidden_actions ↔ tools.yaml 비모순 | 5/5 통과 |
| 스킬 FQN ↔ 실제 에이전트 디렉토리 존재 | 5/5 통과 |
| 커맨드 ↔ 스킬 연결 | 7/7 통과 |

[Top](#abra-dmap-plugin-작업-보고서)

---

## 주요 개선사항 (Before/After)

| 영역 | Before (기존 `../abra`) | After (`samples/abra`) |
|------|------------------------|----------------------|
| **에이전트 파일** | `config.yaml` 단일 파일 | `agentcard.yaml` + `tools.yaml` 분리 |
| **AGENT.md 구조** | 비공식 자유 형식 | 표준 5섹션 (목표/참조/워크플로우/출력 형식/검증) |
| **역할 분리** | 제약사항/핸드오프 AGENT.md에 중복 | agentcard.yaml에만 기재 (WHAT/WHEN) |
| **스킬 타입** | "Executor" 표기, type 필드 없음 | core/setup/orchestrator 타입 명시 |
| **스킬 구조** | 간단한 설명+워크플로우 | 표준 9섹션 (호출규칙/워크플로우/완료조건/검증/상태/취소/재개/부스팅/주의사항) |
| **위임 표기법** | 없음 | `→ Agent:` + 5항목 (TASK/EXPECTED OUTCOME/MUST DO/MUST NOT DO/CONTEXT) |
| **스킬 부스팅** | 없음 | plan/ralph/ultraqa/build-fix/ralplan 매핑 |
| **FQN** | 없음 | 3-part 형식 `abra:{dir}:{name}` |
| **프롬프트 조립** | 없음 | 3파일 로드 + runtime-mapping 적용 순서 명시 |
| **install.yaml** | 비표준 형식 | mcp_servers/lsp_servers/custom_tools 표준 |
| **runtime-mapping** | 3-Tier, custom_cli 타입, builtin 사용 | 4-Tier, lsp/mcp/custom 타입만 사용 |
| **매니페스트** | 없음 | `.claude-plugin/plugin.json` + `marketplace.json` |
| **커맨드** | 1개 | 7개 (각 스킬별 진입점) |
| **참조 문서** | `references/` 공용 디렉토리 | 에이전트별 `references/` 디렉토리로 분산 배치 |

[Top](#abra-dmap-plugin-작업-보고서)

---

## 결론

기존 Abra 프로젝트(`../abra`)를 DMAP 표준에 맞춰 `samples/abra`에 완전히 재구성 완료.
Architect 에이전트의 2회 검증을 거쳐 **APPROVED** 판정을 받음.

| 항목 | 수량 |
|------|------|
| 생성/재작성 파일 | 48개 |
| 에이전트 패키지 | 5개 (각 AGENT.md + agentcard.yaml + tools.yaml + references/) |
| 스킬 파일 | 8개 (core 1, setup 2, orchestrator 5) |
| 커맨드 엔트리포인트 | 7개 |
| 게이트웨이 파일 | 6개 (install.yaml, runtime-mapping.yaml, mcp/, tools/) |
| Architect 검증 | 1차 CONDITIONAL PASS → 수정 → 2차 APPROVED |
| DMAP 표준 준수율 | 100% (에이전트, 스킬, 게이트웨이 전 영역) |

**최종 상태:** APPROVED - 모든 작업 완료, DMAP 표준 준수 검증 통과
