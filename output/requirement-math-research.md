# 요구사항 정의서

## 기본 정보
- 플러그인명: math-research
- 목적: arXiv와 주요 수학 저널에서 최신 논문을 자동으로 검색하고, 관심 주제에 맞춰 요약 및 분류하여 팀에게 일일 리포트 제공
- 대상 도메인: 학술 연구, 수학
- 대상 사용자: 수학 연구원, 대학원생, 교수

## 핵심기능
- 논문 자동 검색: arXiv, Google Scholar, IEEE Xplore, Springer, Elsevier에서 키워드 기반 자동 검색
- 키워드 기반 필터링: 사용자가 등록한 관심 키워드를 기준으로 논문 필터링
- 논문 요약 생성: Claude API를 활용하여 Abstract 및 전문(full-text) 분석 후 고품질 요약 생성
- 일일/주간 리포트 생성: 검색된 논문 목록과 요약을 구조화된 리포트로 자동 생성 (일일 주기)
- 논문 분류 및 태깅: 논문 주제에 따라 자동 분류 및 태그 부여
- 메타데이터 추출 및 저장: 논문 제목, 저자, 출판일, DOI, 키워드 등 메타데이터 추출 및 로컬 저장

## 사용자 플로우
- Step 1. 관심 키워드 등록: 사용자가 관심 있는 수학 분야 키워드 등록 (예: "category theory", "algebraic topology")
- Step 2. 논문 자동 검색: 등록된 키워드를 기반으로 arXiv, Google Scholar 등에서 최신 논문 자동 검색
- Step 3. 논문 필터링 및 분류: 검색된 논문을 키워드 매칭 및 주제 분류로 필터링
- Step 4. 논문 요약 생성: 필터링된 논문의 Abstract 및 전문을 Claude API로 분석하여 요약 생성
- Step 5. 일일 리포트 생성: 요약된 논문 목록을 Markdown 파일 및 이메일 형식으로 리포트 생성
- Step 6. 리포트 전달: Markdown 파일로 저장하고, 사용자 이메일로 발송

## 에이전트 구성 힌트
- **researcher** (MEDIUM): 논문 검색 및 외부 API 연동 전문가
  - 기능 특성: arXiv, Google Scholar, IEEE Xplore 등 외부 API 조사 및 데이터 수집
  - 역할 매칭: 조사·수집 전문가 (외부 문서 조사, API 문서 검색, 기술 리서치)

- **classifier** (MEDIUM): 논문 분류 및 태깅 전문가
  - 기능 특성: 논문 주제 분석 후 카테고리 분류 및 태그 자동 부여
  - 역할 매칭: 분석 전문가 (패턴 파악, 구조 분석)

- **summarizer** (HIGH): AI 기반 논문 요약 생성 전문가
  - 기능 특성: Claude API를 활용한 고품질 논문 요약 생성 (복잡한 추론 필요)
  - 역할 매칭: 문서 작성 전문가 (고도의 언어 처리, 핵심 내용 추출)

- **report-generator** (MEDIUM): 일일 리포트 생성 및 포맷팅 전문가
  - 기능 특성: 구조화된 Markdown/이메일 리포트 자동 생성
  - 역할 매칭: 문서 작성 전문가 (템플릿 기반 산출물 생성)

## 참고 공유 자원
- 참고 가이드: 없음 (수학 논문 리서치 도메인 특화 가이드 없음 — 플러그인 개발 시 직접 작성 필요)
- 참고 샘플: 없음 (유사 도메인 샘플 없음 — 직접 개발 필요)
- 참고 템플릿: `templates/plugin/README-plugin-template.md` (플러그인 README 작성용 표준 템플릿)
- 참고 도구: `context7` (MCP 서버) — arXiv API, Google Scholar API 등 외부 라이브러리 문서 검색용

## 기술 요건
- 프로그래밍 언어: Python (arXiv API, scholarly 라이브러리, Claude API SDK 지원)
- 외부 API 연동:
  - arXiv API (공식 REST API)
  - Google Scholar (scholarly 라이브러리 활용)
  - IEEE Xplore, Springer, Elsevier (각 플랫폼 API 또는 크롤링)
- Claude API: Anthropic Claude API Python SDK (요약 생성용)
- 이메일 발송: smtplib (Python 표준 라이브러리) 또는 SendGrid API
- 데이터 저장: JSON 또는 SQLite (메타데이터 로컬 저장용)
- 출력 형식: Markdown, HTML (이메일용)

## 인증/보안 요건
- Claude API Key: 환경 변수 `ANTHROPIC_API_KEY`로 관리
- 이메일 발송: SMTP 인증 정보 또는 SendGrid API Key (환경 변수로 관리)
- arXiv API: 인증 불요 (공개 API)
- Google Scholar: scholarly 라이브러리 사용 (인증 불요, 단 rate limiting 주의)

## 에러 처리 및 예외 상황
- API 호출 실패: Retry 로직 구현 (최대 3회 재시도)
- Rate Limiting: 요청 간 delay 설정 (arXiv: 3초, Google Scholar: 5초)
- 논문 전문(full-text) 접근 불가: Abstract만 사용하여 요약 생성
- 이메일 발송 실패: Markdown 파일만 저장하고 사용자에게 알림

## 성능/비용 요건
- 일일 검색 논문 수: 최대 100편
- Claude API 토큰 사용량: 논문당 평균 2,000 토큰 (요약 생성 기준)
- 리포트 생성 시간: 5분 이내 (100편 기준)
