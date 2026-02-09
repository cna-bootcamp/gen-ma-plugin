---
name: dify-setup
description: Dify 로컬 환경 구축 (Docker Compose)
user-invocable: true
type: setup
disable-model-invocation: true
---

# dify-setup

## 목표

Dify 로컬 개발 환경을 Docker Compose로 자동 구축함. 에이전트 위임 없이 직접 실행하는 직결형 스킬.

## 워크플로우

### Phase 1: Docker 환경 확인

```bash
docker --version
docker compose version
```

- Docker 미설치 시: 설치 가이드 안내 후 중단
- Docker 실행 중이 아닐 시: Docker 시작 안내

### Phase 2: Dify 소스 다운로드

```bash
cd C:\Users\hiond\workspace
git clone https://github.com/langgenius/dify.git
cd dify/docker
```

- 이미 존재하는 경우: `git pull` 실행하여 최신 버전 동기화

### Phase 3: 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일 필수 설정 항목 자동 구성:
- `SECRET_KEY`: 랜덤 생성 (32자)
- `CONSOLE_WEB_URL`: `http://localhost:3000`
- `API_URL`: `http://localhost:5001`
- `APP_WEB_URL`: `http://localhost:3001`

### Phase 4: Docker Compose 실행

```bash
docker compose up -d
```

컨테이너 시작 대기 (최대 3분):
- `dify-web`: 포트 3000
- `dify-api`: 포트 5001
- `dify-worker`: 백그라운드
- `postgres`: 포트 5432
- `redis`: 포트 6379

### Phase 5: 상태 확인

```bash
docker compose ps
```

모든 컨테이너가 `running` 상태인지 확인.

### Phase 6: 초기 설정 안내

사용자에게 다음 안내 출력:

```
✅ Dify 로컬 환경 구축 완료

접속 정보:
- Console UI: http://localhost:3000
- API Endpoint: http://localhost:5001

다음 단계:
1. 브라우저에서 http://localhost:3000 접속
2. 초기 관리자 계정 생성
3. API Key 발급 (설정 → API Keys)
4. `/abra:setup` 스킬 실행하여 Abra 플러그인 초기화

중단 방법:
cd C:\Users\hiond\workspace\dify\docker
docker compose down
```

## 완료 조건

- [ ] Docker 환경 확인 완료
- [ ] Dify 소스 다운로드 완료
- [ ] .env 파일 생성 완료
- [ ] Docker Compose 실행 성공
- [ ] 모든 컨테이너 running 상태
- [ ] 초기 설정 안내 출력 완료

## 오류 처리

| 오류 상황 | 조치 |
|----------|------|
| Docker 미설치 | 설치 가이드 URL 제공 후 중단 |
| Docker 미실행 | Docker 시작 안내 후 중단 |
| 포트 충돌 (3000, 5001) | 사용 중인 프로세스 확인 안내 |
| 컨테이너 시작 실패 | `docker compose logs` 출력 |
| 네트워크 오류 | 방화벽 설정 확인 안내 |

## 상태 정리

완료 시 `.omc/state/abra-dify-setup-state.json` 삭제.

## 취소

`cancelomc` 또는 `stopomc` 키워드 감지 시:
- 실행 중인 docker compose 명령 중단
- 부분적으로 생성된 컨테이너 정리
- 상태 파일 삭제

## 재개

상태 파일 존재 시 마지막 Phase부터 재개.

## 주의사항

- Windows 환경 기준으로 작성됨
- WSL2 Docker Desktop 권장
- 최소 8GB RAM 필요
- 디스크 여유 공간 10GB 이상 권장
