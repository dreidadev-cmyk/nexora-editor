import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const envString = (name: string, fallback: string) => process.env[name]?.trim() || fallback;
const envNumber = (name: string, fallback: number, min?: number, max?: number) => {
  const value = process.env[name]?.trim() ? Number(process.env[name]) : fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min ?? -Infinity, Math.min(max ?? Infinity, value));
};

const PORT = envNumber("NEXORA_PORT", 3000, 1, 65535);
const HOST = envString("NEXORA_HOST", "0.0.0.0");
const BODY_LIMIT = envString("NEXORA_BODY_LIMIT", "50mb");
const AI_MODEL = envString("NEXORA_AI_MODEL", "gemini-3.7-flash");
const AI_ASSISTANT_TEMPERATURE = envNumber("NEXORA_AI_TEMPERATURE_ASSISTANT", 0.4, 0, 2);
const AI_AGENT_TEMPERATURE = envNumber("NEXORA_AI_TEMPERATURE_AGENT", 0.2, 0, 2);
const AI_USER_AGENT = envString("NEXORA_AI_USER_AGENT", "Nexora-Editor");
const APP_NAME = envString("VITE_APP_NAME", "Nexora Editor");
const MAX_FILE_CONTENT_CHARS = envNumber("NEXORA_AI_MAX_FILE_CHARS", 3000, 256, 50000);
const MAX_PROJECT_FILES = envNumber("NEXORA_AI_MAX_PROJECT_FILES", 100, 1, 1000);
const MAX_AI_REQUEST_CHARS = envNumber("NEXORA_AI_MAX_REQUEST_CHARS", 500000, 10000, 2000000);
const AI_REQUESTS_PER_MINUTE = envNumber("NEXORA_AI_REQUESTS_PER_MINUTE", 20, 1, 120);

app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (bucket.count >= AI_REQUESTS_PER_MINUTE) {
    return res.status(429).json({ error: "AI request rate limit exceeded. Please wait and try again." });
  }
  bucket.count += 1;
  return next();
};

const getUserApiKey = (req: express.Request) => {
  const key = String(req.header("x-nexora-ai-key") || "").trim();
  return key || null;
};
const getGenAI = (apiKey: string) => new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": AI_USER_AGENT } } });
const safeErrorMessage = (error: unknown, fallback: string) => process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : fallback;
const getProjectFiles = (context: any) => (Array.isArray(context?.files) ? context.files : Array.isArray(context?.allFiles) ? context.allFiles : []).slice(0, MAX_PROJECT_FILES);
const buildFilesSummary = (files: any[], fullContent = false) => files.map((f: any) => `File: ${f.path || f.name || "unnamed"}\n\`\`\`\n${String(f.content || "").slice(0, fullContent ? MAX_FILE_CONTENT_CHARS : Math.min(MAX_FILE_CONTENT_CHARS, 3000))}\n\`\`\``).join("\n\n");
const assertPromptSize = (prompt: string) => { if (prompt.length > MAX_AI_REQUEST_CHARS) throw Object.assign(new Error("AI request is too large."), { code: "REQUEST_TOO_LARGE" }); };

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: APP_NAME, timestamp: new Date().toISOString(), aiConfigured: true, aiMode: "user-provided-key" }));

