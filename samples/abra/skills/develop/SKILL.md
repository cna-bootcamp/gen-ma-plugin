---
name: develop
description: AI Agent 개발 및 배포
user-invocable: true
type: orchestrator
---

# develop

## 목표

개발계획서를 기반으로 프로덕션 AI Agent를 구현하고, 빌드·테스트·배포까지 완료함.

## 에이전트 호출 규칙

### FQN (Fully Qualified Name)
```
abra:agent-developer:agent-developer
```

### 프롬프트 조립

1. **에이전트 정의 파일 로드**
   - `agents/agent-developer/AGENT.md` → 프롬프트 본문
   - `agents/agent-developer/agentcard.yaml` → tier 확인 + 프롬프트에 첨부
   - `agents/agent-developer/tools.yaml` → 도구 해석 + 프롬프트에 첨부

2. **런타임 매핑 적용** (`gateway/runtime-mapping.yaml`)
   - **모델 구체화**: agentcard.yaml의 tier → 구체 모델 (예: HIGH → claude-opus-4-6)
   - **도구 구체화**: tools.yaml의 추상 도구 → tool_mapping에서 실제 도구로 변환
   - **금지액션 구체화**: agentcard.yaml의 forbidden_actions → action_mapping에서 제외 도구 결정
   - **최종 도구** = (구체화된 도구) - (제외 도구)

3. **프롬프트 조립 순서**: 공통 정적(runtime-mapping) → 에이전트별 정적(3파일) → 동적(작업 지시)

4. **Task 호출**
   ```typescript
   Task(
     subagent_type: "abra:agent-developer:agent-developer",
     model: "opus",
     prompt: assembledPrompt
   )
   ```

## 워크플로우

### Phase 1: 입력 확인

사전 조건 검증:

#### 필수 파일 확인
```bash
# 개발계획서
ls C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\dev-plan.md

# 검증된 DSL
ls C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\*-verified.dsl.yaml
```

파일 없음 시:
```
❌ 필수 파일이 없습니다.
- dev-plan.md: "/abra:dev-plan" 스킬 먼저 실행 필요
- verified DSL: "/abra:prototype" 스킬 먼저 실행 필요
```

#### 개발계획서 파싱
dev-plan.md에서 다음 정보 추출:
- 개발 방식 (Option A: Dify 런타임 / Option B: 코드 전환)
- 기술스택
- 아키텍처 패턴
- 구현해야 할 DSL 노드 목록

### Phase 2: 개발 방식 선택

#### 사용자 확인
AskUserQuestion으로 최종 확인:

```
개발계획서에 따르면 다음 방식으로 개발 예정입니다:

개발 방식: {dev-plan.md에서 추출한 방식}
기술스택: {dev-plan.md에서 추출한 기술스택}

이대로 진행하시겠습니까?
A) 예, 개발계획서대로 진행
B) 아니오, 개발 방식 변경

선택:
```

#### 개발 방식별 차이

**Option A: Dify 런타임 활용**
- Dify SDK 사용
- DSL 파일 그대로 실행
- 구현 범위: API 래퍼 + 프론트엔드

**Option B: 코드 기반 전환**
- DSL → 네이티브 코드 변환
- 독립 실행형 서비스
- 구현 범위: 전체 비즈니스 로직 + API + 프론트엔드

### Phase 3: 코드 구현

```
→ Agent: agent-developer (with /oh-my-claudecode:ralph)
```

**TASK:**
개발계획서를 기반으로 프로덕션 AI Agent 구현

**EXPECTED OUTCOME:**
- 소스 코드 (개발계획서의 파일 구조 준수)
- 설정 파일 (.env.example, config.yaml 등)
- README.md (설치·실행·사용 가이드)
- 테스트 코드 (단위·통합 테스트)
- 모든 테스트 통과

**MUST DO:**
- 개발계획서의 기술스택·아키텍처 엄격히 준수
- DSL의 모든 노드 구현 (누락 금지)
- 테스트 작성 및 통과 확인
  ```bash
  # 테스트 실행 예시
  cd C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{project-name}
  pytest tests/ -v
  ```
- 코드 품질 검증
  ```bash
  # 린트 검사
  pylint src/

  # 타입 체크 (TypeScript인 경우)
  tsc --noEmit
  ```
