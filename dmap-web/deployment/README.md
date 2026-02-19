# dmap-web 컨테이너 배포 가이드

- [dmap-web 컨테이너 배포 가이드](#dmap-web-컨테이너-배포-가이드)
  - [아키텍처](#아키텍처)
  - [사전 요구사항](#사전-요구사항)
  - [빠른 시작](#빠른-시작)
  - [환경변수 설정](#환경변수-설정)
  - [볼륨 마운트](#볼륨-마운트)
  - [개별 서비스 관리](#개별-서비스-관리)
  - [문제 해결](#문제-해결)

---

## 아키텍처

```
[브라우저] :8080
     ↓
[Nginx 컨테이너] :80
  ├── /          → Frontend 정적 파일 서빙
  └── /api/*     → Backend 컨테이너 :3001 프록시
     ↓
[Backend 컨테이너] :3001
  ├── 볼륨: ~/.claude/ (호스트 → /home/node/.claude, 읽기전용)
  └── 볼륨: dmap 프로젝트 루트 (호스트 → /app/dmap-project)
```

| 서비스 | 이미지 | 포트 | 역할 |
|--------|--------|------|------|
| frontend | Dockerfile.frontend | - | Nginx가 정적 파일 서빙 |
| backend | Dockerfile.backend | 3001 | Express API 서버 |
| nginx | nginx:alpine | 8080:80 | 리버스 프록시 |

[Top](#dmap-web-컨테이너-배포-가이드)

---

## 사전 요구사항

- Docker 20.10+
- Docker Compose v2+
- 호스트에 `~/.claude/` 디렉토리 존재 (Claude CLI 설정)

[Top](#dmap-web-컨테이너-배포-가이드)

---

## 빠른 시작

```bash
# 1. deployment 디렉토리로 이동
cd dmap-web/deployment

# 2. 환경변수 파일 생성
cp .env.example .env

# 3. 빌드 및 실행
docker-compose up --build

# 4. 브라우저에서 접속
# http://localhost:8080
```

백그라운드 실행:

```bash
docker-compose up --build -d
```

중지:

```bash
docker-compose down
```

[Top](#dmap-web-컨테이너-배포-가이드)

---

## 환경변수 설정

`.env` 파일에서 설정 가능한 변수:

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3001` | Backend 서버 포트 |
| `DMAP_PROJECT_DIR` | `/app/dmap-project` | 컨테이너 내 DMAP 프로젝트 경로 |
| `CORS_ORIGIN` | `http://localhost:8080` | CORS 허용 오리진 |
| `CLAUDE_HOME` | `/home/node/.claude` | 컨테이너 내 Claude 설정 경로 |
| `DMAP_PROJECT_HOST_DIR` | `../../` | 호스트의 DMAP 프로젝트 경로 |
| `NGINX_PORT` | `8080` | 외부 접속 포트 |

[Top](#dmap-web-컨테이너-배포-가이드)

---

## 볼륨 마운트

| 호스트 경로 | 컨테이너 경로 | 모드 | 용도 |
|-------------|---------------|------|------|
| `~/.claude/` | `/home/node/.claude` | 읽기전용 | Claude CLI 설정 |
| `../../` (dmap 루트) | `/app/dmap-project` | 읽기/쓰기 | DMAP 프로젝트 파일 |

[Top](#dmap-web-컨테이너-배포-가이드)

---

## 개별 서비스 관리

```bash
# 특정 서비스만 재빌드
docker-compose build backend
docker-compose build frontend

# 로그 확인
docker-compose logs -f backend
docker-compose logs -f nginx

# 특정 서비스 재시작
docker-compose restart backend
```

[Top](#dmap-web-컨테이너-배포-가이드)

---

## 문제 해결

**포트 충돌**

```bash
# 8080 포트가 사용 중인 경우 .env에서 NGINX_PORT 변경
NGINX_PORT=9090
```

**빌드 캐시 초기화**

```bash
docker-compose build --no-cache
```

**컨테이너 상태 확인**

```bash
docker-compose ps
```

**API 헬스체크**

```bash
curl http://localhost:8080/health
```

[Top](#dmap-web-컨테이너-배포-가이드)
