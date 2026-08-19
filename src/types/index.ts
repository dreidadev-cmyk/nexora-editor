export type SupportedLanguage =
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "json"
  | "markdown"
  | "jsx"
  | "tsx"
  | "plaintext";

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: SupportedLanguage;
  isFolder: boolean;
  parentId?: string | null;
  updatedAt: string;
  isEntry?: boolean;
}

export type ProjectTemplateType =
  | "blank"
  | "portfolio"
  | "landing"
  | "dashboard"
  | "vanilla_js"
  | "react_app"
  | "minecraft_server"
  | "tailwind_app";

export interface Project {
  id: string;
  name: string;
  description: string;
  templateType: ProjectTemplateType;
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
  visibility: "private" | "public";
  tags?: string[];
  version?: number;
}

export interface OpenTab {
  fileId: string;
  filePath: string;
  isDirty?: boolean;
}

export type LogLevel = "log" | "info" | "warn" | "error";

export interface ConsoleLogItem {
  id: string;
  type: LogLevel;
  message: string;
  args?: any[];
  timestamp: string;
  line?: number;
  col?: number;
  file?: string;
  stack?: string;
}

export interface RuntimeError {
  message: string;
  line?: number;
  col?: number;
  file?: string;
  stack?: string;
  timestamp: string;
}

export type DeviceType = "mobile" | "tablet" | "laptop" | "desktop" | "custom";

export interface DevicePreset {
  id: DeviceType;
  name: string;
  width: number;
  height: number;
  scale?: number;
}

export interface AIConversationMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  codeSnippet?: string;
  fileActions?: AIAgentFileAction[];
  isErrorFix?: boolean;
}

export interface AIAgentFileAction {
  action: "create" | "update" | "delete";
  path: string;
  content: string;
  explanation: string;
  previousContent?: string;
}

export interface AIAgentPlan {
  summary: string;
  plan: string[];
  fileActions: AIAgentFileAction[];
  recommendations?: string[];
}

export interface ProjectVersion {
  id: string;
  versionNumber: number;
  label: string;
  timestamp: string;
  files: ProjectFile[];
  snapshotReason?: string;
}

export interface DeploymentRecord {
  id: string;
  projectId: string;
  projectName: string;
  targetProvider: "vercel" | "cloudflare" | "netlify" | "static";
  status: "building" | "validated" | "deployed" | "failed";
  liveUrl?: string;
  logs: string[];
  createdAt: string;
  error?: string;
  configFileName?: string;
  configFileContent?: string;
  cliCommand?: string;
  bundleSizeKb?: number;
}

export type AppTheme = "dark" | "light" | "amoled" | "nord" | "cyberpunk";

export interface UserSettings {
  theme: AppTheme;
  fontSize: number;
  tabSize: number;
  minimap: boolean;
  wordWrap: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  lineNumbers: boolean;
  fontLigatures: boolean;
  aiProvider: "gemini" | "custom";
  customAiApiKey?: string;
  customSupabaseUrl?: string;
  customSupabaseKey?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  createdAt: string;
}

export type EditorViewMode =
  | "ide"
  | "preview_only"
  | "split"
  | "mobile_editor"
  | "mobile_preview"
  | "mobile_ai"
  | "mobile_files"
  | "mobile_console";

export interface AIAgentStep {
  stepNumber: number;
  name: string;
  status: "pending" | "analyzing" | "running" | "completed" | "failed";
  description: string;
}

export interface AIAgentExecutionPlan {
  goal: string;
  summary: string;
  steps: AIAgentStep[];
  fileActions: AIAgentFileAction[];
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  codeSnippet?: string;
  fileActions?: AIAgentFileAction[];
}

export type PanelType = "files" | "search" | "ai" | "agent" | "history" | "versions" | "terminal" | "deploy" | "settings";
export type IDEPanel = PanelType;
export type ViewMode = EditorViewMode;
