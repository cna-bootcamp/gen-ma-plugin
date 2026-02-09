# validate_dsl


- [validate_dsl](#validate_dsl)
  - [기본 정보](#기본-정보)
  - [설치 정보](#설치-정보)
  - [검증 항목](#검증-항목)
  - [사용 예시](#사용-예시)
  - [스킬에서의 참조](#스킬에서의-참조)

---

## 기본 정보

| 항목 | 값 |
|------|---|
| 도구명 | validate_dsl |
| 카테고리 | 커스텀 앱 |
| 설명 | Dify DSL YAML 구조 검증 도구 |
| 소스 경로 | `resources/tools/customs/dify-cli/validate_dsl.py` |

[Top](#validate_dsl)

---

## 설치 정보

| 항목 | 값 |
|------|---|
| 설치 방법 | 소스 파일 포함 (별도 설치 불요) |
| 의존성 | pyyaml >= 6.0 |
| 검증 명령 | `python gateway/tools/validate_dsl.py --help` (또는 인자 없이 실행) |
| 필수 여부 | 필수 |

[Top](#validate_dsl)

---

## 검증 항목

| 카테고리 | 검증 내용 |
|---------|----------|
| YAML | 기본 구조 (딕셔너리 형태) |
| VERSION | 시맨틱 버전 형식 및 호환성 (현재 0.5.0) |
| APP | app.name, app.mode 필수 필드 |
| WORKFLOW | workflow 섹션 존재 (workflow/advanced-chat 모드) |
| GRAPH | 노드/엣지 구조, START/END 노드 존재 |
| NODE | 노드별 상세 검증 (LLM, Code, If-Else, HTTP 등) |
| EDGE | 엣지의 source/target 노드 참조 유효성 |
| VARIABLE | 환경변수/대화변수 타입 검증 |
| VAR_REF | 변수 참조 `{{#nodeId.var#}}` 일관성 |
| SELECTOR | value_selector 노드 참조 유효성 |

**출력 형식:**

| 심각도 | 아이콘 | 의미 |
|--------|-------|------|
| ERROR | `[X]` | 필수 수정 — Import 실패 가능 |
| WARNING | `[!]` | 권장 수정 — 동작에 영향 가능 |
| INFO | `[i]` | 참고 정보 |

**종료 코드:**

| 코드 | 의미 |
|------|------|
| 0 | 검증 통과 (ERROR 없음) |
| 1 | 검증 실패 (ERROR 존재) |

[Top](#validate_dsl)

---

## 사용 예시

```bash
# DSL 파일 검증
python gateway/tools/validate_dsl.py my-app.dsl.yaml

# 출력 예시:
# ======================================================================
#   Dify DSL Validator — my-app.dsl.yaml
# ======================================================================
#
#   [X] ERROR (2건)
#   ------------------------------------------------------------------
#   [X] [LLM] @ workflow.graph.nodes[3].data.model
#       model 설정 누락
#       -> model: { provider: '...', name: '...', mode: 'chat' }
#
#   [!] WARNING (1건)
#   ------------------------------------------------------------------
#   [!] [GRAPH] @ workflow.graph.nodes
#       END 노드가 없음 — 워크플로우 종료점 없음
#
# ======================================================================
#   결과: FAIL  |  오류: 2  |  경고: 1  |  정보: 3
# ======================================================================
```

[Top](#validate_dsl)

---

## 스킬에서의 참조

| 참조 위치 | 참조 방법 |
|----------|----------|
| install.yaml | `custom_tools` 항목으로 선언 |
| runtime-mapping.yaml | `dsl_validate` 추상 도구에 매핑 |
| 에이전트 tools.yaml | `dsl_validate` 추상 도구로 선언 |
| SKILL.md | "DSL 파일을 검증" 지시 |

[Top](#validate_dsl)
