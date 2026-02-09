# context7


- [context7](#context7)
  - [기본 정보](#기본-정보)
  - [설치 정보](#설치-정보)
  - [제공 도구](#제공-도구)
  - [사용 예시](#사용-예시)
  - [스킬에서의 참조](#스킬에서의-참조)

---

## 기본 정보

| 항목 | 값 |
|------|---|
| 도구명 | context7 |
| 카테고리 | MCP 서버 |
| 설명 | 라이브러리 공식 문서 검색 및 코드 예시 제공 |
| 공식 사이트 | https://www.npmjs.com/package/@upstash/context7-mcp |
| 제공자 | Upstash |

[Top](#context7)

---

## 설치 정보

| 항목 | 값 |
|------|---|
| 필수 여부 | 선택 (없어도 플러그인 동작) |
| 의존성 | Node.js 18+, npx |

**설치 명령 (Windows):**

```bash
claude mcp add-json context7 "{\"type\":\"stdio\",\"command\":\"cmd\",\"args\":[\"/c\",\"npx\",\"-y\",\"@upstash/context7-mcp@latest\"]}" -s user
```

**설치 명령 (macOS/Linux):**

```bash
claude mcp add-json context7 '{"type":"stdio","command":"npx","args":["-y","@upstash/context7-mcp@latest"]}' -s user
```

**검증 명령:**

```bash
claude mcp list -s user
```

**MCP 설정 파일** (`gateway/mcp/context7.json`):

```json
{
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]
}
```

> macOS/Linux의 경우 `"command": "npx"`, `"args": ["-y", "@upstash/context7-mcp@latest"]`

[Top](#context7)

---

## 제공 도구

| 도구명 | 설명 | 주요 파라미터 |
|--------|------|-------------|
| `resolve-library-id` | 라이브러리명을 Context7 ID로 변환 | `libraryName`: 라이브러리명, `query`: 검색 질의 |
| `query-docs` | 라이브러리 공식 문서 검색 | `libraryId`: Context7 ID (resolve-library-id로 획득), `query`: 검색 질의 |

[Top](#context7)

---

## 사용 예시

```
1. resolve-library-id로 라이브러리 ID 획득
   → libraryName: "react", query: "useState hook"
   → 결과: "/facebook/react"

2. query-docs로 문서 검색
   → libraryId: "/facebook/react", query: "useState hook usage"
   → 결과: 공식 문서 내용 + 코드 예시
```

[Top](#context7)

---

## 스킬에서의 참조

| 참조 위치 | 참조 방법 |
|----------|----------|
| install.yaml | `mcp_servers` 항목으로 선언 |
| runtime-mapping.yaml | `doc_search` 추상 도구에 매핑 |
| 에이전트 tools.yaml | `doc_search` 추상 도구로 선언 |
| SKILL.md | "공식 문서를 검색하여 확인" 지시 |

[Top](#context7)
