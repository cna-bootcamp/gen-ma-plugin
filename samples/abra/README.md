# Abra

> 자연어 한마디로 AI Agent를 뚝딱 만드는 DMAP 플러그인

- [Abra](#abra)
  - [개요](#개요)
  - [설치](#설치)
  - [사용법](#사용법)
  - [에이전트 구성](#에이전트-구성)
  - [요구사항](#요구사항)
  - [디렉토리 구조](#디렉토리-구조)
  - [라이선스](#라이선스)

---

## 개요

서비스 목적을 자연어로 입력하면 시나리오 생성부터 AI Agent 개발까지
5단계 워크플로우를 자동화하는 DMAP 플러그인.
Dify 플랫폼과 연동하여 DSL 자동 생성, 프로토타이핑, 개발계획서 작성,
프로덕션 코드 구현까지 전 과정을 멀티에이전트가 수행.

**주요 기능:**
- 서비스 목적만 입력하면 다양한 관점의 요구사항 시나리오 N개 자동 생성
- 시나리오 → Dify Workflow DSL(YAML) 자동 변환 및 사전 검증
- DSL → Dify import → publish → run → export 전 과정 자동화
- 검증된 DSL 기반으로 기술스택·아키텍처·테스트 전략 포함 개발계획서 자동 작성
- 개발계획서 기반 프로덕션 AI Agent 코드 구현

**5단계 워크플로우:**
```
STEP 1          STEP 2          STEP 3          STEP 4          STEP 5
비즈니스        Dify DSL        Dify            개발계획서      AI Agent
시나리오 ──────▶ 자동생성 ──────▶ 프로토타이핑 ──▶ 작성 ──────────▶ 개발
```

[Top](#abra)

---

## 설치

### 사전 요구사항
- Claude Code CLI 설치
- Docker + Docker Compose (Dify 실행용)
- Python 3.10+ (gateway 도구 실행용)

### 플러그인 설치

**방법 1: 마켓플레이스 — GitHub (권장)**
```bash
claude plugin marketplace add unicorn-inc/abra
claude plugin install abra@abra
claude plugin list
```

**방법 2: 마켓플레이스 — 로컬**
```bash
claude plugin marketplace add ./abra
claude plugin install abra@abra
claude plugin list
```

**방법 3: 로컬 경로 (세션 단위)**
```bash
claude --plugin-dir ./abra
```

> **설치 후 setup 스킬 실행:**
> ```
> /abra:dify-setup
> /abra:setup
> ```

[Top](#abra)

---

## 사용법

### 슬래시 명령
| 명령 | 설명 |
|------|------|
| `/abra:dify-setup` | Dify Docker 환경 구축 |
| `/abra:setup` | 플러그인 초기 설정 |
| `/abra:scenario` | 요구사항 시나리오 생성 및 선택 |
| `/abra:dsl-generate` | Dify DSL 자동 생성 |
| `/abra:prototype` | Dify 프로토타이핑 자동화 |
| `/abra:dev-plan` | 개발계획서 작성 |
| `/abra:develop` | AI Agent 개발 및 배포 |

### 자연어 트리거
| 입력 예시 | 라우팅 |
|-----------|--------|
| "에이전트 만들어" | → 전체 5단계 시작 |
| "시나리오 생성해줘" | → scenario 스킬 |
| "DSL 만들어줘" | → dsl-generate 스킬 |
| "프로토타이핑 해줘" | → prototype 스킬 |
| "개발계획서 써줘" | → dev-plan 스킬 |
| "코드 개발해줘" | → develop 스킬 |

[Top](#abra)

---

## 에이전트 구성
| 에이전트 | 티어 | 역할 |
|----------|------|------|
| scenario-analyst | MEDIUM | 비즈니스 요구사항 → 구조화된 시나리오 |
| dsl-architect | HIGH | 시나리오 → Dify DSL YAML 설계·생성 |
| prototype-runner | MEDIUM | DSL → Dify 프로토타이핑 (자동 에러 수정) |
| plan-writer | MEDIUM | DSL + 요구사항 → 개발계획서 |
| agent-developer | HIGH | 개발계획서 → 프로덕션 코드 구현 |

[Top](#abra)

---

## 요구사항

### 필수 도구
| 도구 | 유형 | 용도 |
|------|------|------|
| Docker + Docker Compose | Custom | Dify 로컬 환경 실행 |
| Python 3.10+ | Custom | gateway 도구 실행 |

### 런타임 호환성
| 런타임 | 지원 |
|--------|:----:|
| Claude Code | ✅ |
| Codex CLI | 미검증 |
| Gemini CLI | 미검증 |

[Top](#abra)

---

## 디렉토리 구조
```
abra/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── skills/
│   ├── orchestrate/SKILL.md
│   ├── dify-setup/SKILL.md
│   ├── setup/SKILL.md
│   ├── scenario/SKILL.md
│   ├── dsl-generate/SKILL.md
│   ├── prototype/SKILL.md
│   ├── dev-plan/SKILL.md
│   └── develop/SKILL.md
├── agents/
│   ├── scenario-analyst/   (AGENT.md, agentcard.yaml, tools.yaml, references/)
│   ├── dsl-architect/      (AGENT.md, agentcard.yaml, tools.yaml, references/)
│   ├── prototype-runner/   (AGENT.md, agentcard.yaml, tools.yaml)
│   ├── plan-writer/        (AGENT.md, agentcard.yaml, tools.yaml, references/)
│   └── agent-developer/    (AGENT.md, agentcard.yaml, tools.yaml, references/)
├── gateway/
│   ├── install.yaml
│   ├── runtime-mapping.yaml
│   ├── mcp/context7.json
│   ├── requirements.txt
│   └── tools/
│       ├── dify_cli.py
│       ├── dify_client.py
│       ├── config.py
│       └── validate_dsl.py
├── commands/
│   ├── dify-setup.md
│   ├── setup.md
│   ├── scenario.md
│   ├── dsl-generate.md
│   ├── prototype.md
│   ├── dev-plan.md
│   └── develop.md
├── docs/
│   └── develop-plan.md
└── README.md
```

[Top](#abra)

---

## 라이선스
MIT License - Unicorn Inc.

[Top](#abra)
