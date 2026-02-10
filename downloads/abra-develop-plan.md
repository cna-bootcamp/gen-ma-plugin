# Abra 플러그인 개발계획서

- [Abra 플러그인 개발계획서](#abra-플러그인-개발계획서)
  - [1. 개요](#1-개요)
  - [2. 자동화 대상 워크플로우](#2-자동화-대상-워크플로우)
  - [3. 플러그인 디렉토리 구조](#3-플러그인-디렉토리-구조)
  - [4. 컴포넌트 설계](#4-컴포넌트-설계)
    - [4.1 plugin.json](#41-pluginjson)
    - [4.2 Skills](#42-skills)
    - [4.3 Agents](#43-agents)
    - [4.4 Gateway](#44-gateway)
  - [5. 스킬 상세 설계](#5-스킬-상세-설계)
    - [5.1 dify-setup (설정스킬)](#51-dify-setup-설정스킬)
    - [5.2 setup (설정스킬)](#52-setup-설정스킬)
    - [5.3 orchestrate (핵심스킬)](#53-orchestrate-핵심스킬)
    - [5.4 scenario (수행자스킬)](#54-scenario-수행자스킬)
    - [5.5 dsl-generate (수행자스킬)](#55-dsl-generate-수행자스킬)
    - [5.6 prototype (수행자스킬)](#56-prototype-수행자스킬)
    - [5.7 dev-plan (수행자스킬)](#57-dev-plan-수행자스킬)
    - [5.8 develop (지휘자스킬)](#58-develop-지휘자스킬)
  - [6. 에이전트 상세 설계](#6-에이전트-상세-설계)
  - [7. Gateway 상세 설계](#7-gateway-상세-설계)
    - [7.1 install.yaml](#71-installyaml)
    - [7.2 runtime-mapping.yaml](#72-runtime-mappingyaml)
  - [8. CLAUDE.md 라우팅 테이블](#8-claudemd-라우팅-테이블)
  - [9. 개발 순서](#9-개발-순서)
  - [10. 기존 자산 활용](#10-기존-자산-활용)

---

## 1. 개요

**플러그인명**: `abra`
**목적**: 자연어로 비즈니스 시나리오를 입력하면 Dify 워크플로우 DSL 생성 → 프로토타이핑 → 개발계획서 → AI Agent 개발까지
전 과정을 자동화하는 Claude Code 플러그인
**설계 기준**: `develop-agent/guide/plugin-standard.md` (플러그인 표준)
**기존 자산**: `develop-agent/examples/mcp/dify-mcp/` (Dify CLI, API 클라이언트), `develop-agent/tools/validate_dsl.py` (DSL 검증기)

**핵심 가치**:
- 자연어 → 동작하는 AI Agent까지 점진적 구체화 (프로토타입 → 프로덕션)
- Dify Visual Builder를 프로토타이핑 도구로 활용
- 'M'사상 (Value-Oriented, Interactive, Iterative) 체화

[Top](#abra-플러그인-개발계획서)

---

## 2. 자동화 대상 워크플로우

5단계 워크플로우를 플러그인으로 자동화:

```
STEP 1          STEP 2          STEP 3          STEP 4          STEP 5
비즈니스        Dify DSL        Dify            개발계획서      AI Agent
시나리오 ──────▶ 자동생성 ──────▶ 프로토타이핑 ──▶ 작성 ──────────▶ 개발
(Human)        (Claude Code)   (Claude Code)   (Claude Code)   (Claude Code)

              ◀──── 에러 시 DSL 수정 루프 (Iterative) ────▶
```

| STEP | 이름 | 입력 | 출력 | 수행자 |
|------|------|------|------|--------|
| 1 | 요구사항 시나리오 생성 & 선택 | 서비스 목적 + 생성 갯수 | 선택된 시나리오 문서 | Human → Claude Code |
| 2 | Dify DSL 자동생성 | 시나리오 문서 | Dify YAML DSL 파일 | Claude Code |
| 3 | Dify 프로토타이핑 | DSL 파일 | 검증된 DSL (Export) | Claude Code (dify_cli) |
| 4 | 개발계획서 작성 | 검증된 DSL + 비기능요구사항 | 개발계획서 | Claude Code |
| 5 | AI Agent 개발 | 개발계획서 + DSL | 프로덕션 코드 또는 Dify 앱 | Claude Code |

[Top](#abra-플러그인-개발계획서)

---

## 3. 플러그인 디렉토리 구조

```
develop-agent/plugin/abra/
├── README.md                       # 플러그인 가이드 (설치, 사용법, 업그레이드, 삭제)
├── docs/
│   └── develop-plan.md             # 개발계획서 (본 문서)
├── .claude-plugin/
│   └── plugin.json                 # 플러그인 매니페스트
│
├── skills/
│   ├── dify-setup/
│   │   └── SKILL.md                # Dify 로컬 환경 구축 (Docker Compose)
│   ├── setup/
│   │   └── SKILL.md                # 플러그인 초기 설정 (.env 설정, 도구 동작 확인)
│   ├── orchestrate/
│   │   └── SKILL.md                # 핵심스킬 — 5단계 워크플로우 오케스트레이션
│   ├── scenario/
│   │   └── SKILL.md                # STEP 1: 요구사항 시나리오 생성 및 선택
│   ├── dsl-generate/
│   │   └── SKILL.md                # STEP 2: Dify DSL 자동생성
│   ├── prototype/
│   │   └── SKILL.md                # STEP 3: Dify 프로토타이핑 (import/export)
│   ├── dev-plan/
│   │   └── SKILL.md                # STEP 4: 개발계획서 작성
│   └── develop/
│       └── SKILL.md                # STEP 5: AI Agent 개발
│
├── agents/
│   ├── scenario-analyst/
│   │   ├── AGENT.md                # 시나리오 분석 전문가
│   │   ├── config.yaml
│   │   └── references/
│   │       └── requirement-generater.md   # 요구사항 생성 프롬프트 템플릿
│   ├── dsl-architect/
│   │   ├── AGENT.md                # DSL 설계 전문가
│   │   ├── config.yaml
│   │   └── references/
│   │       ├── dsl-generation-prompt.md   # DSL 생성 프롬프트 템플릿
│   │       └── dify-workflow-dsl-guide.md # DSL 작성 가이드
│   ├── prototype-runner/
│   │   ├── AGENT.md                # Dify 프로토타이핑 실행 전문가
│   │   └── config.yaml
│   ├── plan-writer/
│   │   ├── AGENT.md                # 개발계획서 작성 전문가
│   │   ├── config.yaml
│   │   └── references/
│   │       └── develop-plan-generate.md   # 개발계획서 생성 프롬프트 템플릿
│   └── agent-developer/
│       ├── AGENT.md                # Agent 개발 전문가
│       ├── config.yaml
│       └── references/
│           └── develop.md                 # Agent 개발 프롬프트 템플릿
│
├── gateway/
│   ├── install.yaml                # 설치 매니페스트 (Custom Tool 등록)
│   ├── runtime-mapping.yaml        # 티어·도구·액션 매핑
│   ├── .env                        # Dify 접속 설정 (base_url, email, password 등)
│   ├── requirements.txt            # Python 의존성 (httpx, python-dotenv, pyyaml)
│   ├── .venv/                      # Python 가상환경 (setup 스킬에서 자동 생성)
│   └── tools/
│       ├── dify_cli.py             # Dify 앱 관리 CLI (list/export/import/update/publish/run)
│       ├── dify_client.py          # Dify Console API 비동기 클라이언트
│       ├── config.py               # Dify 접속 설정 로더
│       └── validate_dsl.py         # DSL YAML 문법·구조 사전 검증기
```

[Top](#abra-플러그인-개발계획서)

---

## 4. 컴포넌트 설계

### 4.1 plugin.json

```json
{
  "name": "abra",
  "description": "자연어로 AI Agent를 개발하는 워크플로우 자동화 플러그인",
  "version": "1.0.0"
}
```

### 4.2 Skills

| 스킬명 | 유형 | 역할 | STEP |
|--------|------|------|------|
| `dify-setup` | Setup | Dify 로컬 환경 구축 (Docker Compose 실행) | 사전 |
| `setup` | Setup | .env 설정, 도구 의존성 확인, 연결 테스트 | - |
| `orchestrate` | Core | 5단계 워크플로우 라우팅 및 오케스트레이션 | 전체 |
| `scenario` | Executor | 요구사항 시나리오 N개 생성 → 사용자 선택 | 1 |
| `dsl-generate` | Executor | Dify YAML DSL 자동생성 | 2 |
| `prototype` | Executor | Dify import/export 자동화, 프로토타이핑 안내 | 3 |
| `dev-plan` | Executor | 개발계획서 작성 | 4 |
| `develop` | Orchestrator | AI Agent 개발 지휘 (Option A/B 분기) | 5 |

### 4.3 Agents

| 에이전트 | 티어 | 역할 | 위임 원천 |
|----------|------|------|----------|
| `scenario-analyst` | MEDIUM | 자연어 요구사항 → 구조화된 시나리오 | scenario 스킬 |
| `dsl-architect` | HIGH | 시나리오 → Dify DSL YAML 설계·생성 | dsl-generate 스킬 |
| `prototype-runner` | MEDIUM | DSL → Dify 프로토타이핑 (import/publish/run/에러수정/export) | prototype 스킬 |
| `plan-writer` | MEDIUM | DSL + 요구사항 → 개발계획서 작성 | dev-plan 스킬 |
| `agent-developer` | HIGH | 개발계획서 → 프로덕션 코드 구현 | develop 스킬 |

### 4.4 Gateway (Custom Tools)

모든 도구는 `gateway/tools/` 디렉토리에 배치. 기존 자산을 복사하여 플러그인 내 자체 포함.

| 도구 | 경로 | 유형 | 역할 |
|------|------|------|------|
| `dify_cli.py` | `gateway/tools/` | CLI | Dify 앱 관리: list, export, import, update, publish, run |
| `dify_client.py` | `gateway/tools/` | Library | Dify Console API 비동기 클라이언트 (dify_cli 백엔드) |
| `config.py` | `gateway/tools/` | Config | Dify 접속 설정 관리 (gateway/.env 참조) |
| `validate_dsl.py` | `gateway/tools/` | CLI | DSL YAML 문법·구조 사전 검증 (Import 전 필수) |
| `.env` | `gateway/` | Config | Dify 접속 정보 (base_url, email, password 등) |
| `requirements.txt` | `gateway/` | Config | Python 의존성 목록 (httpx, python-dotenv, pyyaml) |

[Top](#abra-플러그인-개발계획서)

---

## 5. 스킬 상세 설계

### 5.1 dify-setup (설정스킬)

**Dify 로컬 환경 구축 — Docker Compose로 Dify 실행**

**frontmatter:**
```yaml
---
name: dify-setup
description: Dify 로컬 환경 구축 (Docker Compose)
user-invocable: true
disable-model-invocation: true
---
```

**사전 요구사항:**

| 항목 | 최소 사양 |
|------|----------|
| CPU | 2 Core 이상 |
| RAM | 4 GiB 이상 |
| Docker | 설치 필요 |
| Docker Compose | 설치 필요 |

**워크플로우:**
1. Docker / Docker Compose 설치 여부 확인 (`docker --version`, `docker compose version`)
   - 미설치 시: 설치 안내 URL 제공 후 중단
2. Dify 소스 존재 여부 확인 (`~/home/workspace/dify`)
   - 없으면: `git clone https://github.com/langgenius/dify.git` 실행
   - 있으면: 기존 디렉토리 사용 안내
3. 환경 변수 파일 생성:
   ```bash
   cd ~/home/workspace/dify/docker
   cp .env.example .env
   ```
4. Docker Compose로 Dify 실행:
   ```bash
   docker compose up -d
   ```
5. 컨테이너 상태 확인 (`docker compose ps`)
6. Dify 접속 가능 여부 확인 (http://localhost 헬스체크)
7. 초기 설정 안내:
   - 브라우저에서 `http://localhost/install` 접속
   - 관리자 계정 생성
   - 생성한 이메일/패스워드를 `gateway/.env`에 기록 안내
8. 결과 보고 (컨테이너 상태, 접속 URL)

**커스텀 설정:**
- `docker/.env` 파일에서 환경 변수 수정 가능
- 변경 후: `docker compose up -d`로 재시작

---

### 5.2 setup (설정스킬)

**frontmatter:**
```yaml
---
name: setup
description: Abra 플러그인 초기 설정
user-invocable: true
disable-model-invocation: true
---
```

**선행 조건**: `dify-setup` 완료 (Dify 실행 중)

**워크플로우:**
1. Dify 접속 정보 확인 (base_url, email, password)
2. `gateway/.env` 파일 생성 또는 갱신
3. Python 가상환경 생성 및 의존성 설치:
   ```bash
   cd gateway
   python -m venv .venv
   # Windows
   .venv\Scripts\activate && pip install -r requirements.txt
   # macOS/Linux
   source .venv/bin/activate && pip install -r requirements.txt
   ```
4. Python LSP(Language Server) 설치 확인:
   - `lsp_servers` 도구로 Python LSP 설치 여부 확인
   - 미설치 시: `pip install python-lsp-server` 또는 `pyright` 설치 안내
   - Python 코드 진단(`lsp_diagnostics`)에 필요 (gateway 도구 검증 및 STEP 5 Agent 개발)
5. `gateway/tools/` 하위 도구 동작 확인 (가상환경 내 실행)
   ```bash
   # Windows
   gateway\.venv\Scripts\python gateway\tools\dify_cli.py list
   # macOS/Linux
   gateway/.venv/bin/python gateway/tools/dify_cli.py list
   ```
6. Dify 연결 테스트 (위 명령으로 앱 목록 조회 성공 여부 확인)
7. CLAUDE.md에 라우팅 테이블 추가 (범위 질문)
8. 결과 보고

### 5.3 orchestrate (핵심스킬)

**frontmatter:**
```yaml
---
name: orchestrate
description: Abra 워크플로우 오케스트레이션
user-invocable: false
---
```

**Phase 0 — 의도 분류 (Intent Gate):**

| 감지 패턴 | 라우팅 대상 | `/` 명령어 |
|-----------|-----------|-----------|
| "에이전트 만들어", "Agent 개발", "워크플로우 만들어" | → 전체 5단계 시작 | `/abra:orchestrate` |
| "시나리오 생성", "요구사항 생성", "요구사항 정의" | → scenario 스킬 | `/abra:scenario` |
| "DSL 생성", "워크플로우 DSL" | → dsl-generate 스킬 | `/abra:dsl-generate` |
| "프로토타이핑", "Dify 업로드" | → prototype 스킬 | `/abra:prototype` |
| "개발계획서", "계획서 작성" | → dev-plan 스킬 | `/abra:dev-plan` |
| "코드 개발", "Agent 구현" | → develop 스킬 | `/abra:develop` |
| "Dify 설치", "Dify 실행", "Docker 실행" | → dify-setup 스킬 | `/abra:dify-setup` |
| 초기 설정 | → setup 스킬 | `/abra:setup` |

**Phase 1 — 현황 파악:**
- 프로젝트 디렉토리에 기존 산출물 존재 여부 확인 (시나리오.md, *.dsl.yaml, 계획서.md)
- 어느 단계부터 시작할지 판단 (중간 진입 지원)

**Phase 2 — 실행:**
- 각 STEP의 산출물을 다음 STEP의 입력으로 전달
- STEP 3 에러 루프: publish/run 에러 시 DSL 자동 수정 → update → 재시도
- 전체 피드백: STEP 3~5 결과에 따라 이전 STEP 재실행 가능

**Phase 3 — 완료:**
- 모든 산출물 생성 확인
- 산출물 목록 보고

### 5.4 scenario (수행자스킬)

**STEP 1 자동화 — 요구사항 시나리오 생성 및 선택**

**입력**: 서비스 목적 + 생성 갯수
**출력**: `{project}/scenario.md` (선택된 요구사항 시나리오)

**참조 템플릿**: `agents/scenario-analyst/references/requirement-generater.md`

**워크플로우:**
1. 사용자에게 AskUserQuestion으로 핵심 정보 수집:
   - 서비스 목적 (필수)
   - 생성 갯수 (기본값: 3)
   - 결과파일 디렉토리
2. `scenario-analyst` 에이전트에 위임하여 요구사항 시나리오 자동 생성:
   - `requirement-generater.md` 프롬프트 템플릿 적용
   - 서로 다른 관점(업무자동화, 고객경험, 비용절감, 의사결정, 협업효율화)으로 N개 생성
   - 각 시나리오는 8개 섹션(서비스개요, 사용자시나리오, 에이전트역할, 워크플로우설계,
     외부도구, AI지시사항, 품질요구사항, 검증시나리오) 포함
   - 마지막에 버전 간 비교표 추가
3. 생성된 시나리오 목록을 사용자에게 제시 (AskUserQuestion):
   - 각 버전의 관점·서비스명·핵심가치 요약 표시
   - 사용자가 하나를 선택
4. **선택된 시나리오를 `{project}/scenario.md`로 저장**
5. 선택된 시나리오를 다음 STEP(dsl-generate)의 입력으로 전달

**시나리오 선택 흐름:**
```
서비스 목적 입력 → N개 시나리오 생성 → 비교표 제시 → 사용자 선택
                                                        ↓
                                    선택된 시나리오 → scenario.md 저장
                                                        ↓
                                              STEP 2 (dsl-generate) 진입
```

**산출물 구조** (requirement-generater.md 템플릿 기반):
```markdown
# 버전 N (관점: {관점명})

## 1. 서비스 개요
- 서비스명 / 서비스 유형 / 서비스 목적 / 대상 사용자

## 2. 사용자 시나리오
- As-Is / To-Be / 기대 효과 (정량 수치 포함)

## 3. 에이전트 역할 및 행동
- 역할 정의 / 단계별 행동 (입력→처리→출력) / 예외 처리

## 4. 워크플로우 설계
- 입력·출력 항목 / 분기 조건 / 반복 처리

## 5. 외부 도구 및 데이터 소스

## 6. AI 지시사항 가이드

## 7. 품질 요구사항
- 응답 속도 / 정확도 / 보안 / 운영 관리

## 8. 검증 시나리오
- 정상 케이스 2~3개 / 예외 케이스 1~2개
```

### 5.5 dsl-generate (수행자스킬)

**STEP 2 자동화 — Dify Workflow DSL 자동생성**

**입력**: `scenario.md` (STEP 1에서 선택된 시나리오)
**출력**: `{project}/{app-name}.dsl.yaml` (Dify DSL 파일)

**참조 템플릿**: `agents/dsl-architect/references/dsl-generation-prompt.md`, `agents/dsl-architect/references/dify-workflow-dsl-guide.md`

**워크플로우:**
1. `scenario.md` 읽기
2. `agents/dsl-architect/references/` 하위 DSL 생성 프롬프트 + DSL 가이드 참조
3. `dsl-architect` 에이전트에 위임:
   - 노드(Node) 설계: Start, LLM, Knowledge Retrieval, Tool, IF/ELSE, End 등
   - 엣지(Edge) 연결
   - 변수/파라미터 설정
   - 프롬프트 템플릿 생성
4. DSL YAML 파일 생성
5. `validate_dsl.py`로 문법·구조 사전 검증
   - PASS → 다음 단계 진행
   - FAIL → 오류 항목 기반으로 DSL 수정 → 재검증 (반복)
6. DSL 구조 설명서 출력

**참조 자산:**
- `develop-agent/guide/dify-workflow-dsl-guide.md` → `agents/dsl-architect/references/`에 복사

### 5.6 prototype (수행자스킬)

**STEP 3 자동화 — Dify 프로토타이핑 (Claude Code 자동 실행)**

**입력**: `{app-name}.dsl.yaml`
**출력**: 검증된 DSL (Export)

**워크플로우:** (`prototype-runner` 에이전트에 위임)
1. `dify_cli import`로 DSL을 Dify에 Import하여 새 Workflow 앱 생성
2. `dify_cli publish`로 워크플로우 게시
   - 에러 발생 시: DSL 수정 → `validate_dsl`로 재검증 → `dify_cli update`로 반영 → 재게시
3. `dify_cli run`으로 워크플로우 실행 및 결과 검증
   - 에러 발생 시: DSL 수정 → `validate_dsl`로 재검증 → `dify_cli update`로 반영 → 재실행
   - 실행 성공 시: 결과 출력 확인
4. `dify_cli export`로 검증 완료된 DSL 내려받기
5. 검증된 DSL 파일 저장 → 다음 STEP 진입

**에러 수정 루프:**
```
import → publish → [에러?] → DSL 수정 → validate_dsl → update → 재게시
                                                                   ↓
                              run → [에러?] → DSL 수정 → validate_dsl → update → 재실행
                                                                                  ↓
                                                        [성공] → export → 완료
```

**Custom Tool 활용:**

| 작업 | CLI 명령 |
|------|----------|
| DSL 문법 검증 | `python gateway/tools/validate_dsl.py <yaml_file>` |
| DSL 업로드 (신규) | `python gateway/tools/dify_cli.py import` |
| DSL 업로드 (갱신) | `python gateway/tools/dify_cli.py update` |
| 워크플로우 게시 | `python gateway/tools/dify_cli.py publish` |
| 워크플로우 실행 | `python gateway/tools/dify_cli.py run` |
| DSL 내려받기 | `python gateway/tools/dify_cli.py export` |
| 앱 목록 조회 | `python gateway/tools/dify_cli.py list` |

### 5.7 dev-plan (수행자스킬)

**STEP 4 자동화 — 개발계획서 작성**

**입력**: 검증된 DSL + `scenario.md` + 비기능요구사항
**출력**: `{project}/dev-plan.md` (개발계획서)

**참조 템플릿**: `agents/plan-writer/references/develop-plan-generate.md`

**워크플로우:**
1. 검증된 DSL 파일과 시나리오 문서 읽기
2. `plan-writer` 에이전트에 위임 (`develop-plan-generate.md` 템플릿 적용):
   - 기술스택 및 아키텍처 결정
   - 모듈별 개발 범위 및 순서
   - 프롬프트 최적화 계획
   - API 설계서 / 데이터 모델
   - 테스트 전략 및 배포 계획
3. 개발계획서 생성
4. 리뷰 포인트 체크:
   - DSL 구조와 계획의 일관성
   - 비기능요구사항 포함 여부
   - 프로덕션 전환 전략 타당성

### 5.8 develop (지휘자스킬)

**STEP 5 자동화 — AI Agent 개발 & 배포**

**입력**: `dev-plan.md` + 검증된 DSL
**출력**: 프로덕션 코드 또는 배포된 Dify 앱

**참조 템플릿**: `agents/agent-developer/references/develop.md`

**워크플로우:**

사용자에게 개발 방식 선택 질문 (AskUserQuestion):

**Option A: Dify 런타임 활용**
1. DSL을 Dify에 Import
2. 환경 변수 설정
3. `publish_workflow`로 배포
4. API 엔드포인트 안내

**Option B: 코드 기반 전환**
1. `agent-developer` 에이전트에 위임:
   - DSL을 설계 참조로 활용
   - LangChain/LangGraph 등으로 구현
   - 에러 핸들링/보안 구현
2. 테스트 코드 작성
3. 배포 설정 (Docker, K8s 등)

**완료 조건:**
- Option A: Dify 앱 배포 완료 + API 테스트 통과
- Option B: 코드 빌드 성공 + 테스트 통과

[Top](#abra-플러그인-개발계획서)

---

## 6. 에이전트 상세 설계

### scenario-analyst

```yaml
# config.yaml
name: "scenario-analyst"
version: "1.0.0"
tier: MEDIUM

capabilities:
  role: |
    비즈니스 요구사항을 분석하여 구조화된 시나리오 문서로 변환.
    사용자의 모호한 요구사항에서 핵심 요소를 추출하고 템플릿에 맞게 정리.
  identity:
    is: ["비즈니스 분석가", "요구사항 정의 전문가"]
    is_not: ["코드 작성자", "DSL 생성자"]
  restrictions:
    forbidden_actions: ["file_delete", "code_execute", "network_access"]

handoff:
  - target: dsl-architect
    when: "시나리오 정의 완료 후 DSL 생성 필요"
    reason: "DSL 설계는 전문 에이전트에 위임"
```

### dsl-architect

```yaml
# config.yaml
name: "dsl-architect"
version: "1.0.0"
tier: HIGH

capabilities:
  role: |
    Dify Workflow DSL을 설계·생성하는 전문가.
    비즈니스 시나리오를 Dify YAML DSL로 변환.
    노드 설계, 엣지 연결, 프롬프트 템플릿 작성 수행.
  identity:
    is: ["DSL 설계자", "워크플로우 아키텍트"]
    is_not: ["비즈니스 분석가", "코드 개발자"]
  restrictions:
    forbidden_actions: ["code_execute", "network_access"]

handoff:
  - target: plan-writer
    when: "DSL 생성 완료 후 개발계획서 필요"
    reason: "계획서 작성은 전문 에이전트에 위임"
```

### prototype-runner

```yaml
# config.yaml
name: "prototype-runner"
version: "1.0.0"
tier: MEDIUM

capabilities:
  role: |
    DSL을 Dify에 배포하고 실행하여 프로토타이핑을 수행.
    import → publish → run → export 자동화 및 에러 발생 시
    원인 분석 → DSL 수정 → validate_dsl 재검증 → update 루프 실행.
  identity:
    is: ["프로토타이핑 실행자", "Dify 워크플로우 검증자"]
    is_not: ["DSL 설계자", "코드 개발자", "비즈니스 분석가"]
  restrictions:
    forbidden_actions: ["file_delete", "network_access", "user_interact"]

handoff:
  - target: dsl-architect
    when: "DSL 구조적 결함으로 수정 범위가 큰 경우"
    reason: "대규모 DSL 재설계는 설계 전문가에게 위임"
  - target: plan-writer
    when: "프로토타이핑 완료 후 개발계획서 필요"
    reason: "계획서 작성은 전문 에이전트에 위임"
```

### plan-writer

```yaml
# config.yaml
name: "plan-writer"
version: "1.0.0"
tier: MEDIUM

capabilities:
  role: |
    DSL과 시나리오를 기반으로 개발계획서를 작성.
    기술스택, 아키텍처, 모듈 설계, 테스트 전략 등 포괄적 계획 수립.
  identity:
    is: ["기술 문서 작성자", "개발 계획 수립자"]
    is_not: ["코드 작성자", "DSL 생성자"]
  restrictions:
    forbidden_actions: ["file_delete", "code_execute"]

handoff:
  - target: agent-developer
    when: "개발계획서 승인 후 구현 필요"
    reason: "코드 구현은 전문 에이전트에 위임"
```

### agent-developer

```yaml
# config.yaml
name: "agent-developer"
version: "1.0.0"
tier: HIGH

capabilities:
  role: |
    개발계획서와 DSL을 기반으로 AI Agent를 구현.
    프로덕션 코드 작성, 테스트, 배포 설정 수행.
  identity:
    is: ["AI Agent 개발자", "코드 구현 전문가"]
    is_not: ["비즈니스 분석가", "DSL 설계자"]
  restrictions:
    forbidden_actions: ["user_interact"]

handoff:
  - target: dsl-architect
    when: "구현 중 DSL 수정 필요"
    reason: "DSL 변경은 설계 전문가에게 위임"
```

[Top](#abra-플러그인-개발계획서)

---

## 7. Gateway 상세 설계

### 7.1 install.yaml

```yaml
custom_tools:
  - name: dify_cli
    path: gateway/tools/dify_cli.py
    type: cli
    required: true
    commands:
      - list       # 앱 목록 조회
      - export     # DSL 내보내기
      - import     # DSL 가져오기 (신규 앱 생성)
      - update     # DSL 갱신 (기존 앱 덮어쓰기)
      - publish    # 워크플로우 게시
      - run        # 워크플로우 실행 (SSE 스트리밍)

  - name: validate_dsl
    path: gateway/tools/validate_dsl.py
    type: cli
    required: true
    description: "DSL YAML 문법·구조 사전 검증 (Import 전 필수)"

python_env:
  venv_path: gateway/.venv
  requirements: gateway/requirements.txt

config:
  env_file: gateway/.env
```

> **MCP 서버 불필요**: Bash로 `python gateway/tools/dify_cli.py <command>` 형태로 직접 호출.
> `validate_dsl.py`는 Import 전 DSL 사전 검증에 사용하여 Dify Import 오류를 사전 차단.
> `.env`는 `gateway/` 하위에 배치하여 플러그인 내 자체 관리.
> `requirements.txt`에 Python 의존성 정의. `setup` 스킬에서 가상환경(`.venv`) 생성 후 설치.

### 7.2 runtime-mapping.yaml

```yaml
tier_mapping:
  default:
    HIGH: "claude-opus-4-6"
    MEDIUM: "claude-sonnet-4-5"
    LOW: "claude-haiku-4-5"

tool_mapping:
  # Dify 워크플로우 관리 (Custom Tool — CLI)
  dify_app_management:
    - type: custom_cli
      command: "python gateway/tools/dify_cli.py"
      actions: ["list", "export"]

  dify_dsl_management:
    - type: custom_cli
      command: "python gateway/tools/dify_cli.py"
      actions: ["import", "update", "export"]

  dify_workflow_management:
    - type: custom_cli
      command: "python gateway/tools/dify_cli.py"
      actions: ["publish", "run"]

  dsl_validation:
    - type: custom_cli
      command: "python gateway/tools/validate_dsl.py"
      actions: ["validate"]

action_mapping:
  file_write: ["Write", "Edit"]
  file_delete: ["Bash"]
  code_execute: ["Bash"]
  network_access: ["WebFetch", "WebSearch"]
  user_interact: ["AskUserQuestion"]
  agent_delegate: ["Task"]
```

[Top](#abra-플러그인-개발계획서)

---

## 8. CLAUDE.md 라우팅 테이블

setup 스킬이 설치 시 CLAUDE.md에 추가하는 라우팅 테이블:

```markdown
## Abra 플러그인 활성화 조건

| 조건 | 플러그인 | 진입 스킬 |
|------|---------|----------|
| AI Agent 개발 요청, 워크플로우 생성 요청 | abra | orchestrate |
| 시나리오/요구사항 정의 요청 | abra | scenario |
| Dify DSL 생성 요청 | abra | dsl-generate |
| Dify 프로토타이핑 요청 | abra | prototype |
| 개발계획서 작성 요청 | abra | dev-plan |
| AI Agent 코드 개발 요청 | abra | develop |
```

[Top](#abra-플러그인-개발계획서)

---

## 9. 개발 순서

| 순서 | 작업 | 산출물 | 선행 조건 |
|------|------|--------|----------|
| 1 | plugin.json 작성 | `.claude-plugin/plugin.json` | - |
| 2 | Gateway 설정 | `gateway/install.yaml`, `runtime-mapping.yaml`, `gateway/tools/` | - |
| 3 | dify-setup 스킬 작성 | `skills/dify-setup/SKILL.md` | 1 |
| 4 | setup 스킬 작성 | `skills/setup/SKILL.md` | 2, 3 |
| 5 | orchestrate 스킬 작성 | `skills/orchestrate/SKILL.md` | - |
| 6 | scenario 스킬 + scenario-analyst 에이전트 | `skills/scenario/`, `agents/scenario-analyst/` | 5 |
| 7 | dsl-generate 스킬 + dsl-architect 에이전트 | `skills/dsl-generate/`, `agents/dsl-architect/` | 6 |
| 8 | prototype 스킬 + prototype-runner 에이전트 | `skills/prototype/`, `agents/prototype-runner/` | 7 |
| 9 | dev-plan 스킬 + plan-writer 에이전트 | `skills/dev-plan/`, `agents/plan-writer/` | 8 |
| 10 | develop 스킬 + agent-developer 에이전트 | `skills/develop/`, `agents/agent-developer/` | 9 |
| 11 | 통합 테스트 | 전체 5단계 워크플로우 실행 검증 | 10 |
| 12 | README.md 작성 | `README.md` (플러그인 표준 README 작성 표준 참조) | 11 |

> **반복 개발 권장**: 순서 5~9는 각 단계별로 작성 → 테스트 → 피드백 반영의 반복 사이클로 진행.
> 한 번에 전체를 완성하려 하지 않고, 각 STEP을 독립적으로 검증한 후 다음으로 진행.

[Top](#abra-플러그인-개발계획서)

---

## 10. 기존 자산 활용

| 기존 자산 | 원본 위치 | 복사 위치 | 활용 방식 |
|-----------|----------|----------|----------|
| Dify CLI | `develop-agent/examples/mcp/dify-mcp/dify_cli.py` | `gateway/tools/dify_cli.py` | 모든 Dify 조작의 주 도구 |
| Dify API 클라이언트 | `develop-agent/examples/mcp/dify-mcp/dify_client.py` | `gateway/tools/dify_client.py` | dify_cli의 백엔드 라이브러리 |
| Dify 설정 | `develop-agent/examples/mcp/dify-mcp/config.py` | `gateway/tools/config.py` | 접속 설정 관리 (gateway/.env 참조) |
| DSL 검증기 | `develop-agent/tools/validate_dsl.py` | `gateway/tools/validate_dsl.py` | Import 전 DSL 문법·구조 사전 검증 |
| Python 의존성 | `develop-agent/examples/mcp/dify-mcp/requirements.txt` | `gateway/requirements.txt` | 가상환경 설치용 (mcp 제외, httpx·dotenv·pyyaml만) |
| 요구사항 생성 템플릿 | `develop-agent/tools/prompt-template/requirement-generater.md` | `agents/scenario-analyst/references/` | STEP 1 시나리오 생성 |
| DSL 생성 템플릿 | `develop-agent/tools/prompt-template/dsl-generation-prompt.md` | `agents/dsl-architect/references/` | STEP 2 DSL 생성 |
| DSL 가이드 | `develop-agent/guide/dify-workflow-dsl-guide.md` | `agents/dsl-architect/references/` | STEP 2 DSL 작성 참조 |
| 개발계획서 템플릿 | `develop-agent/tools/prompt-template/develop-plan-generate.md` | `agents/plan-writer/references/` | STEP 4 계획서 생성 |
| Agent 개발 템플릿 | `develop-agent/tools/prompt-template/develop.md` | `agents/agent-developer/references/` | STEP 5 Agent 개발 |
| 플러그인 표준 | `develop-agent/guide/plugin-standard.md` | — | 전체 구조 설계 기준 (참조만) |

> **기존 자산 → gateway/tools/로 복사**: 플러그인이 외부 경로에 의존하지 않도록 자체 포함(self-contained).
> 신규 작성 대상은 Skills(8개)와 Agents(5개)의 마크다운/YAML 파일만 해당.

[Top](#abra-플러그인-개발계획서)
