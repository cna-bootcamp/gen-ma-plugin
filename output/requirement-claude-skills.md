# claude-skills 플러그인 요구사항 정의서

- [claude-skills 플러그인 요구사항 정의서](#claude-skills-플러그인-요구사항-정의서)
  - [기본 정보](#기본-정보)
  - [핵심 기능](#핵심-기능)
  - [사용자 플로우](#사용자-플로우)
  - [에이전트 구성 힌트](#에이전트-구성-힌트)
  - [참고 공유 자원](#참고-공유-자원)
  - [프로젝트 정보](#프로젝트-정보)
  - [원본 스킬 소스](#원본-스킬-소스)
  - [커스텀 도구 목록](#커스텀-도구-목록)
  - [외부 의존성](#외부-의존성)
  - [기술적 제약사항](#기술적-제약사항)
  - [라이선스](#라이선스)

---

## 기본 정보

**플러그인명**: claude-skills

**목적**: Anthropic Claude Code 공식 스킬 6종(DOCX, PPTX, XLSX, PDF, Frontend Design, Product Self-Knowledge)과
해당 스킬의 Python 스크립트/도구를 DMAP 플러그인으로 통합 제공

**대상 도메인**: 문서 처리(Office/PDF), 프론트엔드 디자인, 제품 지식

**대상 사용자**: Claude Code 사용자, 개발자, 문서 작성자

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 핵심 기능

1. **DOCX 처리**
   - 새 Word 문서 생성 (`docx-js` npm 패키지)
   - 기존 DOCX 읽기 (`pandoc` 변환)
   - 기존 DOCX 편집 (unpack → XML 편집 → pack 워크플로우)
   - 변경 추적(tracked changes) 수락, 코멘트 추가

2. **PPTX 처리**
   - 새 프리젠테이션 생성 (`pptxgenjs` npm 패키지)
   - 기존 PPTX 편집 (unpack → XML 편집 → pack 워크플로우)
   - 슬라이드 추가/복제, 고아 파일 정리, 썸네일 생성
   - 디자인 가이드 (색상 팔레트, 타이포그래피, 레이아웃 패턴)

3. **XLSX 처리**
   - Excel 생성/편집 (`openpyxl`)
   - Excel 읽기 (`pandas`)
   - 수식 재계산 (`LibreOffice` 매크로)
   - 재무 모델링 표준 (색상 코딩, 숫자 서식, 수식 구성 규칙)

4. **PDF 처리**
   - PDF 읽기/텍스트 추출 (`pypdf`, `pdfplumber`)
   - 새 PDF 생성 (`reportlab`)
   - PDF 병합/분할 (`pypdf`, `qpdf`)
   - 폼 작성 (채울 수 있는 필드 방식 + 주석 오버레이 방식)
   - OCR, 워터마크, 비밀번호 보호

5. **프론트엔드 디자인**
   - 생산급 UI/UX 디자인 가이드 (프롬프트 전용)
   - 타이포그래피, 색상/테마, 모션, 공간 구성, 배경 가이드
   - "AI slop" 방지 미학 원칙

6. **Anthropic 제품 지식**
   - Claude API, Claude Code, Claude.ai 관련 질문 라우팅 (프롬프트 전용)
   - 공식 문서 URL 안내 및 사실 검증

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 사용자 플로우

| Step | 역할 | 작업 내용 |
|------|------|-----------|
| 1 | User | 문서/디자인/제품 관련 작업 요청 |
| 2 | Core | 키워드 기반 의도 판별 및 스킬 라우팅 |
| 3 | Skill | 작업 유형 판별 (생성/읽기/편집/변환) |
| 4 | Agent | 도구 실행 및 문서 처리 수행 |
| 5 | Agent | 결과물 검증 (유효성 검사, 스키마 검증) |
| 6 | Skill | 결과물 반환 및 사용자 안내 |

**Core 스킬 의도 판별 키워드:**

| 키워드 | 라우팅 대상 |
|--------|-----------|
| `.docx`, `Word`, `워드`, `문서 작성` | docx 스킬 |
| `.pptx`, `PowerPoint`, `파워포인트`, `프리젠테이션`, `슬라이드` | pptx 스킬 |
| `.xlsx`, `Excel`, `엑셀`, `스프레드시트` | xlsx 스킬 |
| `.pdf`, `PDF`, `피디에프` | pdf 스킬 |
| `UI`, `디자인`, `컴포넌트`, `프론트엔드` | frontend-design 스킬 |
| `Claude API`, `Claude Code`, `Anthropic 제품` | product-self-knowledge 스킬 |

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 에이전트 구성 힌트

**추천 에이전트 1**: office-editor

**역할**: Office 문서(DOCX/PPTX/XLSX) XML 편집 전문가

**근거**:
- Step 3~5가 DOCX/PPTX/XLSX 모두 동일한 unpack→XML 분석→편집→검증→pack 패턴
- OOXML XML 구조에 대한 전문 지식을 공유하여 에이전트 통합 가능
- 서식 보존, 네임스페이스 처리, 스키마 검증 등 공통 역량

**적합한 4-Tier 모델**: MEDIUM (Sonnet)
- XML 구조 분석 및 정밀 편집에 중간 수준의 추론 필요
- 유효성 검증과 자동 복구 로직 처리 가능

---

**추천 에이전트 2**: pdf-handler

**역할**: PDF 처리 전문가 (폼 분석, 데이터 추출, 폼 작성, 변환)

**근거**:
- PDF 폼 작성은 전략 판별 필요 (채울 수 있는 필드 vs 주석 오버레이 방식)
- 바운딩 박스 검증, 시각적 확인 등 QA 과정 포함
- Step 3~5가 분석→전략 판별→실행→검증의 독립적 워크플로우

**적합한 4-Tier 모델**: MEDIUM (Sonnet)
- 폼 구조 분석 및 전략 선택에 중간 수준의 추론 필요
- 좌표 기반 폼 작성 시 정밀한 데이터 처리 가능

---

**에이전트 불필요 스킬**:
- frontend-design: 프롬프트 전용 디자인 가이드 (Utility 직결형)
- product-self-knowledge: 프롬프트 전용 라우팅 (Utility 직결형)

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 참고 공유 자원

| 유형 | 자원명 | 적합성 이유 |
|------|--------|-------------|
| 템플릿 | `README-plugin-template` | 플러그인 README.md 작성용 |
| 가이드 | (해당 없음) | 원본 SKILL.md에 API 레퍼런스가 이미 포함 |
| 샘플 | (해당 없음) | 문서 처리 도메인 샘플 미보유 |
| 도구 | (해당 없음) | 모든 도구는 원본 스킬에서 직접 복사 |

**참고**: 원본 스킬의 SKILL.md 파일에 docx-js API, PptxGenJS API, PDF 처리 전략,
OOXML XML 구조 등 포괄적 레퍼런스가 포함되어 있어 별도 가이드 불필요.
이 레퍼런스 콘텐츠는 DMAP 스킬 또는 에이전트의 references/ 디렉토리에 배치.

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 프로젝트 정보

**프로젝트 디렉토리**: `C:\Users\hiond\workspace\claude-skills`

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 원본 스킬 소스

**소스 경로**: `C:\Users\hiond\Downloads\claude_skills_public`

원본 스킬별 구성 및 DMAP 변환 지침:

| 원본 스킬 | SKILL.md | 보조 문서 | Python 스크립트 | DMAP 변환 |
|-----------|----------|----------|----------------|----------|
| docx | 1개 (API 레퍼런스 포함) | - | 7개 + office 모듈 | 스킬(Orchestrator) + 에이전트 references + 커스텀 도구 |
| pptx | 1개 (디자인 가이드 포함) | editing.md, pptxgenjs.md | 3개 + office 모듈 | 스킬(Orchestrator) + 에이전트 references + 커스텀 도구 |
| xlsx | 1개 (재무 모델링 표준 포함) | - | 1개 + office 모듈 | 스킬(Orchestrator) + 에이전트 references + 커스텀 도구 |
| pdf | 1개 | REFERENCE.md, FORMS.md | 8개 | 스킬(Orchestrator) + 에이전트 references + 커스텀 도구 |
| frontend-design | 1개 (디자인 원칙) | - | - | 스킬(Utility) 직결형 |
| product-self-knowledge | 1개 (라우팅 로직) | - | - | 스킬(Utility) 직결형 |

**공유 office 모듈 통합 지침**:
- 원본에서는 docx, pptx, xlsx에 각각 복제된 `office/` 모듈을
  DMAP에서는 `gateway/tools/office/`에 1벌만 배치하여 중복 제거
- office 모듈 구성: unpack.py, pack.py, validate.py, soffice.py,
  helpers/ (merge_runs.py, simplify_redlines.py),
  validators/ (base.py, docx.py, pptx.py, redlining.py),
  schemas/ (35+ XSD 파일)

**원본 콘텐츠 배치 규칙**:

| 원본 콘텐츠 | DMAP 배치 위치 |
|------------|---------------|
| SKILL.md 워크플로우 부분 | `skills/{name}/SKILL.md`에 반영 |
| SKILL.md API 레퍼런스 부분 | `agents/{agent}/references/`에 별도 파일로 분리 |
| 보조 문서 (editing.md 등) | `agents/{agent}/references/`에 배치 |
| Python 스크립트 | `gateway/tools/{category}/`에 배치 |
| XML 템플릿 | `gateway/tools/{category}/templates/`에 배치 |
| XSD 스키마 | `gateway/tools/office/schemas/`에 배치 |

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 커스텀 도구 목록

원본 스킬에서 가져올 Python 스크립트 (커스텀 앱):

**공유 Office 모듈** (`gateway/tools/office/`):

| 도구명 | 파일 | 설명 |
|--------|------|------|
| office-unpack | unpack.py | Office 문서 ZIP 해제, XML 정리, 스마트 인용부호 이스케이프 |
| office-pack | pack.py | XML 압축, 유효성 검증, 자동 복구 후 ZIP 패키징 |
| office-validate | validate.py | XSD 스키마 기반 XML 유효성 검증 CLI |
| office-soffice | soffice.py | 샌드박스 환경 대응 LibreOffice 실행기 (AF_UNIX 심 포함) |

**DOCX 전용** (`gateway/tools/docx/`):

| 도구명 | 파일 | 설명 |
|--------|------|------|
| docx-accept-changes | accept_changes.py | LibreOffice 매크로로 변경 추적 수락 |
| docx-comment | comment.py | 언팩된 DOCX XML에 코멘트/답글 추가 |

**PPTX 전용** (`gateway/tools/pptx/`):

| 도구명 | 파일 | 설명 |
|--------|------|------|
| pptx-add-slide | add_slide.py | 슬라이드 복제/추가, Content_Types 및 rels 자동 관리 |
| pptx-clean | clean.py | 고아 슬라이드/미디어/임베딩/차트 정리 |
| pptx-thumbnail | thumbnail.py | LibreOffice + pdftoppm + PIL 기반 슬라이드 썸네일 그리드 |

**XLSX 전용** (`gateway/tools/xlsx/`):

| 도구명 | 파일 | 설명 |
|--------|------|------|
| xlsx-recalc | recalc.py | LibreOffice 매크로 기반 수식 재계산 + 에러 스캔 |

**PDF 전용** (`gateway/tools/pdf/`):

| 도구명 | 파일 | 설명 |
|--------|------|------|
| pdf-check-fillable | check_fillable_fields.py | PDF 채울 수 있는 필드 존재 여부 확인 |
| pdf-extract-field-info | extract_form_field_info.py | 폼 필드 메타데이터(ID, 페이지, 좌표, 유형) JSON 추출 |
| pdf-extract-structure | extract_form_structure.py | 텍스트 라벨, 라인, 체크박스 좌표 추출 |
| pdf-fill-fields | fill_fillable_fields.py | JSON 명세 기반 채울 수 있는 필드 작성 |
| pdf-fill-annotations | fill_pdf_form_with_annotations.py | 좌표 지정 텍스트 주석 방식 폼 작성 |
| pdf-check-boxes | check_bounding_boxes.py | 필드 바운딩 박스 교차/크기 검증 |
| pdf-to-images | convert_pdf_to_images.py | PDF 페이지 → PNG 이미지 변환 |
| pdf-validation-image | create_validation_image.py | 바운딩 박스 오버레이 검증 이미지 생성 |

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 외부 의존성

**시스템 도구** (사전 설치 필요):

| 도구 | 용도 | 사용 스킬 |
|------|------|----------|
| LibreOffice (`soffice`) | 문서 렌더링, 변환, 매크로 실행 | docx, pptx, xlsx |
| pandoc | DOCX 읽기/변환 | docx |
| poppler-utils (`pdftoppm`) | PDF → 이미지 변환 | pdf, pptx(썸네일) |
| qpdf | PDF 병합/분할 | pdf |

**Python 패키지** (`pip install`):

| 패키지 | 용도 | 사용 스킬 |
|--------|------|----------|
| lxml | XSD 스키마 기반 XML 검증 | docx, pptx, xlsx |
| defusedxml | 안전한 XML 파싱 (XXE 방지) | docx, pptx, xlsx |
| pypdf | PDF 읽기/편집/병합 | pdf |
| pdfplumber | PDF 테이블/텍스트 추출 | pdf |
| reportlab | PDF 생성 | pdf |
| pypdfium2 | PDF 렌더링 | pdf |
| openpyxl | Excel 읽기/쓰기 | xlsx |
| pandas | 데이터 분석/Excel 읽기 | xlsx |
| Pillow | 이미지 처리 | pptx, pdf |

**npm 패키지** (`npm install`):

| 패키지 | 용도 | 사용 스킬 |
|--------|------|----------|
| docx | Word 문서 신규 생성 (docx-js) | docx |
| pptxgenjs | PowerPoint 신규 생성 | pptx |
| react-icons | 아이콘 SVG 추출 (PPTX용) | pptx |
| sharp | 이미지 처리/리사이즈 (PPTX용) | pptx |

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 기술적 제약사항

- LibreOffice 미설치 시 Office 문서 편집/변환 기능 제한
- pandoc 미설치 시 DOCX 읽기 기능 제한
- poppler-utils 미설치 시 PDF 이미지 변환/PPTX 썸네일 기능 제한
- `soffice.py`는 샌드박스 환경(AF_UNIX 소켓 차단)에서 C 언어 LD_PRELOAD 심을 런타임 컴파일하여 대응
- XSD 스키마 파일(35+ 파일)은 ISO-IEC29500-4_2016, ECMA, Microsoft 확장, MCE 표준 포함
- Office 문서 편집 시 원본 서식 보존을 위해 XML 직접 편집 방식 사용 (SDK 미사용)

[Top](#claude-skills-플러그인-요구사항-정의서)

---

## 라이선스

**원본 스킬 라이선스**: Anthropic 독점 라이선스 (LICENSE.txt)
- 원본 스킬은 Anthropic 서비스 내 사용 권한으로 제공
- DMAP 플러그인 배포 시 라이선스 호환성 확인 필요

**플러그인 라이선스**: MIT

---

## 설치 전략

**시스템 도구 설치**: 자동 설치 시도
- setup 스킬에서 미설치 도구 감지 시 OS별 패키지 매니저로 자동 설치 시도
  - Windows: `choco install` / `winget install`
  - macOS: `brew install`
  - Linux: `apt install` / `dnf install`
- 자동 설치 실패 시 수동 설치 방법 안내로 폴백

[Top](#claude-skills-플러그인-요구사항-정의서)
