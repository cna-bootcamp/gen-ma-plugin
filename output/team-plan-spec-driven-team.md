# 팀 기획서

## 기본 정보
- 플러그인명: spec-driven-team
- 목적: 코드 수정이 아닌 명세(Specification) 수정으로 어플리케이션을 유지보수하는 팀
- 대상 도메인: 소프트웨어 유지보수, AI 기반 개발 자동화
- 대상 사용자: 소프트웨어 아키텍트, 개발팀 리더, DevOps 엔지니어

## 핵심기능
- 코드베이스 분석: 대상 애플리케이션의 비즈니스 로직, 아키텍처, 의존성 구조 전체 분석
- AI 에이전트화 추천: 분석 결과를 바탕으로 AI 에이전트로 대체 가능한 영역 식별 및 AI 프레임워크 추천
- 명세 자동 생성: 기존 비즈니스 로직을 마크다운/YAML/JSON 형식의 선언적 명세로 자동 변환
- AI 에이전트 구현: 생성된 명세를 기반으로 AI 에이전트 코드 자동 생성 (Dify/LangChain 등)
- 성능/신뢰성 검증: 기존 코드 vs 명세 기반 AI 에이전트 간 성능 비교, 신뢰성 테스트, ROI 측정
- 명세 버전 관리: Git 기반 명세 버전 관리, 변경 이력 추적, 롤백 지점 관리
- 하이브리드 실행: AI 에이전트 실패 시 레거시 코드로 자동 폴백, 안전성 보장

## 사용자 플로우
- Step 1. 코드베이스 분석: 대상 애플리케이션 코드베이스의 구조, 비즈니스 로직, 패턴 전체 분석
- Step 1.5. 분석 결과 리뷰 (사용자 개입): 감지된 언어, 비즈니스 로직 패턴, 추천 영역 확인 및 제외 영역 지정
- Step 2. AI 에이전트화 추천: AI 에이전트로 대체 가능한 영역 식별, AI 프레임워크 추천, 명세화 전략 수립
- Step 2.5. 전략 승인 (사용자 개입): AI 프레임워크 선택, 에이전트화 우선순위 조정, 마이그레이션 계획 승인
- Step 3. 명세 자동 생성: 비즈니스 로직을 마크다운 기반 선언적 명세로 자동 변환 (필요시 YAML/JSON 구조화)
- Step 3.5. 명세 편집 및 검증 (사용자 개입): 웹 에디터로 명세 미리보기/수정, 명세 검증 실행, 최종 확정
- Step 4. AI 에이전트 구현: 명세 기반 AI 에이전트 코드 생성 및 배포
- Step 4.5. 구현 검증 및 롤백 (사용자 개입): 구현 결과 검증, 실패 시 재시도/롤백 선택
- Step 5. 검증 및 ROI 측정: 성능 벤치마크, 신뢰성 테스트, 유지보수 효율성 비교, ROI 분석 보고서 생성

## 에이전트 구성 힌트
- codebase-analyzer (HIGH): 코드베이스 분석 오케스트레이터 — LSP 서버, 정적 분석 도구(Semgrep, SonarQube, CodeQL), 언어별 린터를 활용하여 비즈니스 로직, 아키텍처, 의존성 구조를 분석하고 AI 에이전트화 가능 영역 식별 (직접 코드 분석 X, 도구 결과 해석 및 통합 ✓)
- agent-strategist (HIGH): AI 에이전트화 전략 수립 전문가 — 분석 결과를 바탕으로 AI 프레임워크 선정, 에이전트 분리 기준, 명세화 전략 수립
- spec-generator (MEDIUM): 명세 자동 생성 전문가 — 비즈니스 로직을 마크다운/YAML/JSON 형식의 선언적 명세로 변환
- agent-implementer (MEDIUM): AI 에이전트 구현 전문가 — 명세를 실제 AI 에이전트 코드로 구현 (Dify/LangChain 등)
- verification-engineer (MEDIUM): 검증 및 ROI 측정 전문가 — 성능 벤치마크, 신뢰성 테스트, 유지보수 효율성 비교 분석
- spec-versioner (LOW): 명세 버전 관리 전문가 — Git 기반 명세 버전 관리, 변경 이력 추적, 롤백 지점 관리
- hybrid-executor (MEDIUM): 하이브리드 실행 관리자 — AI 에이전트 실행 + 폴백 메커니즘 (AI 실패 시 레거시 코드 자동 실행)

