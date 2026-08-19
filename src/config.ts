const env = (import.meta as any).env ?? {};

export const appConfig = Object.freeze({
  name: env.VITE_APP_NAME || "Nexora Editor",
  apiBaseUrl: String(env.VITE_API_BASE_URL || "").replace(/\/$/, ""),
  apiPrefix: env.VITE_API_PREFIX || "/api",
  aiAssistantPath: env.VITE_AI_ASSISTANT_PATH || "/api/ai/assistant",
  aiAgentPath: env.VITE_AI_AGENT_PATH || "/api/ai/agent",
  deployValidationPath: env.VITE_DEPLOY_VALIDATION_PATH || "/api/deploy/validate",
  requestTimeoutMs: Number(env.VITE_REQUEST_TIMEOUT_MS || 120000),
  clipboardResetMs: Number(env.VITE_CLIPBOARD_RESET_MS || 2000),
});

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appConfig.apiBaseUrl}${normalizedPath}`;
}
