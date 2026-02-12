import { Response } from 'express';
import type { SSEEvent } from '@dmap-web/shared';

export function initSSE(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');
}

export function sendSSE(res: Response, event: SSEEvent): void {
  if (res.writableEnded) return;
  res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

export function endSSE(res: Response): void {
  if (res.writableEnded) return;
  sendSSE(res, { type: 'done' });
  res.end();
}
