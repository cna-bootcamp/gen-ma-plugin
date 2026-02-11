# 요구사항 정의서

- [요구사항 정의서](#요구사항-정의서)
  - [기본 정보](#기본-정보)
  - [핵심기능](#핵심기능)
  - [사용자 플로우](#사용자-플로우)
    - [플로우 1. Release 문서 구성 추천](#플로우-1-release-문서-구성-추천)
    - [플로우 2. Release 문서 생성](#플로우-2-release-문서-생성)
    - [플로우 3. Release 문서 수정](#플로우-3-release-문서-수정)
    - [플로우 4. Release 문서 삭제](#플로우-4-release-문서-삭제)
  - [에이전트 구성 힌트](#에이전트-구성-힌트)
  - [참고 공유 자원](#참고-공유-자원)

---

## 기본 정보

- 플러그인명: github-release-manager
- 목적: GitHub의 Release 관리 (생성/수정/삭제/구성 추천)
- 대상 도메인: 개발 자동화
- 대상 사용자: 개발자

[Top](#요구사항-정의서)

---

## 핵심기능

- Release 문서 구성 추천: 외부 사례를 검색하여 최적의 Release 문서 구성안을 작성하고
  사용자 승인 후 템플릿으로 등록
- Release 문서 생성: 템플릿 기반으로 마지막 Release 이후 변경사항을 취합하여
  새로운 Release 문서 생성
- Release 문서 수정: 특정 버전의 Release 문서 내용 수정
- Release 문서 삭제: 특정 버전의 Release 문서 삭제

[Top](#요구사항-정의서)

---

## 사용자 플로우

### 플로우 1. Release 문서 구성 추천

- Step 1. 추천 요청: 사용자가 Release 문서 구성 추천을 요청
- Step 2. 외부 사례 검색: 외부 Release 문서 사례를 검색하여 최적의 구성안 작성
  (output/ 디렉토리에 생성)
- Step 3. 검토 요청: 사용자에게 구성안 검토 및 승인 요청
- Step 4. 템플릿 등록: 승인된 구성안을 templates/ 디렉토리에 Release 템플릿으로 등록

### 플로우 2. Release 문서 생성

- Step 1. 생성 요청: 사용자가 Release 문서 생성을 요청
- Step 2. 템플릿 확인: templates/ 디렉토리에 템플릿 존재 여부 조사,
  없으면 Release 문서 구성 추천 스킬 호출
- Step 3. 버전 문의: 사용자에게 Release 버전 문의
- Step 4. 변경사항 취합: 마지막 Release 시간 확인 후 그 이후 변경사항 취합
- Step 5. 문서 생성: templates/ 디렉토리의 템플릿을 참고하여 Release 문서 생성

### 플로우 3. Release 문서 수정

- Step 1. 수정 요청: 사용자가 Release 문서 수정을 요청
- Step 2. 정보 수집: 수정할 Release 버전과 수정 사항 문의
- Step 3. 문서 수정: Release 문서 수정 실행

### 플로우 4. Release 문서 삭제

- Step 1. 삭제 요청: 사용자가 Release 문서 삭제를 요청
- Step 2. 버전 확인: 삭제할 Release 버전 문의
- Step 3. 문서 삭제: Release 문서 삭제 실행

[Top](#요구사항-정의서)

---

## 에이전트 구성 힌트

- researcher (MEDIUM): 외부 Release 문서 사례 검색 및 분석 전문가
  - 근거: 플로우1 "외부 사례를 검색하여 최적의 Release 문서 구성안 작성"에서
    외부 문서/자료 조사가 필요 → researcher 유형 적합
  - 담당 플로우: 플로우 1 (Step 2)
- executor (MEDIUM): Release 문서 CRUD 실행 전문가 (gh CLI 연동)
  - 근거: 플로우2~4에서 gh CLI를 통한 Release 생성/수정/삭제 작업 수행 → executor 유형 적합
  - 담당 플로우: 플로우 2 (Step 5), 플로우 3 (Step 3), 플로우 4 (Step 3)
- explorer (LOW): Git 히스토리 탐색, 변경사항 취합, 템플릿 탐색 전문가
  - 근거: 플로우2 "마지막 Release 시간 확인 후 변경사항 취합",
    "templates 디렉토리 존재 조사" → explorer 유형 적합
  - 담당 플로우: 플로우 2 (Step 2, Step 4)

[Top](#요구사항-정의서)

---

## 참고 공유 자원

- 참고 가이드: 해당 자원 없음 — 플러그인 개발 시 직접 작성 필요
- 참고 샘플: 해당 자원 없음 — 플러그인 개발 시 직접 작성 필요
- 참고 템플릿: 해당 자원 없음 — 플러그인 개발 시 직접 작성 필요
- 참고 도구: context7 (gh CLI 및 GitHub Release API 공식 문서 검색용)

[Top](#요구사항-정의서)
