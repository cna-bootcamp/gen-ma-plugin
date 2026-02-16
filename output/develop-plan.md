# DMAP 플러그인 개발 계획서

## 플러그인 정보
- **플러그인명**: spec-driven-team
- **버전**: 1.0.0
- **목적**: 코드 수정이 아닌 명세(Specification) 수정으로 어플리케이션을 유지보수하는 팀
- **개발 디렉토리**: `/Users/dreamondal/workspace/spec-driven-team`

---

## 1. 공유자원 활용 계획

### 1.1 가이드 문서
| 자원명 | 복사 위치 | 활용 목적 |
|--------|----------|----------|
| dify-workflow-dsl-guide.md | docs/guides/ | Dify DSL 작성 시 참조 가이드 |

### 1.2 템플릿 활용
| 자원명 | 활용 위치 | 활용 방법 |
|--------|----------|----------|
| README-plugin-template | README.md | 플러그인 README 기본 구조 |
| dsl-generation-prompt | agents/spec-generator/ | 명세 생성 프롬프트 템플릿 |
| develop-plan-generate | agents/agent-implementer/ | AI 에이전트 개발 계획 템플릿 |

### 1.3 샘플 참조
| 자원명 | 참조 목적 |
|--------|----------|
| plugin/README | 플러그인 구조 예시 |
| abra 플러그인 | 유사 도메인 구현 패턴 참조 |

### 1.4 MCP 도구 연동
| 도구명 | 연동 방법 | 활용 에이전트 |
|--------|----------|--------------|
| context7 | runtime-mapping.yaml 설정 | agent-implementer |

---

## 2. 커스텀 도구 개발 계획

### 2.1 기존 도구 활용
| 도구명 | 활용 방법 | 담당 에이전트 |
|--------|----------|--------------|
| dify_cli | 직접 연동 | agent-implementer |
| validate_dsl | 직접 연동 | spec-generator |
| create_repo | 직접 연동 | setup 스킬 |

### 2.2 LSP/린터 설치 스크립트
```bash
# tools/install-analyzers.sh
# setup 스킬에서 프로젝트 언어 자동 감지 후 필요 도구만 선택적 설치
- Python: python-lsp-server, ruff, bandit
- JavaScript/TypeScript: typescript-language-server, eslint
- Java: jdtls, pmd
- C#/.NET: omnisharp, roslyn-analyzers
- Rust: rust-analyzer, clippy
- Go: golangci-lint
- C/C++: clang-tidy
```

### 2.3 정적 분석 도구 통합
```yaml
# tools/static-analysis-config.yaml
sonarqube:
  edition: community
  languages: [python, javascript, java, csharp, go]
  rules: quality-gates/default
codeql:
  queries: security-and-quality
  languages: auto-detect
snyk:
  scope: security-vulnerabilities
```

---

## 3. 외부 자원 수집 계획

### 3.1 공식 문서 링크
| 도구 | 문서 URL | 수집 위치 |
|------|---------|----------|
| SonarQube | https://docs.sonarqube.org/ | docs/external/sonarqube-guide.md |
| CodeQL | https://codeql.github.com/docs/ | docs/external/codeql-guide.md |
| Snyk Code | https://docs.snyk.io/snyk-code | docs/external/snyk-guide.md |
| LSP Protocol | https://microsoft.github.io/language-server-protocol/ | docs/external/lsp-protocol.md |

### 3.2 설치 가이드 작성
- `docs/setup/install-lsp-servers.md`: 언어별 LSP 서버 설치 가이드
- `docs/setup/install-static-analyzers.md`: 정적 분석 도구 설치 가이드
- `docs/setup/install-linters.md`: 언어별 린터 설치 가이드

---

## 4. DMAP 표준 산출물 생성 계획

