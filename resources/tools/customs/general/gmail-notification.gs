/**
 * Dify Workflow Gmail 알림 발송 - Google Apps Script
 * ===================================================
 * Dify HTTP Request 노드에서 POST 요청을 받아 Gmail로 이메일 발송
 *
 * 설정 방법:
 * 1. https://script.google.com 접속
 * 2. 새 프로젝트 생성 후 이 코드 붙여넣기
 * 3. [배포] > [새 배포] > 유형: 웹 앱
 *    - 실행 계정: "본인"
 *    - 액세스 권한: "모든 사용자"
 * 4. 배포 후 생성된 URL을 Dify 환경변수(GMAIL_APPS_SCRIPT_URL)에 설정
 *
 * 요청 형식 (JSON):
 * {
 *   "to": "recipient@example.com",
 *   "subject": "메일 제목",
 *   "body": "HTML 본문 내용"
 * }
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var to = data.to || "";
    var subject = data.subject || "[Dify] 알림";
    var body = data.body || "";

    if (!to) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: "to field is required" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    GmailApp.sendEmail(to, subject, "", { htmlBody: body });

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Email sent to " + to }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Dify Gmail Notification Service is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}
