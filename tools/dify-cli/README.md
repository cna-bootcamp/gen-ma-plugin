# Dify CLI 사용 가이드

Dify API를 직접 호출하여 빠른 DSL export/import를 제공하는 Python CLI 도구

## 설치

```bash
cd {작업디렉토리}/gen-ma-plugin/tools/dify-cli
pip install -r requirements.txt
```

## 설정

`.env` 파일에서 Dify 연결 정보 설정:

```env
DIFY_BASE_URL=http://localhost
DIFY_EMAIL=your_email@example.com
DIFY_PASSWORD=your_password

# 또는 Admin API Key 사용 (선택사항)
# DIFY_ADMIN_API_KEY=your_admin_api_key
# DIFY_WORKSPACE_ID=your_workspace_id
```

## 명령어

### 1. 앱 목록 조회

```bash
python dify_cli.py list [--mode MODE]
```

**옵션:**
- `--mode`: 앱 유형 필터 (기본값: `all`)
  - 선택 가능: `all`, `workflow`, `advanced-chat`, `chat`, `agent-chat`, `completion`

**예시:**
```bash
# 모든 앱 조회
python dify_cli.py list

# 워크플로우 앱만 조회
python dify_cli.py list --mode workflow
```

**출력 예시:**
```
ID                                   | Name                    | Mode
-------------------------------------+-------------------------+---------
39dfd1d1-c36a-45a5-bf98-63afd2c521d2 | Sentiment Analysis      | workflow
b3e9369a-707f-490e-a8df-37917c46d4d2 | CSR Distribution System | workflow

총 2개
```

### 2. DSL 내보내기

```bash
python dify_cli.py export <app_id> [-o FILE]
```

**인자:**
- `app_id`: 내보낼 앱의 ID

**옵션:**
- `-o`, `--output`: 출력 파일 경로 (지정하지 않으면 stdout으로 출력)

**예시:**
```bash
# 파일로 저장
python dify_cli.py export 39dfd1d1-c36a-45a5-bf98-63afd2c521d2 -o sentiment.yaml

# stdout으로 출력 (파이프라인 활용)
python dify_cli.py export 39dfd1d1-c36a-45a5-bf98-63afd2c521d2 > sentiment.yaml
```

**출력 예시:**
```
내보내기 완료: sentiment.yaml (0.3초)
```

### 3. DSL 가져오기 (신규 앱 생성)

```bash
python dify_cli.py import <file> [--name NAME]
```

**인자:**
- `file`: YAML DSL 파일 경로

**옵션:**
- `--name`: 앱 이름 (DSL 파일 내의 이름을 덮어씀)

**예시:**
```bash
# DSL 파일로 신규 앱 생성
python dify_cli.py import sentiment.yaml

# 이름을 변경하여 생성
python dify_cli.py import sentiment.yaml --name "Sentiment Analysis v2"
```

**출력 예시:**
```
앱 생성 완료: a1b2c3d4-5678-90ab-cdef-1234567890ab
완료 (1.2초)
```

**버전 충돌 처리:**
- DSL 버전이 다를 경우 자동으로 확인(confirm) 처리

### 4. 기존 앱 덮어쓰기

```bash
python dify_cli.py update <app_id> <file>
```

**인자:**
- `app_id`: 덮어쓸 앱의 ID
- `file`: YAML DSL 파일 경로

**예시:**
```bash
python dify_cli.py update 39dfd1d1-c36a-45a5-bf98-63afd2c521d2 sentiment_updated.yaml
```

**출력 예시:**
```
앱 업데이트 완료: 39dfd1d1-c36a-45a5-bf98-63afd2c521d2
완료 (0.8초)
```

### 5. 워크플로우 배포

```bash
python dify_cli.py publish <app_id> [--name NAME] [--comment COMMENT]
```

**인자:**
- `app_id`: 배포할 앱의 ID

**옵션:**
- `--name`: 버전 이름
- `--comment`: 버전 코멘트

**예시:**
```bash
# 기본 배포
python dify_cli.py publish 39dfd1d1-c36a-45a5-bf98-63afd2c521d2

# 버전 정보와 함께 배포
python dify_cli.py publish 39dfd1d1-c36a-45a5-bf98-63afd2c521d2 \
  --name "v1.0.0" \
  --comment "Initial production release"
```

