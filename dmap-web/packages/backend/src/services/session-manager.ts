/**
 * 세션 관리자 - 스킬 실행 세션의 생성/조회/재개/삭제를 관리
 *
 * 이중 영속화 전략:
 * - 인메모리(Map): 빠른 접근 + pendingResponse Promise 관리
 * - 디스크(.dmap/sessions/{id}.json): 서버 재시작 후 세션 이력 복구
 *
 * 핵심 메커니즘:
 * - waitForUserResponse/resolveUserResponse: Promise 기반 사용자 응답 대기 패턴
 * - sdkSessionId: Claude SDK 세션 ID를 별도 추적하여 SDK resume 옵션 지원
 * - sweepExpired: 1시간 비활성 세션 메모리 해제 (디스크는 보존)
 *
 * @module session-manager
 */
import { v4 as uuidv4 } from 'uuid';
import type { Session, SessionUsage } from '@dmap-web/shared';
import fs from 'fs/promises';
import path from 'path';
import { DMAP_PROJECT_DIR } from '../config.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('SessionManager');

/**
 * 내부 세션 타입 - 공개 Session 타입 + pendingResponse Promise
 * pendingResponse는 런타임 전용이므로 디스크 저장 시 제외됨
 */
interface InternalSession extends Session {
  pendingResponse?: {
    resolve: (value: string) => void;
    reject: (reason: Error) => void;
  };
}

/**
 * 세션 생명주기 관리 클래스 (싱글턴)
 *
 * 상태 전이: active → waiting → active (응답 후) 또는 aborted
 * 메모리 정책: 인메모리 1시간 만료 sweep, 디스크는 영구 보존
 */
class SessionManager {
  private sessions = new Map<string, InternalSession>();
  private readonly TIMEOUT = 60 * 60 * 1000; // 1 hour for in-memory cleanup
  private readonly SWEEP_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private readonly sessionsDir: string;

  constructor() {
    this.sessionsDir = path.join(DMAP_PROJECT_DIR, '.dmap', 'sessions');
    // init async in background
    this.init();
  }

  /** 비동기 초기화: 세션 디렉토리 생성 + 디스크에서 기존 세션 복구 + sweep 타이머 시작 */
  private async init(): Promise<void> {
    await fs.mkdir(this.sessionsDir, { recursive: true });
    await this.loadFromDisk();
    // Single sweep interval for all sessions
    setInterval(() => this.sweepExpired(), this.SWEEP_INTERVAL);
  }