### 4.1 디렉토리 구조
```
spec-driven-team/
├── plugin.json                 # 플러그인 메타데이터
├── marketplace.json            # 마켓플레이스 정보
├── README.md                   # 플러그인 설명서
├── install.yaml                # Gateway 설치 설정
├── runtime-mapping.yaml        # Gateway 런타임 매핑
├── commands/                   # 진입점 명령어
│   ├── setup.sh               # /spec-driven-team:setup
│   ├── analyze-codebase.sh    # /spec-driven-team:analyze-codebase
│   ├── recommend-agents.sh    # /spec-driven-team:recommend-agents
│   ├── generate-spec.sh       # /spec-driven-team:generate-spec
│   ├── implement-agents.sh    # /spec-driven-team:implement-agents
│   ├── verify-roi.sh          # /spec-driven-team:verify-roi
│   ├── core.sh                # /spec-driven-team:core (전체 워크플로우)
│   └── help.sh                # /spec-driven-team:help
├── agents/                     # AI 에이전트
│   ├── codebase-analyzer/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   └── tools.yaml
│   ├── agent-strategist/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   └── tools.yaml
│   ├── spec-generator/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   └── tools.yaml
│   ├── agent-implementer/
│   │   ├── AGENT.md
│   │   ├── agentcard.yaml
│   │   └── tools.yaml
│   └── verification-engineer/
│       ├── AGENT.md
│       ├── agentcard.yaml
│       └── tools.yaml
├── skills/                     # 스킬 정의
│   ├── setup/SKILL.md
│   ├── core/SKILL.md
│   ├── help/SKILL.md
│   ├── analyze-codebase/SKILL.md
│   ├── recommend-agents/SKILL.md
│   ├── generate-spec/SKILL.md
│   ├── implement-agents/SKILL.md
│   └── verify-roi/SKILL.md
├── tools/                      # 도구 및 스크립트
│   ├── install-analyzers.sh
│   ├── static-analysis-config.yaml
│   └── language-detector.py
├── docs/                       # 문서
│   ├── guides/
│   ├── external/
│   └── setup/
└── examples/                   # 예제
    └── sample-analysis/
```

### 4.2 생성 순서

#### Phase 1: 기본 구조 (Day 1)
1. 디렉토리 구조 생성
2. `plugin.json` 작성
3. `marketplace.json` 작성
4. `README.md` 작성 (템플릿 기반)

#### Phase 2: Gateway 설정 (Day 1)
1. `install.yaml` 작성
   - 의존성 도구 설치 스크립트
   - 환경 변수 설정
2. `runtime-mapping.yaml` 작성
   - MCP 도구 연동 설정
   - 커스텀 도구 경로 매핑

#### Phase 3: 에이전트 개발 (Day 2-3)
1. **codebase-analyzer** (HIGH)
   - AGENT.md: LSP/정적분석 오케스트레이션 전략
   - tools.yaml: LSP 서버, 정적 분석 도구 연동
   - agentcard.yaml: 에이전트 메타데이터

2. **agent-strategist** (HIGH)
   - AGENT.md: AI 에이전트화 전략 수립 로직
   - tools.yaml: context7 연동
   - agentcard.yaml: 에이전트 메타데이터

3. **spec-generator** (MEDIUM)
   - AGENT.md: 명세 자동 생성 알고리즘
   - tools.yaml: validate_dsl 연동
   - agentcard.yaml: 에이전트 메타데이터

4. **agent-implementer** (MEDIUM)
   - AGENT.md: AI 에이전트 구현 프로세스
   - tools.yaml: dify_cli, context7 연동
   - agentcard.yaml: 에이전트 메타데이터

5. **verification-engineer** (MEDIUM)
   - AGENT.md: 검증 및 ROI 측정 방법론
   - tools.yaml: 벤치마크 도구 연동
   - agentcard.yaml: 에이전트 메타데이터

#### Phase 4: 스킬 개발 (Day 3-4)
1. **setup** (필수)
   - 언어 자동 감지 로직
   - 필요 도구 선택적 설치
   - 환경 검증

2. **core** (필수)
   - 5단계 전체 워크플로우 오케스트레이션
   - 에이전트 간 데이터 전달

3. **analyze-codebase**
   - codebase-analyzer 에이전트 호출
   - 분석 결과 포맷팅

4. **recommend-agents**
   - agent-strategist 에이전트 호출
   - 추천 결과 시각화

5. **generate-spec**
   - spec-generator 에이전트 호출
   - 명세 검증 및 저장

