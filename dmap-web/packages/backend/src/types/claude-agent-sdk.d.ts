declare module '@anthropic-ai/claude-code' {
  export interface QueryOptions {
    model?: string;
    permissionMode?: string;
    cwd?: string;
    maxTurns?: number;
    resume?: string;
    abortController?: AbortController;
    allowedTools?: string[];
    [key: string]: unknown;
  }

  export interface SDKMessage {
    type: string;
    [key: string]: unknown;
  }

  export function query(params: {
    prompt: string;
    options?: QueryOptions;
  }): AsyncIterable<SDKMessage>;
}
