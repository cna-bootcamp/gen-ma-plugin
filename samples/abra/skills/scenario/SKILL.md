---
name: scenario
description: 요구사항 시나리오 생성 및 선택
user-invocable: true
type: orchestrator
---

# scenario

## 목표

서비스 목적을 다양한 관점으로 분석하여 여러 개의 구조화된 시나리오를 생성하고, 사용자가 최적안을 선택하도록 지원함.

## 에이전트 호출 규칙

### FQN (Fully Qualified Name)
```
abra:scenario-analyst:scenario-analyst
```

### 프롬프트 조립

1. **에이전트 정의 파일 로드**
   - `agents/scenario-analyst/AGENT.md` → 프롬프트 본문
   - `agents/scenario-analyst/agentcard.yaml` → tier 확인 + 프롬프트에 첨부
   - `agents/scenario-analyst/tools.yaml` → 도구 해석 + 프롬프트에 첨부

2. **런타임 매핑 적용** (`gateway/runtime-mapping.yaml`)
   - **모델 구체화**: agentcard.yaml의 tier → 구체 모델 (예: MEDIUM → claude-sonnet-4-5)
   - **도구 구체화**: tools.yaml의 추상 도구 → tool_mapping에서 실제 도구로 변환
   - **금지액션 구체화**: agentcard.yaml의 forbidden_actions → action_mapping에서 제외 도구 결정
   - **최종 도구** = (구체화된 도구) - (제외 도구)

3. **프롬프트 조립 순서**: 공통 정적(runtime-mapping) → 에이전트별 정적(3파일) → 동적(작업 지시)

4. **Task 호출**
   ```typescript
   Task(
     subagent_type: "abra:scenario-analyst:scenario-analyst",
     model: "sonnet",
     prompt: assembledPrompt
   )
   ```

## 워크플로우

### Phase 1: 입력 수집

AskUserQuestion 도구로 다음 정보 수집:

| 항목 | 질문 | 타입 | 예시 |
|------|------|------|------|
| 서비스 목적 | 개발하려는 AI Agent의 목적을 설명해주세요 | Requirement | "고객 문의 자동 응답 시스템" |
| 생성 갯수 | 몇 개의 시나리오를 생성할까요? | Preference | 3 (기본값) |

### Phase 2: 기획 수립

```
→ Skill: /oh-my-claudecode:plan
- INTENT: 시나리오 생성 전략 수립
- ARGS: 서비스 목적, 생성 갯수
- RETURN: 시나리오 생성 계획
```

**계획 내용:**
- 분석할 관점 목록 (비즈니스, 사용자 경험, 기술 구현 등)
- 각 시나리오의 차별화 포인트
- 시나리오 구조 (8개 섹션) 확정

### Phase 3: 시나리오 생성

```
→ Agent: scenario-analyst (with /oh-my-claudecode:ralph)
```

**TASK:**
서비스 목적을 다양한 관점으로 분석하여 N개의 구조화된 시나리오 생성

**EXPECTED OUTCOME:**
- 각 시나리오가 다음 8개 섹션을 포함한 마크다운 문서
  1. 서비스 개요
  2. 주요 기능
  3. 사용자 여정
  4. 핵심 시나리오
  5. 입출력 정의
  6. 예외 상황 처리
  7. 성공 지표
  8. 제약 사항
- N개 시나리오 비교표 (강점, 약점, 적용 상황)

**MUST DO:**
- 비즈니스 용어 사용 (기술 용어를 비즈니스 언어로 번역)
- 관점별 차별화 명확히 (단순 변형 금지)
- 비교표 작성 (각 시나리오의 특징 명시)
- references/requirement-generater.md 참조

**MUST NOT DO:**
- 기술 용어 직접 사용 금지 (예: "LLM 노드", "변수 추출기" → "대화 엔진", "정보 파악 단계")
- DSL 생성 금지 (이 단계는 비즈니스 요구사항만 다룸)
- 단일 관점으로 N개 복사 금지

**CONTEXT:**
- 서비스 목적: {사용자 입력}
- 생성 갯수: {N}
- 참조 문서: `C:\Users\hiond\workspace\gen-dmap\references\requirement-generater.md`

### Phase 4: 시나리오 선택

AskUserQuestion으로 사용자 선택:

```
다음 중 개발할 시나리오를 선택해주세요:

1. [시나리오 A 제목] - 강점: ..., 적용: ...
2. [시나리오 B 제목] - 강점: ..., 적용: ...
3. [시나리오 C 제목] - 강점: ..., 적용: ...

선택 (1-3):
```

### Phase 5: 완료

선택된 시나리오를 `scenario.md`로 저장:

```
C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\scenario.md
```

완료 메시지 출력:
```
✅ 시나리오 생성 완료

산출물:
- scenario.md: 선택된 시나리오 (8개 섹션 포함)

다음 단계:
- "DSL 생성해줘" 또는 "/abra:dsl-generate"를 실행하여 Dify 워크플로우 DSL 생성
```

## 완료 조건

- [ ] 요청된 갯수(N개)의 시나리오가 생성됨
- [ ] 각 시나리오가 8개 섹션을 모두 포함함
- [ ] 시나리오 비교표가 작성됨
- [ ] 사용자가 시나리오를 선택함
- [ ] scenario.md 파일이 저장됨
- [ ] 다음 단계 안내가 출력됨

## 검증 프로토콜

### 자동 검증
- 8개 섹션 완성도 확인 (섹션 제목 존재, 최소 길이 충족)
- 마크다운 문법 검증

### 사용자 검증
- 시나리오 품질은 사용자 선택으로 확정
- 선택되지 않은 시나리오는 `outputs/alternatives/` 디렉토리에 백업

## 상태 정리

완료 시 `.omc/state/abra-scenario-state.json` 삭제.

**상태 파일 구조:**
```json
{
  "phase": "Phase3_GeneratingScenarios",
  "serviceObjective": "고객 문의 자동 응답 시스템",
  "scenarioCount": 3,
  "generatedScenarios": ["scenario-a.md", "scenario-b.md"],
  "selectedScenario": null,
  "timestamp": "2026-02-09T10:30:00Z"
}
```

## 취소

`cancelomc` 또는 `stopomc` 키워드 감지 시:
- scenario-analyst 에이전트 중단
- 부분 생성된 시나리오 파일 정리
- 상태 파일 삭제

## 재개

상태 파일 존재 시:
- `phase` 필드 확인하여 마지막 Phase부터 재개
- 이미 생성된 시나리오는 재사용
- 사용자에게 재개 알림

## 스킬 부스팅

| 워크플로우 단계 | 활용 스킬 | 목적 |
|----------------|-----------|------|
| Phase 2: 기획 수립 | `/oh-my-claudecode:plan` | 시나리오 생성 전략 인터뷰 |
| Phase 3: 시나리오 생성 | `/oh-my-claudecode:ralph` | 완료까지 지속 실행 |

## 주의사항

- 시나리오는 비즈니스 관점에서 작성됨 (기술 용어 배제)
- DSL 생성은 다음 단계(`dsl-generate` 스킬)에서 수행
- 최소 2개 이상의 시나리오 생성 권장 (비교 선택의 의미 확보)
- 참조 문서(`requirement-generater.md`)는 시나리오 구조와 작성 가이드 포함
