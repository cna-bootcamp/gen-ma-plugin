# gmail-notification


- [gmail-notification](#gmail-notification)
  - [기본 정보](#기본-정보)
  - [설치 정보](#설치-정보)
  - [사용 예시](#사용-예시)

---

## 기본 정보

| 항목 | 값 |
|------|---|
| 도구명 | gmail-notification |
| 카테고리 | 커스텀 앱 |
| 설명 | Google Apps Script 기반 Gmail 알림 발송 (Dify HTTP Request 노드 연동) |
| 소스 경로 | `resources/tools/customs/general/gmail-notification.gs` |

[Top](#gmail-notification)

---

## 설치 정보

| 항목 | 값 |
|------|---|
| 설치 방법 | Google Apps Script에 배포 |
| 필수 여부 | 선택 |
| 의존성 | Google 계정, Gmail 권한 |

**배포 절차:**

1. https://script.google.com 접속
2. 새 프로젝트 생성 후 `gmail-notification.gs` 코드 붙여넣기
3. [배포] > [새 배포] > 유형: **웹 앱**
   - 실행 계정: "본인"
   - 액세스 권한: "모든 사용자"
4. 배포 후 생성된 URL을 Dify 환경변수(`GMAIL_APPS_SCRIPT_URL`)에 설정

**검증 방법:**

브라우저에서 배포 URL 접속 시 아래 응답 확인:

```json
{"status": "ok", "message": "Dify Gmail Notification Service is running"}
```

[Top](#gmail-notification)

---

## 사용 예시

Dify HTTP Request 노드에서 POST 요청:

**요청 형식 (JSON):**

```json
{
  "to": "recipient@example.com",
  "subject": "메일 제목",
  "body": "<h1>HTML 본문</h1><p>내용</p>"
}
```

**응답 형식:**

| 상태 | 응답 |
|------|------|
| 성공 | `{"status": "success", "message": "Email sent to recipient@example.com"}` |
| 실패 | `{"status": "error", "message": "에러 내용"}` |

> `body` 필드는 HTML 형식 지원. `to` 필드 필수.

[Top](#gmail-notification)
