# claude-skills 플러그인 명세

- [claude-skills 플러그인 명세](#claude-skills-플러그인-명세)
  - [기본 정보](#기본-정보)
  - [제공 스킬](#제공-스킬)
  - [실행 경로](#실행-경로)
  - [ARGS 스키마](#args-스키마)
  - [도메인 컨텍스트 수집 가이드](#도메인-컨텍스트-수집-가이드)
  - [선행 요구사항](#선행-요구사항)
  - [호출 예시](#호출-예시)

---

## 기본 정보

| 항목 | 값 |
|------|---|
| 플러그인명 | claude-skills |
| 설명 | Anthropic 공식 스킬 6종(DOCX, PPTX, XLSX, PDF, Frontend Design, Product Self-Knowledge)을 DMAP 플러그인으로 통합 제공 |
| 설치 | `git clone https://github.com/unicorn-plugins/claude-skills.git`, `/claude-skills:setup` |
| 저장소 | https://github.com/unicorn-plugins/claude-skills |

[Top](#claude-skills-플러그인-명세)

---

## 제공 스킬

| 스킬 | FQN | 유형 | 설명 |
|------|-----|------|------|
| core | `claude-skills:core` | Router | 사용자 요청 의도 판별 및 스킬 라우팅 |
| setup | `claude-skills:setup` | Orchestrator | 플러그인 환경 설정 (시스템 도구 + Python/npm 패키지 설치) |
| help | `claude-skills:help` | Direct | 플러그인 사용 안내 |
| add-ext-skill | `claude-skills:add-ext-skill` | Orchestrator | 확장 스킬 추가 (외부 SKILL.md 동적 로드) |
| remove-ext-skill | `claude-skills:remove-ext-skill` | Orchestrator | 확장 스킬 제거 |
| docx | `claude-skills:docx` | Orchestrator | Word 문서(.docx) 생성, 읽기, 편집 |
| pptx | `claude-skills:pptx` | Orchestrator | PowerPoint(.pptx) 생성, 읽기, 편집 |
| xlsx | `claude-skills:xlsx` | Orchestrator | Excel(.xlsx) 생성, 읽기, 편집, 수식 재계산 |
| pdf | `claude-skills:pdf` | Orchestrator | PDF 읽기, 생성, 편집, 폼 작성, 변환 |
| frontend-design | `claude-skills:frontend-design` | Direct | 프론트엔드 UI/UX 디자인 원칙 가이드 |
| product-self-knowledge | `claude-skills:product-self-knowledge` | Direct | Anthropic 제품 지식 (Claude API, Claude Code, Claude.ai) |

[Top](#claude-skills-플러그인-명세)

---

## 실행 경로

| 경로명 | 설명 | 스킬 체인 | 조건 |
|--------|------|----------|------|
| Document Processing | Office 문서 처리 (생성/읽기/편집) | core → docx/pptx/xlsx/pdf | 문서 관련 키워드 감지 시 |
| Design Guide | 프론트엔드 디자인 가이드 제공 | core → frontend-design | UI/디자인 키워드 감지 시 |
| Product Knowledge | Anthropic 제품 정보 제공 | core → product-self-knowledge | Claude/Anthropic 키워드 감지 시 |
| Extension Management | 확장 스킬 추가/제거 | core → add-ext-skill / remove-ext-skill | 스킬 추가/제거 키워드 감지 시 |
| Setup | 환경 설정 | setup (직접 호출) | `/claude-skills:setup` 호출 시 |

[Top](#claude-skills-플러그인-명세)

---

## ARGS 스키마

docx, pptx, xlsx, pdf 스킬은 core에서 라우팅 시 사용자 요청 원문을 ARGS로 전달.
각 스킬은 별도의 구조화된 ARGS 키를 정의하지 않으며, 자연어 요청을 직접 처리함.

### add-ext-skill 스킬 ARGS

| 키 | 필수 | 설명 |
|----|------|------|
| skill_path | ✅ | 추가할 SKILL.md 파일의 로컬 경로 또는 URL |

### remove-ext-skill 스킬 ARGS

| 키 | 필수 | 설명 |
|----|------|------|
| skill_name | ✅ | 제거할 확장 스킬명 |

[Top](#claude-skills-플러그인-명세)

---

## 도메인 컨텍스트 수집 가이드

이 플러그인을 호출하는 External 스킬이 수집해야 할 도메인 컨텍스트:

| 수집 대상 | 소스 | 용도 |
|----------|------|------|
| 대상 문서 파일 | 사용자 지정 경로 | DOCX/PPTX/XLSX/PDF 처리 대상 |
| 문서 요구사항 | 사용자 입력 | 생성/편집할 문서의 내용 및 형식 요구사항 |
| 디자인 컨텍스트 | 사용자 입력 | 프론트엔드 디자인 시 목적, 톤, 기술 제약 |
| 제품 질문 | 사용자 입력 | Claude API/Code/Claude.ai 관련 질문 |

[Top](#claude-skills-플러그인-명세)

---

## 선행 요구사항

- claude-skills 플러그인 설치 필수 (`git clone https://github.com/unicorn-plugins/claude-skills.git`)
- `/claude-skills:setup` 실행하여 시스템 도구 및 패키지 설치 권장
- 시스템 도구: LibreOffice (필수), pandoc (필수), poppler-utils (선택), qpdf (선택)
- Python 패키지: lxml, defusedxml, pypdf, pdfplumber, reportlab, pypdfium2, openpyxl, pandas, Pillow
- npm 패키지: docx, pptxgenjs, react-icons, sharp

[Top](#claude-skills-플러그인-명세)

---

## 호출 예시

### Document Processing Path (core → docx)

**Skill:** claude-skills:docx

- **INTENT**: Word 문서 생성
- **ARGS**: "프로젝트 현황 보고서를 Word 문서로 작성해줘. 목차, 헤딩, 표 포함."
- **RETURN**: 유효한 OOXML 구조의 .docx 파일 생성 완료

### Document Processing Path (core → xlsx)

**Skill:** claude-skills:xlsx

- **INTENT**: Excel 문서 생성 및 수식 재계산
- **ARGS**: "월별 매출 데이터를 Excel로 만들어줘. 합계와 평균 수식 포함."
- **RETURN**: 수식이 포함된 .xlsx 파일 생성 완료

### Document Processing Path (core → pdf)

**Skill:** claude-skills:pdf

- **INTENT**: PDF 폼 작성
- **ARGS**: "이 PDF 양식에 이름: 홍길동, 날짜: 2026-02-14를 채워줘."
- **RETURN**: 폼 작성 완료된 PDF 파일

### Design Guide Path (core → frontend-design)

**Skill:** claude-skills:frontend-design

- **INTENT**: 프론트엔드 UI 디자인 가이드 요청
- **ARGS**: "React 대시보드 UI 디자인 원칙 알려줘."
- **RETURN**: Anthropic 공식 프론트엔드 디자인 원칙 및 가이드 제공

### Product Knowledge Path (core → product-self-knowledge)

**Skill:** claude-skills:product-self-knowledge

- **INTENT**: Claude 제품 정보 요청
- **ARGS**: "Claude API의 최신 모델과 컨텍스트 윈도우 크기는?"
- **RETURN**: Claude API, Claude Code, Claude.ai 관련 공식 정보 제공

### Extension Management Path (add-ext-skill)

**Skill:** claude-skills:add-ext-skill

- **INTENT**: 확장 스킬 추가
- **ARGS**: { "skill_path": "/path/to/custom-skill/SKILL.md" }
- **RETURN**: 확장 스킬 추가 완료 (skills/{name}/SKILL.md, commands/{name}.md 생성)

### Extension Management Path (remove-ext-skill)

**Skill:** claude-skills:remove-ext-skill

- **INTENT**: 확장 스킬 제거
- **ARGS**: { "skill_name": "custom-skill" }
- **RETURN**: 확장 스킬 제거 완료 (skills/{name}/, commands/{name}.md 삭제)

[Top](#claude-skills-플러그인-명세)
