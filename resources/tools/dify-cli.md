# dify_cli


- [dify_cli](#dify_cli)
  - [기본 정보](#기본-정보)
  - [설치 정보](#설치-정보)
  - [환경 변수](#환경-변수)
  - [명령어](#명령어)
  - [사용 예시](#사용-예시)
  - [스킬에서의 참조](#스킬에서의-참조)

---

## 기본 정보

| 항목 | 값 |
|------|---|
| 도구명 | dify_cli |
| 카테고리 | 커스텀 앱 |
| 설명 | Dify API 클라이언트 — DSL import/export, workflow publish/run |
| 소스 경로 | `resources/tools/customs/dify-cli/dify_cli.py` |
| 의존 모듈 | `config.py`, `dify_client.py` |

[Top](#dify_cli)

---

## 설치 정보

| 항목 | 값 |
|------|---|
| 설치 방법 | 소스 파일 포함 (별도 설치 불요) |
| 의존성 설치 | `pip install -r gateway/requirements.txt` |
| 검증 명령 | `python gateway/tools/dify_cli.py --help` |
| 필수 여부 | 필수 |

**필수 의존성:**

| 패키지 | 최소 버전 | 용도 |
|--------|----------|------|
| httpx | 0.27.0 | Dify HTTP API 비동기 호출 |
| python-dotenv | 1.0.0 | .env 환경 변수 로드 |
| pyyaml | 6.0 | YAML 파싱 및 생성 |

[Top](#dify_cli)

---

## 환경 변수

| 변수명 | 필수 | 설명 | 기본값 |
|--------|:----:|------|--------|
| `DIFY_BASE_URL` | 필수 | Dify 서버 URL | `http://localhost` |
| `DIFY_ADMIN_API_KEY` | 택1 | Admin API Key (Console API 인증) | - |
| `DIFY_EMAIL` | 택1 | Dify 로그인 이메일 (Admin Key 없을 때) | - |
| `DIFY_PASSWORD` | 택1 | Dify 로그인 비밀번호 (Admin Key 없을 때) | - |
| `DIFY_WORKSPACE_ID` | 선택 | Workspace ID | 자동 감지 |
| `DIFY_APP_API_KEY` | run시 필수 | App Service API Key (run 명령 전용) | - |
| `DIFY_DEFAULT_APP_ID` | 선택 | 기본 앱 ID (export/update/publish 시 생략 가능) | - |
| `DIFY_DEFAULT_DSL_PATH` | 선택 | 기본 DSL 파일 경로 (import/export 시 생략 가능) | - |

> **인증 방식**: `DIFY_ADMIN_API_KEY` 또는 `DIFY_EMAIL`+`DIFY_PASSWORD` 중 하나 필수.
> - **로컬 커뮤니티 버전**: Admin API Key 미지원. `DIFY_EMAIL`+`DIFY_PASSWORD` 필수.
> - **클라우드/엔터프라이즈 버전**: Admin API Key 사용 가능 (헤더 기반, 로그인 불요).

[Top](#dify_cli)

---

## 명령어

| 명령어 | 설명 | API 유형 | 주요 파라미터 |
|--------|------|---------|-------------|
| `list` | 앱 목록 조회 | Console API | `--mode` (all/workflow/chat/...) |
| `export` | DSL YAML 내보내기 | Console API | `<app_id>`, `-o <file>` |
| `import` | DSL YAML 가져오기 (신규 생성) | Console API | `<file>`, `--name` |
| `update` | 기존 앱을 DSL로 덮어쓰기 | Console API | `<app_id>`, `<file>` |
| `publish` | 워크플로우 배포 | Console API | `<app_id>`, `--name`, `--comment` |
| `run` | 워크플로우 실행 | Service API | `--inputs`, `--key`, `--response-mode` |

[Top](#dify_cli)

---

## 사용 예시

```bash
# 앱 목록 조회
python gateway/tools/dify_cli.py list --mode workflow

# DSL 내보내기
python gateway/tools/dify_cli.py export abc-123 -o output.dsl.yaml

# DSL 가져오기 (신규 앱 생성)
python gateway/tools/dify_cli.py import my-app.dsl.yaml --name "My App"

# 기존 앱 업데이트
python gateway/tools/dify_cli.py update abc-123 my-app.dsl.yaml

# 워크플로우 배포
python gateway/tools/dify_cli.py publish abc-123 --name "v1.0" --comment "초기 배포"

# 워크플로우 실행 (스트리밍)
python gateway/tools/dify_cli.py run --inputs '{"query": "테스트"}' --key app-xxxx

# 워크플로우 실행 (블로킹)
python gateway/tools/dify_cli.py run --inputs '{"query": "테스트"}' --key app-xxxx -m blocking
```

[Top](#dify_cli)

---

## 스킬에서의 참조

| 참조 위치 | 참조 방법 |
|----------|----------|
| install.yaml | `custom_tools` 항목으로 선언 |
| runtime-mapping.yaml | `dify_api` 추상 도구에 매핑 |
| 에이전트 tools.yaml | `dify_api` 추상 도구로 선언 |
| SKILL.md | "dify_cli로 DSL을 import" 지시 |

[Top](#dify_cli)