app.post("/api/ai/assistant", rateLimit, async (req, res) => {
  try {
    const apiKey = getUserApiKey(req);
    if (!apiKey) return res.status(401).json({ error: "AI API key required. Add your provider API key in Nexora AI Settings." });
    const message = String(req.body.message || req.body.prompt || "");
    const context = req.body.projectContext || req.body.project || req.body.context || {};
    const activeFile = req.body.activeFile || (req.body.context ? { name: req.body.context.activeFileName } : undefined);
    const selectedCode = String(req.body.selectedCode || "");
    const systemPrompt = `You are Nexora AI Assistant, an expert full-stack developer and coding assistant integrated into the Nexora Editor IDE. Provide direct, actionable, production-ready code with concise explanations.\nProject Name: ${String(context?.name || APP_NAME)}\nActive File: ${String(activeFile?.path || activeFile?.name || "None")}\nCurrent Project Files Context:\n${buildFilesSummary(getProjectFiles(context)) || "No files provided."}`;
    const userPrompt = `${message}${selectedCode ? `\n\nSelected Code:\n\`\`\`\n${selectedCode.slice(0, MAX_FILE_CONTENT_CHARS)}\n\`\`\`` : ""}`;
    assertPromptSize(systemPrompt + userPrompt);
    const response = await getGenAI(apiKey).models.generateContent({ model: AI_MODEL, contents: userPrompt, config: { systemInstruction: systemPrompt, temperature: AI_ASSISTANT_TEMPERATURE } });
    return res.json({ reply: response.text || "No response generated." });
  } catch (error: unknown) {
    if ((error as any)?.code === "REQUEST_TOO_LARGE") return res.status(413).json({ error: "AI request is too large. Reduce the selected code or project context." });
    console.error("AI Assistant Error:", error);
    return res.status(500).json({ error: safeErrorMessage(error, "Failed to process AI request.") });
  }
});

app.post("/api/ai/agent", rateLimit, async (req, res) => {
  try {
    const apiKey = getUserApiKey(req);
    if (!apiKey) return res.status(401).json({ error: "AI API key required. Add your provider API key in Nexora AI Settings." });
    const goal = String(req.body.goal || req.body.prompt || "");
    const context = req.body.projectContext || req.body.project || {};
    const systemPrompt = `You are Nexora AI Agent. Return ONLY valid JSON with summary, plan, fileActions, and recommendations. Provide complete code for modified files and analyze active errors specifically.`;
    const errors = Array.isArray(req.body.currentErrors) ? JSON.stringify(req.body.currentErrors).slice(0, MAX_FILE_CONTENT_CHARS * 4) : "";
    const userPrompt = `Goal: ${goal}\nProject Name: ${String(context?.name || APP_NAME)}\nErrors: ${errors}\nCurrent Project Files:\n${buildFilesSummary(getProjectFiles(context), true) || "Empty project."}`;
    assertPromptSize(systemPrompt + userPrompt);
    const response = await getGenAI(apiKey).models.generateContent({ model: AI_MODEL, contents: userPrompt, config: { systemInstruction: systemPrompt, responseMimeType: "application/json", temperature: AI_AGENT_TEMPERATURE } });
    let result: any;
    try { result = JSON.parse(response.text || "{}"); } catch { result = JSON.parse((response.text || "{}").replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim()); }
    const steps = Array.isArray(result.plan) ? result.plan.map((p: any, i: number) => ({ stepNumber: i + 1, name: typeof p === "string" ? p.split(":")[0] : `Step ${i + 1}`, status: "completed", description: typeof p === "string" ? p : JSON.stringify(p) })) : [];
    return res.json({ success: true, summary: result.summary || "AI Agent generated file actions.", steps, fileActions: Array.isArray(result.fileActions) ? result.fileActions : [], recommendations: Array.isArray(result.recommendations) ? result.recommendations : [], result });
  } catch (error: unknown) {
    if ((error as any)?.code === "REQUEST_TOO_LARGE") return res.status(413).json({ error: "AI request is too large. Reduce the project context." });
    console.error("AI Agent Error:", error);
    return res.status(500).json({ error: safeErrorMessage(error, "Failed to process AI Agent request.") });
  }
});

app.post("/api/deploy/validate", async (req, res) => {
  try {
    const { project, targetProvider } = req.body;
    if (!project || !Array.isArray(project.files) || project.files.length === 0) return res.status(400).json({ error: "Project has no files to deploy." });
    const target = ["vercel", "cloudflare", "netlify", "static"].includes(targetProvider) ? targetProvider : "static";
    const files = project.files;
    const logs: string[] = [`[Validation Pipeline] Inspecting project: "${String(project.name || APP_NAME)}"...`, `[Validation Pipeline] Target platform: ${target.toUpperCase()}`, `[Validation Pipeline] Analyzing ${files.length} project file(s)...`];
    let fatalErrors = 0;
    const hasIndex = files.some((f: any) => (f.path || f.name || "").toLowerCase().replace(/^\.\//, "") === "index.html");
    if (!hasIndex) { fatalErrors++; logs.push(`[Validation Error] No root "index.html" file detected.`); } else logs.push(`[Validation Success] Verified entry point: index.html.`);
    const invalid = files.filter((f: any) => !String(f.path || f.name || "").trim()).length;
    if (invalid) { fatalErrors += invalid; logs.push(`[Validation Error] ${invalid} file(s) have no valid path.`); }
    logs.push(`[Asset Analysis] Identified ${files.filter((f: any) => /\.css$/i.test(f.name || f.path || "")).length} stylesheet(s) and ${files.filter((f: any) => /\.(js|jsx|ts|tsx)$/i.test(f.name || f.path || "")).length} JavaScript/TypeScript script(s).`);
    const bundleSizeKb = Math.max(1, Math.round(JSON.stringify(files).length / 1024));
    logs.push(`[Package Size] Calculated bundle payload: ~${bundleSizeKb} KB.`);
    if (fatalErrors) { logs.push(`[Validation Failed] ${fatalErrors} fatal error(s) found. Deployment is blocked.`); return res.status(422).json({ success: false, status: "invalid", fatalErrors, logs, timestamp: new Date().toISOString() }); }
    const name = String(project.name || APP_NAME).toLowerCase().replace(/[^a-z0-9]/g, "-");
    let configFileName = "README.md", configFileContent = `# ${String(project.name || APP_NAME)}\n\nStatic package.\n`, cliCommand = envString("NEXORA_STATIC_PREVIEW_COMMAND", "npx serve .");
    if (target === "vercel") { configFileName = "vercel.json"; configFileContent = JSON.stringify({ version: 2, name, builds: [{ src: "index.html", use: "@vercel/static" }], routes: [{ src: "/(.*)", dest: "/index.html" }] }, null, 2); cliCommand = envString("NEXORA_VERCEL_CLI_COMMAND", "npx vercel --prod"); }
    else if (target === "netlify") { configFileName = "netlify.toml"; configFileContent = `[build]\n  publish = "."\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n`; cliCommand = envString("NEXORA_NETLIFY_CLI_COMMAND", "npx netlify deploy --prod --dir=."); }
    else if (target === "cloudflare") { configFileName = "_headers"; configFileContent = `/*\n  X-Frame-Options: SAMEORIGIN\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`; cliCommand = envString("NEXORA_CLOUDFLARE_CLI_COMMAND", `npx wrangler pages deploy . --project-name ${name}`); }
    logs.push(`[Validation Complete] Static validation passed. No untrusted project code was executed or compiled.`);
    return res.json({ success: true, deploymentId: `val_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, status: "validated", logs, configFileName, configFileContent, cliCommand, bundleSizeKb, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error("Deployment validation error:", error);
    return res.status(500).json({ error: safeErrorMessage(error, "Deployment validation failed.") });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, HOST, () => console.log(`${APP_NAME} Server listening on http://${HOST}:${PORT}`));
}
startServer();
