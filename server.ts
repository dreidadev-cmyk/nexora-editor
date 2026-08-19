import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function envString(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function envNumber(name: string, fallback: number, min?: number, max?: number): number {
  const raw = process.env[name];
  const value = raw === undefined || raw.trim() === "" ? fallback : Number(raw);
  if (!Number.isFinite(value)) return fallback;
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

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

app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": AI_USER_AGENT },
      },
    });
  }

  return genAIInstance;
}

function safeErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV !== "production" && error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function getProjectFiles(projectContext: any): any[] {
  const files = Array.isArray(projectContext?.files)
    ? projectContext.files
    : Array.isArray(projectContext?.allFiles)
      ? projectContext.allFiles
      : [];
  return files.slice(0, MAX_PROJECT_FILES);
}

function buildFilesSummary(files: any[], fullContent = false): string {
  return files
    .map((f: { name?: string; path?: string; content?: string }) => {
      const content = String(f.content || "");
      const limit = fullContent ? MAX_FILE_CONTENT_CHARS : Math.min(MAX_FILE_CONTENT_CHARS, 3000);
      return `File: ${f.path || f.name || "unnamed"}\n\`\`\`\n${content.slice(0, limit)}\n\`\`\``;
    })
    .join("\n\n");
}

function assertPromptSize(prompt: string): void {
  if (prompt.length > MAX_AI_REQUEST_CHARS) {
    throw Object.assign(new Error("AI request is too large."), { code: "REQUEST_TOO_LARGE" });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: APP_NAME,
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post("/api/ai/assistant", async (req, res) => {
  try {
    const message = String(req.body.message || req.body.prompt || "");
    const projectContext = req.body.projectContext || req.body.project || req.body.context || {};
    const activeFile = req.body.activeFile || (req.body.context ? {
      name: req.body.context.activeFileName,
      content: req.body.context.activeFileContent,
    } : undefined);
    const selectedCode = req.body.selectedCode ? String(req.body.selectedCode) : "";
    const taskType = String(req.body.taskType || "general");

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: "AI provider is not configured." });
    }

    const filesArray = getProjectFiles(projectContext);
    const filesSummary = buildFilesSummary(filesArray);
    const systemPrompt = `You are Nexora AI Assistant, an expert full-stack developer and coding assistant integrated into the Nexora Editor IDE.
You help users write clean, modern, accessible, bug-free HTML, CSS, JavaScript, TypeScript, React, and Tailwind code.
Provide direct, actionable, production-ready code with concise explanations.
When providing code modifications, specify clearly which file is affected and provide complete, working code.

Project Name: ${String(projectContext?.name || APP_NAME)}
Active File: ${String(activeFile?.path || activeFile?.name || "None")}
Task Mode: ${taskType}

Current Project Files Context:
${filesSummary || "No files provided."}`;

    const userPrompt = `${message}${selectedCode ? `\n\nSelected Code snippet:\n\`\`\`\n${selectedCode.slice(0, MAX_FILE_CONTENT_CHARS)}\n\`\`\`` : ""}`;
    assertPromptSize(systemPrompt + userPrompt);

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: AI_ASSISTANT_TEMPERATURE,
      },
    });

    return res.json({ reply: response.text || "No response generated." });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "REQUEST_TOO_LARGE") {
      return res.status(413).json({ error: "AI request is too large. Reduce the selected code or project context." });
    }
    console.error("AI Assistant Error:", error);
    return res.status(500).json({ error: safeErrorMessage(error, "Failed to process AI request.") });
  }
});

app.post("/api/ai/agent", async (req, res) => {
  try {
    const goal = String(req.body.goal || req.body.prompt || "");
    const projectContext = req.body.projectContext || req.body.project || {};
    const currentErrors = req.body.currentErrors;

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: "AI provider is not configured." });
    }

    const filesArray = getProjectFiles(projectContext);
    const filesSummary = buildFilesSummary(filesArray, true);
    const systemPrompt = `You are Nexora AI Agent, an autonomous software engineer that inspects projects, plans solutions, and generates exact multi-file edits.
You must respond with valid JSON matching this schema:
{
  "summary": "Brief description of what was planned and done",
  "plan": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "fileActions": [{ "action": "create" | "update" | "delete", "path": "path/to/file.ext", "content": "Full complete new file content", "explanation": "Why this file was modified or created" }],
  "recommendations": ["Tips or follow-ups for the user"]
}

Rules:
1. Return ONLY pure JSON with no markdown wrapping or code blocks.
2. Provide FULL working code for modified files, not snippets with omitted sections.
3. Support HTML, CSS, JavaScript, TypeScript, React JSX, JSON.
4. Ensure responsive design with Tailwind CSS or clean CSS.
5. If there are active errors, analyze and fix them specifically.`;

    const errorsText = Array.isArray(currentErrors) && currentErrors.length > 0
      ? `Current Runtime/Build Errors:\n${JSON.stringify(currentErrors).slice(0, MAX_FILE_CONTENT_CHARS * 4)}\n`
      : "";
    const userPrompt = `Goal: ${goal}\n\nProject Name: ${String(projectContext?.name || APP_NAME)}\n${errorsText}\nCurrent Project Files:\n${filesSummary || "Empty project."}\n\nExecute the task and return the structured JSON plan and file edits.`;
    assertPromptSize(systemPrompt + userPrompt);

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: AI_AGENT_TEMPERATURE,
      },
    });

    const jsonStr = response.text || "{}";
    let agentResult: any;
    try {
      agentResult = JSON.parse(jsonStr);
    } catch {
      const cleaned = jsonStr.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      agentResult = JSON.parse(cleaned);
    }

    const steps = Array.isArray(agentResult.plan)
      ? agentResult.plan.map((p: any, idx: number) => ({
          stepNumber: idx + 1,
          name: typeof p === "string" ? (p.includes(":") ? p.split(":")[0] : `Step ${idx + 1}`) : `Step ${idx + 1}`,
          status: "completed",
          description: typeof p === "string" ? p : JSON.stringify(p),
        }))
      : [];

    return res.json({
      success: true,
      summary: agentResult.summary || "AI Agent generated file actions.",
      steps,
      fileActions: Array.isArray(agentResult.fileActions) ? agentResult.fileActions : [],
      recommendations: Array.isArray(agentResult.recommendations) ? agentResult.recommendations : [],
      result: agentResult,
    });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "REQUEST_TOO_LARGE") {
      return res.status(413).json({ error: "AI request is too large. Reduce the project context." });
    }
    console.error("AI Agent Error:", error);
    return res.status(500).json({ error: safeErrorMessage(error, "Failed to process AI Agent request.") });
  }
});

app.post("/api/deploy/validate", async (req, res) => {
  try {
    const { project, targetProvider } = req.body;
    if (!project || !Array.isArray(project.files) || project.files.length === 0) {
      return res.status(400).json({ error: "Project has no files to deploy." });
    }

    const target: "vercel" | "cloudflare" | "netlify" | "static" = targetProvider || "static";
    const files = project.files;
    const hasIndexHtml = files.some((f: { name?: string; path?: string }) => (f.path || f.name || "").toLowerCase().replace(/^\.\//, "") === "index.html");
    const logs: string[] = [
      `[Validation Pipeline] Inspecting project: "${String(project.name || APP_NAME)}"...`,
      `[Validation Pipeline] Target platform: ${target.toUpperCase()}`,
      `[Validation Pipeline] Analyzing ${files.length} project file(s)...`,
    ];

    let fatalErrors = 0;
    if (!hasIndexHtml) {
      fatalErrors++;
      logs.push(`[Validation Error] No root "index.html" file detected.`);
    } else {
      logs.push(`[Validation Success] Verified entry point: index.html.`);
    }

    const invalidFiles = files.filter((f: any) => !String(f.path || f.name || "").trim());
    if (invalidFiles.length > 0) {
      fatalErrors += invalidFiles.length;
      logs.push(`[Validation Error] ${invalidFiles.length} file(s) have no valid path.`);
    }

    const cssCount = files.filter((f: any) => String(f.name || f.path || "").toLowerCase().endsWith(".css")).length;
    const jsCount = files.filter((f: any) => /\.(js|jsx|ts|tsx)$/i.test(String(f.name || f.path || ""))).length;
    logs.push(`[Asset Analysis] Identified ${cssCount} stylesheet(s) and ${jsCount} JavaScript/TypeScript script(s).`);

    const rawSize = JSON.stringify(files).length;
    const bundleSizeKb = Math.max(1, Math.round(rawSize / 1024));
    logs.push(`[Package Size] Calculated bundle payload: ~${bundleSizeKb} KB.`);

    if (fatalErrors > 0) {
      logs.push(`[Validation Failed] ${fatalErrors} fatal error(s) found. Deployment is blocked.`);
      return res.status(422).json({ success: false, status: "invalid", fatalErrors, logs, timestamp: new Date().toISOString() });
    }

    let configFileName = "";
    let configFileContent = "";
    let cliCommand = "";
    const normalizedProjectName = String(project.name || APP_NAME).toLowerCase().replace(/[^a-z0-9]/g, "-");

    if (target === "vercel") {
      configFileName = "vercel.json";
      configFileContent = JSON.stringify({ version: 2, name: normalizedProjectName, builds: [{ src: "index.html", use: "@vercel/static" }], routes: [{ src: "/(.*)", dest: "/index.html" }] }, null, 2);
      cliCommand = envString("NEXORA_VERCEL_CLI_COMMAND", "npx vercel --prod");
      logs.push(`[Config Generator] Generated Vercel configuration.`);
    } else if (target === "netlify") {
      configFileName = "netlify.toml";
      configFileContent = `[build]\n  publish = "."\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n`;
      cliCommand = envString("NEXORA_NETLIFY_CLI_COMMAND", "npx netlify deploy --prod --dir=.");
      logs.push(`[Config Generator] Generated Netlify configuration.`);
    } else if (target === "cloudflare") {
      configFileName = "_headers";
      configFileContent = `/*\n  X-Frame-Options: SAMEORIGIN\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`;
      cliCommand = envString("NEXORA_CLOUDFLARE_CLI_COMMAND", `npx wrangler pages deploy . --project-name ${normalizedProjectName}`);
      logs.push(`[Config Generator] Generated Cloudflare Pages security headers.`);
    } else {
      configFileName = envString("NEXORA_STATIC_README_FILE", "README.md");
      configFileContent = `# ${String(project.name || APP_NAME)}\n\nThis is a static web application built with ${APP_NAME}.\n`;
      cliCommand = envString("NEXORA_STATIC_PREVIEW_COMMAND", "npx serve .");
      logs.push(`[Static Package] Production static package ready for hosting.`);
    }

    logs.push(`[Validation Complete] Static validation passed. This endpoint does not execute or compile untrusted project code.`);
    const deploymentId = `val_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    return res.json({ success: true, deploymentId, status: "validated", liveUrl: undefined, logs, configFileName, configFileContent, cliCommand, bundleSizeKb, timestamp: new Date().toISOString() });
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

  app.listen(PORT, HOST, () => {
    console.log(`${APP_NAME} Server listening on http://${HOST}:${PORT}`);
  });
}

startServer();
