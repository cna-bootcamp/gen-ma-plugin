---
name: dev-plan
description: 개발계획서 작성
user-invocable: true
type: orchestrator
---

# dev-plan

## 목표

검증된 DSL과 요구사항 시나리오를 분석하여 프로덕션 AI Agent 개발을 위한 상세 개발계획서를 작성함.

## 에이전트 호출 규칙

### FQN (Fully Qualified Name)
```
abra:plan-writer:plan-writer
```

### 프롬프트 조립

1. **에이전트 정의 파일 로드**
   - `agents/plan-writer/AGENT.md` → 프롬프트 본문
   - `agents/plan-writer/agentcard.yaml` → tier 확인 + 프롬프트에 첨부
   - `agents/plan-writer/tools.yaml` → 도구 해석 + 프롬프트에 첨부

2. **런타임 매핑 적용** (`gateway/runtime-mapping.yaml`)
   - **모델 구체화**: agentcard.yaml의 tier → 구체 모델 (예: MEDIUM → claude-sonnet-4-5)
   - **도구 구체화**: tools.yaml의 추상 도구 → tool_mapping에서 실제 도구로 변환
   - **금지액션 구체화**: agentcard.yaml의 forbidden_actions(code_execute, file_delete) → action_mapping에서 제외 도구 결정
   - **최종 도구** = (구체화된 도구) - (제외 도구)

3. **프롬프트 조립 순서**: 공통 정적(runtime-mapping) → 에이전트별 정적(3파일) → 동적(작업 지시)

4. **Task 호출**
   ```typescript
   Task(
     subagent_type: "abra:plan-writer:plan-writer",
     model: "sonnet",
     prompt: assembledPrompt
   )
   ```

## 워크플로우

### Phase 1: 입력 확인

사전 조건 검증:

#### 필수 파일 확인
```bash
# 검증된 DSL 파일
ls C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\*-verified.dsl.yaml

# 시나리오 파일
ls C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\scenario.md
```

파일 없음 시:
```
❌ 필수 파일이 없습니다.
- verified DSL: "/abra:prototype" 스킬 먼저 실행 필요
- scenario.md: "/abra:scenario" 스킬 먼저 실행 필요
```

#### DSL 노드 분석
검증된 DSL을 파싱하여 노드 목록 추출:
- 노드 타입별 분류 (llm, code, http-request, tool 등)
- 변수 의존성 파악
- 외부 연동 확인 (API, DB 등)

### Phase 2: 비기능 요구사항 수집

AskUserQuestion으로 다음 정보 수집:

| 항목 | 질문 | 타입 | 예시 |
|------|------|------|------|
| 개발 방식 | 어떤 방식으로 개발할까요? | Preference | "Option A: Dify 런타임 활용" 또는 "Option B: 코드 기반 전환" |
| 기술스택 선호 | 선호하는 기술스택이 있나요? | Preference | "Python FastAPI" 또는 "TypeScript Express" |
| 배포 환경 | 어디에 배포할 예정인가요? | Constraint | "Docker", "Kubernetes", "AWS Lambda" |
| 성능 목표 | 응답 시간 목표가 있나요? | Constraint | "3초 이내" |
| 확장성 요구 | 동시 사용자 규모는? | Constraint | "100명" 또는 "10,000명" |

**Option A: Dify 런타임 활용**
- Dify SDK를 사용하여 DSL 실행
- 인프라: Dify 서버 + 프론트엔드 래퍼
- 장점: 빠른 구현, 유지보수 용이
- 단점: Dify 의존성

**Option B: 코드 기반 전환**
- DSL을 네이티브 코드로 변환
- 인프라: 독립 실행형 서비스
- 장점: Dify 의존성 제거, 최적화 가능
- 단점: 구현 복잡도 증가

### Phase 3: 개발 계획 수립

```
→ Agent: plan-writer (with /oh-my-claudecode:ralplan)
```

**TASK:**
DSL과 요구사항을 분석하여 8개 섹션을 포함한 상세 개발계획서 작성

**EXPECTED OUTCOME:**
다음 8개 섹션을 포함한 마크다운 문서:
1. **프로젝트 개요**
   - 목적, 범위, 핵심 가치
2. **아키텍처 설계**
   - 시스템 구조도, 컴포넌트 설계
   - 선택한 개발 방식(Option A/B) 반영
3. **기술스택**
   - 프로그래밍 언어, 프레임워크, 라이브러리
   - 선택 근거 명시
4. **구현 계획**
   - DSL 노드별 구현 방법
   - 파일 구조 및 모듈 설계
5. **API 설계**
   - 엔드포인트 목록
   - 요청/응답 스키마