- README.md 작성 (설치·실행 방법 명시)

**MUST NOT DO:**
- 개발계획서 범위 외 기능 추가 금지
- DSL 노드 누락 금지
- 테스트 없이 완료 금지
- 하드코딩된 비밀 정보 포함 금지 (환경 변수 사용)

**CONTEXT:**
- dev-plan.md 경로: `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\dev-plan.md`
- verified DSL 경로: `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{app-name}-verified.dsl.yaml`
- 참조 문서: `C:\Users\hiond\workspace\gen-dmap\references\develop.md`
- 출력 디렉토리: `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{project-name}\`

**구현 구조 예시 (Option A: Dify 런타임):**
```
{project-name}/
├── src/
│   ├── api/
│   │   └── server.py          # FastAPI 서버
│   ├── dify/
│   │   ├── client.py          # Dify SDK 래퍼
│   │   └── workflow.yaml      # verified DSL 복사
│   └── config.py
├── tests/
│   ├── test_api.py
│   └── test_dify_client.py
├── .env.example
├── requirements.txt
├── Dockerfile
└── README.md
```

**구현 구조 예시 (Option B: 코드 전환):**
```
{project-name}/
├── src/
│   ├── api/
│   │   └── server.py
│   ├── agents/
│   │   ├── nodes/             # DSL 노드별 구현
│   │   │   ├── llm_node.py
│   │   │   ├── code_node.py
│   │   │   └── http_node.py
│   │   ├── workflow.py        # 워크플로우 엔진
│   │   └── executor.py
│   └── config.py
├── tests/
│   ├── test_api.py
│   ├── test_nodes.py
│   └── test_workflow.py
├── .env.example
├── requirements.txt
├── Dockerfile
└── README.md
```

### Phase 4: 빌드 검증

```
→ Skill: /oh-my-claudecode:build-fix
- INTENT: 빌드·린트·타입 체크
- ARGS: 프로젝트 디렉토리 경로
- RETURN: 빌드 결과
```

**검증 항목:**
- [ ] 빌드 에러 0건
- [ ] 린트 검사 통과
- [ ] 타입 체크 통과 (TypeScript인 경우)
- [ ] 의존성 충돌 없음

**빌드 실패 시:**
- build-fix 스킬이 자동으로 오류 수정 시도
- 수정 후 재검증 (최대 3회)
- 3회 실패 시 사용자에게 수동 확인 요청

### Phase 5: QA 검증

```
→ Agent: agent-developer (with /oh-my-claudecode:ultraqa)
```

**TASK:**
구현 코드의 테스트 실행 및 품질 검증

**EXPECTED OUTCOME:**
- 모든 테스트 PASS
- 테스트 커버리지 80% 이상
- 코드 품질 기준 충족 (린트 점수 8.0 이상)

**MUST DO:**
- 단위 테스트 실행 및 통과 확인
- 통합 테스트 실행 (API 엔드포인트 전체)
- E2E 테스트 (핵심 사용자 시나리오)
- 테스트 결과 보고서 생성

**MUST NOT DO:**
- 실패하는 테스트 삭제 금지
- 테스트 커버리지 낮추기 금지
- 테스트 건너뛰기 금지

**CONTEXT:**
- 프로젝트 디렉토리: `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{project-name}`
- dev-plan.md 테스트 전략 섹션 참조

**테스트 실행 예시:**
```bash
# Python 프로젝트
cd C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{project-name}
pytest tests/ -v --cov=src --cov-report=html

# TypeScript 프로젝트
npm test -- --coverage
```

### Phase 6: 완료

#### 산출물 정리

프로젝트 디렉토리:
```
C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{project-name}\
```

#### 실행 방법 안내

완료 메시지 출력:
```
✅ AI Agent 개발 완료

산출물:
- 소스 코드: {project-name}/src/
- 테스트 코드: {project-name}/tests/
- README.md: 설치·실행 가이드
- Dockerfile: 컨테이너 이미지 빌드

개발 요약:
- 개발 방식: {Option A/B}
- 기술스택: {주요 기술}
- DSL 노드 구현: {전체 노드 수}개 (100%)

빌드 검증:
✓ 빌드: 성공
✓ 린트: 통과 (점수: 8.5/10)
✓ 타입 체크: 통과

