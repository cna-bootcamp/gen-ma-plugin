---
name: setup
description: Abra 플러그인 초기 설정
user-invocable: true
type: setup
disable-model-invocation: true
---

# setup

## 목표

Abra 플러그인 초기 설정을 자동화함. Dify API 연결, Python 환경 구성, 도구 검증을 수행하는 직결형 스킬.

## 워크플로우

### Phase 1: Dify 접속 정보 수집

AskUserQuestion으로 다음 정보 수집:

| 항목 | 질문 | 기본값 |
|------|------|--------|
| DIFY_API_URL | Dify API URL을 입력하세요 | http://localhost:5001 |
| DIFY_API_KEY | Dify API Key를 입력하세요 | (필수 입력) |
| DIFY_WORKSPACE_ID | Workspace ID를 입력하세요 | (선택, 자동 감지 가능) |

### Phase 2: .env 파일 생성

`C:\Users\hiond\workspace\gen-dmap\samples\abra\.env` 파일 생성:

```bash
# Dify Connection
DIFY_API_URL=http://localhost:5001
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxx
DIFY_WORKSPACE_ID=workspace-xxxxxxxxxxxxxxxxx

# Python Environment
PYTHONPATH=C:\Users\hiond\workspace\gen-dmap\samples\abra

# Logging
LOG_LEVEL=INFO
```

기존 파일이 있는 경우 백업 후 덮어쓰기.

### Phase 3: Python 가상환경 생성

```bash
cd C:\Users\hiond\workspace\gen-dmap\samples\abra
python -m venv .venv
.venv\Scripts\activate
```

Python 버전 확인 (3.9 이상 필요):
```bash
python --version
```

### Phase 4: 의존성 설치

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

필수 패키지:
- `requests` - Dify API 호출
- `pyyaml` - DSL YAML 파싱
- `python-dotenv` - 환경 변수 로드
- `pytest` - 테스트 프레임워크
- `black` - 코드 포매터
- `pylint` - 린터

### Phase 5: LSP 서버 확인

Python LSP 서버 설치 확인:

```bash
pip show python-lsp-server
```

미설치 시 자동 설치:
```bash
pip install python-lsp-server[all]
```

### Phase 6: 도구 동작 확인

#### validate_dsl 도구 테스트

```bash
cd C:\Users\hiond\workspace\gen-dmap\tools\dify-cli
python validate_dsl.py --help
```

정상 출력 확인:
```
usage: validate_dsl.py [-h] [--verbose] dsl_file
```

#### gateway 커스텀 도구 테스트

```bash
cd C:\Users\hiond\workspace\gen-dmap\samples\abra\tools
python test_gateway.py
```

예상 출력:
```
✓ Dify API 연결 성공
✓ Workspace 접근 가능
✓ Import API 동작 확인
```

### Phase 7: CLAUDE.md 라우팅 테이블 추가

`C:\Users\hiond\workspace\gen-dmap\samples\abra\CLAUDE.md` 파일에 라우팅 테이블 자동 추가:

```markdown
# Abra Skill 라우팅

| 감지 패턴 | 실행 스킬 |
|-----------|-----------|
| "에이전트 만들어", "Agent 개발" | /abra:orchestrate |
| "시나리오 생성", "요구사항" | /abra:scenario |
| "DSL 생성" | /abra:dsl-generate |
| "프로토타이핑" | /abra:prototype |
| "개발계획서" | /abra:dev-plan |
| "코드 개발" | /abra:develop |
| "Dify 설치" | /abra:dify-setup |
```

### Phase 8: 설정 완료 보고

사용자에게 다음 안내 출력:

```
✅ Abra 플러그인 초기 설정 완료

설정 정보:
- Dify API URL: http://localhost:5001
- Python 가상환경: C:\Users\hiond\workspace\gen-dmap\samples\abra\.venv
- 환경 변수: .env 파일 생성 완료

다음 단계:
1. "에이전트 만들어줘" - 전체 워크플로우 실행
2. "시나리오 생성해줘" - 요구사항 시나리오 생성
3. "/abra:orchestrate" - 수동 스킬 호출

문서:
- README.md: 전체 가이드
- AGENTS.md: 에이전트 구조
- standards/: 표준 문서
```

## 완료 조건

- [ ] Dify 접속 정보 수집 완료
- [ ] .env 파일 생성 완료
- [ ] Python 가상환경 생성 완료
- [ ] 의존성 설치 완료
- [ ] LSP 서버 설치 확인 완료
- [ ] validate_dsl 도구 동작 확인 완료
- [ ] gateway 도구 테스트 통과
- [ ] CLAUDE.md 라우팅 테이블 추가 완료
- [ ] 설정 완료 보고 출력 완료

## 오류 처리

| 오류 상황 | 조치 |
|----------|------|
| Python 3.9 미만 | Python 업그레이드 안내 후 중단 |
| pip 설치 실패 | 네트워크 연결 확인 안내 |
| Dify API 연결 실패 | API URL/Key 재확인 요청 |
| validate_dsl 실행 실패 | PYTHONPATH 설정 확인 |
| gateway 테스트 실패 | Dify 서비스 상태 확인 안내 |

## 상태 정리

완료 시 `.omc/state/abra-setup-state.json` 삭제.

## 취소

`cancelomc` 또는 `stopomc` 키워드 감지 시:
- 실행 중인 pip install 중단
- 부분적으로 생성된 파일 정리
- 상태 파일 삭제

## 재개

상태 파일 존재 시 마지막 Phase부터 재개.

## 주의사항

- Windows 환경 기준으로 작성됨
- Python 3.9 이상 필수
- Dify 로컬 환경이 먼저 구축되어 있어야 함 (`/abra:dify-setup` 선행 필요)
- .env 파일에 민감 정보(API Key) 포함되므로 .gitignore 추가 권장
