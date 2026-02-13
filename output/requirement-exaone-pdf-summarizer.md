# 요구사항 정의서

## 기본 정보
- 플러그인명: exaone-pdf-summarizer
- 목적: PDF 문서를 자동으로 요약하여 핵심 내용을 빠르게 파악할 수 있도록 지원
- 대상 도메인: 문서 처리 자동화
- 대상 사용자: 일반 사용자

## 핵심기능
- PDF 텍스트 추출: PDF 파일에서 텍스트 내용 추출
- AI 기반 요약: EXAONE-4.0-1.2B 모델을 사용한 한국어 최적화 요약 생성
- 핵심 키워드 추출: 문서의 주요 키워드 자동 추출
- 목차 생성: 요약 문서에 구조화된 목차 자동 생성
- 결과 저장: Markdown 형식으로 요약 결과 저장

## 사용자 플로우
- Step 1. PDF 파일 선택: `pdf/` 디렉토리에서 요약할 PDF 파일 스캔 및 사용자 선택
- Step 2. 텍스트 추출: 선택된 PDF에서 텍스트 추출 및 전처리
- Step 3. AI 요약 생성: EXAONE 모델로 요약문 생성 (고정 길이, 자동 판단)
- Step 4. 메타데이터 생성: 핵심 키워드 추출 및 목차 구조화
- Step 5. 결과 저장: `summary/` 디렉토리에 Markdown 파일로 저장

## 기술 요구사항
- 모델: EXAONE-4.0-1.2B (Instruction-tuned, Hugging Face)
  - 모델 URL: https://huggingface.co/LGAI-EXAONE/EXAONE-4.0-1.2B
- 프레임워크: transformers >= 4.54.0
- GPU 지원: PyTorch with CUDA 12.1+
- 특수 설정:
  - `apply_chat_template` 사용 시 `enable_thinking=False` (reasoning 모드 비활성화)
  - `attention_mask` 명시적 전달
  - `dtype` 파라미터 사용 (`torch_dtype`은 deprecated)
  - 한국어 요약 시 `temperature=0.1` 권장

## 입출력 경로
- 입력: `pdf/` 디렉토리의 PDF 파일 (스캔하여 사용자에게 선택 문의)
- 출력: `summary/` 디렉토리에 중복되지 않는 Markdown 파일 생성

## README.md 포함 내용
- 소스 코드 구조 및 실행 흐름 설명
- GPU/CPU 확인 방법 (`nvidia-smi` 사용법)
- 가상환경 설정 및 실행 방법
- 시스템 요구사항 (Python 버전, 의존성, GPU 사양)
- 생성 파라미터 설명 (`temperature`, `max_new_tokens` 등)

## 에이전트 구성 힌트

### 추천 구성 (단순화)
- file-handler (LOW): PDF 파일 스캔/선택 및 Markdown 파일 저장 담당 (Step 1, 5)
- text-analyzer (MEDIUM): PDF 텍스트 추출, AI 요약 생성, 키워드 추출, 목차 생성 담당 (Step 2, 3, 4)

### 대안 구성 (세분화)
- file-manager (LOW): PDF 파일 스캔 및 선택 (Step 1)
- text-processor (MEDIUM): PDF 텍스트 추출 및 전처리 (Step 2)
- summarizer (MEDIUM): EXAONE 모델 호출 및 요약 생성 (Step 3)
- metadata-generator (MEDIUM): 핵심 키워드 추출 및 목차 생성 (Step 4)
- output-writer (LOW): Markdown 파일 저장 (Step 5)

## 참고 공유 자원

### 템플릿
- README-plugin-template: 플러그인 README.md 스켈레톤 (resources/templates/plugin/README-plugin-template.md)

### 가이드
- plugin-dev-guide: DMAP 플러그인 개발 워크플로우 표준 (resources/guides/plugin/plugin-dev-guide.md)

### 커스텀 도구 개발 필요
- pdf_extractor.py: PDF 파일 텍스트 추출 앱 (PyPDF2 또는 pdfplumber 사용)
- exaone_summarizer.py: EXAONE-4.0-1.2B 모델 로드 및 요약 생성 앱 (transformers, torch 사용)

## 추가 고려사항
- GPU 메모리 부족 시 CPU 폴백 처리 필요
- PDF 파일이 이미지 기반인 경우 OCR 처리 여부 (향후 확장 가능)
- 요약 품질 평가 메커니즘 (선택적)
- 진행률 표시 (선택적)
