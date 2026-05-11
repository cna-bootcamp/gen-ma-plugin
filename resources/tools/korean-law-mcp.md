# korean-law-mcp

- [korean-law-mcp](#korean-law-mcp)
  - [기본 정보](#기본-정보)
  - [설치 정보](#설치-정보)
  - [제공 도구](#제공-도구)
  - [사용 예시](#사용-예시)
  - [스킬에서의 참조](#스킬에서의-참조)

---

## 기본 정보

| 항목 | 값 |
|------|---|
| 도구명 | korean-law-mcp |
| 카테고리 | MCP 서버 |
| 설명 | 법제처 Open API 기반 한국 법령·판례·조례·조약 검색 및 법률 리서치 |
| 공식 사이트 | https://github.com/chrisryugj/korean-law-mcp |
| 제공자 | Chris |
| 실행 패키지 | `korean-law-mcp@latest` |
| 설정 경로 | `resources/tools/mcp/law/korean-law-mcp/install-config.json` |

[Top](#korean-law-mcp)

---

## 설치 정보

| 항목 | 값 |
|------|---|
| 필수 여부 | 선택 |
| 의존성 | Node.js 20.19+, npx |
| 필수 환경 변수 | `LAW_OC` |
| 데이터 소스 | 법제처 Open API |

**설치 명령 (Windows PowerShell):**

```powershell
$config = @'
{
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "korean-law-mcp@latest"],
  "env": {
    "LAW_OC": "<YOUR_LAW_OC>"
  }
}
'@
claude mcp add-json korean-law-mcp $config -s user
```

**설치 명령 (macOS/Linux):**

```bash
claude mcp add-json korean-law-mcp '{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "korean-law-mcp@latest"],
  "env": {
    "LAW_OC": "<YOUR_LAW_OC>"
  }
}' -s user
```

**검증 명령:**

```bash
claude mcp list -s user
```

[Top](#korean-law-mcp)

---

## 제공 도구

| 도구명 | 설명 | 주요 파라미터 |
|--------|------|-------------|
| `chain_full_research` | 법령·판례·해석례 기반 종합 리서치 | 질의, 시나리오 |
| `chain_law_system` | 법률·시행령·시행규칙과 위임구조 분석 | 법령명, 조문, 시나리오 |
| `chain_action_basis` | 허가·인가·처분 근거 확인 | 질의, 시나리오 |
| `chain_dispute_prep` | 불복·소송·심판 대비 리서치 | 질의, 사건 유형 |
| `chain_amendment_track` | 신구대조와 개정 연혁 추적 | 법령명, 조문, 기준일 |
| `chain_ordinance_compare` | 상위법 기준 전국 조례 비교 | 법령명, 지역, 시나리오 |
| `chain_procedure_detail` | 절차·비용·서식 안내 | 민원·절차명 |
| `chain_document_review` | 계약서·약관 리스크 분석 | 문서 내용, 검토 관점 |
| `search_law` | 법령 검색 및 lawId·MST 획득 | query |
| `get_law_text` | 법령 조문 전문 조회 | mst 또는 lawId, jo |
| `get_annexes` | 별표·서식 조회 및 본문 추출 | lawName, bylSeq |
| `search_decisions` | 판례·헌재·조세심판 등 17개 도메인 통합 검색 | domain, query |
| `get_decision_text` | 17개 도메인 결정·판례 전문 조회 | domain, id, full |
| `verify_citations` | LLM 답변의 법령·조문 인용 실존 여부 검증 | text, searchDisplay |
| `impact_map` | 조문 개정·위임·관련 조례 영향 그래프 생성 | lawName, jo, depth |
| `discover_tools` | 전문 도구 검색 | query, category |
| `execute_tool` | 전문 도구 프록시 실행 | tool, arguments |

[Top](#korean-law-mcp)

---

## 사용 예시

```text
1. search_law로 법령 검색
   -> query: "근로기준법"

2. get_law_text로 조문 조회
   -> lawId: "근로기준법", jo: "제74조"

3. search_decisions로 관련 판례·해석례 검색
   -> domain: "precedent", query: "근로기준법 제74조"

4. verify_citations로 답변 내 조문 인용 검증
   -> text: "근로기준법 제74조에 따르면..."

5. chain_full_research로 종합 리서치 수행
   -> query: "관세법 제38조 납세신고 관련 판례와 해석례"
```

[Top](#korean-law-mcp)

---

## 스킬에서의 참조

| 참조 위치 | 참조 방법 |
|----------|----------|
| install.yaml | `mcp_servers` 항목으로 선언 |
| runtime-mapping.yaml | `korean_law_search` 또는 `legal_research` 추상 도구에 매핑 |
| 에이전트 tools.yaml | `korean_law_search`, `legal_research` 추상 도구로 선언 |
| SKILL.md | 한국 법령·판례·조례 확인과 인용 검증 지시문에서 참조 |

[Top](#korean-law-mcp)