  /** 만료 세션 메모리 해제 (1시간 비활성 기준) - 디스크 파일은 이력 보존을 위해 삭제하지 않음 */
  private sweepExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      const inactive = now - new Date(session.lastActivity).getTime();
      if (inactive > this.TIMEOUT) {
        if (session.pendingResponse) {
          session.pendingResponse.reject(new Error('Session timed out'));
        }
        this.sessions.delete(id);
        // Don't delete from disk - keep for history
      }
    }
  }

  /** 서버 시작 시 디스크의 세션 JSON 파일들을 메모리로 복구 - pendingResponse는 런타임 전용이므로 제외 */
  private async loadFromDisk(): Promise<void> {
    try {
      const files = (await fs.readdir(this.sessionsDir)).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const data = JSON.parse(await fs.readFile(path.join(this.sessionsDir, file), 'utf-8'));
          // Don't restore runtime-only fields
          delete data.pendingResponse;
          this.sessions.set(data.id, data);
        } catch {
          // Skip corrupted files
        }
      }
      log.info(`Loaded ${files.length} sessions from disk`);
    } catch {
      // Directory might not exist yet
    }
  }

  /** 세션 상태를 디스크에 영속화 - pendingResponse(Promise)는 직렬화 불가하므로 제외 */
  private async saveToDisk(session: InternalSession): Promise<void> {
    try {
      const { pendingResponse: _, ...data } = session;
      await fs.writeFile(
        path.join(this.sessionsDir, `${session.id}.json`),
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    } catch (err) {
      log.error(`Failed to save session ${session.id}:`, err);
    }
  }

  /** 새 세션 생성 - UUID 발급, 메모리 + 디스크 동시 저장 */
  create(skillName: string): InternalSession {
    const now = new Date().toISOString();
    const session: InternalSession = {
      id: uuidv4(),
      skillName,
      status: 'active',
      createdAt: now,
      lastActivity: now,
    };
    this.sessions.set(session.id, session);
    this.saveToDisk(session);
    return session;
  }

  /** 세션 조회 - 접근 시 lastActivity 자동 갱신 (sweep 방지) */
  get(id: string): InternalSession | undefined {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActivity = new Date().toISOString();
    }
    return session;
  }

  /** Claude SDK 세션 ID 연결 - SDK resume 옵션에 필요 */
  updateSdkSessionId(id: string, sdkSessionId: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.sdkSessionId = sdkSessionId;
      this.saveToDisk(session);
    }
  }

  /** 세션 메타데이터 부분 업데이트 (preview, pluginId, usage 등) */
  updateMeta(id: string, meta: { preview?: string; pluginId?: string; skillIcon?: string; usage?: SessionUsage; previousSkillName?: string }): void {
    const session = this.sessions.get(id);
    if (!session) return;
    if (meta.preview !== undefined) session.preview = meta.preview;
    if (meta.pluginId !== undefined) session.pluginId = meta.pluginId;
    if (meta.skillIcon !== undefined) session.skillIcon = meta.skillIcon;
    if (meta.previousSkillName !== undefined) session.previousSkillName = meta.previousSkillName;
    if (meta.usage !== undefined) session.usage = meta.usage;
    session.lastActivity = new Date().toISOString();
    this.saveToDisk(session);
  }

  /** 세션 상태 전이 (active/waiting/completed/aborted) */
  setStatus(id: string, status: Session['status']): void {
    const session = this.sessions.get(id);
    if (session) {
      session.status = status;
      session.lastActivity = new Date().toISOString();
      this.saveToDisk(session);
    }
  }

  /**
   * 사용자 응답 대기 (Promise 기반 블로킹)
   *
   * 호출 시 세션 상태를 'waiting'으로 전환하고, Promise를 생성하여 pendingResponse에 저장.
   * resolveUserResponse() 호출 시까지 대기. 세션 만료/삭제 시 reject.
   *
   * @returns 사용자가 제출한 응답 문자열
   */
  waitForUserResponse(id: string): Promise<string> {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Session ${id} not found`);

    session.status = 'waiting';
    return new Promise<string>((resolve, reject) => {
      session.pendingResponse = { resolve, reject };
    });
  }

  /** 대기 중인 사용자 응답 Promise를 resolve - 세션 상태를 'active'로 복원 */
  resolveUserResponse(id: string, response: string): boolean {
    const session = this.sessions.get(id);
    if (!session?.pendingResponse) return false;

    session.status = 'active';
    session.pendingResponse.resolve(response);
    session.pendingResponse = undefined;
    return true;
  }

  /** 세션 강제 중단 - pendingResponse가 있으면 reject 후 정리 */
  abortSession(id: string): void {
    const session = this.sessions.get(id);
    if (!session) return;

    if (session.pendingResponse) {
      session.pendingResponse.reject(new Error('Session aborted'));
      session.pendingResponse = undefined;
    }

    session.status = 'aborted';
    session.lastActivity = new Date().toISOString();
    log.info(`Session ${id} aborted`);
  }

  /** 세션 완전 삭제 - 메모리 + 디스크 모두 제거, pendingResponse가 있으면 reject */
  async delete(id: string): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session) return false;
    if (session.pendingResponse) {
      session.pendingResponse.reject(new Error('Session deleted'));
    }
    this.sessions.delete(id);
    // Remove from disk
    try {
      const filePath = path.join(this.sessionsDir, `${id}.json`);
      await fs.unlink(filePath);
    } catch { /* ignore */ }
    return true;
  }

  /** 전체 세션 목록 반환 - lastActivity 기준 내림차순 정렬, pendingResponse 제외 */
  listAll(): Session[] {
    return Array.from(this.sessions.values())
      .map(({ pendingResponse: _pending, ...s }) => s)
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }

}

export const sessionManager = new SessionManager();
export type { InternalSession };
