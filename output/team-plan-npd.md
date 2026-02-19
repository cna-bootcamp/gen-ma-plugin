# 팀 기획서

## 기본 정보
- 플러그인명: npd
- 목적: 사람과 AI가 협업하여 새로운 프로젝트의 기획-설계-개발-배포 전 과정을 지원하는 플러그인
- 대상 도메인: 소프트웨어 제품 개발 (New Product Development)
- 대상 사용자: 개발자, 기획자, 비개발자 (상업적 수준의 소프트웨어를 개발하려는 모든 사용자)
- 플러그인 개발 디렉토리: ~/workspace/npd

## 핵심기능
- 프로젝트 생성: 모노레포 패턴(프론트+백엔드 단일 레포)으로 새 프로젝트 초기화 및 CLAUDE.md Instruction 설정,
  GitHub 레포 자동 생성 (필수)
- 기획 지원: PO·서비스기획자·아키텍트·도메인전문가·AI엔지니어가 협업하여 서비스 기획 단계별 수행.
  clauding-guide의 기획 스킬(skills/ 디렉토리)을 플러그인 내부에 복사하여 포함
- 설계 지원: 아키텍트·AI엔지니어가 협업하여 클라우드 아키텍처 패턴 선정, 논리/시퀀스/API/클래스/데이터 설계 수행.
  clauding-guide의 design-* 커맨드를 플러그인 내부에 포함
- 개발 지원: 백엔드개발자·프론트엔드개발자·AI엔지니어·QA가 협업하여 코드 생성 및 테스트 수행.
  clauding-guide의 develop-* 커맨드를 플러그인 내부에 포함
- 배포 지원: DevOps 엔지니어가 컨테이너/K8s/CI-CD 파이프라인 구성.
  clauding-guide의 deploy-* 커맨드를 플러그인 내부에 포함
- 도메인전문가 동적 생성: 프로젝트 생성 스킬 실행 시 MVP 주제를 입력받아 도메인을 자동 추론하여
  `agents/domain-expert-{서비스명}/` 디렉토리에 AGENT.md·agentcard.yaml·tools.yaml 자동 생성.
  복수 서비스 병행 개발 시 서비스별 독립 디렉토리로 관리

## 사용자 플로우
- Step 1. 프로젝트 생성: 프로젝트명·기술스택(기본: Spring Boot 백엔드)·MVP 주제를 입력받아
  MVP 주제로 도메인 자동 추론 → 모노레포 디렉토리 구조 생성, CLAUDE.md 설정, domain-expert AGENT.md 동적 생성, GitHub 레포 자동 생성
- Step 2. 기획: PO·서비스기획자·아키텍트·도메인전문가·AI엔지니어 협업으로
  상위수준기획 → 기획구체화 → 유저스토리 → 프로토타입 개발 순서로 수행.
  AI엔지니어는 각 기획 단계에서 AI 활용 기회를 발굴하여 팀에 제안
- Step 3. 설계: 아키텍트·AI엔지니어 협업으로
  클라우드 아키텍처 패턴 선정 → 논리/시퀀스/API/클래스/데이터 설계 순서대로 수행
- Step 4. 개발: 백엔드개발자·프론트엔드개발자·AI엔지니어·QA 협업으로
  공통모듈 → 서비스별 백엔드 → 프론트엔드 → AI기능 → 테스트 순서로 수행
- Step 5. 배포: DevOps 엔지니어가
  컨테이너 이미지 빌드 → 컨테이너 실행 → K8s 배포 → CI/CD 파이프라인 구성 순서로 수행

## 에이전트 구성 힌트

### 기획 단계
- product-owner: 비즈니스 가치 판단, 우선순위 결정, MVP 범위 정의 전문가 (HIGH)
- service-planner: 사용자 경험 설계, 유저스토리 작성, 프로토타입 기획 전문가 (MEDIUM)
- architect: 기술 실현 가능성 검토, 클라우드 아키텍처 패턴 제안 — 기획 단계부터 참여 (HIGH)
- domain-expert-{서비스명}: [동적 생성] 프로젝트 생성 스킬 실행 시 MVP 주제를 분석하여 도메인 자동 추론 후
  `agents/domain-expert-{서비스명}/` 디렉토리(AGENT.md·agentcard.yaml·tools.yaml) 자동 생성.
  복수 서비스 병행 개발 시 서비스별 독립 디렉토리로 관리. 도메인 지식 기반 요구사항 검증 및 비즈니스 로직 자문 전문가 (HIGH)
- ai-engineer: AI/ML 활용 기회 발굴 및 제안 — 기획 단계부터 전 단계 필수 참여 (HIGH)

### 설계 단계
- architect: 논리/시퀀스/API/클래스/데이터 설계 수행 (HIGH)
- ai-engineer: AI 연동 설계 (API 설계, 프롬프트 설계, 모델 선정) (HIGH)

### 개발 단계
- backend-developer: Spring Boot 기반 백엔드 개발, 테스트코드 작성 (MEDIUM)
- frontend-developer: 프론트엔드 개발 (UI/UX, 컴포넌트) (MEDIUM)
- ai-engineer: AI/ML 기능 구현 (Claude API, OpenAI 등 연동) (HIGH)
- qa-engineer: API 테스트, 단위/통합/E2E 테스트 수행 및 버그 리포트 (MEDIUM)

### 배포 단계
- devops-engineer: 컨테이너 빌드, K8s 배포, CI/CD 파이프라인 구성 (MEDIUM)

### 전체 조율
- orchestrator: 단계 전환 판단, 에이전트 간 핸드오프, 다음 작업 안내 (HIGH)

## 참고 공유 자원
- 참고 가이드: plugin-dev-guide (플러그인 개발 표준)
- 참고 템플릿: README-plugin-template, team-plan-template
- 참고 도구: context7 (라이브러리 문서 검색), create_repo (GitHub 레포 자동 생성)
- 참고 플러그인: abra (유사 AI 자동화 워크플로우 구조 참고)
