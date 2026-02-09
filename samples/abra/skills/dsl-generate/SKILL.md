---
name: dsl-generate
description: Dify DSL 자동 생성
user-invocable: true
type: orchestrator
---

# dsl-generate

## 목표

시나리오 문서를 분석하여 Dify import 가능한 완전한 DSL YAML 파일을 생성하고 자동 검증함.

## 에이전트 호출 규칙

### FQN (Fully Qualified Name)
```
abra:dsl-architect:dsl-architect
```

### 프롬프트 조립

1. **에이전트 정의 파일 로드**
   - `agents/dsl-architect/AGENT.md` → 프롬프트 본문
   - `agents/dsl-architect/agentcard.yaml` → tier 확인 + 프롬프트에 첨부
   - `agents/dsl-architect/tools.yaml` → 도구 해석 + 프롬프트에 첨부

2. **런타임 매핑 적용** (`gateway/runtime-mapping.yaml`)
   - **모델 구체화**: agentcard.yaml의 tier → 구체 모델 (예: HIGH → claude-opus-4-6)
   - **도구 구체화**: tools.yaml의 추상 도구 → tool_mapping에서 실제 도구로 변환
   - **금지액션 구체화**: agentcard.yaml의 forbidden_actions(code_execute) → action_mapping에서 Bash 제외
   - **최종 도구** = (구체화된 도구) - (제외 도구)

3. **프롬프트 조립 순서**: 공통 정적(runtime-mapping) → 에이전트별 정적(3파일) → 동적(작업 지시)

4. **Task 호출**
   ```typescript
   Task(
     subagent_type: "abra:dsl-architect:dsl-architect",
     model: "opus",
     prompt: assembledPrompt
   )
   ```

## 워크플로우

### Phase 1: 입력 확인

사전 조건 검증:
- `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\scenario.md` 파일 존재 확인
- 파일 내 8개 섹션 완성도 확인

파일 없음 시:
```
❌ scenario.md 파일이 없습니다.
"/abra:scenario" 스킬을 먼저 실행해주세요.
```

### Phase 2: 설계 계획

```
→ Skill: /oh-my-claudecode:plan
- INTENT: DSL 설계 전략 수립
- ARGS: scenario.md 경로
- RETURN: DSL 설계 계획
```

**계획 내용:**
- 노드 매핑 전략 (시나리오의 각 단계를 Dify 노드로 변환)
- 변수 흐름 설계 (입력 → 처리 → 출력)
- 예외 처리 전략 (에러 핸들링, 폴백 로직)
- DSL 검증 기준 확정

### Phase 3: DSL 설계 및 생성

```
→ Agent: dsl-architect (with /oh-my-claudecode:ralph)
```

**TASK:**
scenario.md를 분석하여 Dify import 가능한 완전한 DSL YAML 파일 생성 및 검증

**EXPECTED OUTCOME:**
- Dify DSL YAML 파일 (`{app-name}.dsl.yaml`)
- validate_dsl 도구로 검증 통과 (PASS)
- 워크플로우 플로우 다이어그램 (Mermaid 형식)

**MUST DO:**
- DSL 가이드 엄격히 준수 (`references/dify-workflow-dsl-guide.md`)
- 노드 ID 고유성 보장 (중복 ID 금지)
- 변수 참조 정확성 검증 (존재하지 않는 변수 참조 금지)
- 자동 검증 도구 실행 및 PASS 확인
  ```bash
  cd C:\Users\hiond\workspace\gen-dmap\tools\dify-cli
  python validate_dsl.py C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{app-name}.dsl.yaml --verbose
  ```
- 검증 실패 시 오류 수정 후 재검증 (최대 3회 시도)

**MUST NOT DO:**
- 직접 코드 실행 금지 (code_execute 사용 금지, Bash 도구만 허용)
- 요구사항 범위 외 기능 추가 금지 (시나리오에 없는 노드 추가 금지)
- 검증 없이 DSL 저장 금지 (validate_dsl PASS 필수)

**CONTEXT:**
- scenario.md 경로: `C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\scenario.md`
- DSL 가이드 경로: `C:\Users\hiond\workspace\gen-dmap\references\dify-workflow-dsl-guide.md`
- DSL 생성 프롬프트 참조: `C:\Users\hiond\workspace\gen-dmap\references\dsl-generation-prompt.md`
- 검증 도구 경로: `C:\Users\hiond\workspace\gen-dmap\tools\dify-cli\validate_dsl.py`

