---
name: prototype
description: Dify 프로토타이핑 자동화
user-invocable: true
type: orchestrator
---

# prototype

## 목표

생성된 DSL을 Dify에 import하고, publish 및 실행 테스트를 자동화하여 워크플로우의 실제 동작을 검증함.

## 에이전트 호출 규칙

### FQN (Fully Qualified Name)
```
abra:prototype-runner:prototype-runner
```

### 프롬프트 조립

1. **에이전트 정의 파일 로드**
   - `agents/prototype-runner/AGENT.md` → 프롬프트 본문
   - `agents/prototype-runner/agentcard.yaml` → tier 확인 + 프롬프트에 첨부
   - `agents/prototype-runner/tools.yaml` → 도구 해석 + 프롬프트에 첨부

2. **런타임 매핑 적용** (`gateway/runtime-mapping.yaml`)
   - **모델 구체화**: agentcard.yaml의 tier → 구체 모델 (예: MEDIUM → claude-sonnet-4-5)
   - **도구 구체화**: tools.yaml의 추상 도구 → tool_mapping에서 실제 도구로 변환
   - **금지액션 구체화**: agentcard.yaml의 forbidden_actions → action_mapping에서 제외 도구 결정
   - **최종 도구** = (구체화된 도구) - (제외 도구)

3. **프롬프트 조립 순서**: 공통 정적(runtime-mapping) → 에이전트별 정적(3파일) → 동적(작업 지시)

4. **Task 호출**
   ```typescript
   Task(
     subagent_type: "abra:prototype-runner:prototype-runner",
     model: "sonnet",
     prompt: assembledPrompt
   )
   ```

## 워크플로우

### Phase 1: 사전 확인

#### DSL 파일 존재 확인
```bash
ls C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\*.dsl.yaml
```

파일 없음 시:
```
❌ DSL 파일이 없습니다.
"/abra:dsl-generate" 스킬을 먼저 실행해주세요.
```

#### Dify API 연결 확인
```bash
cd C:\Users\hiond\workspace\gen-dmap\samples\abra\tools
python test_gateway.py
```

연결 실패 시:
```
❌ Dify API 연결 실패
.env 파일의 DIFY_API_URL, DIFY_API_KEY를 확인해주세요.
```

### Phase 2: 실행 계획

```
→ Skill: /oh-my-claudecode:plan
- INTENT: 프로토타이핑 실행 전략 수립
- ARGS: DSL 파일 경로
- RETURN: 실행 계획
```

**계획 내용:**
- 테스트 입력값 준비 (시나리오 기반)
- 검증 기준 설정 (예상 출력, 실행 시간 등)
- 오류 시나리오 정의 (예외 처리 동작 확인)

### Phase 3: 프로토타이핑 실행

```
→ Agent: prototype-runner (with /oh-my-claudecode:ralph)
```

**TASK:**
DSL을 Dify에 import → publish → run → export 자동화

**EXPECTED OUTCOME:**
- Dify import 성공 (워크플로우 ID 반환)
- Publish 성공 (버전 번호 반환)
- 테스트 실행 성공 (실행 결과 반환)
- Export 성공 (검증된 DSL 파일 저장)
- 실행 결과 보고서 (각 단계별 성공/실패, 로그)

**MUST DO:**
- Import 단계:
  ```bash
  cd C:\Users\hiond\workspace\gen-dmap\samples\abra\tools
  python gateway.py import --file ../outputs/{app-name}.dsl.yaml
  ```
  - 성공 확인: 워크플로우 ID 반환
  - 실패 시: 에러 메시지 분석 후 DSL 수정 시도 (최대 3회)

- Publish 단계:
  ```bash
  python gateway.py publish --workflow-id {workflow-id}
  ```
  - 성공 확인: 버전 번호 반환
  - 실패 시: 유효성 검사 오류 확인 후 수정

- Run 단계:
  ```bash
  python gateway.py run --workflow-id {workflow-id} --input '{test-input-json}'
  ```
  - 테스트 입력값: 시나리오의 "입출력 정의" 섹션 기반
  - 성공 확인: 예상 출력과 실제 출력 비교
  - 실패 시: 로그 분석 후 노드별 오류 파악

- Export 단계:
  ```bash
  python gateway.py export --workflow-id {workflow-id} --output ../outputs/{app-name}-verified.dsl.yaml
  ```
  - 실행 검증된 DSL 백업

**MUST NOT DO:**
- 요구사항 범위 외 워크플로우 수정 금지
- 테스트 입력값 임의 변경 금지 (시나리오 기반 엄수)
- 오류 무시하고 진행 금지 (각 단계 성공 확인 필수)

