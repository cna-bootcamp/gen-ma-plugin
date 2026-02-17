/**
 * 세션 라우트 - 스킬 실행 세션의 CRUD 및 사용자 응답 주입
 *
 * 엔드포인트:
 * - GET /api/sessions: 전체 세션 목록 (pluginId 필터 지원)
 * - GET /api/sessions/:id: 세션 상세 조회
 * - POST /api/sessions/:id/respond: 대기 중인 세션에 사용자 응답 주입
 * - DELETE /api/sessions/:id: 세션 삭제
 *
 * @module routes/sessions
 */
import { Router } from 'express';
import { sessionManager } from '../services/session-manager.js';
import type { SessionRespondRequest } from '@dmap-web/shared';

export const sessionsRouter = Router();

// GET /api/sessions - List all sessions
sessionsRouter.get('/', (req, res) => {
  const pluginId = req.query.pluginId as string | undefined;
  let sessions = sessionManager.listAll();
  if (pluginId) {
    sessions = sessions.filter(s => s.pluginId === pluginId || !s.pluginId);
  }
  res.json({ sessions });
});

// GET /api/sessions/:id - Get session detail
sessionsRouter.get('/:id', (req, res) => {
  const session = sessionManager.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  // Strip internal pendingResponse before sending
  const { pendingResponse: _pending, ...publicSession } = session;
  res.json(publicSession);
});

// POST /api/sessions/:id/respond - Send user response to waiting session
// 사용자 응답을 대기 중인 세션에 주입 → SessionManager의 pendingResponse Promise를 resolve
sessionsRouter.post('/:id/respond', (req, res) => {
  const { id } = req.params;
  const { response } = req.body as SessionRespondRequest;

  if (!response) {
    res.status(400).json({ error: 'Response is required' });
    return;
  }

  const resolved = sessionManager.resolveUserResponse(id, response);

  if (!resolved) {
    res.status(404).json({ error: 'No pending response for this session' });
    return;
  }

  res.json({ success: true });
});

// DELETE /api/sessions/:id - Delete a session
sessionsRouter.delete('/:id', async (req, res) => {
  const deleted = await sessionManager.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({ success: true });
});
