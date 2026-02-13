# v1.0.6 - DMAP Web

**Release Date**: 2026-02-12

---

## Highlights

- **DMAP Web 앱**: 브라우저에서 DMAP 빌더를 사용할 수 있는 웹 애플리케이션 추가 (React + Express monorepo)
- **README 다국어 분리**: 한국어(README.md)와 영문(README.en.md) 파일 분리로 가독성 향상
- **문서 구조 개선**: 빠른 시작 섹션 재배치, 워크플로우 자동화 강조, 생태계 문서 링크 연결

---

## Added

### DMAP Web

- **웹 기반 DMAP 빌더**: 브라우저에서 플러그인 관리, 스킬 실행, 멀티에이전트 활동 모니터링을 지원하는 웹 앱 추가 (72ba106, @hiondal)
  - React (Vite) 프론트엔드 + Express 백엔드 monorepo 구조
  - 한국어/영어 다국어 지원 (i18n)
  - 활동 패널: 진행상황, 에이전트, 도구 사용량 실시간 표시
  - 파일 브라우저 다이얼로그, 질문 폼, 승인 게이트 UI
  - Claude Code SDK 연동으로 스킬 스트리밍 실행

### 문서

- **README.en.md**: 영문 전용 README 파일 신규 생성 (72ba106, @hiondal)

---

## Changed

- **README 언어 분리**: README.md(한국어)와 README.en.md(영문) 파일 분리 (72ba106, @hiondal)
- **빠른 시작 재배치**: 핵심 가치 바로 뒤로 이동하여 신규 사용자 접근성 향상 (72ba106, @hiondal)
- **워크플로우 자동화 강조**: requirement-writer → develop-plugin → publish End-to-End 흐름 명시 (d7ea7f9, @hiondal)
- **플러그인 명세서 자동 생성**: 플러그인 명세서 추가 프로세스를 AI 자동 생성 방식으로 변경 (fe011ef, @hiondal)
- **생태계 문서 링크**: DMAP 생태계 섹션에 상세 문서 FQDN 링크 연결 (4f66ed7, @hiondal)

---

## Removed

- **docs/paper 디렉토리**: 논문 관련 파일 정리 (72ba106, @hiondal)
- **ext-abra 스킬**: 외부호출 스킬 제거 (72ba106, @hiondal)

---

## Fixed

- **활동 패널 진행상황 완료 표시**: 스킬 실행 완료 시 모든 단계가 체크 표시되도록 수정 (72ba106, @hiondal)

---

## Contributors

We'd like to thank the following people for their contributions to this release:

- @hiondal - DMAP Web 앱 개발, README 다국어 분리, 문서 구조 개선