**CONTEXT:**
- DSL 파일 경로: `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{app-name}.dsl.yaml`
- Dify API 설정: `.env` 파일 (DIFY_API_URL, DIFY_API_KEY)
- Gateway 커스텀 도구 경로: `C:\Users\hiond\workspace\gen-dmap\samples\abra\tools\gateway.py`
- scenario.md 경로: `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\scenario.md` (테스트 입력값 참조)

### Phase 4: QA 검증

```
→ Skill: /oh-my-claudecode:ultraqa
- INTENT: 프로토타이핑 결과 검증
- ARGS: 실행 결과 보고서
- RETURN: 검증 결과
```

**검증 항목:**
- [ ] Import 성공 (워크플로우 ID 존재)
- [ ] Publish 성공 (버전 번호 존재)
- [ ] Run 성공 (실행 결과 정상)
- [ ] 예상 출력과 실제 출력 일치
- [ ] 예외 상황 처리 동작 확인
- [ ] Export 성공 (verified DSL 파일 존재)

**검증 실패 시:**
- Phase 3으로 복귀 (최대 3회 재시도)
- 3회 실패 시 사용자에게 수동 확인 요청

### Phase 5: 완료

검증된 DSL 파일 저장:
```
C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{app-name}-verified.dsl.yaml
```

실행 결과 보고서 저장:
```
C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{app-name}-test-report.md
```

완료 메시지 출력:
```
✅ 프로토타이핑 완료

산출물:
- {app-name}-verified.dsl.yaml: 실행 검증 완료된 DSL
- {app-name}-test-report.md: 실행 결과 보고서

실행 결과:
✓ Import: 성공 (Workflow ID: wf-xxxx)
✓ Publish: 성공 (Version: 1.0)
✓ Run: 성공 (실행 시간: 2.3초)
✓ 예상 출력 일치: 100%

Dify 접속:
http://localhost:3000/app/{workflow-id}

다음 단계:
- "개발계획서 작성해줘" 또는 "/abra:dev-plan"를 실행하여 프로덕션 개발 계획 수립
```

## 완료 조건

- [ ] DSL 파일이 존재함
- [ ] Dify API 연결 성공
- [ ] Import 성공
- [ ] Publish 성공
- [ ] Run 테스트 성공
- [ ] Export 성공
- [ ] verified DSL 파일 저장됨
- [ ] 테스트 보고서 생성됨
- [ ] 다음 단계 안내 출력됨

## 검증 프로토콜

### 자동 검증

각 단계별 API 응답 코드 확인:
- Import: 200 OK, workflow_id 존재
- Publish: 200 OK, version 존재
- Run: 200 OK, result 존재
- Export: 200 OK, 파일 생성 확인

### 기능 검증 (ultraqa)

실행 결과와 예상 출력 비교:
- 출력 형식 일치
- 핵심 데이터 포함 여부
- 예외 처리 동작 확인

## 상태 정리

완료 시 `.omc/state/abra-prototype-state.json` 삭제.

**상태 파일 구조:**
```json
{
  "phase": "Phase3_Running",
  "dslPath": "outputs/customer-inquiry-agent.dsl.yaml",
  "workflowId": "wf-12345678",
  "version": "1.0",
  "importStatus": "SUCCESS",
  "publishStatus": "SUCCESS",
  "runStatus": "IN_PROGRESS",
  "attempts": 1,
  "timestamp": "2026-02-09T12:00:00Z"
}
```

## 취소

`cancelomc` 또는 `stopomc` 키워드 감지 시:
- prototype-runner 에이전트 중단
- Dify에 생성된 워크플로우는 유지 (삭제하지 않음)
- 상태 파일 삭제

## 재개

상태 파일 존재 시:
- `phase` 및 각 단계 status 확인
- 성공한 단계는 건너뛰고 다음 단계부터 재개
- 사용자에게 재개 알림 및 현재 상태 출력

## 스킬 부스팅

| 워크플로우 단계 | 활용 스킬 | 목적 |
|----------------|-----------|------|
| Phase 2: 실행 계획 | `/oh-my-claudecode:plan` | 테스트 전략 수립 |
| Phase 3: 실행 | `/oh-my-claudecode:ralph` | 완료까지 지속 실행 |
| Phase 4: QA 검증 | `/oh-my-claudecode:ultraqa` | 실행 결과 검증 |

## 주의사항

- Dify 로컬 환경이 실행 중이어야 함 (`docker compose up` 상태)
- API Key는 Dify Console에서 발급받아야 함
- 테스트 입력값은 시나리오의 "입출력 정의" 섹션을 엄격히 따름
- 워크플로우 실행 실패 시 Dify 로그 확인 필요 (`docker compose logs dify-worker`)
- gateway.py는 커스텀 도구로 Dify REST API를 래핑한 것
