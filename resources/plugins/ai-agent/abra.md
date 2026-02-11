# abra 플러그인 명세

- [abra 플러그인 명세](#abra-플러그인-명세)
  - [기본 정보](#기본-정보)
  - [제공 스킬](#제공-스킬)
  - [실행 경로](#실행-경로)
  - [ARGS 스키마](#args-스키마)
    - [scenario 스킬 ARGS](#scenario-스킬-args)
    - [dev-plan 스킬 ARGS](#dev-plan-스킬-args)
  - [도메인 컨텍스트 수집 가이드](#도메인-컨텍스트-수집-가이드)
  - [선행 요구사항](#선행-요구사항)
  - [호출 예시](#호출-예시)
    - [Full Path (scenario → dev-plan → develop)](#full-path-scenario--dev-plan--develop)
    - [Short Path (dev-plan → develop)](#short-path-dev-plan--develop)

---

## 기본 정보

| 항목 | 값 |
|------|---|
| 플러그인명 | abra |
| 설명 | Dify 워크플로우 기반 AI Agent 개발 자동화 |
| 설치 | `claude plugin add unicorn-plugins/abra` |
| 저장소 | https://github.com/unicorn-plugins/abra |

[Top](#abra-플러그인-명세)

---

## 제공 스킬

| 스킬 | FQN | 유형 | 설명 |
|------|-----|------|------|
| scenario | `abra:scenario` | Orchestrator | 요구사항 시나리오 생성 및 선택 |
| dsl-generate | `abra:dsl-generate` | Orchestrator | Dify DSL 자동생성 |
| prototype | `abra:prototype` | Orchestrator | Dify 프로토타이핑 자동화 |
| dev-plan | `abra:dev-plan` | Orchestrator | 개발계획서 작성 |
| develop | `abra:develop` | Orchestrator | AI Agent 개발 및 배포 |

[Top](#abra-플러그인-명세)

---

## 실행 경로

| 경로명 | 설명 | 스킬 체인 | 조건 |
|--------|------|----------|------|
| Full Path | Dify 워크플로우 포함 5단계 | scenario → dsl-generate → prototype → dev-plan → develop | Dify 워크플로우가 필요한 경우 |
| Short Path | 코드 기반 2단계 | dev-plan → develop | 코드 개발만 필요한 경우 (Dify 워크플로우 불필요) |

[Top](#abra-플러그인-명세)

---

## ARGS 스키마

External 스킬이 이 플러그인의 스킬을 호출할 때 전달 가능한 ARGS 키.
Skill→Skill 입력 전달 규약에 따라 `ARGS` 루트 키 아래에 JSON 구조로 전달.

### scenario 스킬 ARGS

| 키 | 필수 | 설명 |
|----|------|------|
| source_plugin | ✅ | 호출자 플러그인 식별 |
| service_purpose | ✅ | 서비스 목적 |
| count | 선택 | 생성할 시나리오 수 (기본 3) |
| project_dir | ✅ | 프로젝트 디렉토리 |
| domain_context | 선택 | 도메인 컨텍스트 |
| requirement | 선택 | 요구사항 |
| references | 선택 | 참고 자료 |

### dev-plan 스킬 ARGS

| 키 | 필수 | 설명 |
|----|------|------|
| source_plugin | ✅ | 호출자 플러그인 식별 |
| domain_context | 선택 | 도메인 컨텍스트 |
| service_purpose | 선택 | 서비스 목적 |
| requirement | 선택 | 요구사항 |
| references | 선택 | 참고 자료 |
| project_dir | ✅ | 프로젝트 디렉토리 |
| allowed_options | 선택 | 기술스택 옵션 제한 (예: `[B, C]`) |
| no_workflow | 선택 | `true` 시 DSL/시나리오 검증 스킵 (Short Path용) |

[Top](#abra-플러그인-명세)

---

## 도메인 컨텍스트 수집 가이드

이 플러그인을 호출하는 External 스킬이 수집해야 할 도메인 컨텍스트:

| 수집 대상 | 소스 | 용도 |
|----------|------|------|
| 플러그인 메타데이터 | `.claude-plugin/plugin.json` | 플러그인명, 설명 |
| 에이전트 정보 | `agents/*/AGENT.md` | 에이전트 역할 파악 |
| 요구사항 | `output/requirement-{name}.md` 또는 사용자 입력 | 서비스 요구사항 |
| 참고 자료 | `resources/` 또는 사용자 제공 | 도메인 지식 |

[Top](#abra-플러그인-명세)

---

## 선행 요구사항

- abra 플러그인 설치 필수 (`claude plugin add unicorn-plugins/abra`)
- Dify 프로토타이핑 시 Dify 서버 접근 필요 (Full Path만 해당)

[Top](#abra-플러그인-명세)

---

## 호출 예시

### Full Path (scenario → dev-plan → develop)

**Phase 3-1: scenario 호출**

→ Skill: abra:scenario

- **INTENT**: 요구사항 시나리오 생성
- **ARGS**: {
    "source_plugin": "{호출자 플러그인명}",
    "service_purpose": "{서비스 목적}",
    "project_dir": "{프로젝트 디렉토리}",
    "domain_context": "{수집된 도메인 컨텍스트}",
    "requirement": "{요구사항}",
    "references": "{참고 자료}"
  }
- **RETURN**: 시나리오 파일 생성 완료

**Phase 3-2: dev-plan 호출**

→ Skill: abra:dev-plan

- **INTENT**: 개발계획서 작성
- **ARGS**: {
    "source_plugin": "{호출자 플러그인명}",
    "project_dir": "{프로젝트 디렉토리}",
    "domain_context": "{수집된 도메인 컨텍스트}"
  }
- **RETURN**: 개발계획서 파일 생성 완료

**Phase 3-3: develop 호출**

→ Skill: abra:develop

- **INTENT**: AI Agent 개발 및 배포
- **ARGS**: {
    "source_plugin": "{호출자 플러그인명}",
    "project_dir": "{프로젝트 디렉토리}"
  }
- **RETURN**: Agent 개발 및 배포 완료

### Short Path (dev-plan → develop)

**Phase 3-1: dev-plan 호출**

→ Skill: abra:dev-plan

- **INTENT**: 개발계획서 작성 (코드 기반)
- **ARGS**: {
    "source_plugin": "{호출자 플러그인명}",
    "project_dir": "{프로젝트 디렉토리}",
    "domain_context": "{수집된 도메인 컨텍스트}",
    "no_workflow": "true",
    "allowed_options": ["B", "C"]
  }
- **RETURN**: 개발계획서 파일 생성 완료

**Phase 3-2: develop 호출**

→ Skill: abra:develop

- **INTENT**: AI Agent 개발 및 배포
- **ARGS**: {
    "source_plugin": "{호출자 플러그인명}",
    "project_dir": "{프로젝트 디렉토리}"
  }
- **RETURN**: Agent 개발 및 배포 완료

[Top](#abra-플러그인-명세)
