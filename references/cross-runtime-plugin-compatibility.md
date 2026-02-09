# 크로스 런타임 플러그인 호환성 분석

- [크로스 런타임 플러그인 호환성 분석](#크로스-런타임-플러그인-호환성-분석)
  - [1. 개요](#1-개요)
  - [2. 컴포넌트별 호환성 매트릭스](#2-컴포넌트별-호환성-매트릭스)
  - [3. 포팅 가능 영역 (Zero ~ Minimal Changes)](#3-포팅-가능-영역-zero--minimal-changes)
    - [3.1 Skills — SKILL.md 포맷 (사실상 표준)](#31-skills--skillmd-포맷-사실상-표준)
    - [3.2 MCP 서버 — 범용 프로토콜 표준](#32-mcp-서버--범용-프로토콜-표준)
    - [3.3 AGENTS.md — 크로스 플랫폼 지시 파일](#33-agentsmd--크로스-플랫폼-지시-파일)
  - [4. 포팅 불가 영역 (Platform-Specific)](#4-포팅-불가-영역-platform-specific)
  - [5. 플랫폼별 플러그인 구조 비교](#5-플랫폼별-플러그인-구조-비교)
    - [5.1 Claude Code 플러그인 구조](#51-claude-code-플러그인-구조)
    - [5.2 OpenAI Codex 구조](#52-openai-codex-구조)
    - [5.3 Google Antigravity 구조](#53-google-antigravity-구조)
  - [6. 실용적 크로스 플랫폼 전략](#6-실용적-크로스-플랫폼-전략)
    - [6.1 권장 디렉토리 구조](#61-권장-디렉토리-구조)
    - [6.2 자동 배포 스크립트](#62-자동-배포-스크립트)
    - [6.3 포팅 체크리스트](#63-포팅-체크리스트)
  - [7. Agentic AI Foundation 표준화 동향](#7-agentic-ai-foundation-표준화-동향)
  - [8. 결론](#8-결론)
  - [9. 참고 자료](#9-참고-자료)

---

## 1. 개요

Claude Code, OpenAI Codex, Google Antigravity 세 AI 코딩 런타임 간
**플러그인 호환성**을 분석한 문서.

**핵심 질문:** `plugin.json`만 바꾸면 다른 런타임에서 동작하는가?
**결론:** `plugin.json`만으로는 부족. 하지만 **핵심 로직(Skills, MCP)의 80~90%는 거의 그대로 포팅 가능.**

[Top](#크로스-런타임-플러그인-호환성-분석)

---

## 2. 컴포넌트별 호환성 매트릭스

| 컴포넌트 | Claude Code | OpenAI Codex | Google Antigravity | 호환성 | 포팅 난이도 |
|----------|-------------|--------------|-------------------|--------|-----------|
| **Skills (SKILL.md)** | `.claude/skills/` | `.codex/skills/` | `.agent/skills/` | 100% | 폴더명만 변경 |
| **AGENTS.md** | `@import` 방식 | 네이티브 | 네이티브 | 100% | 변경 불필요 |
| **MCP 서버** | 지원 | 지원 | 지원 | 100% | 설정 파일만 변경 |
| **Hooks** | TypeScript 기반 | 미지원 | 미지원 | 0% | 포팅 불가 |
| **Plugin Manifest** | `plugin.json` | 자체 형식 | 자체 형식 | 0% | 재작성 필요 |
| **Workflows** | 미지원 | Automations (JSON) | `.agent/workflows/` (YAML) | 0% | 플랫폼 고유 |
| **Rules** | CLAUDE.md | AGENTS.md | `.agent/rules/` | 부분 | 형식 변환 필요 |
| **Commands** | Slash commands | 미지원 | 미지원 | 0% | Skill로 전환 |

[Top](#크로스-런타임-플러그인-호환성-분석)

---

## 3. 포팅 가능 영역 (Zero ~ Minimal Changes)

### 3.1 Skills — SKILL.md 포맷 (사실상 표준)

세 플랫폼 모두 **동일한 SKILL.md 형식** 사용:

```yaml
---
name: my-skill
version: 1.0.0
description: Brief description (max 160 characters)
displayName: "Human Readable Name"
author: "Author Name"
keywords:
  - tag1
  - tag2
---

# Skill Instructions

Your system prompt and instructions here...
```

**포팅 방법:**
```bash
# Claude Code → Codex
cp -r .claude/skills/my-skill/ .codex/skills/my-skill/

# Claude Code → Antigravity
cp -r .claude/skills/my-skill/ .agent/skills/my-skill/
```

**공통 동작:**
- 이름(name)과 설명(description)으로 시맨틱 매칭
- Progressive Disclosure: 메타데이터 먼저 로드, 필요 시 전체 콘텐츠 로드
- YAML frontmatter + Markdown 본문

### 3.2 MCP 서버 — 범용 프로토콜 표준

MCP(Model Context Protocol)는 Anthropic이 만들고
Linux Foundation(Agentic AI Foundation)에 기증한 **범용 표준**.

| 플랫폼 | MCP 지원 | 설정 위치 |
|--------|---------|----------|
| Claude Code | 네이티브 | `claude_code_config.json` |
| OpenAI Codex | 네이티브 | `codex_config.json` |
| Google Antigravity | 네이티브 | UI 설정 |
| ChatGPT Desktop | 네이티브 | Desktop 설정 |

**동일한 MCP 서버**가 모든 플랫폼에서 동작. 설정 파일 위치만 상이.

### 3.3 AGENTS.md — 크로스 플랫폼 지시 파일

프로젝트 루트에 `AGENTS.md` 하나만 두면 모든 플랫폼에서 인식:

| 플랫폼 | 지원 방식 |
|--------|----------|
| Claude Code | `CLAUDE.md`에서 `@AGENTS.md` 임포트 |
| OpenAI Codex | 네이티브 자동 로드 |
| Google Antigravity | 네이티브 자동 로드 |
| Cursor | 네이티브 |
| GitHub Copilot | 네이티브 |
| Windsurf | 네이티브 |

[Top](#크로스-런타임-플러그인-호환성-분석)

---

## 4. 포팅 불가 영역 (Platform-Specific)

| 컴포넌트 | 소속 플랫폼 | 비호환 이유 | 대안 |
|----------|-----------|-----------|------|
| **Hooks** | Claude Code | TypeScript 이벤트 시스템, 타 플랫폼에 동등 개념 없음 | Skill로 로직 재작성 |
| **Automations** | Codex | JSON 기반 스케줄 실행, Codex 전용 | Skill + CI/CD로 대체 |
| **Workflows** | Antigravity | YAML+Markdown 단계별 실행, Antigravity 전용 | Skill로 변환 |
| **Plugin Manifest** | 각 플랫폼 | 구조/스키마가 상이 | 플랫폼별 매니페스트 작성 |
| **Rules** | Antigravity | `.agent/rules/` 전용 디렉토리 구조 | AGENTS.md로 통합 |

[Top](#크로스-런타임-플러그인-호환성-분석)

---

## 5. 플랫폼별 플러그인 구조 비교

### 5.1 Claude Code 플러그인 구조

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # 매니페스트
├── agents/                  # 에이전트 정의
├── skills/                  # SKILL.md 파일
├── commands/                # Slash commands
├── hooks/                   # TypeScript 이벤트 핸들러
└── mcp-servers/             # MCP 서버 정의
```

`plugin.json` 스키마:
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "owner": { "name": "Author", "email": "email@example.com" },
  "agents": ["./agents/", "./specialized/"],
  "commands": {},
  "skills": {},
  "hooks": {}
}
```

### 5.2 OpenAI Codex 구조

```
my-project/
├── .codex/
│   ├── config.toml          # Codex 설정
│   ├── skills/              # SKILL.md 파일
│   └── automations/         # JSON 스케줄 정의
├── AGENTS.md                # 프로젝트 지시 파일
└── ...
```

### 5.3 Google Antigravity 구조

```
my-project/
├── .agent/
│   ├── rules/               # Markdown 룰 파일들
│   ├── skills/              # SKILL.md 파일
│   └── workflows/           # YAML 워크플로우
├── AGENTS.md                # 프로젝트 지시 파일
└── ...
```

[Top](#크로스-런타임-플러그인-호환성-분석)

---

## 6. 실용적 크로스 플랫폼 전략

### 6.1 권장 디렉토리 구조

**공통 레이어 + 플랫폼별 어댑터 패턴:**

```
my-plugin/
├── shared/                     # 공통 (모든 플랫폼)
│   ├── skills/                 # SKILL.md 파일 (100% 호환)
│   ├── AGENTS.md               # 크로스 플랫폼 지시 파일
│   └── mcp-servers/            # MCP 서버 정의
│
├── .claude-plugin/             # Claude Code 전용
│   ├── plugin.json
│   └── hooks/
│
├── .codex/                     # Codex 전용
│   ├── config.toml
│   └── automations/
│
└── .agent/                     # Antigravity 전용
    ├── rules/
    └── workflows/
```

### 6.2 자동 배포 스크립트

```bash
#!/bin/bash
# sync-skills.sh - 공통 Skills를 각 플랫폼 디렉토리에 배포

SHARED_SKILLS="shared/skills"

# Claude Code
mkdir -p .claude/skills
cp -r $SHARED_SKILLS/* .claude/skills/

# OpenAI Codex
mkdir -p .codex/skills
cp -r $SHARED_SKILLS/* .codex/skills/

# Google Antigravity
mkdir -p .agent/skills
cp -r $SHARED_SKILLS/* .agent/skills/

echo "Skills synced to all platforms."
```

또는 심볼릭 링크 방식:
```bash
ln -s shared/skills .claude/skills
ln -s shared/skills .codex/skills
ln -s shared/skills .agent/skills
```

### 6.3 포팅 체크리스트

**Claude Code → Codex 포팅:**
- [ ] Skills: `.claude/skills/` → `.codex/skills/` 복사
- [ ] AGENTS.md: 프로젝트 루트에 배치 (변경 불필요)
- [ ] MCP 서버: `codex_config.json`에 연결 설정 재작성
- [ ] Hooks: Skill 또는 Automation으로 전환
- [ ] Commands: Skill로 통합

**Claude Code → Antigravity 포팅:**
- [ ] Skills: `.claude/skills/` → `.agent/skills/` 복사
- [ ] AGENTS.md: 프로젝트 루트에 배치 (변경 불필요)
- [ ] MCP 서버: UI에서 연결 설정
- [ ] Hooks: Workflow 또는 Skill로 전환
- [ ] CLAUDE.md 내용: `.agent/rules/`로 분리 배치
- [ ] Commands: Skill로 통합

[Top](#크로스-런타임-플러그인-호환성-분석)

---

## 7. Agentic AI Foundation 표준화 동향

**2025년 12월** Linux Foundation 산하 Agentic AI Foundation 설립.

**참여 기업:**
- AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI

**기증된 핵심 프로젝트:**

| 프로젝트 | 기증 기업 | 역할 |
|----------|---------|------|
| **MCP** | Anthropic | 도구/데이터 연결 프로토콜 |
| **AGENTS.md** | OpenAI | 프로젝트 지시 파일 표준 |
| **goose** | Block | 로컬 우선 에이전트 프레임워크 |

**Skills 표준:**
- YAML frontmatter + Markdown 형식
- Claude Code, Codex, Antigravity, Cursor, Copilot, Windsurf 등 28+ 도구 채택
- 200+ Skills가 공유 카탈로그에 등록

[Top](#크로스-런타임-플러그인-호환성-분석)

---

## 8. 결론

### plugin.json만 바꾸면 되는가?

**아니오.** 매니페스트(plugin.json)는 각 플랫폼마다 고유한 스키마를 사용하므로
단순 수정으로는 호환 불가.

### 실제로 포팅 가능한 범위

| 영역 | 호환률 | 포팅 방법 |
|------|--------|----------|
| **Skills (SKILL.md)** | 100% | 폴더명 변경 |
| **MCP 서버** | 100% | 설정 파일 변경 |
| **AGENTS.md** | 100% | 변경 불필요 |
| **Hooks/Automations/Workflows** | 0% | 재작성 필요 |
| **Plugin Manifest** | 0% | 재작성 필요 |

### 권장 접근법

> **Skills + MCP + AGENTS.md = 크로스 플랫폼 (폴더명만 변경)**
> **Hooks + Manifest + Workflows = 플랫폼 고유 (재작성 필요)**

플러그인의 **핵심 로직(Skills, MCP)**은 거의 그대로 옮길 수 있지만,
**생명주기 관리(Hooks, Manifest)**는 각 플랫폼에 맞게 별도 작성 필요.
**공통 레이어를 분리하는 설계**가 크로스 플랫폼 전략의 핵심.

[Top](#크로스-런타임-플러그인-호환성-분석)

---

## 9. 참고 자료

- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Claude Code Custom Subagents](https://code.claude.com/docs/en/sub-agents)
- [OpenAI Codex Skills](https://developers.openai.com/codex/skills/)
- [OpenAI Codex AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/)
- [Google Antigravity Rules 가이드](https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/)
- [Google Antigravity 2026 가이드](https://www.aifire.co/p/google-antigravity-the-2026-guide-to-the-best-ai-ide)
- [Agentic AI Foundation (Linux Foundation)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [AGENTS.md 표준화 동향](https://tessl.io/blog/the-rise-of-agents-md-an-open-standard-and-single-source-of-truth-for-ai-coding-agents/)
- [Claude Code AGENTS.md Issue #6235](https://github.com/anthropics/claude-code/issues/6235)

[Top](#크로스-런타임-플러그인-호환성-분석)
