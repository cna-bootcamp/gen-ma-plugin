# gen-ai-curriculum

- [gen-ai-curriculum](#gen-ai-curriculum)
  - [기본 정보](#기본-정보)
  - [제공 스킬](#제공-스킬)
  - [실행 경로](#실행-경로)
  - [ARGS 스키마](#args-스키마)
  - [도메인 컨텍스트 수집 가이드](#도메인-컨텍스트-수집-가이드)
  - [선행 요구사항](#선행-요구사항)
  - [호출 예시](#호출-예시)

---

## 기본 정보

| 항목 | 값 |
|------|---|
| 플러그인명 | gen-ai-curriculum |
| 버전 | 1.0.1 |
| 설명 | 교재 분석 기반 AI교육 커리큘럼 자동 생성 DMAP 플러그인 |
| 카테고리 | education |
| 저장소 | `unicorn-inc/gen-ai-curriculum` |
| 라이선스 | MIT |
| 제작자 | Unicorn Inc. |

**설치 명령:**

```bash
# GitHub 마켓플레이스
claude plugin marketplace add unicorn-inc/gen-ai-curriculum
claude plugin install gen-ai-curriculum@gen-ai-curriculum

# 로컬 마켓플레이스
claude plugin marketplace add ./gen-ai-curriculum
claude plugin install gen-ai-curriculum@gen-ai-curriculum
```

**주요 기능:**

- 교재 파일(Markdown) 분석 및 구조화된 분석 체계 추천
- 교육 대상/형태/차별성 반영한 맞춤형 커리큘럼 생성
- 골든써클 접근법 기반 PPTX 프리젠테이션 자동 생성 (4가지 테마 지원)

[Top](#gen-ai-curriculum)

---

## 제공 스킬

| 스킬명 | FQN | 유형 | 설명 |
|--------|-----|------|------|
| core | `gen-ai-curriculum:core` | system | 시스템 행동 규범 및 의도 라우팅 |
| setup | `gen-ai-curriculum:setup` | user-invocable | 플러그인 초기 설정 (도구 설치) |
| help | `gen-ai-curriculum:help` | user-invocable | 사용 안내 |
| generate-curriculum | `gen-ai-curriculum:generate-curriculum` | user-invocable | 교재 분석 → 커리큘럼 생성 → 프리젠테이션 작성 |
| add-ext-skill | `gen-ai-curriculum:add-ext-skill` | user-invocable (utility) | 외부호출 스킬(ext-{대상플러그인}) 추가 |
| remove-ext-skill | `gen-ai-curriculum:remove-ext-skill` | user-invocable (utility) | 외부호출 스킬(ext-{대상플러그인}) 제거 |

**에이전트 구성:**

| 에이전트 | FQN | 티어 | 역할 |
|----------|-----|------|------|
| textbook-analyst | `gen-ai-curriculum:textbook-analyst:textbook-analyst` | HIGH | 교재 파일 분석 및 구조화된 분석 체계 추천 |
| curriculum-writer | `gen-ai-curriculum:curriculum-writer:curriculum-writer` | HIGH | 분석 결과 기반 커리큘럼 수행 계획서 및 커리큘럼 작성 |
| presentation-writer | `gen-ai-curriculum:presentation-writer:presentation-writer` | MEDIUM | 프리젠테이션 기획(골든써클) 및 PPTX 생성 |

[Top](#gen-ai-curriculum)

---

## 실행 경로

| 경로명 | 설명 | 스킬 체인 | 트리거 조건 |
|--------|------|----------|------------|
| 커리큘럼 생성 | 교재 분석부터 PPTX 생성까지 4-Phase 워크플로우 | `core` → `generate-curriculum` → Agent(`textbook-analyst` → `curriculum-writer` → `presentation-writer`) | "커리큘럼 만들어줘", "교재 분석", "커리큘럼 생성", "프리젠테이션" |
| 초기 설정 | 도구 설치 및 환경 설정 | `core` → `setup` | "설정", "설치", "setup" |
| 사용 안내 | 명령 목록 및 자동 라우팅 규칙 안내 | `core` → `help` | "도움말", "뭘 할 수 있어", "help" |
| 외부호출 스킬 추가 | ext-{대상플러그인} 스킬 자동 생성 | `add-ext-skill` (직접 호출) | `/gen-ai-curriculum:add-ext-skill` |
| 외부호출 스킬 제거 | ext-{대상플러그인} 스킬 삭제 | `remove-ext-skill` (직접 호출) | `/gen-ai-curriculum:remove-ext-skill` |

**커리큘럼 생성 경로 상세 (4-Phase):**

| Phase | 담당 | 작업 | 산출물 |
|-------|------|------|--------|
| Phase 1: 정보 수집 | 스킬 (직접 수행) | 교육 대상, 교육 형태, 차별성, 교재 경로 수집 | 수집 정보 요약 |
| Phase 2: 교재 분석 | Agent: textbook-analyst | 교재 전체 분석, 분석 체계 3개 추천 → 사용자 승인 | 구조화된 교재 분석 결과 보고서 |
| Phase 3: 커리큘럼 생성 | Agent: curriculum-writer | 수행 계획서 작성 → 사용자 승인 → 세부 커리큘럼 생성 | 수행 계획서 + 세부 커리큘럼 (Markdown) |
| Phase 4: 프리젠테이션 작성 | Agent: presentation-writer | PPT 스타일 사용자 문의 → 골든써클 기획서 → 사용자 승인 → PPTX 생성 | 골든써클 기획서 + PPTX 파일 |

[Top](#gen-ai-curriculum)

---

## ARGS 스키마

### generate-curriculum

| ARGS 키 | 필수 | 타입 | 설명 |
|---------|:----:|------|------|
| `교육_대상` | 필수 | string | 교육 대상 (PM/PO, 기획자, 개발자 등) |
| `교육_형태` | 필수 | string | 일회성 특강 / 정식교육 |
| `교육_시간` | 조건부 | string | 일회성 특강: 시간, 정식교육: 일수 및 하루 시수 |
| `차별성` | 필수 | string | 커리큘럼에 반영할 차별성 요소 |
| `교재_파일_경로` | 필수 | string | 분석 대상 교재 파일 경로 (Markdown) |

> Phase 1에서 AskUserQuestion으로 대화형 수집함.
> External 스킬에서 위임 시 ARGS로 사전 전달 가능.

### setup

별도 ARGS 없음. `gateway/install.yaml` 기반 자동 수행.

### help

별도 ARGS 없음. 하드코딩된 명령 목록 즉시 출력.

### add-ext-skill

| ARGS 키 | 필수 | 타입 | 설명 |
|---------|:----:|------|------|
| `대상_플러그인` | 선택 | string | 추가할 대상 플러그인명 (미지정 시 대화형 선택) |

### remove-ext-skill

| ARGS 키 | 필수 | 타입 | 설명 |
|---------|:----:|------|------|
| `대상_ext_스킬` | 선택 | string | 제거할 ext-{대상플러그인} 스킬명 (미지정 시 대화형 선택) |

[Top](#gen-ai-curriculum)

---

## 도메인 컨텍스트 수집 가이드

External 스킬이 gen-ai-curriculum에 위임하기 전 수집해야 할 도메인 컨텍스트:

| 수집 대상 | 소스 | 용도 | 필수 |
|-----------|------|------|:----:|
| 교재 파일 (Markdown) | 사용자 프로젝트 내 교재 문서 | Phase 2 교재 분석 입력 | 필수 |
| 교육 대상 | 사용자 요구사항 정의서 또는 직접 입력 | 커리큘럼 맞춤화 기준 | 필수 |
| 교육 형태 | 사용자 요구사항 정의서 또는 직접 입력 | 일회성 특강 / 정식교육 분기 | 필수 |
| 교육 시간 | 사용자 직접 입력 | 커리큘럼 분량 결정 | 조건부 |
| 차별성 요소 | 사용자 요구사항 정의서 또는 직접 입력 | 커리큘럼 차별화 반영 | 필수 |
| PPT 스타일 | 사용자 직접 입력 | 테마, 강조색, 배경색 반영 | 선택 |

> **수집 시점:** External 스킬의 Phase 0(사전 준비)에서 수집하여
> generate-curriculum 스킬의 Phase 1 대화형 수집을 대체하거나 보완함.

[Top](#gen-ai-curriculum)

---

## 선행 요구사항

| 요구사항 | 설명 | 확인 방법 |
|---------|------|----------|
| Claude Code CLI | Claude Code CLI 설치 필수 | `claude --version` |
| Python 3.10+ | generate_pptx 커스텀 앱 실행용 | `python --version` |
| 플러그인 설치 | gen-ai-curriculum 플러그인 설치 | `claude plugin list` |
| setup 실행 | `/gen-ai-curriculum:setup`으로 도구 설치 | setup 완료 보고 확인 |

**필수 도구 (setup 실행 시 자동 설치):**

| 도구 | 유형 | 용도 | 필수 |
|------|------|------|:----:|
| generate_pptx | Custom App (Python) | JSON 입력 → PPTX 프리젠테이션 파일 생성 | 필수 |
| generate_image | Custom App (Python) | Gemini 기반 이미지 생성 | 선택 |

**환경 변수 (선택):**

| 변수명 | 용도 | 필수 |
|--------|------|:----:|
| `GEMINI_API_KEY` | generate_image 도구 사용 시 Gemini API 인증 | 조건부 |

[Top](#gen-ai-curriculum)

---

## 호출 예시

### 예시 1: 커리큘럼 생성 (직접 호출)

```
INTENT: 교재 분석 기반 AI교육 커리큘럼 생성
ARGS: {
  "교육_대상": "PM/PO, 기획자",
  "교육_형태": "정식교육",
  "교육_시간": "3일, 하루 6시간",
  "차별성": "실습 중심, 실무 적용 사례 포함",
  "교재_파일_경로": "~/workspace/textbook/ai-basics.md"
}
RETURN: 교재 분석 보고서 + 수행 계획서 + 세부 커리큘럼 + PPTX 파일 (output/ 디렉토리)
```

### 예시 2: 커리큘럼 생성 (External 스킬 → Skill 위임)

```
# External 스킬에서 gen-ai-curriculum:generate-curriculum으로 위임

INTENT: gen-ai-curriculum 플러그인의 커리큘럼 생성 워크플로우 실행
ARGS: {
  "source_plugin": "my-plugin",
  "교육_대상": "개발자",
  "교육_형태": "일회성 특강",
  "교육_시간": "2시간",
  "차별성": "GenAI 활용 코딩 중심",
  "교재_파일_경로": "~/workspace/textbook/genai-coding.md"
}
RETURN: 교재 분석 보고서 + 수행 계획서 + 세부 커리큘럼 + PPTX 파일 (output/ 디렉토리)
```

### 예시 3: 초기 설정

```
INTENT: gen-ai-curriculum 플러그인 도구 설치 및 환경 설정
ARGS: {}
RETURN: Python 환경 확인, 의존성 설치, 커스텀 도구 확인, 플러그인 활성화 결과 보고
```

### 예시 4: 외부호출 스킬 추가

```
INTENT: 외부 플러그인 위임용 ext-{대상플러그인} 스킬 생성
ARGS: {
  "대상_플러그인": "abra"
}
RETURN: skills/ext-abra/SKILL.md + commands/ext-abra.md 생성, help 스킬 업데이트
```

[Top](#gen-ai-curriculum)
