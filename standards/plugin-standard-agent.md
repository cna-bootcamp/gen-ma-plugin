# Agent 표준

> **교차 참조**: 아래 상황에서 추가 문서를 로드할 것.
> - config.yaml의 forbidden_actions 매핑이 필요하면 → `standards/plugin-standard-gateway.md`
> - 에이전트를 호출하는 스킬을 함께 작성해야 하면 → `standards/plugin-standard-skill.md`
> - tier의 실제 모델 변환이 필요하면 → `standards/plugin-standard-gateway.md`의 "runtime-mapping.yaml" 섹션
> - 전체 아키텍처 확인이 필요하면 → `standards/plugin-standard.md`

---

## 한 줄 정의

에이전트(Agent)는 스킬로부터 위임받은 작업을 자율적으로 수행하는 Service 레이어의 전문가 단위이며, 독립된 디렉토리 패키지(AGENT.md + config.yaml)로 구성됨.

[Top](#agent-표준)

---

## MUST 규칙

| # | 규칙 |
|---|------|
| 1 | 에이전트는 AGENT.md(프롬프트) + config.yaml(메타데이터) 쌍으로 구성 |
| 2 | config.yaml에 name, version, tier, capabilities, handoff 필수 포함 |
| 3 | tier는 HIGH / MEDIUM / LOW 중 하나 |
| 4 | 하나의 에이전트는 하나의 전문 역할만 담당 (역할 단일성) |
| 5 | 역할 밖 요청은 handoff로 적절한 에이전트에 위임 |
| 6 | AGENT.md에 역할/워크플로우/출력형식/검증 섹션 포함 |
| 7 | forbidden_actions는 블랙리스트 방식 (나열되지 않은 것은 허용) |
| 8 | 티어 변형 에이전트는 inherits로 기본 에이전트 상속, 오버라이드만 기술 |

[Top](#agent-표준)

---

## MUST NOT 규칙

| # | 금지 사항 |
|---|----------|
| 1 | AGENT.md에 도구 명세(도구명, 파라미터, 호출방법) 기술 금지 — tools.yaml에 분리 |
| 2 | AGENT.md에 모델명 하드코딩 금지 — tier로 추상화 |
| 3 | 에이전트가 직접 라우팅/오케스트레이션 수행 금지 |
| 4 | config.yaml에 프롬프트 성격 내용(워크플로우, 출력형식) 포함 금지 |

[Top](#agent-표준)

---

## 에이전트 디렉토리 구조

```text
agents/{agent_name}/
├── AGENT.md          # [필수] 프롬프트 전문 (역할, 워크플로우, 출력형식, 검증, 예시)
├── config.yaml       # [필수] 역량·제약·핸드오프 선언 (기계 판독용)
├── tools.yaml        # [선택] 필요 도구 인터페이스 명세
├── budget.yaml       # [선택] 실행 자원 예산 (토큰, 파일 수, 타임아웃 등)
├── references/       # [선택] 전문 지식, 가이드라인, 참조 문서
│   ├── guidelines/
│   └── docs/
└── templates/        # [선택] 출력 포맷 규격
```

[Top](#agent-표준)

---

## 에이전트 설계 원칙

### 역할 단일성

| 원칙 | 설명 | 예시 |
|------|------|------|
| 단일 역할 | 하나의 전문 영역에 집중 | architect = 분석·설계만, 코드 수정 안 함 |
| 명확한 경계 | "나는 무엇이다 / 무엇이 아니다" 선언 | executor = 코드 작성, 요구사항 수집은 안 함 |
| 핸드오프 규칙 | 자기 역할 밖의 요청은 적절한 에이전트로 위임 | architect → executor로 구현 위임 |

### 자율성과 캡슐화

| 원칙 | 설명 |
|------|------|
| **사고 자율성** | 에이전트는 자신의 워크플로우에 따라 독립적으로 판단 |
| **도구 자율성** | 허용된 도구 범위 내에서 어떤 도구를 언제 쓸지 스스로 결정 |
| **캡슐화** | 내부 사고 과정은 외부에 노출하지 않고, 결과만 반환 |
| **이동성** | 에이전트 파일(또는 디렉토리)을 다른 프로젝트에 복사해도 동작 |

[Top](#agent-표준)

---

## 3-Tier 모델

동일한 역할을 **비용과 역량** 기준으로 티어별 변형 에이전트로 분리함.
이는 자원의 비용-역량 트레이드오프를 최적화하는 범용 원칙임.

### 티어 특성

| 티어 | 특성 | 적합한 작업 |
|------|------|------------|
| **LOW** | 빠르고 저비용, 단순 작업 전용 | 단건 조회, 간단한 수정, 빠른 검색 |
| **MEDIUM** | 균형잡힌 성능 | 기능 구현, 탐색, 일반 분석 |
| **HIGH** | 최고 능력, 고비용 | 복잡한 의사결정, 심층 분석, 대규모 작업 |

### 도메인별 티어 적용 예시

| 도메인 | LOW | MEDIUM | HIGH |
|--------|-----|--------|------|
| LLM 모델 | Haiku | Sonnet | Opus |
| 클라우드 인프라 | t2.micro | m5.large | p3.xlarge |
| 고객 지원 | L1 스크립트 응대 | L2 전문가 | L3 엔지니어 |
| 검토 수준 | 자동 검사 | 담당자 검토 | 전문가 위원회 |

### 에스컬레이션 원칙

LOW 티어가 처리할 수 없는 복잡도를 감지하면 스스로 작업을 중단하고 상위 티어로의 에스컬레이션을 보고함.
이 원칙은 자원 낭비를 방지하면서 품질을 보장하는 핵심 메커니즘임.

[Top](#agent-표준)

---

## AGENT.md 표준

AGENT.md는 **에이전트의 전체 프롬프트**를 마크다운으로 작성하는 파일.
Frontmatter(식별 메타데이터) + Markdown Content(프롬프트 본문)로 구성됨.
런타임이 이 파일을 읽어 프롬프트로 주입함.

### Frontmatter

```yaml
---
name: my-agent                     # 에이전트 식별자 (디렉토리명과 일치)
description: 에이전트 역할 설명      # 역할 요약 (한 줄)
---
```

### 프롬프트 구성

| 섹션 | 필수 | 내용 |
|------|:----:|------|
| 역할 및 지시 | ✅ | 에이전트의 역할, 행동 원칙, 지시사항 (산문) |
| 워크플로우 | ✅ | 사고 절차 — 순서대로 수행할 단계 |
| 출력 형식 | 권장 | 결과물의 구조와 형식 |
| 검증 | 권장 | 완료 전 자체 점검 항목 |
| 예시 (Few-shot) | 선택 | 입력/출력 예시로 기대 품질 시연 |

### 작성 원칙

- AGENT.md는 **프롬프트 전문** — 사람과 LLM 모두 읽을 수 있는 마크다운
- **도구 명세 금지** — 실행할 도구의 이름, 파라미터, 호출 방법 등을 프롬프트에 기술하지 않음. 도구 인터페이스는 `tools.yaml`에, 도구 제약은 `config.yaml`에 분리함
- 런타임 설정(모델, 도구 제한 등)은 `config.yaml`에 분리
- 런타임이 AGENT.md를 통째로 읽어 프롬프트로 주입 (system prompt 등)

[Top](#agent-표준)

---

## config.yaml 표준

에이전트의 **역량·제약·핸드오프**를 정형 데이터로 선언함.
오케스트레이터가 에이전트 소환 전 역량을 기계적으로 검토 가능.
워크플로우·출력 형식·검증 등 프롬프트 성격의 내용은 `AGENT.md`에 기술함.

### 표준 필드 구성

config.yaml은 YAML 주석(`#`)을 활용하여 **자체 문서화**됨.

```yaml
# ─────────────────────────────────────────────
# 식별 (AGENT.md Frontmatter와 동일)
# ─────────────────────────────────────────────
name: "my-agent"                       # 에이전트 식별자
version: "1.0.0"                       # 에이전트 버전

# ─────────────────────────────────────────────
# 티어 (역량 요구 수준)
# ─────────────────────────────────────────────
tier: HIGH                             # LOW / MEDIUM / HIGH
                                       # 실제 모델 매핑은 런타임 환경이 결정

# ─────────────────────────────────────────────
# 상속 (선택 — 티어 변형 에이전트용)
#   기본 에이전트의 설정을 상속받고,
#   이 파일에 기술된 필드만 오버라이드
# ─────────────────────────────────────────────
# inherits: architect                  # 상속 대상 에이전트 이름

# ─────────────────────────────────────────────
# 역량 (에이전트 프로필)
#   오케스트레이터는 이 섹션만 읽으면
#   에이전트의 전체 프로필을 파악 가능
# ─────────────────────────────────────────────
capabilities:
  # 역할 — 무엇을 하는가 (산문)
  role: |
    시스템 아키텍트.
    코드를 분석하고, 설계를 자문하고, 구현 방향을 제시함.
    직접 코드를 작성하거나 수정하지 않음.

  # 정체성 — 무엇이다 / 무엇이 아니다 (구조화)
  identity:
    is:
      - 코드 분석가
      - 구현 검증자
      - 아키텍처 자문가
    is_not:
      - 요구사항 수집가
      - 계획 작성자
      - 코드 작성자

  # 제약 — 무엇을 못 하는가 (구조화)
  restrictions:
    forbidden_actions: ["file_write", "file_delete"]

# ─────────────────────────────────────────────
# 핸드오프 (역할 경계)
# ─────────────────────────────────────────────
handoff:
  - target: executor
    when: "코드 수정 필요"
    reason: "직접 수정 권한 없음"
  - target: tdd-guide
    when: "테스트 작성 필요"
    reason: "테스트 전문가에게 위임"

# ─────────────────────────────────────────────
# 에스컬레이션 (선택 — 티어 변형 에이전트용)
#   현재 에이전트의 역량을 초과하는 상황 목록.
#   해당 조건 충족 시 상위 티어 에이전트로 위임.
# ─────────────────────────────────────────────
# escalation:
#   - "다중 파일 분석 필요"
#   - "아키텍처 의사결정 필요"
```

### 필드 분류

| 분류 | 필드 | 필수 | 설명 |
|------|------|:----:|------|
| **식별** | `name`, `version` | ✅ | 에이전트 식별 및 버전 관리 |
| **티어** | `tier` | ✅ | 역량 요구 수준 (LOW / MEDIUM / HIGH), 실제 모델 매핑은 런타임이 결정 |
| **상속** | `inherits` | 선택 | 기본 에이전트 이름. 티어 변형 에이전트가 상위 설정을 상속받을 때 사용 |
| **역량** | `capabilities` | ✅ | 에이전트 프로필 컨테이너 (하위에 role, identity, restrictions 포함) |
| ↳ 역할 | `capabilities.role` | ✅ | 무엇을 하는가 (산문) |
| ↳ 정체성 | `capabilities.identity` | ✅ | 무엇이다 / 무엇이 아니다 (구조화) |
| ↳ 제약 | `capabilities.restrictions` | 권장 | 금지 액션, 예산 한도 등 (구조화) |
| **경계** | `handoff` | ✅ | 핸드오프 대상, 조건, 사유 |
| **에스컬레이션** | `escalation` | 선택 | 상위 티어로 위임하는 조건 목록. 티어 변형 에이전트에서 사용 |

> **확장 지침**: 플러그인별로 필요한 필드를 자유롭게 추가 가능.
> YAML 주석으로 필드 용도를 설명하여 자체 문서화를 유지함.

### 표준 액션 카테고리

`forbidden_actions`에 사용할 **추상 액션 카테고리** 목록.
런타임 환경이 각 카테고리를 실제 도구/권한에 매핑함.
(`tier`와 동일한 철학 — 표준은 의미를 정의하고, 구현은 런타임이 결정)

| 카테고리 | 의미 | 런타임 매핑 예시 |
|----------|------|-----------------|
| `file_read` | 파일 읽기 | Claude Code: `Read`, `Glob` |
| `file_write` | 파일 생성·수정 | Claude Code: `Write`, `Edit` |
| `file_delete` | 파일·디렉토리 삭제 | Claude Code: `Bash(rm)` |
| `code_execute` | 코드·명령 실행 | Claude Code: `Bash` |
| `network_access` | 외부 네트워크 요청 | Claude Code: `WebFetch`, `WebSearch` |
| `user_interact` | 사용자에게 직접 질문 | Claude Code: `AskUserQuestion` |
| `agent_delegate` | 다른 에이전트 호출 | Claude Code: `Task` |
| `state_mutate` | 외부 상태 변경 (DB, API 등) | 도메인별 도구 매핑 |

> **작성 가이드**:
> - 에이전트가 **하지 말아야 할 행위**만 `forbidden_actions`에 나열
> - 나열되지 않은 카테고리는 **허용**으로 간주 (블랙리스트 방식)
> - 플러그인별 도메인 카테고리 추가 가능 (예: `db_write`, `deploy`, `payment`)
> - 런타임 매핑 테이블은 **gateway 계층**에서 정의 (추상 카테고리 → 실제 도구 변환)

[Top](#agent-표준)

---

## tools.yaml 표준

에이전트가 **필요로 하는 도구의 인터페이스 명세**.
런타임이 이 파일을 읽어 Gateway의 매핑 테이블을 참조하여 실제 도구를 매칭·제공함.

```yaml
# 에이전트가 필요로 하는 도구 선언
# 런타임이 Gateway의 runtime-mapping.yaml을 참조하여 실제 도구에 매핑
tools:
  - name: file_read
    description: "파일 내용 읽기"
    input: { path: string }
    output: { content: string }

  - name: code_search
    description: "코드베이스에서 패턴 검색"
    input: { pattern: string, scope: string }
    output: { matches: list }

  - name: code_diagnostics
    description: "파일의 오류·경고 조회"
    input: { path: string }
    output: { errors: list, warnings: list }
```

### 작성 가이드

- 추상 인터페이스만 기술 — 구현(MCP, LSP 등)은 런타임이 결정
- 런타임이 `tools.yaml`의 선언과 Gateway의 `runtime-mapping.yaml`을 매칭하여 실제 도구 제공
- 미선언 도구는 에이전트에 제공되지 않음 (화이트리스트 방식)

[Top](#agent-표준)

---

## budget.yaml 표준

에이전트의 **실행 자원 예산**을 정의하는 파일.
런타임이 이 예산을 기반으로 에이전트 실행을 제어함.

```yaml
max_token_per_run: 8192        # 1회 실행 당 최대 토큰
max_files: 10                  # 탐색 가능한 최대 파일 수
max_concurrent_tasks: 3        # 동시 실행 가능한 하위 작업 수
timeout_seconds: 300           # 실행 제한 시간
```

### 작성 가이드

- 티어 변형 에이전트는 기본 에이전트 대비 축소된 예산만 오버라이드
  (예: architect-low → `max_files: 5`, `max_token_per_run: 4096`)
- 미지정 필드는 런타임 기본값 적용
- 파일이 없으면 런타임 기본 예산으로 실행

[Top](#agent-표준)

---

## 에이전트 이름 규칙

공식 표준에서 네임스페이스는 스킬에만 적용되지만, 오케스트레이션 플러그인(예: OMC)은 `Task` 도구로 에이전트를 호출할 때 **자체 네이밍 규칙**을 적용함.

OMC는 `agents/` 디렉토리를 재귀 탐색하여 `.md` 파일을 발견하고,
**`{plugin-name}:{디렉토리명}:{frontmatter-name}`** 형식으로 등록함.

| 디렉토리 | AGENT.md의 name | Task 호출 시 이름 |
|----------|----------------|------------------|
| `scenario-analyst/` | `scenario-analyst` | `abra:scenario-analyst:scenario-analyst` |
| `dsl-architect/` | `dsl-architect` | `abra:dsl-architect:dsl-architect` |

> **주의**: 디렉토리명과 frontmatter name이 동일하면 `{plugin}:{name}:{name}`처럼
> 이름이 중복되어 보일 수 있음. 이는 OMC의 디렉토리 기반 탐색 방식 때문이며,
> 에이전트 호출 시 반드시 **전체 이름(fully qualified name)**을 사용해야 함.

```python
# 스킬에서 에이전트 호출 예시
Task(
    subagent_type="abra:scenario-analyst:scenario-analyst",
    model="opus",
    prompt="시나리오를 분석해주세요..."
)
```

[Top](#agent-표준)

---

## 표준 템플릿

### 기본 에이전트 (architect/)

**`architect/AGENT.md`** — 프롬프트 전문:

````markdown
---
name: architect
description: 시스템 아키텍처 분석 및 설계 자문
---

# Architect

시스템 아키텍트. 코드를 분석하고 설계를 자문함.
직접 코드를 작성하거나 수정하지 않음.

## 워크플로우

1. 대상 코드/시스템 구조 파악
2. 문제점 또는 개선 기회 식별
3. 해결 방안 제시 (복수 대안 + 트레이드오프)
4. 권장안 선택 근거 설명

## 출력 형식

1. 현황 요약
2. 문제점/개선 기회
3. 권장안 + 근거

## 검증

- 분석 대상 파일 모두 읽었는지 확인
- 권장안의 트레이드오프를 명시했는지 확인
````

**`architect/config.yaml`** — 기계 판독용 선언:

```yaml
name: "architect"
version: "1.0.0"
tier: HIGH                             # 높은 추론 능력 필요

capabilities:
  role: |
    시스템 아키텍트. 코드를 분석하고, 설계를 자문하고, 구현 방향을 제시함.
    직접 코드를 작성하거나 수정하지 않음.
  identity:
    is: ["코드 분석가", "구현 검증자", "아키텍처 자문가"]
    is_not: ["코드 작성자", "요구사항 수집가"]
  restrictions:
    forbidden_actions: ["file_write", "file_delete"]

handoff:
  - target: executor
    when: "코드 수정 필요"
    reason: "직접 수정 권한 없음"
  - target: tdd-guide
    when: "테스트 작성 필요"
    reason: "테스트 전문가에게 위임"
```

### 티어 변형 에이전트 (architect-low/)

기본 에이전트를 상속하여 티어별 역할 범위를 조정:

**`architect-low/AGENT.md`** — 축소된 역할 프롬프트:

````markdown
---
name: architect-low
description: 간단한 코드 질문 및 조회 (경량)
---

# Architect (경량)

architect의 경량 변형. 빠르고 간단한 분석에 특화.
복잡한 분석이 필요하면 상위 티어(architect)로 에스컬레이션.

## 워크플로우

1. 대상 코드 빠르게 파악
2. 간단한 질문에 즉시 답변

## 출력 형식

간결한 1~2문장으로 답변.
````

**`architect-low/config.yaml`**:

```yaml
name: "architect-low"
version: "1.0.0"
tier: LOW                              # 빠르고 저비용
inherits: architect                    # 기본 에이전트 상속

# 아래는 기본 에이전트 대비 오버라이드만 기술
capabilities:
  role: |
    architect의 경량 변형. 빠르고 간단한 분석에 특화.
  restrictions:
    forbidden_actions: ["file_write", "file_delete"]

# 에스컬레이션 기준 — 상위 티어(architect)로 보고
escalation:
  - "다중 파일 분석 필요"
  - "아키텍처 의사결정 필요"
  - "5개 이상 파일 탐색 필요"
```

### 티어 변형 에이전트 패키지 구조

```text
agents/
├── architect/            # 기본 에이전트 (HIGH)
│   ├── AGENT.md
│   ├── config.yaml
│   └── references/
├── architect-low/        # 티어 변형 (LOW)
│   ├── AGENT.md          # 상속 선언 + 범위 축소만 기술
│   └── config.yaml       # 모델(haiku), 축소된 역량만 오버라이드
└── architect-medium/     # 티어 변형 (MEDIUM)
    ├── AGENT.md
    └── config.yaml
```

> **상속 원칙**: 티어 변형 에이전트는 `references/`, `templates/`를 자체 보유하지 않고
> 기본 에이전트의 것을 참조함. `AGENT.md`에 `상속: architect` 선언으로 연결.

[Top](#agent-표준)

---

## 검증 체크리스트

- [ ] AGENT.md에 Frontmatter(name, description) 포함
- [ ] config.yaml에 name, version, tier, capabilities, handoff 포함
- [ ] AGENT.md에 도구명/모델명 하드코딩 없음
- [ ] capabilities.identity에 is/is_not 구분됨
- [ ] handoff에 target, when, reason 포함
- [ ] 티어 변형이면 inherits 필드 + escalation 목록 포함
- [ ] 역할 단일성: 하나의 전문 역할에만 집중
- [ ] tools.yaml 선언 도구가 Gateway의 runtime-mapping.yaml에 매핑됨

[Top](#agent-표준)