테스트 검증:
✓ 단위 테스트: 25개 PASS
✓ 통합 테스트: 8개 PASS
✓ 커버리지: 85%

실행 방법:
1. 환경 변수 설정:
   cp .env.example .env
   # .env 파일을 편집하여 API 키 등 설정

2. 의존성 설치:
   pip install -r requirements.txt

3. 서버 실행:
   python src/api/server.py

4. 접속:
   http://localhost:8000

Docker 실행:
docker build -t {project-name} .
docker run -p 8000:8000 --env-file .env {project-name}

다음 단계:
- 실제 운영 환경에 배포
- 모니터링 설정
- 사용자 피드백 수집
```

## 완료 조건

- [ ] dev-plan.md 파일이 존재함
- [ ] verified DSL 파일이 존재함
- [ ] 개발 방식이 선택됨
- [ ] 소스 코드 구현 완료
- [ ] 설정 파일 작성 완료
- [ ] README.md 작성 완료
- [ ] 테스트 코드 작성 완료
- [ ] 빌드 에러 0건
- [ ] 모든 테스트 PASS
- [ ] 테스트 커버리지 80% 이상
- [ ] 실행 방법 안내 출력 완료

## 검증 프로토콜

### 빌드 검증 (Phase 4)

build-fix 스킬을 통한 자동 검증:
- 빌드 성공
- 린트 통과
- 타입 체크 통과

### 테스트 검증 (Phase 5)

ultraqa 스킬을 통한 품질 검증:
- 모든 테스트 PASS
- 커버리지 기준 충족
- 코드 품질 기준 충족

### Architect 검증 (필수)

완료 전 Architect 에이전트 검증:
- 개발계획서 준수 여부
- DSL 노드 전체 구현 여부
- 테스트 전략 충족 여부

검증 실패 시 Phase 3으로 복귀.

## 상태 정리

완료 시 `.omc/state/abra-develop-state.json` 삭제.

**상태 파일 구조:**
```json
{
  "phase": "Phase5_QA",
  "devPlanPath": "outputs/dev-plan.md",
  "dslPath": "outputs/customer-inquiry-agent-verified.dsl.yaml",
  "projectDir": "outputs/customer-inquiry-agent-app",
  "developmentMode": "Option A",
  "techStack": "Python FastAPI",
  "buildStatus": "SUCCESS",
  "testStatus": "IN_PROGRESS",
  "testsPassed": 25,
  "testsFailed": 0,
  "coverage": 85,
  "timestamp": "2026-02-09T15:00:00Z"
}
```

## 취소

`cancelomc` 또는 `stopomc` 키워드 감지 시:
- agent-developer 에이전트 중단
- 부분 구현된 코드 정리 (`.wip` 디렉토리로 백업)
- 상태 파일 삭제

## 재개

상태 파일 존재 시:
- `phase` 및 각 단계 status 확인
- 성공한 Phase는 건너뛰고 다음 Phase부터 재개
- 사용자에게 재개 알림 및 현재 상태 출력

## 스킬 부스팅

| 워크플로우 단계 | 활용 스킬 | 목적 |
|----------------|-----------|------|
| Phase 3: 코드 구현 | `/oh-my-claudecode:ralph` | 완료까지 지속 실행 |
| Phase 4: 빌드 검증 | `/oh-my-claudecode:build-fix` | 빌드 오류 자동 수정 |
| Phase 5: QA 검증 | `/oh-my-claudecode:ultraqa` | 테스트 실행 및 품질 검증 |

## 주의사항

- 개발은 고복잡도 작업으로 Opus 모델 사용 (정확도 최우선)
- 개발계획서를 엄격히 따라야 프로토타이핑 결과와 일관성 유지
- Option A와 Option B는 구현 복잡도와 유지보수성의 트레이드오프
- 테스트는 품질 보증의 핵심이므로 절대 건너뛰지 않음
- 빌드·테스트 실패 시 완료 주장 금지 (검증-완료 프로토콜 준수)
- README.md는 다른 개발자가 즉시 실행 가능한 수준으로 작성
- 민감 정보(.env)는 .gitignore에 추가하고 .env.example만 커밋
- references/develop.md에 개발 가이드 및 모범 사례 포함
