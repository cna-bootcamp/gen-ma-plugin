---
name: orchestrate
description: Abra 워크플로우 오케스트레이션
user-invocable: false
type: core
---

# orchestrate

## 목표

Core 라우팅 전용 스킬. 사용자 의도를 감지하여 적절한 전문 스킬로 디스패치함.

## 라우팅 테이블

| 감지 패턴 | 라우팅 대상 | 비고 |
|-----------|-----------|------|
| "에이전트 만들어", "Agent 개발", "전체 워크플로우" | 전체 5단계 실행 | scenario → dsl-generate → prototype → dev-plan → develop |
| "시나리오 생성", "요구사항", "기획" | → Skill: scenario | 서비스 목적 입력 필요 |
| "DSL 생성", "워크플로우 설계" | → Skill: dsl-generate | scenario.md 필요 |
| "프로토타이핑", "테스트", "검증" | → Skill: prototype | DSL 파일 필요 |
| "개발계획서", "계획 수립" | → Skill: dev-plan | 검증된 DSL 필요 |
| "코드 개발", "구현", "배포" | → Skill: develop | dev-plan.md 필요 |
| "Dify 설치", "Dify 구축" | → Skill: dify-setup | - |
| "초기 설정", "환경 설정" | → Skill: setup | - |

## 라우팅 로직

### Phase 1: 현황 파악

산출물 존재 여부 확인:
- `scenario.md` - 시나리오 생성 완료 여부
- `{app-name}.dsl.yaml` - DSL 생성 완료 여부
- `{app-name}-verified.dsl.yaml` - 프로토타이핑 완료 여부
- `dev-plan.md` - 개발계획서 작성 완료 여부
- 구현 코드 디렉토리 - 개발 완료 여부

### Phase 2: 실행

#### 전체 워크플로우 실행 시

1. **Scenario** (`scenario` 스킬 호출)
   - INTENT: 요구사항 시나리오 생성
   - ARGS: 서비스 목적
   - RETURN: scenario.md

2. **DSL Generate** (`dsl-generate` 스킬 호출)
   - INTENT: Dify DSL 자동 생성
   - ARGS: scenario.md 경로
   - RETURN: {app-name}.dsl.yaml

3. **Prototype** (`prototype` 스킬 호출)
   - INTENT: Dify 프로토타이핑
   - ARGS: DSL 파일 경로
   - RETURN: {app-name}-verified.dsl.yaml

4. **Dev Plan** (`dev-plan` 스킬 호출)
   - INTENT: 개발계획서 작성
   - ARGS: verified DSL 경로, scenario.md 경로
   - RETURN: dev-plan.md

5. **Develop** (`develop` 스킬 호출)
   - INTENT: AI Agent 개발 및 배포
   - ARGS: dev-plan.md 경로, DSL 경로
   - RETURN: 구현 코드 + README.md

#### 개별 스킬 실행 시

매핑 테이블에 따라 해당 스킬로 직접 디스패치.

### Phase 3: 완료 보고

- 실행된 스킬 목록
- 생성된 산출물 경로
- 다음 단계 안내 (해당되는 경우)

## 디스패치 방식

```
→ Skill: {skill-name}
- INTENT: {실행 의도}
- ARGS: {필요한 입력값}
- RETURN: {기대 산출물}
```

## 완료 조건

- [ ] 사용자 의도가 정확히 식별됨
- [ ] 적절한 스킬로 디스패치됨
- [ ] 디스패치된 스킬이 완료됨

## 주의사항

- Core 스킬은 로직을 포함하지 않음
- 모든 실제 작업은 전문 스킬에 위임
- 산출물 의존성 체크는 수행하되, 생성은 전문 스킬이 담당