6. **implement-agents**
   - agent-implementer 에이전트 호출
   - 구현 코드 생성

7. **verify-roi**
   - verification-engineer 에이전트 호출
   - ROI 보고서 생성

8. **help**
   - 사용법 안내
   - 명령어 목록

#### Phase 5: 진입점 개발 (Day 4)
1. `commands/` 디렉토리의 각 .sh 파일 작성
2. 스킬 호출 래퍼 구현
3. 에러 처리 및 로깅

#### Phase 6: 도구 통합 (Day 5)
1. `tools/install-analyzers.sh` 스크립트 작성
2. `tools/language-detector.py` 구현
3. `tools/static-analysis-config.yaml` 설정

#### Phase 7: 문서화 (Day 5)
1. 외부 도구 설치 가이드 작성
2. 사용 예제 작성
3. FAQ 및 트러블슈팅 가이드

---

## 5. 개발 일정

| 단계 | 작업 내용 | 예상 소요 시간 | 산출물 |
|------|----------|---------------|--------|
| Day 1 | 기본 구조 및 Gateway 설정 | 4시간 | plugin.json, marketplace.json, install.yaml, runtime-mapping.yaml |
| Day 2 | HIGH 에이전트 개발 | 6시간 | codebase-analyzer, agent-strategist |
| Day 3 | MEDIUM 에이전트 개발 | 6시간 | spec-generator, agent-implementer, verification-engineer |
| Day 4 | 스킬 및 진입점 개발 | 6시간 | 8개 스킬, commands/ 스크립트 |
| Day 5 | 도구 통합 및 문서화 | 4시간 | 설치 스크립트, 가이드 문서 |
| **총계** | **전체 개발** | **26시간** | **완성된 DMAP 플러그인** |

---

## 6. 리스크 및 대응 방안

### 6.1 기술적 리스크
| 리스크 | 확률 | 영향도 | 대응 방안 |
|--------|------|--------|----------|
| LSP 서버 호환성 문제 | 중 | 높음 | 언어별 폴백 전략 수립 |
| 정적 분석 도구 성능 | 중 | 중간 | 대규모 프로젝트는 샘플링 분석 |
| AI 에이전트 정확도 | 높음 | 높음 | 반복 검증 및 사용자 확인 단계 추가 |

### 6.2 일정 리스크
| 리스크 | 확률 | 영향도 | 대응 방안 |
|--------|------|--------|----------|
| 도구 통합 지연 | 중 | 중간 | 핵심 도구 우선 통합 |
| 테스트 시간 부족 | 낮음 | 높음 | 자동화 테스트 스크립트 준비 |

---

## 7. 성공 지표

### 7.1 기능적 성공 지표
- [ ] 5개 이상 언어의 코드베이스 분석 가능
- [ ] AI 에이전트화 추천 정확도 80% 이상
- [ ] 명세 자동 생성 성공률 90% 이상
- [ ] AI 에이전트 구현 코드 실행 가능
- [ ] ROI 측정 보고서 자동 생성

### 7.2 비기능적 성공 지표
- [ ] 10만 라인 코드베이스 분석 시간 < 10분
- [ ] 명세 생성 시간 < 5분
- [ ] 설치 및 설정 시간 < 30분
- [ ] 문서화 완성도 100%

---

## 8. 다음 단계

1. **즉시 시작**: 기본 디렉토리 구조 생성 및 plugin.json 작성
2. **Day 1 목표**: Gateway 설정 완료 및 기본 구조 검증
3. **우선순위**: codebase-analyzer 에이전트 먼저 개발하여 핵심 기능 검증

---

## 9. 참고사항

- 모든 에이전트는 도구 오케스트레이션 방식으로 구현 (직접 코드 분석 X)
- LSP 서버와 정적 분석 도구는 언어별로 동적 선택
- 명세 기반 접근법의 ROI는 6개월 단위로 측정 및 보고
- 사용자 피드백을 반영한 지속적 개선 체계 구축

---

**작성일**: 2024-12-27
**작성자**: DMAP 빌더 팀
**버전**: 1.0.0