### Phase 4: 검증

```
→ Skill: /oh-my-claudecode:ultraqa
- INTENT: DSL 품질 검증
- ARGS: DSL 파일 경로
- RETURN: 검증 결과
```

**검증 항목:**
- [ ] validate_dsl 도구 PASS
- [ ] 모든 노드 ID 고유함
- [ ] 모든 변수 참조 유효함
- [ ] 시작 노드(start) 존재
- [ ] 종료 노드(end 또는 answer) 존재
- [ ] 고아 노드 없음 (연결되지 않은 노드)
- [ ] 순환 참조 없음

**검증 실패 시:**
- Phase 3으로 복귀 (최대 3회 재시도)
- 3회 실패 시 사용자에게 수동 수정 요청

### Phase 5: 완료

DSL 파일 저장:
```
C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{app-name}.dsl.yaml
```

플로우 다이어그램 저장:
```
C:\Users\hiond\workspace\gen-dmap\samples\abra\outputs\{app-name}-flow.md
```

완료 메시지 출력:
```
✅ DSL 생성 완료

산출물:
- {app-name}.dsl.yaml: Dify import 가능한 DSL (validate_dsl PASS)
- {app-name}-flow.md: 워크플로우 플로우 다이어그램

검증 결과:
✓ validate_dsl: PASS
✓ 노드 수: 15개
✓ 변수 참조: 모두 유효
✓ 에러: 0건

다음 단계:
- "프로토타이핑해줘" 또는 "/abra:prototype"를 실행하여 Dify에서 실제 실행 테스트
```

## 완료 조건

- [ ] scenario.md 파일이 존재함
- [ ] DSL YAML 파일이 생성됨
- [ ] validate_dsl 검증이 PASS함
- [ ] 플로우 다이어그램이 생성됨
- [ ] 에러가 0건임
- [ ] 다음 단계 안내가 출력됨

## 검증 프로토콜

### 자동 검증 (필수)

완료 전 validate_dsl 자동 검증 PASS 필수.

```bash
python validate_dsl.py {dsl-file} --verbose
```

**검증 통과 기준:**
- 반환 코드: 0
- 출력 메시지: "Validation PASS"
- 에러 메시지 없음

### Architect 검증 (Phase 4)

ultraqa 스킬을 통한 품질 검증:
- DSL 구조 정합성
- 노드 연결 완전성
- 변수 참조 유효성

## 상태 정리

완료 시 `.omc/state/abra-dsl-generate-state.json` 삭제.

**상태 파일 구조:**
```json
{
  "phase": "Phase3_Generating",
  "scenarioPath": "outputs/scenario.md",
  "appName": "customer-inquiry-agent",
  "dslPath": "outputs/customer-inquiry-agent.dsl.yaml",
  "validationAttempts": 1,
  "validationStatus": "PASS",
  "timestamp": "2026-02-09T11:15:00Z"
}
```

## 취소

`cancelomc` 또는 `stopomc` 키워드 감지 시:
- dsl-architect 에이전트 중단
- 부분 생성된 DSL 파일 정리 (`.draft.yaml` 확장자로 백업)
- 상태 파일 삭제

## 재개

상태 파일 존재 시:
- `phase` 필드 확인하여 마지막 Phase부터 재개
- `validationAttempts` 확인하여 재시도 횟수 추적
- 사용자에게 재개 알림

## 스킬 부스팅

| 워크플로우 단계 | 활용 스킬 | 목적 |
|----------------|-----------|------|
| Phase 2: 설계 계획 | `/oh-my-claudecode:plan` | DSL 설계 전략 수립 |
| Phase 3: DSL 생성 | `/oh-my-claudecode:ralph` | 검증 통과까지 지속 실행 |
| Phase 4: 검증 | `/oh-my-claudecode:ultraqa` | 품질 검증 및 오류 수정 |

## 주의사항

- DSL 생성은 고복잡도 작업으로 Opus 모델 사용 (정확도 최우선)
- validate_dsl 검증 없이는 절대 완료하지 않음 (HARD RULE)
- 검증 실패 시 최대 3회 재시도, 이후 사용자 개입 요청
- DSL 가이드 문서(`dify-workflow-dsl-guide.md`)를 항상 참조
- 노드 ID는 UUID v4 형식 권장 (고유성 보장)