**출력 예시:**
```
배포 완료: 버전 v1.0.0
완료 (0.5초)
```

## 실전 워크플로우

### 시나리오 1: 앱 백업

```bash
# 1. 앱 목록 확인
python dify_cli.py list --mode workflow

# 2. 특정 앱 백업
python dify_cli.py export 39dfd1d1-c36a-45a5-bf98-63afd2c521d2 -o backup_sentiment.yaml
```

### 시나리오 2: 앱 복제

```bash
# 1. 원본 앱 내보내기
python dify_cli.py export 39dfd1d1-c36a-45a5-bf98-63afd2c521d2 -o template.yaml

# 2. 새 이름으로 가져오기
python dify_cli.py import template.yaml --name "Sentiment Analysis (Dev)"
```

### 시나리오 3: 개발 → 프로덕션 배포

```bash
# 1. 개발 환경에서 DSL 내보내기
python dify_cli.py export dev-app-id -o prod_workflow.yaml

# 2. 프로덕션 환경 .env 변경
# DIFY_BASE_URL=https://production.example.com

# 3. 프로덕션에 배포
python dify_cli.py import prod_workflow.yaml --name "Production Workflow"

# 4. 워크플로우 배포
python dify_cli.py publish prod-app-id --name "v1.0.0" --comment "Production release"
```

### 시나리오 4: DSL 수정 후 업데이트

```bash
# 1. 현재 DSL 내보내기
python dify_cli.py export 39dfd1d1-c36a-45a5-bf98-63afd2c521d2 -o current.yaml

# 2. 텍스트 에디터로 current.yaml 수정

# 3. 수정된 DSL로 앱 업데이트
python dify_cli.py update 39dfd1d1-c36a-45a5-bf98-63afd2c521d2 current.yaml

# 4. 배포
python dify_cli.py publish 39dfd1d1-c36a-45a5-bf98-63afd2c521d2
```

## MCP Server와 비교

| 기능 | dify_cli.py | MCP Server |
|------|-------------|------------|
| 설치 | Python만 필요 | Claude Code MCP 설정 필요 |
| 속도 | 매우 빠름 (직접 API) | MCP 오버헤드 있음 |
| 사용처 | 스크립트, CI/CD, 자동화 | Claude Code 대화형 작업 |
| 배치 처리 | 쉬움 (표준 CLI) | 어려움 (대화형만) |

**권장 사용법:**
- **자동화/스크립트**: `dify_cli.py` 사용
- **Claude와 대화하며 작업**: MCP Server 사용

## 오류 처리

### 인증 오류
```
API 오류: [401] Login failed
```
→ `.env` 파일의 이메일/비밀번호 확인

### 파일 없음
```
오류: 파일을 찾을 수 없습니다 - workflow.yaml
```
→ 파일 경로 확인

### 버전 충돌
```
버전 충돌 감지, 자동 확인 중...
```
→ 자동으로 처리됨 (수동 작업 불필요)

## 고급 사용법

### Bash 스크립트 예시

```bash
#!/bin/bash
# 모든 워크플로우 앱 백업

OUTPUT_DIR="backups/$(date +%Y%m%d)"
mkdir -p "$OUTPUT_DIR"

python dify_cli.py list --mode workflow | tail -n +3 | while IFS='|' read -r id name mode; do
  id=$(echo "$id" | xargs)
  name=$(echo "$name" | xargs | tr ' ' '_')

  if [ -n "$id" ]; then
    echo "Backing up: $name"
    python dify_cli.py export "$id" -o "$OUTPUT_DIR/${name}.yaml"
  fi
done

echo "Backup complete: $OUTPUT_DIR"
```

### PowerShell 스크립트 예시

```powershell
# 모든 워크플로우 앱 백업
$outputDir = "backups\$(Get-Date -Format yyyyMMdd)"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

python dify_cli.py list --mode workflow | Select-Object -Skip 2 | ForEach-Object {
  if ($_ -match '([a-f0-9-]{36})\s*\|\s*([^\|]+)\s*\|') {
    $id = $matches[1].Trim()
    $name = $matches[2].Trim() -replace '\s+', '_'

    Write-Host "Backing up: $name"
    python dify_cli.py export $id -o "$outputDir\${name}.yaml"
  }
}

Write-Host "Backup complete: $outputDir"
```

## 라이선스

Dify MCP Server 프로젝트와 동일한 라이선스 적용