## 참고 공유 자원
- 참고 가이드:
  - `dify-workflow-dsl-guide`: Dify 워크플로우 DSL 작성 가이드 (AI 프레임워크로 Dify 선택 시 활용)
  - `plugin-dev-guide`: DMAP 플러그인 개발 가이드 (플러그인 자체 개발 워크플로우 참조)
- 참고 템플릿:
  - `dsl-generation-prompt`: 비즈니스 로직 → DSL 명세 자동 생성 프롬프트
  - `develop-plan-generate`: AI 에이전트 개발 계획서 생성 프롬프트
- 참고 샘플:
  - 해당 자원 없음 (유사 도메인: Abra 플러그인 샘플 참고 가능)
- 참고 도구:
  - **MCP 서버:**
    - `context7`: AI 프레임워크 공식 문서 검색 및 코드 예시 제공
  - **LSP 서버 (언어별 코드 인텔리전스):**
    - `python-lsp-server`: Python 코드 분석
    - `typescript-language-server`: JavaScript/TypeScript 코드 분석
    - `jdtls`: Java 코드 분석
    - `omnisharp`: C#/.NET 코드 분석
    - `rust-analyzer`: Rust 코드 분석
  - **정적 분석 도구 (엔터프라이즈 구성):**
    - `SonarQube Community Edition`: 다중 언어 정적 분석 (29개 언어, 6,500+ 규칙)
    - `CodeQL`: GitHub 통합 보안 분석 (시맨틱 분석)
    - `Snyk Code`: 보안 취약점 탐지
  - **언어별 린터:**
    - Python: `Ruff` (초고속 린터), `Bandit` (보안)
    - JavaScript/TypeScript: `ESLint`
    - Java: `PMD`
    - C/C++: `Clang-Tidy`
    - C#: `Roslyn Analyzers`
    - Go: `golangci-lint`
    - Rust: `Clippy`
  - **커스텀 앱:**
    - `dify_cli`: Dify DSL import/export, workflow publish/run 자동화
    - `validate_dsl`: 생성된 DSL 명세 구조 검증
- 참고 플러그인:
  - `abra`: Dify 워크플로우 기반 AI Agent 개발 자동화 (유사 도메인 참고용)

## 기술적 도전과제
- 어떤 부분을 AI 에이전트화할 것인가?
  - codebase-analyzer가 LSP/정적분석/린터 결과를 통합 분석하여 AI 에이전트로 대체 가능한 영역 자동 식별
  - agent-strategist가 분석 결과를 바탕으로 에이전트화 우선순위 결정
  - 기준: 반복적 패턴, 규칙 기반 로직, 데이터 변환 로직 우선 추천
- 기존 비즈니스 로직을 어떻게 명세화할 것인가?
  - spec-generator가 마크다운 기반 선언적 명세 자동 생성
  - 필요 시 YAML/JSON으로 구조화된 규칙 정의
- 성능/신뢰성 보장 방법은?
  - verification-engineer가 기존 코드 vs 명세 기반 AI 에이전트 간 성능 벤치마크 수행
  - 에러율 모니터링, 회귀 테스트 자동화
  - hybrid-executor가 AI 에이전트 실패 시 레거시 코드로 자동 폴백 (Fallback 메커니즘)
- 다양한 언어 지원 전략은?
  - codebase-analyzer가 프로젝트 언어 자동 감지 → 해당 언어의 LSP 서버 + 린터 동적 선택 및 실행
  - 도구 오케스트레이션 방식으로 언어별 전문성 확보 (에이전트가 직접 코드 분석 X)
- 명세 버전 관리 및 동기화는?
  - spec-versioner가 Git 기반 명세 버전 관리, 브랜칭/머지 전략 수립
  - 명세 변경 이력 추적, 명세 버전별 태깅, 롤백 지점 관리
  - 명세 수정 → AI 에이전트 재생성 → 검증 → 배포 파이프라인 자동화

