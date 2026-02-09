---
name: scenario
description: 요구사항 시나리오 생성 및 선택 (STEP 1)
user-invocable: true
---

# Scenario

[SCENARIO 스킬 활성화]

## 목표

비즈니스 요구사항을 N개의 구조화된 시나리오로 변환하고 사용자가 하나를 선택하도록 함.
STEP 1: 시나리오 생성 및 선택 단계를 담당.

## 활성화 조건

다음 키워드 감지 시 자동 활성화:
- "시나리오 생성", "요구사항 생성", "요구사항 정의"
- "시나리오 만들어", "요구사항 만들어"

또는 `/abra:scenario` 명령 호출 시.

## 에이전트 호출 규칙

### 에이전트 FQN

| 에이전트 | FQN |
|----------|-----|
| scenario-analyst | `abra:scenario-analyst:scenario-analyst` |

### 프롬프트 조립

1. `agents/scenario-analyst/` 에서 3파일 로드 (AGENT.md + agentcard.yaml + tools.yaml)
2. `gateway/runtime-mapping.yaml` 참조하여 구체화:
   - **모델 구체화**: agentcard.yaml의 `tier: MEDIUM` → `tier_mapping`에서 `claude-sonnet-4-5` 결정
   - **툴 구체화**: tools.yaml의 추상 도구 → `tool_mapping`에서 실제 도구 결정
     - `file_read` → builtin `Read` 도구
     - `file_write` → builtin `Write` 도구
   - **금지액션 구체화**: agentcard.yaml의 `forbidden_actions: ["file_delete", "code_execute", "network_access"]` → `action_mapping`에서 제외할 실제 도구 결정
     - `file_delete` → `Bash` 도구 중 삭제 명령 제외
     - `code_execute` → `Bash` 도구 제외
     - `network_access` → `WebFetch`, `WebSearch` 도구 제외
   - **최종 도구** = (builtin: Read, Write) - (제외 도구)
3. 프롬프트 조립: AGENT.md + agentcard.yaml + tools.yaml을 합쳐 하나의 프롬프트로 구성
   - **구성 순서**: 공통 정적(runtime-mapping) → 에이전트별 정적(3파일) → 동적(작업 지시)
4. `Task(subagent_type="abra:scenario-analyst:scenario-analyst", model="sonnet", prompt=조립된 프롬프트)` 호출

## 워크플로우

### Phase 0: 입력 수집 (`ulw` 활용)

AskUserQuestion 도구로 핵심 정보를 사용자로부터 수집:

| 항목 | 필수 | 기본값 | 설명 |
|------|:----:|--------|------|
| 서비스 목적 | ✅ | - | AI 에이전트가 해결할 비즈니스 문제 또는 목적 |
| 생성 갯수 | 선택 | 3 | 생성할 시나리오 버전 수 (1~5 권장) |
| 프로젝트 디렉토리 | ✅ | 서비스 목적 기반 추천 | 프로젝트 루트 디렉토리 (아래 "프로젝트 디렉토리 설정" 참조) |
| 외부 도구/데이터 소스 | ✅ | - | 사용자가 제공 가능한 외부 도구 및 데이터 소스 (아래 참조) |

AskUserQuestion 형식:
- 질문 유형: Requirement
- 선택지: 단일 입력(서비스 목적), 숫자 입력(생성 갯수), 경로 입력(디렉토리)

#### 프로젝트 디렉토리 설정

서비스 목적에서 핵심 키워드를 추출하여 프로젝트 디렉토리명을 추천:
- 추천명은 영문 kebab-case 형식
- 예: "고객 문의 자동 응답" → `customer-inquiry-agent`
- 예: "사내 문서 검색 챗봇" → `doc-search-chatbot`
- 예: "일일 보고서 자동 생성" → `daily-report-generator`

AskUserQuestion으로 확인:
- 질문: "프로젝트를 생성할 경로를 선택해 주세요"
- 옵션:
  - "현재 디렉토리 하위 (`./{추천명}/`)" (권장)
  - "직접 입력"
- 디렉토리 생성 후 `output/` 서브디렉토리도 함께 생성
- 이후 모든 `{output_dir}`는 `{project_root}/output/`을 가리킴

#### 외부 도구 및 데이터 소스 확인

시나리오에 반영할 외부 도구와 데이터 소스를 사전에 파악:

1. **보유 도구/데이터 소스 질문**
   - 질문: "사용 가능한 외부 도구나 데이터 소스가 있나요?"
   - 옵션:
     - "있음 (직접 입력)" — 사용자가 보유한 API, DB, 문서 저장소 등을 구체적으로 입력
     - "없음 — 추천해 주세요" — 서비스 목적에 적합한 도구/데이터 소스를 추천
     - "모르겠음 — 시나리오에서 판단" — 에이전트가 시나리오 작성 시 적절히 판단

