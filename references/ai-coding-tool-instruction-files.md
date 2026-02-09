# AI 코딩 도구 런타임 상주 파일 비교

- [AI 코딩 도구 런타임 상주 파일 비교](#ai-코딩-도구-런타임-상주-파일-비교)
  - [1. 개요](#1-개요)
  - [2. Claude Code — CLAUDE.md](#2-claude-code--claudemd)
  - [3. OpenAI Codex — AGENTS.md](#3-openai-codex--agentsmd)
  - [4. Google Antigravity — GEMINI.md + .agent/rules/](#4-google-antigravity--geminimd--agentrules)
  - [5. 세 도구 비교표](#5-세-도구-비교표)
  - [6. Claude Code에서 AGENTS.md 지원 현황](#6-claude-code에서-agentsmd-지원-현황)
  - [7. AGENTS.md 크로스 플랫폼 지원 현황](#7-agentsmd-크로스-플랫폼-지원-현황)
  - [8. 참고 자료](#8-참고-자료)

---

## 1. 개요

각 AI 코딩 도구는 **시스템 프롬프트에 자동 로드되는 지시 파일**(런타임 상주 파일)을 제공.
이 파일에 프로젝트별 코딩 규칙, 아키텍처 가이드, 행동 지침 등을 작성하면
에이전트가 매 세션마다 해당 내용을 참조하여 동작.

[Top](#ai-코딩-도구-런타임-상주-파일-비교)

---

## 2. Claude Code — CLAUDE.md

| 항목 | 내용 |
|------|------|
| **파일명** | `CLAUDE.md` |
| **글로벌 위치** | `~/.claude/CLAUDE.md` (모든 프로젝트 공통) |
| **프로젝트 위치** | 프로젝트 루트 `CLAUDE.md`, 하위 디렉토리에도 배치 가능 |
| **로딩 시점** | 세션 시작 시 시스템 프롬프트에 자동 주입 |
| **우선순위** | 글로벌 → 프로젝트 루트 → 하위 디렉토리 순 병합 |
| **크기 제한** | 메모리 파일은 ~200줄, 전체는 유연 |
| **형식** | Markdown |

**특징:**
- Claude Code 전용 포맷
- `@AGENTS.md` 구문으로 외부 파일 임포트 가능
- 하위 디렉토리의 `CLAUDE.md`는 해당 디렉토리 작업 시에만 로드

[Top](#ai-코딩-도구-런타임-상주-파일-비교)

---

## 3. OpenAI Codex — AGENTS.md

| 항목 | 내용 |
|------|------|
| **파일명** | `AGENTS.md` (오버라이드: `AGENTS.override.md`) |
| **글로벌 위치** | `~/.codex/AGENTS.md` (또는 `$CODEX_HOME`) |
| **프로젝트 위치** | Git 루트부터 현재 디렉토리까지 각 레벨에서 탐색 |
| **로딩 시점** | 세션 시작 시 instruction chain 빌드, 시스템 프롬프트 주입 |
| **우선순위** | 글로벌 → Git 루트 → ... → 현재 디렉토리 순 연결(concat) |
| **크기 제한** | 기본 32KiB (`project_doc_max_bytes`) |
| **형식** | Markdown |

**탐색 규칙:**
1. 글로벌 스코프에서 `AGENTS.override.md` → `AGENTS.md` 순으로 확인
2. 프로젝트 스코프에서 Git 루트부터 CWD까지 디렉토리별 1개 파일만 사용
3. 하위 디렉토리 파일이 상위를 오버라이드 (나중에 concat되므로)
4. `config.toml`의 `project_doc_fallback_filenames`로 대체 파일명 설정 가능

[Top](#ai-코딩-도구-런타임-상주-파일-비교)

---

## 4. Google Antigravity — GEMINI.md + .agent/rules/

| 항목 | 내용 |
|------|------|
| **글로벌 룰 파일** | `~/.gemini/GEMINI.md` |
| **워크스페이스 룰** | `프로젝트/.agent/rules/*.md` (여러 파일 가능) |
| **워크플로우** | `프로젝트/.agent/workflows/*.yaml` |
| **글로벌 워크플로우** | `~/.gemini/antigravity/global_workflows/` |
| **로딩 시점** | 에이전트 실행 전 시스템 지시로 자동 로드 |
| **형식** | Markdown + YAML |

**특징:**
- Rules(지시)와 Workflows(절차)를 분리하여 관리
- Rules: 행동 제약 조건 (수동적, 지속적 가이드라인)
- Workflows: 단계별 실행 절차 (능동적, 순차적 작업 흐름)
- `.agent/rules/` 디렉토리에 여러 `.md` 파일 배치 가능
- Gemini CLI와 `~/.gemini/GEMINI.md` 경로 공유로 충돌 가능성 존재

[Top](#ai-코딩-도구-런타임-상주-파일-비교)

---

## 5. 세 도구 비교표

| 비교 항목 | Claude Code | OpenAI Codex | Google Antigravity |
|-----------|-------------|--------------|-------------------|
| **핵심 파일** | `CLAUDE.md` | `AGENTS.md` | `GEMINI.md` + `.agent/rules/` |
| **글로벌 경로** | `~/.claude/` | `~/.codex/` | `~/.gemini/` |
| **프로젝트 경로** | 프로젝트 루트 | Git 루트~CWD 전체 | `.agent/rules/` 디렉토리 |
| **파일 형식** | Markdown | Markdown | Markdown + YAML |
| **다중 파일** | 레벨별 1개 | 레벨별 1개 | 여러 개 가능 (rules 폴더) |
| **오버라이드** | 하위 우선 | `*.override.md` 우선 | 워크스페이스 > 글로벌 |
| **크기 제한** | 유연 | 32KiB | 명시적 제한 없음 |
| **외부 파일 임포트** | `@파일명` 지원 | 미지원 | 미지원 |
| **규칙/절차 분리** | 미분리 | 미분리 | Rules + Workflows 분리 |

[Top](#ai-코딩-도구-런타임-상주-파일-비교)

---

## 6. Claude Code에서 AGENTS.md 지원 현황

**현재 상태: 네이티브 미지원** (2026.02 기준)

- [GitHub Issue #6235](https://github.com/anthropics/claude-code/issues/6235)에서 2,400+ 찬성 획득
- 활발한 논의 진행 중 (179+ 코멘트)

**워크어라운드 3가지:**

| 방법 | 설정 | 비고 |
|------|------|------|
| **파일 임포트** (추천) | `CLAUDE.md`에 `@AGENTS.md` 한 줄 추가 | 가장 간편 |
| **심볼릭 링크** | `ln -s AGENTS.md CLAUDE.md` | OS 지원 필요 |
| **Hooks** | 세션 시작 시 AGENTS.md 자동 로드 훅 설정 | 고급 사용자용 |

**듀얼 파일 전략:**
- `AGENTS.md`: 크로스 플랫폼 공통 지시 (팀 공유용)
- `CLAUDE.md`: Claude Code 전용 최적화 지시 + `@AGENTS.md` 임포트

[Top](#ai-코딩-도구-런타임-상주-파일-비교)

---

## 7. AGENTS.md 크로스 플랫폼 지원 현황

Agentic AI Foundation(Linux Foundation)에서 표준화 추진 중.

| 플랫폼 | AGENTS.md 지원 | 비고 |
|--------|---------------|------|
| Claude Code | Import 방식 | `@AGENTS.md` |
| OpenAI Codex | 네이티브 | 기본 지시 파일 |
| Google Antigravity | 네이티브 | 자동 인식 |
| Cursor | 네이티브 | `.cursorrules` 대체/보완 |
| GitHub Copilot | 네이티브 | 지원 |
| Windsurf | 네이티브 | 지원 |

**20,000+ 오픈소스 프로젝트**에서 이미 AGENTS.md 사용 중.

[Top](#ai-코딩-도구-런타임-상주-파일-비교)

---

## 8. 참고 자료

- [OpenAI Codex AGENTS.md 공식 문서](https://developers.openai.com/codex/guides/agents-md/)
- [Google Antigravity Rules 가이드](https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/)
- [Claude Code AGENTS.md 지원 요청 (Issue #6235)](https://github.com/anthropics/claude-code/issues/6235)
- [Google Antigravity 2026 가이드](https://www.aifire.co/p/google-antigravity-the-2026-guide-to-the-best-ai-ide)
- [Agentic AI Foundation (Linux Foundation)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [AGENTS.md 표준화 동향](https://tessl.io/blog/the-rise-of-agents-md-an-open-standard-and-single-source-of-truth-for-ai-coding-agents/)

[Top](#ai-코딩-도구-런타임-상주-파일-비교)
