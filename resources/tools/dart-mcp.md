# dart-mcp

- [dart-mcp](#dart-mcp)
  - [기본 정보](#기본-정보)
  - [설치 정보](#설치-정보)
  - [제공 도구](#제공-도구)
  - [사용 예시](#사용-예시)
  - [스킬에서의 참조](#스킬에서의-참조)

---

## 기본 정보

| 항목 | 값 |
|------|---|
| 도구명 | dart-mcp |
| 카테고리 | MCP 서버 |
| 설명 | DART 공시와 KRX 시장 데이터를 활용한 한국 주식·공시 분석 |
| 공식 사이트 | https://mcp.directory/servers/korean-stock-market-dart-krx |
| 제공자 | jjlabsio |
| 실행 패키지 | `korea-stock-mcp@latest` |
| 설정 경로 | `resources/tools/mcp/finance/dart-mcp/install-config.json` |

[Top](#dart-mcp)

---

## 설치 정보

| 항목 | 값 |
|------|---|
| 필수 여부 | 선택 |
| 의존성 | Node.js 18+, npx |
| 필수 환경 변수 | `DART_API_KEY`, `KRX_API_KEY` |
| 데이터 소스 | DART 전자공시시스템, KRX 한국거래소 |

**설치 명령 (Windows PowerShell):**

```powershell
$config = @'
{
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "korea-stock-mcp@latest"],
  "env": {
    "DART_API_KEY": "<YOUR_DART_API_KEY>",
    "KRX_API_KEY": "<YOUR_KRX_API_KEY>"
  }
}
'@
claude mcp add-json dart-mcp $config -s user
```

**설치 명령 (macOS/Linux):**

```bash
claude mcp add-json dart-mcp '{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "korea-stock-mcp@latest"],
  "env": {
    "DART_API_KEY": "<YOUR_DART_API_KEY>",
    "KRX_API_KEY": "<YOUR_KRX_API_KEY>"
  }
}' -s user
```

**검증 명령:**

```bash
claude mcp list -s user
```

[Top](#dart-mcp)

---

## 제공 도구

| 도구명 | 설명 | 주요 파라미터 |
|--------|------|-------------|
| `get_disclosure_list` | 회사별·기간별 공시보고서 검색 | 회사명, 종목코드, 기간, 공시 유형 |
| `get_corp_code` | DART 공시대상회사 고유번호 조회 | 회사명, 종목코드 |
| `get_disclosure` | 공시보고서 원문 파싱 데이터 조회 | 접수번호, 섹션 ID |
| `get_financial_statement` | XBRL 기반 재무제표 조회 | 고유번호, 사업연도, 보고서 코드 |
| `get_stock_base_info` | KOSPI·KOSDAQ·KONEX 종목 기본정보 조회 | 종목코드, 시장구분 |
| `get_stock_trade_info` | 종목별 일별 거래 데이터 조회 | 종목코드, 기준일, 시장구분 |
| `get_market_type` | 종목코드 기준 시장구분 조회 | 종목코드 |
| `get_today_date` | 현재 날짜 조회 | 없음 |

[Top](#dart-mcp)

---

## 사용 예시

```text
1. get_corp_code로 회사 고유번호 조회
   -> companyName: "삼양식품"

2. get_financial_statement로 연도별 재무제표 조회
   -> corpCode: "조회한 고유번호", bsnsYear: "2024", reprtCode: "11011"

3. get_stock_trade_info로 일별 주가와 거래량 조회
   -> stockCode: "003230", date: "20250102"
```

[Top](#dart-mcp)

---

## 스킬에서의 참조

| 참조 위치 | 참조 방법 |
|----------|----------|
| install.yaml | `mcp_servers` 항목으로 선언 |
| runtime-mapping.yaml | `stock_market_data` 또는 `disclosure_search` 추상 도구에 매핑 |
| 에이전트 tools.yaml | `stock_market_data`, `financial_disclosure` 추상 도구로 선언 |
| SKILL.md | 한국 상장사 공시·재무·주가 조회 지시문에서 참조 |

[Top](#dart-mcp)
