# Abra — AI Agent 자동 생성 플러그인

- [Abra — AI Agent 자동 생성 플러그인](#abra--ai-agent-자동-생성-플러그인)
  - [개요](#개요)
  - [설치](#설치)
  - [사용법](#사용법)
  - [요구사항](#요구사항)
  - [라이선스](#라이선스)

---

## 개요

**Abra**는 자연어로 비즈니스 요구사항을 입력하면 Dify 워크플로우 DSL 생성 → 프로토타이핑
→ 개발계획서 → AI Agent 개발까지 **전 과정을 자동화**하는 선언형 멀티에이전트 플러그인(DMAP)임.

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **시나리오 생성** | 서비스 목적을 입력하면 다양한 관점(업무자동화, 고객경험, 비용절감 등)의 요구사항 시나리오 N개 자동 생성 및 사용자 선택 |
| **DSL 자동생성** | 선택된 시나리오를 기반으로 Dify Workflow DSL(YAML) 자동 생성 및 문법·구조 사전 검증 |
| **프로토타이핑** | 생성된 DSL을 Dify에 자동 Import → Publish → Run하여 프로토타이핑 수행. 에러 발생 시 DSL 수정 → 재검증 → 재시도 루프 자동 실행 |
| **개발계획서 작성** | 검증된 DSL과 시나리오를 기반으로 기술스택, 아키텍처, 모듈 설계, 테스트 전략을 포함한 개발계획서 자동 생성 |
| **AI Agent 개발** | 개발계획서에 따라 Dify 런타임 활용(Option A) 또는 코드 기반 전환(Option B) 방식으로 AI Agent 구현 |
| **Dify 환경 구축** | Docker Compose로 로컬 Dify 환경 자동 구축 및 설정 |

### 작업 흐름 (5단계)

```
STEP 1          STEP 2          STEP 3          STEP 4          STEP 5
비즈니스        Dify DSL        Dify            개발계획서      AI Agent
시나리오 ──────▶ 자동생성 ──────▶ 프로토타이핑 ──▶ 작성 ──────────▶ 개발
(Human+AI)     (AI)            (AI)            (AI)            (AI)

              ◀──── 에러 시 DSL 수정 루프 (Iterative) ────▶
```

| 단계 | 입력 | 출력 |
|------|------|------|
| STEP 1: 시나리오 생성 | 서비스 목적 + 생성 갯수 | 선택된 시나리오 문서 |
| STEP 2: DSL 자동생성 | 시나리오 문서 | Dify YAML DSL 파일 |
| STEP 3: 프로토타이핑 | DSL 파일 | 검증된 DSL (Export) |
| STEP 4: 개발계획서 작성 | 검증된 DSL + 시나리오 | 개발계획서 |
| STEP 5: AI Agent 개발 | 개발계획서 + DSL | 프로덕션 코드 또는 Dify 앱 |

### 'M'사상 체화

Abra는 Unicorn Inc.의 'M'사상을 구현함:
- **Value-Oriented**: WHY First — 비즈니스 요구사항(WHY)에서 시작하여 기술 구현(HOW)으로 진행
- **Interactive**: Believe crew — 사용자 선택 인정, 각 단계에서 피드백 반영
- **Iterative**: Fast fail — 프로토타이핑 에러 시 자동 수정 루프, 빠른 반복 개선

[Top](#abra--ai-agent-자동-생성-플러그인)

---

## 설치

### 1단계: 선행 조건 확인

Abra 플러그인을 사용하려면 다음 환경이 필요함:

| 항목 | 요구사항 |
|------|---------|
| **Claude Code** | DMAP 런타임 지원 버전 |
| **Docker** | 20.10+ (Dify 로컬 환경 구축 필요) |
| **Docker Compose** | 2.0+ (Dify 멀티 컨테이너 관리) |
| **Python** | 3.10+ (커스텀 도구 실행) |
| **메모리** | 4 GiB 이상 (Dify 컨테이너) |
| **디스크** | 5 GiB 이상 (Dify 이미지 + 데이터) |

### 2단계: Dify 로컬 환경 구축

플러그인 사용 전 Dify 환경 구축 필수. 다음 명령어로 진행:

```bash
/abra:dify-setup
```

**상세 단계:**

1. Docker & Docker Compose 설치 여부 자동 확인
2. Dify 소스 다운로드 (기본: `~/workspace/dify`)
3. 환경 변수 파일 생성 (`.env`)
4. Docker Compose 컨테이너 실행
5. 컨테이너 상태 확인 및 헬스체크
6. 관리자 계정 생성 안내 (`http://localhost/install`)

**Dify 접속 확인:**

```bash
curl http://localhost/console/api/health
```

### 3단계: 플러그인 초기 설정

Dify 환경 구축 완료 후 플러그인 설정 실행:

```bash
/abra:setup
```

**설정 내용:**

1. Dify 접속 정보 입력 (Base URL, Email, Password)
2. `.env` 파일 생성 (`gateway/.env`)
3. Python 가상환경 생성
4. 의존성 설치 (`httpx`, `python-dotenv`, `pyyaml`)
5. Dify 연결 테스트
6. 라우팅 테이블 등록 (로컬 또는 전역 `CLAUDE.md`)

**설정 완료 후:**

플러그인 사용 준비 완료. 다음 명령어로 사용 가능:

```bash
/abra:scenario      # STEP 1: 시나리오 생성
/abra:dsl-generate  # STEP 2: DSL 자동생성
/abra:prototype     # STEP 3: 프로토타이핑
/abra:dev-plan      # STEP 4: 개발계획서 작성
/abra:develop       # STEP 5: AI Agent 개발
```

[Top](#abra--ai-agent-자동-생성-플러그인)

---

## 사용법

### 빠른 시작 (전체 5단계 자동 실행)

비즈니스 요구사항 한 줄만 입력하면 AI Agent 개발까지 전 과정 자동화:

```bash
에이전트 만들어줘: 고객 지원 챗봇. 자주 묻는 질문에 자동으로 답변하고,
복잡한 문제는 인간 상담원에게 에스컬레이션.
```

Abra는 자동으로 core 스킬을 통해 의도를 분류하고 `scenario` 스킬부터
시작하여 `develop` 스킬까지 순차 실행함.

### 개별 단계별 사용

각 STEP을 독립적으로 실행 가능:

#### STEP 1: 시나리오 생성

```bash
/abra:scenario
```

**입력:**
- 서비스 목적 (예: "고객 지원 챗봇")
- 생성할 시나리오 갯수 (기본값: 3)
- 결과 저장 디렉토리 (기본값: `output/`)

**출력:**
- 다양한 관점(업무자동화, 고객경험, 비용절감, 의사결정, 협업효율화)의
  N개 시나리오 생성
- 각 시나리오의 관점·서비스명·핵심가치를 요약한 비교표 제시
- 사용자가 하나를 선택 → `output/scenario.md` 저장

#### STEP 2: DSL 자동생성

```bash
/abra:dsl-generate
```

**입력:**
- STEP 1에서 선택된 `scenario.md` 자동 로드

**출력:**
- Dify Workflow DSL(YAML) 자동 생성
- 노드 설계(Start, LLM, Knowledge Retrieval, Tool, IF/ELSE, End 등)
- 엣지(Edge) 연결 및 변수 설정
- 프롬프트 템플릿 작성
- DSL 구조 설명서
- 결과: `output/{app-name}.dsl.yaml` 저장

#### STEP 3: 프로토타이핑

```bash
/abra:prototype
```

**입력:**
- STEP 2에서 생성된 DSL 파일 자동 로드

**프로세스:**
1. DSL 사전 검증 (`validate_dsl`)
2. Dify에 Import
3. 워크플로우 Publish
4. 워크플로우 Run (테스트 실행)
5. 에러 발생 시:
   - DSL 수정
   - 사전 검증 재실행
   - Update & 재실행 (자동 루프)
6. 성공 시 Export로 검증된 DSL 확보

**출력:**
- 검증 완료된 DSL 파일
- Dify 앱 ID (배포된 워크플로우)
- 실행 결과 로그

#### STEP 4: 개발계획서 작성

```bash
/abra:dev-plan
```

**입력:**
- 검증된 DSL + 시나리오 자동 로드
- 비기능요구사항 추가 입력:
  - 기술스택 선호 (예: Python/Node.js, LangChain/LangGraph)
  - 배포 환경 (예: Docker, K8s, 서버리스)
  - 성능/보안 요건
  - 기타 제약

**출력:**
- 기술스택 및 아키텍처 정의
- 모듈별 개발 범위 및 순서
- 프롬프트 최적화 계획
- API 설계서 / 데이터 모델
- 테스트 전략 및 배포 계획
- 결과: `output/dev-plan.md` 저장

#### STEP 5: AI Agent 개발

```bash
/abra:develop
```

**입력:**
- 개발계획서 + 검증된 DSL 자동 로드
- 개발 방식 선택:
  - **Option A**: Dify 런타임 활용 (DSL Import → 환경 설정 → 배포 → API 테스트)
  - **Option B**: 코드 기반 전환 (LangChain/LangGraph 등으로 구현)

**Option A (Dify 런타임) — 저코드 개발:**
- DSL을 Dify에 Import
- 환경 변수 설정
- 워크플로우 Publish & Deploy
- API 테스트 자동 실행

**Option B (코드 기반) — 풀코드 개발:**
- DSL 참조하여 LangChain/LangGraph 등으로 구현
- 테스트 코드 자동 생성 및 실행
- 빌드 오류 자동 수정 (`/oh-my-claudecode:build-fix`)
- QA 검증 자동 실행 (`/oh-my-claudecode:ultraqa`)

**출력:**
- Option A: 배포된 Dify 앱 + API 엔드포인트
- Option B: 프로덕션 코드 + 테스트 통과 보고서

### 자동 라우팅 (Core 스킬)

사용자 요청을 자동으로 분석하여 적절한 스킬로 라우팅:

| 사용자 요청 | 라우팅 대상 |
|-----------|-----------|
| "에이전트 만들어", "Agent 개발", "워크플로우 자동화" | 전체 5단계 순차 실행 |
| "시나리오 생성", "요구사항 정의" | STEP 1: `/abra:scenario` |
| "DSL 생성", "워크플로우 DSL" | STEP 2: `/abra:dsl-generate` |
| "프로토타이핑", "Dify 업로드" | STEP 3: `/abra:prototype` |
| "개발계획서 써줘" | STEP 4: `/abra:dev-plan` |
| "코드 개발", "Agent 구현" | STEP 5: `/abra:develop` |
| "Dify 설치", "Docker 실행" | `/abra:dify-setup` |
| "설정해줘", "초기 설정" | `/abra:setup` |

### 결과 산출물

각 단계 완료 후 `output/` 디렉토리에 다음 파일 생성:

| 파일 | 설명 |
|------|------|
| `scenario.md` | STEP 1에서 선택된 비즈니스 시나리오 |
| `{app-name}.dsl.yaml` | STEP 2에서 생성 & STEP 3에서 검증된 Dify DSL |
| `dev-plan.md` | STEP 4에서 생성된 개발계획서 |
| `{app-name}-code/` | STEP 5-Option B에서 생성된 프로덕션 코드 (Python/Node.js) |
| `test-results.log` | 테스트 실행 결과 |

### 트러블슈팅

**문제 1: Dify 연결 실패**

```bash
Error: Unable to connect to Dify API
```

**해결:**
1. Dify 컨테이너 상태 확인: `docker compose ps`
2. 포트 확인: `curl http://localhost/console/api/health`
3. 접속 정보 재확인: `cat gateway/.env`
4. 플러그인 재설정: `/abra:setup`

**문제 2: DSL 검증 오류**

```bash
Error: DSL validation failed
```

**해결:**
1. DSL 파일 구조 확인: 노드·엣지·변수 유효성
2. Dify DSL 가이드 참조: `agents/dsl-architect/references/dify-workflow-dsl-guide.md`
3. DSL 재생성: `/abra:dsl-generate` 재실행

**문제 3: Dify 프로토타이핑 에러**

```bash
Error: Workflow publish/run failed
```

**해결:**
1. 에러 메시지 확인
2. DSL 수정 (자동 루프에서 처리됨)
3. 도구 의존성 재확인: `gateway/.venv/bin/python gateway/tools/dify_cli.py list`

**문제 4: 의존성 설치 오류**

```bash
Error: pip install failed
```

**해결:**
1. Python 버전 확인: `python --version` (3.10+ 필수)
2. 인터넷 연결 확인
3. 가상환경 재생성: `rm -rf gateway/.venv && /abra:setup`

[Top](#abra--ai-agent-자동-생성-플러그인)

---

## 요구사항

### 시스템 요구사항

| 항목 | 최소 사양 | 권장 사양 |
|------|---------|---------|
| CPU | 2 Core | 4 Core 이상 |
| RAM | 4 GiB | 8 GiB 이상 |
| 디스크 | 5 GiB | 20 GiB 이상 |
| Docker | 20.10+ | 최신 버전 |
| Docker Compose | 2.0+ | 최신 버전 |
| Python | 3.10+ | 3.11+ |

### 소프트웨어 의존성

#### 런타임 (Claude Code)
- DMAP 빌더 표준 지원 버전

#### Dify
- 로컬 Docker Compose 기반 설치
- Docker 이미지 크기: ~3-4 GiB

#### Python 라이브러리 (gateway/requirements.txt)

```
httpx>=0.27.0           # 비동기 HTTP 클라이언트 (Dify API 호출)
python-dotenv>=1.0.0    # 환경 변수 로더 (.env 파일)
pyyaml>=6.0             # YAML 파서 (DSL 검증)
```

### 플러그인 구조

```
abra/
├── .claude-plugin/                 # 플러그인 메타데이터
│   ├── plugin.json
│   └── marketplace.json
├── agents/                         # 5개 에이전트 (scenario-analyst, dsl-architect,
│   │                              #            prototype-runner, plan-writer, agent-developer)
│   ├── scenario-analyst/
│   ├── dsl-architect/
│   ├── prototype-runner/
│   ├── plan-writer/
│   └── agent-developer/
├── skills/                         # 8개 스킬 (core, setup, dify-setup, scenario,
│   │                              #          dsl-generate, prototype, dev-plan, develop)
│   ├── core/
│   ├── setup/
│   ├── dify-setup/
│   ├── scenario/
│   ├── dsl-generate/
│   ├── prototype/
│   ├── dev-plan/
│   └── develop/
├── gateway/                        # 런타임 매핑 및 도구
│   ├── install.yaml
│   ├── runtime-mapping.yaml
│   ├── requirements.txt
│   ├── .env.example
│   └── tools/
│       ├── dify_cli.py
│       ├── dify_client.py
│       ├── config.py
│       └── validate_dsl.py
├── commands/                       # 슬래시 명령 진입점
│   ├── setup.md
│   ├── dify-setup.md
│   ├── scenario.md
│   ├── dsl-generate.md
│   ├── prototype.md
│   ├── dev-plan.md
│   └── develop.md
├── docs/
│   └── develop-plan.md            # 플러그인 개발계획서
└── README.md                       # 본 가이드
```

### 에이전트 구성

| 에이전트 | 역할 | 티어 |
|--------|------|------|
| **scenario-analyst** | 비즈니스 시나리오 분석 및 생성 | MEDIUM |
| **dsl-architect** | Dify Workflow DSL 설계 | HIGH |
| **prototype-runner** | Dify 프로토타이핑 자동화 | MEDIUM |
| **plan-writer** | 개발계획서 작성 | MEDIUM |
| **agent-developer** | AI Agent 구현 | HIGH |

### 스킬 구성

| 스킬 | 유형 | 역할 |
|------|------|------|
| **core** | 핵심스킬 | 의도 분류 및 라우팅 |
| **setup** | 설정스킬 | 플러그인 초기 설정 |
| **dify-setup** | 설정스킬 | Dify 환경 구축 |
| **scenario** | 지휘자스킬 | STEP 1 시나리오 생성 |
| **dsl-generate** | 지휘자스킬 | STEP 2 DSL 자동생성 |
| **prototype** | 지휘자스킬 | STEP 3 프로토타이핑 |
| **dev-plan** | 지휘자스킬 | STEP 4 개발계획서 작성 |
| **develop** | 지휘자스킬 | STEP 5 AI Agent 개발 |

[Top](#abra--ai-agent-자동-생성-플러그인)

---

## 라이선스

Abra 플러그인은 MIT 라이선스 하에 배포됨.

### 저작권

Copyright (c) 2025 Unicorn Inc.

### 라이선스 텍스트

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### 오픈소스 의존성

Abra 플러그인은 다음 오픈소스 소프트웨어를 사용함:

| 라이브러리 | 버전 | 라이선스 |
|-----------|------|---------|
| `httpx` | ≥0.27.0 | BSD |
| `python-dotenv` | ≥1.0.0 | BSD |
| `pyyaml` | ≥6.0 | MIT |
| `Dify` | Latest | AGPL-3.0 |

각 라이브러리의 라이선스 및 저작권 정보는 공식 저장소 참조.

### 기여 및 지원

버그 리포트, 기능 요청, 기여는 다음 경로로:
- GitHub Issues: https://github.com/cna-bootcamp/abra/issues
- GitHub Discussions: https://github.com/cna-bootcamp/abra/discussions

[Top](#abra--ai-agent-자동-생성-플러그인)
