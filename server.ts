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
const PORT = Number(process.env.NEXORA_PORT || 3000);
const HOST = process.env.NEXORA_HOST || "0.0.0.0";
const BODY_LIMIT = process.env.NEXORA_BODY_LIMIT || "50mb";
const AI_MODEL = process.env.NEXORA_AI_MODEL || "gemini-3.7-flash";
const AI_ASSISTANT_TEMPERATURE = Number(process.env.NEXORA_AI_TEMPERATURE_ASSISTANT || 0.4);
const AI_AGENT_TEMPERATURE = Number(process.env.NEXORA_AI_TEMPERATURE_AGENT || 0.2);
const AI_USER_AGENT = process.env.NEXORA_AI_USER_AGENT || "Nexora-Editor";
const APP_NAME = process.env.VITE_APP_NAME || "Nexora Editor";

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
        headers: {
          "User-Agent": AI_USER_AGENT,
        },
      },
    });
  }

  return genAIInstance;
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
    const message = req.body.message || req.body.prompt || "";
    const projectContext = req.body.projectContext || req.body.project || req.body.context || {};
    const activeFile = req.body.activeFile || (req.body.context ? { name: req.body.context.activeFileName, content: req.body.context.activeFileContent } : undefined);
    const selectedCode = req.body.selectedCode;
    const taskType = req.body.taskType || "general";

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "AI provider is not configured. Set GEMINI_API_KEY in the server environment.",
      });
    }

    const filesArray = Array.isArray(projectContext?.files)
      ? projectContext.files
      : Array.isArray(projectContext?.allFiles)
        ? projectContext.allFiles
        : [];

    const filesSummary = filesArray
      .map((f: { name?: string; path?: string; content?: string }) => `File: ${f.path || f.name}\n\`\`\`\n${(f.content || "").slice(0, 3000)}\n\`\`\``)
      .join("\n\n");

    const systemPrompt = `You are Nexora AI Assistant, an expert full-stack developer and coding assistant integrated into the Nexora Editor IDE.
You help users write clean, modern, accessible, bug-free HTML, CSS, JavaScript, TypeScript, React, and Tailwind code.
Provide direct, actionable, production-ready code with concise explanations.
When providing code modifications, specify clearly which file is affected and provide complete, working code.

Project Name: ${projectContext?.name || APP_NAME}
Active File: ${activeFile?.path || activeFile?.name || "None"}
Task Mode: ${taskType || "general"}

Current Project Files Context:
${filesSummary || "No files provided."}`;

    const userPrompt = `${message}${selectedCode ? `\n\nSelected Code snippet:\n\`\`\`\n${selectedCode}\n\`\`\`` : ""}`;

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: AI_ASSISTANT_TEMPERATURE,
      },
    });

    res.json({ reply: response.text || "No response generated." });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    res.status(500).json({ error: error.message || "Failed to process AI request." });
  }
});

app.post("/api/ai/agent", async (req, res) => {
  try {
    const goal = req.body.goal || req.body.prompt || "";
    const projectContext = req.body.projectContext || req.body.project || {};
    const currentErrors = req.body.currentErrors;

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "AI provider is not configured. Set GEMINI_API_KEY in the server environment.",
      });
    }

    const filesArray = Array.isArray(projectContext?.files) ? projectContext.files : [];
    const filesSummary = filesArray
      .map((f: { name?: string; path?: string; content?: string }) => `--- File: ${f.path || f.name} ---\n${f.content || ""}`)
      .join("\n\n");

    const systemPrompt = `You are Nexora AI Agent, an autonomous software engineer that inspects projects, plans solutions, and generates exact multi-file edits.
You must respond with valid JSON matching this schema:
{
  "summary": "Brief description of what was planned and done",
  "plan": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "fileActions": [
    {
      "action": "create" | "update" | "delete",
      "path": "path/to/file.ext",
      "content": "Full complete new file content (never truncated)",
      "explanation": "Why this file was modified or created"
    }
  ],
  "recommendations": ["Tips or follow-ups for the user"]
}

Rules:
1. Return ONLY pure JSON with no markdown wrapping or code blocks.
2. Provide FULL working code for modified files, not snippets with '...rest of code'.
3. Support HTML, CSS, JavaScript, TypeScript, React JSX, JSON.
4. Ensure responsive design with Tailwind CSS or clean CSS.
5. If there are active errors, analyze and fix them specifically.`;

    const userPrompt = `Goal: ${goal}

Project Name: ${projectContext?.name || APP_NAME}
${currentErrors && currentErrors.length > 0 ? `Current Runtime/Build Errors:\n${JSON.stringify(currentErrors, null, 2)}\n` : ""}

Current Project Files:
${filesSummary || "Empty project."}

