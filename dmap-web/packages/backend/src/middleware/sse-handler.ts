/**
 * SSE(Server-Sent Events) 미들웨어 - 스킬 실행 결과를 실시간 스트리밍
 *
 * SSE 프로토콜: text/event-stream 형식으로 타입별 이벤트 전송
 * 이벤트 형식: "event: {type}\ndata: {json}\n\n"
 *
 * 사용 흐름: initSSE(res) → sendSSE(res, event)* → endSSE(res)
 * endSSE는 'done' 이벤트를 마지막으로 전송 후 스트림 종료
 *
 * @module middleware/sse-handler
 */
import { Response } from 'express';
import type { SSEEvent } from '@dmap-web/shared';

/** SSE 헤더 설정 및 연결 초기화 - X-Accel-Buffering: no로 Nginx 버퍼링 비활성화 */
export function initSSE(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');
}

/** 타입별 SSE 이벤트 전송 - 스트림 종료 후 호출 시 무시(writableEnded 체크) */
export function sendSSE(res: Response, event: SSEEvent): void {
  if (res.writableEnded) return;
  res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

/** SSE 스트림 종료 - 'done' 이벤트 전송 후 응답 종료 */
export function endSSE(res: Response): void {
  if (res.writableEnded) return;
  sendSSE(res, { type: 'done' });
  res.end();
}