2. **도구/데이터 소스 추천** ("추천해 주세요" 선택 시)
   - 서비스 목적을 분석하여 적합한 도구/데이터 소스 카테고리별 추천:
     - **검색/RAG**: 벡터 DB(Pinecone, Weaviate), 지식 베이스(Notion, Confluence)
     - **외부 API**: 날씨, 뉴스, 금융, 이메일, 캘린더 등
     - **데이터 저장소**: PostgreSQL, MongoDB, Google Sheets, Airtable 등
     - **커뮤니케이션**: Slack, Teams, Email API 등
     - **파일 처리**: PDF 파서, OCR, 문서 변환 등
   - 추천 목록에서 사용자가 선택하도록 AskUserQuestion 제시

3. **커스텀 앱 필요성 판단**
   - 적합한 기존 도구/데이터 소스가 없는 경우를 식별
   - 커스텀 앱 개발이 필요하다면 시나리오의 "외부 도구 및 데이터 소스" 섹션에
     "커스텀 개발 필요" 항목으로 명시 (STEP 5 develop에서 구현)

### Phase 1: 시나리오 생성 → Agent: scenario-analyst (`ulw` 활용)

scenario-analyst 에이전트에 위임:

- **TASK**: 서비스 목적을 기반으로 N개의 요구사항 시나리오 자동 생성. 각 시나리오는 서로 다른 관점(업무자동화, 고객경험, 비용절감, 의사결정 지원, 협업효율화)으로 작성
- **EXPECTED OUTCOME**: 각 시나리오에 8개 섹션(서비스개요, 사용자시나리오, 에이전트역할, 워크플로우설계, 외부도구, AI지시사항, 품질요구사항, 검증시나리오) 포함 + 버전 간 비교표 포함한 마크다운 문서
- **MUST DO**: `references/requirement-generater.md` 프롬프트 템플릿 활용, 다양한 관점(업무자동화, 고객경험, 비용절감, 의사결정, 협업효율화) 반영, 비즈니스 용어 사용(기술 용어 최소화), 각 시나리오 차별화(서비스명, 우선순위, 품질 지표), 사용자 제공 외부 도구/데이터 소스를 시나리오에 우선 반영, 적합한 도구가 없는 기능은 "커스텀 개발 필요"로 명시
- **MUST NOT DO**: 사용자에게 직접 질문 금지, 시나리오 선택 금지, DSL 생성 금지
- **CONTEXT**: 서비스 목적: `{service_purpose}`, 생성 갯수: `{count}`, 출력 디렉토리: `{output_dir}`, 외부 도구/데이터 소스: `{external_tools_and_data}`

### Phase 2: 사용자 선택

AskUserQuestion 도구로 시나리오 선택:

생성된 각 시나리오의 요약 정보를 표 형식으로 제시:

| 버전 | 관점 | 서비스명 | 핵심 가치 |
|------|------|----------|----------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |

질문: "어떤 시나리오를 선택하시겠습니까?"
- 질문 유형: Preference
- 선택지: 1 ~ N (버전 번호)

### Phase 3: 결과 저장 및 완료

선택된 시나리오를 `{output_dir}/scenario.md`로 저장.

사용자에게 완료 보고:
```
✅ 시나리오 생성 완료

- 생성된 시나리오 수: {count}개
- 선택된 버전: 버전 {selected_version} ({관점})
- 저장 위치: {output_dir}/scenario.md

다음 단계: `/abra:dsl-generate`로 Dify DSL 생성
```

## 완료 조건

- [ ] N개 시나리오 생성 완료
- [ ] 각 시나리오에 8개 섹션 포함
- [ ] 버전 간 비교표 포함
- [ ] 사용자 선택 완료
- [ ] scenario.md 파일 저장 완료

## 검증 프로토콜

시나리오 파일의 필수 요소 확인:
1. 8개 섹션이 모두 존재하는지 확인
2. 비교표가 모든 버전을 포함하는지 확인
3. 비즈니스 용어로 작성되었는지 확인 (기술 용어 최소화)

## 상태 정리

완료 시 임시 파일 없음 (상태 파일 미사용).

## 취소

사용자 요청 시 즉시 중단. "cancelomc" 또는 "stopomc" 키워드 감지.

## 재개

scenario.md 파일이 이미 존재하는 경우, 사용자에게 재사용 여부 질문:
- 재사용: Phase 2 선택 단계로 진입
- 새로 생성: Phase 0부터 재시작

## 스킬 부스팅

이 스킬은 다음 OMC 스킬을 활용하여 검증된 워크플로우를 적용함:

| 단계 | OMC 스킬 | 목적 |
|------|----------|------|
| Phase 0 | `ulw` 매직 키워드 | 입력 수집 + 프로젝트 설정 + 외부 도구 확인의 병렬 실행 보장 |
| Phase 1 | `ulw` 매직 키워드 | 시나리오 생성의 완료 보장 + 병렬 실행 |