## 실용성 검증 전략
- 정말로 유지보수가 쉬워질까?
  - Step 5에서 유지보수 시나리오별 소요 시간 비교 (코드 수정 vs 명세 수정)
  - 명세 디버깅 난이도, 명세-실제동작 불일치 추적 복잡도 측정
- AI 에이전트 명세 관리가 코드 관리보다 효율적일까?
  - 명세 버전 관리, 명세 변경 이력 추적 시스템 포함
  - 코드 변경 대비 명세 변경의 리드타임 측정
  - 명세 복잡도 vs 코드 복잡도 비교 (단순 CRUD, 복잡한 상태 머신, 멀티스레딩 각 시나리오별)
- ROI(투자 대비 효과)는?
  - verification-engineer가 비용 분석: AI 에이전트 개발 비용 vs 유지보수 시간 절감 효과
  - LLM API 비용 (월 예상), 도구 인프라 비용 포함
  - 6개월/1년 단위 ROI 예측 보고서 생성
  - 개발팀 학습 곡선 (3-6개월) 비용 반영

## 의사결정 사항 (유연하게 대응)
- 어떤 종류의 앱인지?
  - 웹/모바일/백엔드/마이크로서비스/풀스택 모든 유형 지원
  - codebase-analyzer가 프로젝트 구조 분석하여 자동 판별
- AI 에이전트로 대체하려는 기능은 무엇인지?
  - agent-strategist가 코드베이스 분석 결과를 바탕으로 추천
  - 사용자는 추천 목록 중 선택 또는 커스텀 지정 가능
