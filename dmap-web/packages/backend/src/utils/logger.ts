type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const currentLevel: number = LEVELS[(process.env.LOG_LEVEL as LogLevel) ?? 'info'] ?? LEVELS.info;

function format(level: string, tag: string, msg: string): string {
  return `[${level.toUpperCase()}][${tag}] ${msg}`;
}

export function createLogger(tag: string) {
  return {
    debug(msg: string, ...args: unknown[]) {
      if (currentLevel <= LEVELS.debug) console.debug(format('debug', tag, msg), ...args);
    },
    info(msg: string, ...args: unknown[]) {
      if (currentLevel <= LEVELS.info) console.log(format('info', tag, msg), ...args);
    },
    warn(msg: string, ...args: unknown[]) {
      if (currentLevel <= LEVELS.warn) console.warn(format('warn', tag, msg), ...args);
    },
    error(msg: string, ...args: unknown[]) {
      console.error(format('error', tag, msg), ...args);
    },
  };
}