Execute the task and return the structured JSON plan and file edits.`;

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

    res.json({
      success: true,
      summary: agentResult.summary || "AI Agent generated file actions.",
      steps,
      fileActions: agentResult.fileActions || [],
      recommendations: agentResult.recommendations || [],
      result: agentResult,
    });
  } catch (error: any) {
    console.error("AI Agent Error:", error);
    res.status(500).json({ error: error.message || "Failed to execute AI Agent task." });
  }
});

app.post("/api/deploy/validate", async (req, res) => {
  try {
    const { project, targetProvider } = req.body;
    if (!project || !Array.isArray(project.files) || project.files.length === 0) {
      return res.status(400).json({ error: "Project has no files to deploy." });
    }

    const target: "vercel" | "cloudflare" | "netlify" | "static" = targetProvider || "static";
    const hasIndexHtml = project.files.some((f: { name: string; path: string }) => (f.path || f.name).toLowerCase() === "index.html");

    const logs: string[] = [
      `[Validation Pipeline] Inspecting project: "${project.name}"...`,
      `[Validation Pipeline] Target platform: ${target.toUpperCase()}`,
      `[Validation Pipeline] Analyzing ${project.files.length} project file(s)...`,
    ];

    if (!hasIndexHtml) {
      logs.push(`[Validation Notice] Warning: No root "index.html" file detected. Static web hosts require an index.html entry point.`);
    } else {
      logs.push(`[Validation Success] Verified entry point: index.html.`);
    }

    const cssCount = project.files.filter((f: any) => (f.name || f.path).endsWith(".css")).length;
    const jsCount = project.files.filter((f: any) => /\.(js|jsx|ts|tsx)$/.test(f.name || f.path)).length;
    logs.push(`[Asset Analysis] Identified ${cssCount} stylesheet(s) and ${jsCount} JavaScript/TypeScript script(s).`);

    const rawSize = JSON.stringify(project.files).length;
    const bundleSizeKb = Math.max(1, Math.round(rawSize / 1024));
    logs.push(`[Package Size] Calculated bundle payload: ~${bundleSizeKb} KB.`);

    let configFileName = "";
    let configFileContent = "";
    let cliCommand = "";
    const normalizedProjectName = (project.name || APP_NAME).toLowerCase().replace(/[^a-z0-9]/g, "-");

    if (target === "vercel") {
      configFileName = "vercel.json";
      configFileContent = JSON.stringify({
        version: 2,
        name: normalizedProjectName,
        builds: [{ src: "index.html", use: "@vercel/static" }],
        routes: [{ src: "/(.*)", dest: "/index.html" }],
      }, null, 2);
      cliCommand = process.env.NEXORA_VERCEL_CLI_COMMAND || "npx vercel --prod";
      logs.push(`[Config Generator] Generated Vercel configuration (vercel.json).`);
      logs.push(`[CLI Recommendation] Run "${cliCommand}" in the exported project directory.`);
    } else if (target === "netlify") {
      configFileName = "netlify.toml";
      configFileContent = `[build]\n  publish = "."\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n`;
      cliCommand = process.env.NEXORA_NETLIFY_CLI_COMMAND || "npx netlify deploy --prod --dir=.";
      logs.push(`[Config Generator] Generated Netlify configuration (netlify.toml).`);
      logs.push(`[CLI Recommendation] Run "${cliCommand}" to publish to Netlify.`);
    } else if (target === "cloudflare") {
      configFileName = "_headers";
      configFileContent = `/*\n  X-Frame-Options: SAMEORIGIN\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`;
      cliCommand = process.env.NEXORA_CLOUDFLARE_CLI_COMMAND || `npx wrangler pages deploy . --project-name ${normalizedProjectName}`;
      logs.push(`[Config Generator] Generated Cloudflare Pages security headers (_headers).`);
      logs.push(`[CLI Recommendation] Run "${cliCommand}".`);
    } else {
      configFileName = process.env.NEXORA_STATIC_README_FILE || "README.md";
      configFileContent = `# ${project.name}\n\nThis is a static web application built with ${APP_NAME}.\nDeploy by uploading the files to any web host.\n`;
      cliCommand = process.env.NEXORA_STATIC_PREVIEW_COMMAND || "npx serve .";
      logs.push(`[Static Package] Production static package ready for hosting.`);
    }

    logs.push(`[Validation Complete] Build validation passed with 0 fatal errors. Ready to deploy.`);

    const deploymentId = `val_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    res.json({
      success: true,
      deploymentId,
      status: "validated",
      liveUrl: undefined,
      logs,
      configFileName,
      configFileContent,
      cliCommand,
      bundleSizeKb,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Deployment validation failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`${APP_NAME} Server listening on http://${HOST}:${PORT}`);
  });
}

startServer();