6. **테스트 전략**
   - 단위 테스트, 통합 테스트, E2E 테스트
   - 테스트 도구 및 커버리지 목표
7. **배포 계획**
   - 인프라 구성
   - CI/CD 파이프라인
8. **유지보수 계획**
   - 모니터링, 로깅
   - 버전 관리 전략

**MUST DO:**
- DSL의 모든 노드를 구현 계획에 반영 (누락 금지)
- 기술스택 선택 근거 명시 (성능, 생태계, 팀 경험 등)
- 테스트 전략 구체화 (테스트 케이스 예시 포함)
- 비기능 요구사항 반영 (성능, 확장성, 보안)
- references/develop-plan-generate.md 참조

**MUST NOT DO:**
- 직접 코드 작성 금지 (개발계획서만 작성)
- 파일 삭제 금지
- DSL 노드 임의 추가/삭제 금지
- 근거 없는 기술스택 선택 금지

**CONTEXT:**
- verified DSL 경로: `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{app-name}-verified.dsl.yaml`
- scenario.md 경로: `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\scenario.md`
- 개발 방식: {사용자 선택}
- 기술스택 선호: {사용자 입력}
- 배포 환경: {사용자 입력}
- 참조 문서: `C:\Users\hiond\workspace\gen-dmap\references\develop-plan-generate.md`

### Phase 4: 완료

개발계획서 저장:
```
C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\dev-plan.md
```

완료 메시지 출력:
```
✅ 개발계획서 작성 완료

산출물:
- dev-plan.md: 8개 섹션 개발계획서

개발 계획 요약:
- 개발 방식: {Option A/B}
- 기술스택: {주요 기술}
- 아키텍처: {아키텍처 패턴}
- 배포 환경: {배포 타겟}

DSL 노드 반영:
✓ 전체 노드 수: 15개
✓ LLM 노드: 3개
✓ Code 노드: 5개
✓ HTTP Request 노드: 2개
✓ 기타 노드: 5개

다음 단계:
- "코드 개발해줘" 또는 "/abra:develop"를 실행하여 실제 구현 시작
```

## 완료 조건

- [ ] 검증된 DSL 파일이 존재함
- [ ] scenario.md 파일이 존재함
- [ ] 비기능 요구사항 수집 완료
- [ ] 개발계획서 8개 섹션 완성
- [ ] DSL 모든 노드가 구현 계획에 반영됨
- [ ] 기술스택 선택 근거가 명확함
- [ ] 테스트 전략이 구체적임
- [ ] dev-plan.md 파일 저장됨
- [ ] 다음 단계 안내 출력됨

## 검증 프로토콜

### 자동 검증

- 8개 섹션 완성도 확인 (섹션 제목 존재, 최소 길이 충족)
- DSL 노드 누락 검사 (DSL 파일과 교차 검증)
- 마크다운 문법 검증

### 수동 검증

- 기술스택 선택 근거 타당성
- 아키텍처 설계 적절성
- 테스트 전략 구체성

## 상태 정리

완료 시 `.omc/state/abra-dev-plan-state.json` 삭제.

**상태 파일 구조:**
```json
{
  "phase": "Phase3_Planning",
  "dslPath": "outputs/customer-inquiry-agent-verified.dsl.yaml",
  "scenarioPath": "outputs/scenario.md",
  "developmentMode": "Option A",
  "techStackPreference": "Python FastAPI",
  "deploymentTarget": "Docker",
  "dslNodeCount": 15,
  "timestamp": "2026-02-09T13:00:00Z"
}
```

## 취소

`cancelomc` 또는 `stopomc` 키워드 감지 시:
- plan-writer 에이전트 중단
- 부분 작성된 개발계획서 파일 정리 (`.draft.md` 확장자로 백업)
- 상태 파일 삭제

## 재개

상태 파일 존재 시:
- `phase` 필드 확인하여 마지막 Phase부터 재개
- 수집된 비기능 요구사항 재사용
- 사용자에게 재개 알림

## 스킬 부스팅

| 워크플로우 단계 | 활용 스킬 | 목적 |
|----------------|-----------|------|
| Phase 3: 개발 계획 수립 | `/oh-my-claudecode:ralplan` | Planner+Architect+Critic 협업을 통한 반복적 계획 개선 |

## 주의사항

- 개발계획서는 코드 구현 전 설계 문서
- DSL 노드를 모두 반영해야 프로토타이핑 결과와 일관성 유지
- 기술스택 선택 시 팀의 기존 역량 고려
- Option A(Dify 런타임)와 Option B(코드 전환)는 트레이드오프 존재
- 테스트 전략은 품질 보증의 핵심이므로 구체적으로 작성
- references/develop-plan-generate.md에 개발계획서 작성 가이드 포함
