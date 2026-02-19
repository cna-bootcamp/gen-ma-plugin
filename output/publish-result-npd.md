# NPD 플러그인 publish 결과

## 배포 정보

- **플러그인명:** npd
- **버전:** 0.0.1
- **저장소:** https://github.com/unicorn-plugins/npd
- **Organization:** unicorn-plugins
- **배포 상태:** 완료

## 배포 과정

### Step 1: 인증 정보 수집
- GitHub 계정 확인 (hiondal)
- Organization: unicorn-plugins
- PAT 저장: `.dmap/secrets/git-token-npd.env`
- `.gitignore` 확인 완료 (`.dmap/secrets/` 패턴 이미 포함)

### Step 2: 원격 저장소 생성 및 Push
- create_repo.py로 unicorn-plugins/npd 저장소 생성 완료
- 보안 이슈 발견 및 해결:
  - `resources/guides/deploy/deploy-actions-cicd-back.md` — 예시 Azure 시크릿 값 → 플레이스홀더 교체
  - `resources/guides/deploy/deploy-actions-cicd-front.md` — 예시 Azure 시크릿 값 → 플레이스홀더 교체
  - git history 재작성 (update-ref로 초기 커밋 클린 재생성)
- Force Push 성공 (커밋: f6b489f, 79 files, 6663 insertions)

### Step 2.5: 원격 URL 보안 검증
- 원격 URL 토큰 노출 없음: `https://github.com/unicorn-plugins/npd.git`

### Step 3: 완료
- 커밋: f6b489f — NPD DMAP 플러그인 초기 배포

## 설치 방법

```bash
# 1. GitHub 저장소를 마켓플레이스로 등록
claude plugin marketplace add unicorn-plugins/npd

# 2. 플러그인 설치
claude plugin install npd@npd

# 3. 설치 확인
claude plugin list

# 4. 초기 설정
/npd:setup
```

## 저장소 URL

https://github.com/unicorn-plugins/npd

## 보안 안내

배포에 사용한 GitHub PAT를 폐기 권장:
1. GitHub → Settings → Developer settings → Personal access tokens
2. 해당 토큰 삭제
3. 새 토큰 생성 후 `.dmap/secrets/git-token-npd.env`에 저장
