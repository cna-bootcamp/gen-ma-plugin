# weather-info 플러그인 개발 계획서

## 목차

- [weather-info 플러그인 개발 계획서](#weather-info-플러그인-개발-계획서)
  - [개요](#개요)
  - [1. 공유자원 선택](#1-공유자원-선택)
  - [2. 플러그인 구조 설계](#2-플러그인-구조-설계)
  - [3. 커스텀 도구 개발 계획](#3-커스텀-도구-개발-계획)
  - [4. 개발 순서 및 작업 내용](#4-개발-순서-및-작업-내용)
  - [5. 예상 디렉토리 구조](#5-예상-디렉토리-구조)
  - [6. 테스트 및 검증 계획](#6-테스트-및-검증-계획)
  - [7. 배포 계획](#7-배포-계획)

---

## 개요

**플러그인명**: weather-info

**목적**: OpenWeatherMap API를 통해 좌표 기반 현재 날씨 정보를 한국어로 제공하는 DMAP 플러그인

**대상 사용자**: 일반 사용자

**핵심 기능**:
- 위도/경도 좌표 기반 날씨 조회
- 현재 날씨 정보 텍스트 요약 제공 (기온, 날씨 상태, 체감온도 등)

[Top](#weather-info-플러그인-개발-계획서)

---

## 1. 공유자원 선택

### 1.1 필요 공유자원 분석

| 유형 | 자원명 | 선택 | 활용 방법 |
|------|--------|------|-----------|
| **가이드** | plugin-dev-guide | ✓ | DMAP 플러그인 개발 표준 워크플로우 참조 |
| **템플릿** | README-plugin-template | ✓ | README.md 작성 시 스켈레톤으로 활용 |
| **샘플** | README (plugin) | ✓ | README.md 작성 예시 참조 |
| **도구** | context7 (MCP 서버) | △ | OpenWeatherMap API 문서 조회용 (선택적) |

### 1.2 선택 근거

**필수 자원**:
- `plugin-dev-guide`: DMAP 플러그인 개발 4-Phase 워크플로우 및 표준 구조 이해 필수
- `README-plugin-template`: 플러그인 문서화 표준 준수를 위한 템플릿

**선택적 자원**:
- `context7`: OpenWeatherMap API 문서 조회가 필요한 경우 활용 가능하나, API가 단순하여 필수는 아님

**제외 자원**:
- Dify 관련 자원들: 본 플러그인은 Dify 프로토타이핑이 불필요한 단순 REST API 호출 패턴
- 다른 도구들: 날씨 API 호출에 특화된 도구가 없어 직접 구현 필요

[Top](#weather-info-플러그인-개발-계획서)

---

## 2. 플러그인 구조 설계

### 2.1 에이전트 구성

| 에이전트명 | 티어 | 역할 | 주요 책임 |
|------------|------|------|----------|
| weather-agent | MEDIUM (Sonnet) | 날씨 정보 처리 | 좌표 검증, API 호출, 응답 파싱, 텍스트 요약 생성 |

**단일 에이전트 선택 이유**:
- 모든 처리 단계가 데이터 처리 및 API 연동이라는 동일한 역할
- 선형적이고 단순한 플로우로 에이전트 분리 불필요
- 하나의 트랜잭션으로 처리 가능

### 2.2 스킬 구성

| 스킬명 | 타입 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| core | Core | 필수 | 시스템 전체 행동 규범, 모호한 요청의 의도 판별 |
| setup | Setup | 필수 | 플러그인 설치, API 키 설정, 의존성 설치 |
| get-weather | Orchestrator | 필수 | 좌표 기반 날씨 조회 워크플로우 |
| help | Utility | 권장 | 사용 가능한 명령 및 자동 라우팅 안내 |

### 2.3 Gateway 설정

**runtime-mapping.yaml**:
```yaml
model_tiers:
  MEDIUM:
    model: claude-3-5-sonnet-20241022
    temperature: 0.3
    max_tokens: 8000
```

**install.yaml** (선택적):
```yaml
mcp_servers:
  - name: context7
    description: OpenWeatherMap API 문서 조회용 (선택적)
    required: false
```

### 2.4 명령어 및 자동 라우팅

| 명령어 | 자동 라우팅 패턴 |
|--------|-----------------|
| `/weather-info:get-weather` | "날씨 알려줘", "날씨 정보", "weather" |
| `/weather-info:setup` | "날씨 설정", "API 키 설정" |
| `/weather-info:help` | "날씨 도움말", "날씨 명령어" |

[Top](#weather-info-플러그인-개발-계획서)

---

## 3. 커스텀 도구 개발 계획

### 3.1 weather_api.py 설계

**위치**: `gateway/tools/weather_api.py`

**주요 기능**:
```python
class WeatherAPI:
    def __init__(self, api_key: str = None):
        """API 키 초기화 (기본값 제공)"""

    def validate_coordinates(self, lat: float, lon: float) -> bool:
        """좌표 유효성 검증 (-90 ~ 90, -180 ~ 180)"""

    def get_current_weather(self, lat: float, lon: float) -> dict:
        """OpenWeatherMap API 호출 및 응답 반환"""

    def parse_weather_data(self, data: dict) -> dict:
        """API 응답에서 필요한 정보 추출"""

    def format_weather_text(self, weather_info: dict) -> str:
        """한국어 텍스트 요약 생성"""
```

**에러 처리**:
- API 호출 실패 시 3초 대기 후 1회 재시도
- 좌표 유효성 검증 실패 시 한국어 안내 메시지
- 네트워크 오류, API 키 오류 등 구분하여 처리

**의존성**:
- `requests`: HTTP API 호출
- `typing`: 타입 힌트
- `time`: 재시도 대기
- `json`: 응답 파싱

### 3.2 설정 파일 관리

**위치**: `.weather-info/config.yaml`

```yaml
api_key: "1aa5bfca079a20586915b56f29235cc0"  # 기본값
language: "kr"
units: "metric"
```

[Top](#weather-info-플러그인-개발-계획서)

---

## 4. 개발 순서 및 작업 내용

### Step 1: 플러그인 스켈레톤 생성
- [ ] `.claude-plugin/` 메타데이터 디렉토리 생성
- [ ] `skills/`, `agents/`, `gateway/`, `commands/` 디렉토리 생성
- [ ] `.gitignore`에 `.weather-info/` 추가

### Step 2: Gateway 설정
- [ ] `gateway/runtime-mapping.yaml` 작성 (MEDIUM → Sonnet 매핑)
- [ ] `gateway/install.yaml` 작성 (context7 MCP 서버, 선택적)

### Step 3: 커스텀 도구 개발
- [ ] `gateway/tools/weather_api.py` 구현
  - [ ] WeatherAPI 클래스 구현
  - [ ] 좌표 검증 로직
  - [ ] API 호출 및 재시도 로직
  - [ ] 응답 파싱 및 텍스트 포맷팅
- [ ] `gateway/tools/requirements.txt` 작성

### Step 4: weather-agent 에이전트 개발
- [ ] `agents/weather-agent/AGENT.md` 작성
- [ ] `agents/weather-agent/agentcard.yaml` 작성
- [ ] `agents/weather-agent/tools.yaml` 작성

### Step 5: 스킬 개발
- [ ] `skills/core/SKILL.md` 작성 (행동 규범, 의도 판별)
- [ ] `skills/setup/SKILL.md` 작성 (API 키 설정, 의존성 설치)
- [ ] `skills/get-weather/SKILL.md` 작성 (날씨 조회 워크플로우)
- [ ] `skills/help/SKILL.md` 작성 (사용법 안내)

### Step 6: 진입점 생성
- [ ] `commands/get-weather.md` 작성
- [ ] `commands/setup.md` 작성
- [ ] `commands/help.md` 작성

### Step 7: 문서화
- [ ] `README.md` 작성 (플러그인 소개, 설치, 사용법)
- [ ] 테스트 시나리오 문서화

[Top](#weather-info-플러그인-개발-계획서)

---

## 5. 예상 디렉토리 구조

```
weather-info/
├── .claude-plugin/          # 플러그인 메타데이터
│   ├── plugin.json
│   └── marketplace.json
├── agents/                  # 에이전트 정의
│   └── weather-agent/
│       ├── AGENT.md
│       ├── agentcard.yaml
│       └── tools.yaml
├── skills/                  # 스킬 정의
│   ├── core/
│   │   └── SKILL.md
│   ├── setup/
│   │   └── SKILL.md
│   ├── get-weather/
│   │   └── SKILL.md
│   └── help/
│       └── SKILL.md
├── gateway/                 # Gateway 설정
│   ├── runtime-mapping.yaml
│   ├── install.yaml
│   └── tools/              # 커스텀 도구
│       ├── weather_api.py
│       └── requirements.txt
├── commands/                # 명령어 진입점
│   ├── get-weather.md
│   ├── setup.md
│   └── help.md
├── README.md               # 플러그인 문서
├── .gitignore             # Git 제외 설정
└── .weather-info/         # 런타임 설정 (Git 제외)
    └── config.yaml
```

[Top](#weather-info-플러그인-개발-계획서)

---

## 6. 테스트 및 검증 계획

### 6.1 단위 테스트

| 테스트 항목 | 검증 내용 |
|-------------|-----------|
| 좌표 검증 | 유효/무효 좌표 처리 확인 |
| API 호출 | 정상 응답 및 에러 처리 |
| 재시도 로직 | 실패 시 재시도 동작 확인 |
| 텍스트 포맷팅 | 한국어 요약 생성 확인 |

### 6.2 통합 테스트

**테스트 시나리오**:
1. 정상 좌표 입력 → 날씨 정보 반환
2. 무효 좌표 입력 → 에러 메시지 출력
3. API 키 미설정 → 기본값 사용 확인
4. 네트워크 오류 → 재시도 후 에러 처리

### 6.3 사용자 테스트

**테스트 케이스**:
```
# 서울 좌표로 테스트
/weather-info:get-weather --lat 37.5665 --lon 126.9780

# 자연어 요청 테스트
"서울 날씨 알려줘" (좌표: 37.5665, 126.9780)

# 에러 케이스 테스트
/weather-info:get-weather --lat 999 --lon 999
```

[Top](#weather-info-플러그인-개발-계획서)

---

## 7. 배포 계획

### 7.1 GitHub 배포

**저장소 구조**:
- Organization: `weather-info-plugins`
- Repository: `weather-info`
- Branch: `main`

### 7.2 배포 체크리스트

- [ ] 모든 테스트 통과 확인
- [ ] README.md 완성도 확인
- [ ] API 키 하드코딩 제거 확인
- [ ] `.gitignore` 설정 확인
- [ ] 라이선스 파일 추가
- [ ] 버전 태깅 (v1.0.0)

### 7.3 플러그인 등록

DMAP 플러그인 레지스트리 등록:
```yaml
- name: weather-info
  description: OpenWeatherMap API 기반 날씨 정보 제공
  version: 1.0.0
  repo: https://github.com/weather-info-plugins/weather-info
  author: DMAP Team
```

[Top](#weather-info-플러그인-개발-계획서)
