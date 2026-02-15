# math-research 플러그인 명세서

---

## 기본 정보

| 항목 | 내용 |
|------|------|
| 플러그인명 | math-research |
| 버전 | 1.0.0 |
| 분류 | research (학술 연구) |
| 저장소 | https://github.com/unicorn-plugins/math-research |
| 라이선스 | MIT |
| 제작자 | Unicorn Inc. |

---

## 한 줄 설명

arXiv와 주요 수학 저널에서 최신 논문을 자동으로 검색하고, AI 요약 및 일일 리포트를 제공하는 DMAP 플러그인

---

## 주요 기능

- **논문 자동 검색**: arXiv, Google Scholar, IEEE Xplore 등에서 키워드 기반 자동 검색
- **AI 요약 생성**: Claude API를 활용한 논문 요약 생성 (Abstract 및 전문 분석)
- **주제별 분류**: 논문 주제에 따라 자동 분류 및 태그 부여
- **일일 리포트**: Markdown 및 이메일 형식의 일일 리포트 자동 생성
- **메타데이터 관리**: 논문 제목, 저자, 출판일, DOI, 키워드 등 메타데이터 추출 및 로컬 저장

---

## 대상 사용자

- 수학 연구원
- 대학원생
- 교수
- 학술 연구팀

---

## 에이전트 구성

| 에이전트 | 티어 | 역할 |
|----------|------|------|
| researcher | MEDIUM | arXiv, Google Scholar 등에서 논문 검색 및 메타데이터 수집 |
| classifier | MEDIUM | 논문 주제별 분류 및 태그 자동 부여 |
| summarizer | HIGH | Claude API로 논문 요약 생성 (고품질 언어 처리) |
| report-generator | MEDIUM | Markdown/이메일 형식 일일 리포트 생성 및 발송 |

---

## 스킬 구성

| 스킬 | 타입 | 설명 |
|------|------|------|
| setup | Setup | 플러그인 초기 설정 (API 키, 이메일, 키워드 등록) |
| help | Utility | 사용 안내 |
| add-ext-skill | Utility | 외부 확장 스킬 추가 |
| remove-ext-skill | Utility | 외부 확장 스킬 제거 |
| core | Core | 전체 워크플로우 실행 (검색 → 분류 → 요약 → 리포트) |
| search-papers | Orchestrator | 키워드 기반 논문 검색 |
| generate-report | Orchestrator | AI 요약 및 일일 리포트 생성 |

---

## 필수 도구

| 도구 | 유형 | 용도 |
|------|------|------|
| arxiv | Python 패키지 | arXiv API 클라이언트 |
| scholarly | Python 패키지 | Google Scholar 검색 |
| python-dotenv | Python 패키지 | 환경 변수 관리 |
| pyyaml | Python 패키지 | YAML 파일 파싱 |
| arxiv_client.py | Custom | arXiv API 래퍼 |
| scholar_client.py | Custom | Google Scholar 래퍼 |
| email_sender.py | Custom | SMTP 이메일 발송 |
| context7 | MCP | 외부 라이브러리 문서 검색 |

---

## 기술 스택

- **언어**: Python 3.8+
- **외부 API**: arXiv API, Google Scholar, Claude API
- **데이터 저장**: JSON
- **이메일**: SMTP (smtplib)
- **출력 형식**: Markdown, HTML

---

## 설치 방법

```bash
# 1. GitHub 저장소를 마켓플레이스로 등록
claude plugin marketplace add unicorn-plugins/math-research

# 2. 플러그인 설치
claude plugin install math-research@math-research

# 3. 설치 확인
claude plugin list

# 4. 초기 설정
/math-research:setup
```

---

## 사용 예시

### 기본 사용 흐름

```
1. 초기 설정
   /math-research:setup
   → API 키, 이메일 설정, 관심 키워드 등록

2. 논문 검색
   /math-research:search-papers
   또는 "논문 검색해줘"
   → arXiv, Google Scholar에서 검색

3. 리포트 생성
   /math-research:generate-report
   또는 "리포트 생성해줘"
   → AI 요약 + Markdown 리포트 생성

4. 전체 워크플로우
   /math-research:core
   → 검색부터 리포트까지 자동화
```

### 자동 라우팅

다음 자연어 요청은 자동으로 처리됨:
- "논문 검색해줘", "최신 논문 찾아줘" → `/math-research:search-papers`
- "리포트 생성해줘", "일일 리포트" → `/math-research:generate-report`
- "math-research 실행", "전체 워크플로우" → `/math-research:core`

---

## 설정 파일

### .dmap/math-research/config.json

```json
{
  "keywords": ["graph theory", "combinatorics"],
  "sources": {
    "arxiv": true,
    "scholar": true,
    "ieee": false
  },
  "search_period": "최근 1개월",
  "max_results": 50,
  "email": {
    "enabled": true,
    "recipients": ["user@example.com"]
  }
}
```

### .dmap/math-research/.env

```bash
# Claude API Key
ANTHROPIC_API_KEY=your_api_key_here

# SMTP 설정
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
RECIPIENTS=recipient@example.com
```

---

## 성능 및 제약 사항

- **일일 검색 논문 수**: 최대 100편
- **Claude API 토큰 사용량**: 논문당 평균 2,000 토큰
- **리포트 생성 시간**: 약 5분 (100편 기준)
- **Rate Limiting**:
  - arXiv API: 요청 간 3초 대기
  - Google Scholar: 요청 간 5초 대기

---

## 외부 스킬 통합

이 플러그인은 다른 플러그인의 External 스킬에서 호출 가능:

```yaml
# 다른 플러그인의 SKILL.md에서
external-plugins:
  - name: math-research
    skills:
      - search-papers
      - generate-report
```

---

## 런타임 호환성

| 런타임 | 지원 |
|--------|:----:|
| Claude Code | ✅ |
| Codex CLI | 미검증 |
| Gemini CLI | 미검증 |

---

## 참고 자료

- **GitHub 저장소**: https://github.com/unicorn-plugins/math-research
- **README**: https://github.com/unicorn-plugins/math-research/blob/main/README.md
- **arXiv API**: https://info.arxiv.org/help/api/index.html
- **Claude API**: https://docs.anthropic.com/

---

## 업데이트 이력

| 버전 | 날짜 | 주요 변경 사항 |
|------|------|---------------|
| 1.0.0 | 2026-02-15 | 초기 릴리스 - 논문 검색, AI 요약, 일일 리포트 기능 |

---

## 라이선스

MIT License

---

## 제작 정보

- **제작자**: Unicorn Inc.
- **제작 도구**: DMAP Builder (Declarative Multi-Agent Plugin Builder)
- **제작 방법**: `/dmap:develop-plugin` 명령으로 자동 생성
- **배포 방법**: `/dmap:publish` 명령으로 GitHub에 자동 배포

---

## 관련 리소스

### 사용된 가이드
- `plugin-dev-guide.md` - DMAP 플러그인 개발 가이드

### 사용된 템플릿
- `README-plugin-template.md` - 플러그인 README 템플릿

### 사용된 도구
- `context7` (MCP) - 외부 라이브러리 문서 검색
- `create_repo.py` - GitHub 저장소 생성 및 배포
