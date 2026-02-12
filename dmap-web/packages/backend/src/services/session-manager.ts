import { v4 as uuidv4 } from 'uuid';
import type { Session } from '@dmap-web/shared';

interface InternalSession extends Session {
  pendingResponse?: {
    resolve: (value: string) => void;
    reject: (reason: Error) => void;
  };
}

class SessionManager {
  private sessions = new Map<string, InternalSession>();
  private readonly TIMEOUT = 60 * 60 * 1000; // 1 hour

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
    this.scheduleCleanup(session.id);
    return session;
  }

  get(id: string): InternalSession | undefined {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActivity = new Date().toISOString();
    }
    return session;
  }

  updateSdkSessionId(id: string, sdkSessionId: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.sdkSessionId = sdkSessionId;
    }
  }

  setStatus(id: string, status: Session['status']): void {
    const session = this.sessions.get(id);
    if (session) {
      session.status = status;
      session.lastActivity = new Date().toISOString();
    }
  }

  waitForUserResponse(id: string): Promise<string> {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Session ${id} not found`);

    session.status = 'waiting';
    return new Promise<string>((resolve, reject) => {
      session.pendingResponse = { resolve, reject };
    });
  }

  resolveUserResponse(id: string, response: string): boolean {
    const session = this.sessions.get(id);
    if (!session?.pendingResponse) return false;

    session.status = 'active';
    session.pendingResponse.resolve(response);
    session.pendingResponse = undefined;
    return true;
  }

  listAll(): Session[] {
    return Array.from(this.sessions.values()).map(
      ({ pendingResponse: _pending, ...s }) => s
    );
  }

  private scheduleCleanup(id: string): void {
    setTimeout(() => {
      const session = this.sessions.get(id);
      if (session) {
        const inactive =
          Date.now() - new Date(session.lastActivity).getTime();
        if (inactive > this.TIMEOUT) {
          if (session.pendingResponse) {
            session.pendingResponse.reject(new Error('Session timed out'));
          }
          this.sessions.delete(id);
        } else {
          this.scheduleCleanup(id);
        }
      }
    }, this.TIMEOUT);
  }
}

export const sessionManager = new SessionManager();
export type { InternalSession };
