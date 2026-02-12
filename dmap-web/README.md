# DMAP Web

DMAP(Declarative Multi-Agent Plugin) 빌더의 웹 인터페이스.
Claude Code SDK를 통해 DMAP 스킬을 실행하고, 실시간 스트리밍과 승인 게이트를 제공하는 풀스택 웹 애플리케이션.

- [DMAP Web](#dmap-web)
  - [개요](#개요)
  - [기술 스택](#기술-스택)
  - [프로젝트 구조](#프로젝트-구조)
  - [시작하기](#시작하기)
    - [사전 요구사항](#사전-요구사항)
    - [설치](#설치)
    - [환경 변수](#환경-변수)
    - [개발 서버 실행](#개발-서버-실행)
    - [프로덕션 빌드](#프로덕션-빌드)
  - [아키텍처](#아키텍처)
    - [모노레포 구성](#모노레포-구성)
    - [데이터 흐름](#데이터-흐름)
    - [SSE 이벤트 타입](#sse-이벤트-타입)
  - [API 엔드포인트](#api-엔드포인트)
  - [사용 가능한 스킬](#사용-가능한-스킬)
  - [UI 구성](#ui-구성)
  - [스크립트 목록](#스크립트-목록)

---

## 개요

DMAP Web은 DMAP 빌더의 9개 스킬을 웹 브라우저에서 실행할 수 있는 인터페이스를 제공.
사이드바에서 스킬을 선택하고, 채팅 형태로 실시간 실행 결과를 확인하며,
승인 게이트에서 사용자 입력을 통해 워크플로우를 제어.

**주요 기능:**
- 9개 DMAP 스킬의 웹 기반 실행
- Server-Sent Events(SSE)를 통한 실시간 스트리밍
- 승인 게이트를 통한 대화형 워크플로우 제어
- 세션 관리 (생성, 재개, 타임아웃)
- Markdown 렌더링 지원 채팅 UI

[Top](#dmap-web)

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 런타임 | Node.js | ESM |
| 언어 | TypeScript | 5.7 |
| 모노레포 | npm workspaces | - |
| 백엔드 | Express.js | 4.21 |
| AI SDK | @anthropic-ai/claude-code | 1.0 |
| 프론트엔드 | React | 18.3 |
| 빌드 도구 | Vite | 6.0 |
| 상태 관리 | Zustand | 5.0 |
| 스타일링 | Tailwind CSS | 3.4 |
| Markdown | react-markdown + remark-gfm | 9.0 / 4.0 |

[Top](#dmap-web)

---

## 프로젝트 구조

```
dmap-web/
├── package.json                          # 루트 워크스페이스 설정
├── tsconfig.json                         # 기본 TypeScript 설정
├── .env.example                          # 환경 변수 템플릿
├── .gitignore
└── packages/
    ├── shared/                           # 공유 타입 및 상수
    │   └── src/
    │       ├── types.ts                  # SSEEvent, SkillMeta, Session, ChatMessage
    │       └── constants.ts              # DMAP_SKILLS 카탈로그, SKILL_CATEGORIES
    │
    ├── backend/                          # Express API 서버
    │   └── src/
    │       ├── server.ts                 # Express 앱 설정 및 미들웨어
    │       ├── middleware/
    │       │   ├── sse-handler.ts        # SSE 스트리밍 핸들러
    │       │   └── error-handler.ts      # 에러 처리 미들웨어
    │       ├── routes/
    │       │   ├── health.ts             # GET /health
    │       │   ├── skills.ts             # 스킬 목록 조회 및 실행
    │       │   └── sessions.ts           # 세션 관리 및 사용자 응답
    │       └── services/
    │           ├── claude-sdk-client.ts   # Claude SDK 연동
    │           └── session-manager.ts    # 세션 생명주기 관리
    │
    └── frontend/                         # React 웹 UI
        └── src/
            ├── App.tsx                   # 루트 컴포넌트
            ├── main.tsx                  # React DOM 엔트리
            ├── components/
            │   ├── Layout.tsx            # 사이드바 + 채팅 레이아웃
            │   ├── ChatPanel.tsx         # 스킬 실행 및 메시지 UI
            │   ├── Sidebar.tsx           # 스킬 선택 네비게이션
            │   ├── SkillCard.tsx         # 개별 스킬 버튼
            │   ├── MessageBubble.tsx     # Markdown 지원 메시지 버블
            │   ├── ApprovalDialog.tsx    # 승인 게이트 다이얼로그
            │   └── ToolIndicator.tsx     # 도구 실행 스피너
            ├── hooks/
            │   └── useSkillStream.ts     # SSE 스트림 및 API 연동
            └── stores/
                └── appStore.ts           # Zustand 상태 관리
```

[Top](#dmap-web)

---

## 시작하기

### 사전 요구사항

- **Node.js** 18 이상
- **npm** 9 이상
- **Claude Code** CLI 설치 및 인증 완료

### 설치

```bash
cd dmap-web
npm install
```

모노레포 구조로 모든 패키지의 의존성이 한 번에 설치됨.

### 환경 변수

`.env.example`을 `.env`로 복사 후 설정:

```bash
cp .env.example .env
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 백엔드 서버 포트 | 3001 |
| `DMAP_PROJECT_DIR` | 스킬 실행 작업 디렉토리 | ../ |

### 개발 서버 실행

```bash
npm run dev
```

백엔드(포트 3001)와 프론트엔드(포트 5173)가 동시에 실행됨.
프론트엔드의 `/api` 요청은 자동으로 백엔드로 프록시.

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3001

### 프로덕션 빌드

```bash
npm run build
```

shared → backend → frontend 순서로 빌드.
빌드 산출물은 각 패키지의 `dist/` 디렉토리에 생성.

[Top](#dmap-web)

---

## 아키텍처

### 모노레포 구성

```
┌─────────────────────────────────────────────┐
│                 npm workspaces               │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ shared   │←─│ backend  │  │ frontend  │  │
│  │ (types)  │←─│(Express) │  │(React+    │  │
│  │          │  │          │  │ Vite)     │  │
│  └──────────┘  └──────────┘  └───────────┘  │
│                                              │
└─────────────────────────────────────────────┘
```

| 패키지 | 역할 |
|--------|------|
| `@dmap-web/shared` | SSE 이벤트, 스킬 메타데이터, 세션 등 공유 타입과 상수 |
| `@dmap-web/backend` | Express API 서버, Claude SDK 연동, 세션 관리, SSE 스트리밍 |
| `@dmap-web/frontend` | React UI, 스킬 선택, 채팅 인터페이스, 승인 게이트 |

### 데이터 흐름

```
[사용자] ──스킬 선택──→ [Frontend]
                          │
                    POST /api/skills/:name/execute
                          │
                          ▼
                      [Backend] ──query()──→ [Claude SDK]
                          │                       │
                          │               /dmap:skillname 실행
                          │                       │
                     SSE 스트림 ◄── 이벤트 스트림 ──┘
                          │
                          ▼
                      [Frontend] ──채팅 메시지 렌더링──→ [사용자]
                          │
                    (승인 필요 시)
                          │
[사용자] ──승인/입력──→ POST /api/sessions/:id/respond
                          │
                          ▼
                      [Backend] ──resume──→ [Claude SDK]
                          │                     │
                     SSE 스트림 ◄─────────────────┘
                          │
                          ▼
                      (완료까지 반복)
```

### SSE 이벤트 타입

| 타입 | 설명 |
|------|------|
| `text` | 어시스턴트 텍스트 출력 |
| `tool` | 도구 호출 표시 |
| `approval` | 사용자 승인 요청 |
| `complete` | 세션 완료 (sessionId 포함) |
| `error` | 에러 메시지 |
| `done` | 스트림 종료 신호 |

[Top](#dmap-web)

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| GET | `/api/skills` | 사용 가능한 DMAP 스킬 목록 조회 |
| POST | `/api/skills/:name/execute` | 스킬 실행 (SSE 스트림 응답) |
| GET | `/api/sessions` | 전체 세션 목록 조회 |
| GET | `/api/sessions/:id` | 특정 세션 상세 정보 조회 |
| POST | `/api/sessions/:id/respond` | 대기 중인 세션에 사용자 응답 전송 |

[Top](#dmap-web)

---

## 사용 가능한 스킬

| 스킬 | 카테고리 | 승인 게이트 | 설명 |
|------|----------|------------|------|
| develop-plugin | core | O | DMAP 플러그인 개발 (4-Phase 워크플로우) |
| requirement-writer | core | O | 요구사항 정의서 작성 지원 (AI 자동 완성) |
| publish | setup | O | 개발 완료된 플러그인을 GitHub에 배포 |
| setup | setup | X | DMAP 빌더 초기 설정 및 검증 |
| help | utility | X | 사용 안내 |
| add-ext-skill | utility | O | 외부 플러그인 연동 스킬 추가 |
| remove-ext-skill | utility | O | 외부 플러그인 연동 스킬 제거 |
| ext-abra | external | O | Dify 워크플로우 기반 AI Agent 개발 자동화 |
| ext-github-release-manager | external | O | GitHub Release 문서 자동 생성/수정/삭제 |

[Top](#dmap-web)

---

## UI 구성

```
┌─ Layout ──────────────────────────────────────────┐
│ ┌─ Sidebar ──────────┐  ┌─ ChatPanel ────────────┐│
│ │ DMAP Builder       │  │ 헤더 (선택된 스킬명)    ││
│ │                    │  │ [Stop] [Run]            ││
│ │ 카테고리:           │  ├────────────────────────┤│
│ │  Core              │  │                        ││
│ │   ├ develop-plugin │  │  메시지 영역 (스크롤)    ││
│ │   └ requirement-   │  │  - 어시스턴트 메시지     ││
│ │     writer         │  │  - 도구 실행 표시       ││
│ │  Setup             │  │  - Markdown 렌더링      ││
│ │   ├ publish        │  │                        ││
│ │   └ setup          │  ├────────────────────────┤│
│ │  Utility           │  │ 승인 다이얼로그         ││
│ │   ├ add-ext-skill  │  │ (승인 대기 시 표시)     ││
│ │   └ remove-ext-    │  │  [옵션1] [옵션2]       ││
│ │     skill          │  │  [직접 입력]            ││
│ │  External          │  │                        ││
│ │   ├ ext-abra       │  │                        ││
│ │   └ ext-github-    │  │                        ││
│ │     release-mgr    │  │                        ││
│ │                    │  │                        ││
│ │ v0.1.0            │  │                        ││
│ └────────────────────┘  └────────────────────────┘│
└────────────────────────────────────────────────────┘
```

[Top](#dmap-web)

---

## 스크립트 목록

**루트:**

| 스크립트 | 설명 |
|---------|------|
| `npm run dev` | 백엔드 + 프론트엔드 동시 실행 |
| `npm run build` | 전체 패키지 빌드 |
| `npm run build:shared` | shared 패키지만 빌드 |

**Backend (`packages/backend`):**

| 스크립트 | 설명 |
|---------|------|
| `npm run dev` | tsx watch 모드로 개발 서버 실행 (포트 3001) |
| `npm run build` | TypeScript 컴파일 (dist/) |
| `npm run start` | 컴파일된 서버 실행 |
| `npm run typecheck` | 타입 검사 (tsc --noEmit) |

**Frontend (`packages/frontend`):**

| 스크립트 | 설명 |
|---------|------|
| `npm run dev` | Vite 개발 서버 실행 (포트 5173) |
| `npm run build` | TypeScript 검사 + Vite 빌드 |
| `npm run preview` | 프로덕션 빌드 미리보기 |
| `npm run typecheck` | 타입 검사 (tsc --noEmit) |

[Top](#dmap-web)