- 어떤 AI 프레임워크/플랫폼 사용 예정인지?
  - agent-strategist가 프로젝트 특성, 팀 기술 스택, 비용 요건을 고려하여 추천
  - 추천 옵션: Dify (워크플로우 기반), LangChain (Python/JS), Semantic Kernel (C#/.NET), AutoGen (멀티에이전트), 커스텀 프레임워크

## AI 에이전트화 적용 기준 (중요)

### AI 에이전트화 적합 기능 ✅
- CRUD 연산 (단순 생성/조회/수정/삭제)
- 데이터 변환/매핑 (A 형식 → B 형식)
- 규칙 기반 검증 (비즈니스 규칙, 데이터 유효성 검사)
- 반복적 워크플로우 (승인, 알림, 데이터 동기화)

### AI 에이전트화 부적합 기능 ❌
- 멀티스레딩/동시성 제어 (복잡한 락 메커니즘)
- 실시간 처리 (<10ms 응답 요구)
- 금융/의료 등 미션 크리티컬 (100% 정확도 필수)
- 복잡한 알고리즘 최적화 (성능 최적화 로직)

### 적합성 자동 판별 기준
- codebase-analyzer가 코드 복잡도, 실시간성 요구사항, 에러 허용 범위 분석
- agent-strategist가 비즈니스 리스크, 도메인 특성 고려하여 최종 추천
- 사용자가 Step 2.5에서 추천 결과 검토 및 조정

## 마이그레이션 전략 (단계적 적용)

### Phase 1: PoC (단일 모듈, 4주)
- 범위: 단일 CRUD 모듈 (예: 사용자 관리)
- 성공 지표: 100% 기능 동등성, 테스트 커버리지 100%, 성능 저하 <5%
- 롤백 조건: 에러율 >1% 또는 성능 저하 >10%

### Phase 2: Pilot (3-5개 핵심 모듈, 12주)
- 범위: 인증, 결제, 알림 등 핵심 모듈
- 성공 지표: 통합 테스트 통과, 사용자 피드백 긍정, 버그 발생률 <기존 대비
- 롤백 조건: 심각한 버그 발견 또는 사용자 만족도 저하

### Phase 3: Rollout (전체 시스템, 24주)
- 범위: 전체 비즈니스 로직 명세화
- 성공 지표: ROI >150%, 유지보수 시간 50% 감소, 개발자 만족도 80%+
- 롤백 조건: ROI <100% 또는 운영 안정성 저하

### 하이브리드 운영 모드
- 마이그레이션 기간 중 레거시 코드 + AI 에이전트 동시 운영
- hybrid-executor가 AI 에이전트 실패 시 레거시 코드로 자동 폴백
- 6개월 이상 하이브리드 운영 후 단계적 레거시 코드 제거

## 명세 관리 시스템

### 명세 저장소 구조
```
/specs
  /{version}      # v1.0.0, v1.1.0 등 (Semantic Versioning)
    /{domain}     # auth, payment, notification
      /{component}.md
```

### 명세 버전 관리 전략
- Git 기반 명세 버전 관리 (브랜칭: main, develop, feature/*)
- spec-versioner가 명세 변경 이력 추적, 명세 버전별 태깅 (v1.0.0, v1.1.0)
- 명세 롤백 지점 관리 (각 배포 시점 태그)
- 명세 충돌 해결 메커니즘 (3-way merge, 동시 수정 방지 락)

### 명세-코드 동기화 프로세스
1. 명세 수정 (개발자가 Markdown/YAML 수정)
2. spec-versioner가 변경사항 감지 및 버전 태깅
3. agent-implementer가 명세 기반 AI 에이전트 재생성
4. verification-engineer가 회귀 테스트 자동 실행
5. 통과 시 CI/CD 파이프라인으로 배포, 실패 시 롤백

### 롤백 메커니즘
- 명세 롤백: Git revert로 이전 명세 버전으로 복원
- AI 에이전트 롤백: 이전 버전 AI 에이전트 코드 재배포
- 레거시 폴백: hybrid-executor가 AI 에이전트 실패 시 레거시 코드 자동 실행

## 에이전트 간 데이터 파이프라인

### 표준 입출력 스키마
```yaml
pipeline:
  - stage: analysis
    agent: codebase-analyzer
    output: .omc/analysis-report.json
    schema:
      detected_languages: [python, typescript]
      business_logic_patterns: []
      dependency_graph: {}
      agentization_candidates: []

  - stage: strategy
    agent: agent-strategist
    input: .omc/analysis-report.json
    output: .omc/strategy-plan.yaml
    schema:
      recommended_frameworks: [dify, langchain]
      agent_candidates: []
      migration_phases: [poc, pilot, rollout]

  - stage: spec_generation
    agent: spec-generator
    input: .omc/strategy-plan.yaml
    output: specs/v1.0.0/{domain}/{component}.md
    schema:
      markdown_spec: str
      yaml_rules: {}

  - stage: implementation
    agent: agent-implementer
    input: specs/v1.0.0/{domain}/{component}.md
    output: agents/{domain}/{component}_agent.py
    schema:
      agent_code: str
      dependencies: []

  - stage: verification
    agent: verification-engineer
    input: agents/{domain}/{component}_agent.py
    output: .omc/verification-report.json
    schema:
      performance_metrics: {}
      reliability_metrics: {}
      roi_analysis: {}
```

## 온보딩 자료 계획

### 빠른 시작 튜토리얼 (10분)
1. 샘플 프로젝트로 데모 실행 (간단한 Python CRUD 앱)
2. 각 단계 실행 및 결과물 미리보기
3. 명세 편집 체험 (웹 에디터)
4. AI 에이전트 실행 및 성능 비교

### 인터랙티브 가이드
- 각 단계별 상세 설명 (CLI 명령어, 옵션)
- 실행 모드 (전체 자동 `--auto`, 단계별 확인 `--interactive`, 수동 모드)
- 오류 발생 시 복구 전략 (재시도, 건너뛰기, 롤백, 디버그, 중단)

### FAQ 및 트러블슈팅
- 도구 설치 실패, LSP 서버 미동작, 명세 생성 오류, AI 에이전트 실패 등 시나리오별 해결 방법
- SonarQube/CodeQL 설정 가이드
- LLM API 키 설정 및 비용 최적화 팁

### 샘플 프로젝트
- Python/Django CRUD 앱 (사용자 관리 모듈)
- TypeScript/Express REST API (인증 모듈)
- 각 샘플에 대한 전체 실행 로그 및 생성된 명세 제공

## 개발 설정
- 플러그인 디렉토리: /Users/dreamondal/workspace/spec-driven-team
- GitHub 저장소: 생성 예정
- 대상 사용자 기술 수준: 중급 (기본적인 CLI 사용 가능)
- 에러 처리 전략: 오류 발생 시 복구 옵션 제공 (재시도/건너뛰기/롤백/디버그/중단)

