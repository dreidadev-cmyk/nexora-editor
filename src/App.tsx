import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  Search,
  Sparkles,
  History,
  Terminal as TerminalIcon,
  Settings,
  Rocket,
  Layers,
  ChevronLeft,
  ChevronRight,
  Code2,
  Play,
  Monitor,
  Smartphone,
  AlertCircle,
  X,
  Plus,
  Compass,
  FileCode,
  Layout,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { ProjectProvider, useProject } from "./context/ProjectContext";
import { Header } from "./components/common/Header";
import { CommandPalette } from "./components/common/CommandPalette";
import { FileExplorer } from "./components/editor/FileExplorer";
import { GlobalSearch } from "./components/editor/GlobalSearch";
import { MonacoEditorPane } from "./components/editor/MonacoEditorPane";
import { PreviewPane } from "./components/editor/PreviewPane";
import { ConsolePane } from "./components/editor/ConsolePane";
import { TerminalPane } from "./components/editor/TerminalPane";
import { VersionHistory } from "./components/editor/VersionHistory";
import { AIAssistantPane } from "./components/ai/AIAssistantPane";
import { AIAgentPane } from "./components/ai/AIAgentPane";
import { DeployCenterModal } from "./components/deploy/DeployCenterModal";
import { SettingsModal } from "./components/settings/SettingsModal";
import { AuthModal } from "./components/auth/AuthModal";
import { UserDashboard } from "./components/dashboard/UserDashboard";
import { PanelType, ViewMode } from "./types";

const MainIDE: React.FC = () => {
  const {
    currentProject,
    activePanel,
    setActivePanel,
    viewMode,
    setViewMode,
    runPreview,
    isMobile,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    consoleLogs,
    runtimeErrors,
  } = useProject();

  const { settings } = useSettings();
  const { user } = useAuth();

  // Modals & Panels State
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isBottomConsoleOpen, setIsBottomConsoleOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<"console" | "terminal">("console");

  // Mobile View Navigation State
  const [mobileTab, setMobileTab] = useState<"files" | "editor" | "preview" | "agent" | "console">("editor");

  // Resizing state for Desktop Split (Editor vs Preview)
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage for editor
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + S: Save & Run Preview
      if (isCtrlOrCmd && e.key.toLowerCase() === "s") {
        e.preventDefault();
        runPreview();
      }

      // Ctrl/Cmd + B: Toggle Sidebar
      if (isCtrlOrCmd && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }

      // Ctrl/Cmd + J or Ctrl/Cmd + `: Toggle Bottom Console/Terminal
      if (isCtrlOrCmd && (e.key === "`" || e.key.toLowerCase() === "j")) {
        e.preventDefault();
        setIsBottomConsoleOpen((prev) => !prev);
      }

      // Ctrl/Cmd + Shift + D: Deploy
      if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setIsDeployOpen(true);
      }

      // Ctrl/Cmd + Shift + A: AI Agent
      if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setActivePanel("agent");
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runPreview, setActivePanel]);

  // Handle Split Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      if (newRatio > 20 && newRatio < 80) {
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingSplit) setIsDraggingSplit(false);
    };

    if (isDraggingSplit) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSplit]);

  const errorCount = consoleLogs.filter((l) => l.type === "error").length + runtimeErrors.length;
  const warnCount = consoleLogs.filter((l) => l.type === "warn").length;

  const handleFixErrorWithAI = (errorLog: any) => {
    setActivePanel("agent");
    setIsSidebarCollapsed(false);
    if (isMobile) setMobileTab("agent");
  };

  const themeClass =
    settings.theme === "light"
      ? "theme-light bg-slate-100 text-slate-900"
      : settings.theme === "amoled"
      ? "theme-amoled bg-black text-slate-100"
      : settings.theme === "nord"
      ? "theme-nord bg-[#2e3440] text-[#eceff4]"
      : settings.theme === "cyberpunk"
      ? "theme-cyberpunk bg-[#0d0221] text-[#00f0ff]"
      : "theme-dark bg-slate-950 text-slate-100";

  // If dashboard modal / view is full screen
  if (isDashboardOpen) {
    return (
      <div className={`min-h-screen ${themeClass}`}>
        <UserDashboard
          onOpenProject={() => setIsDashboardOpen(false)}
          onOpenDeploy={() => setIsDeployOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
        {/* Modals available from Dashboard */}
        <DeployCenterModal isOpen={isDeployOpen} onClose={() => setIsDeployOpen(false)} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onOpenDeploy={() => setIsDeployOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenDashboard={() => setIsDashboardOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans ${themeClass} select-none`}>
      {/* Top Header */}
      <Header
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenDeploy={() => setIsDeployOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Desktop Activity Bar */}
        <aside className="w-12 bg-slate-950 border-r border-slate-800/80 flex flex-col items-center justify-between py-2 shrink-0 z-20 hidden md:flex">
          {/* Primary Tool Icons */}
          <div className="flex flex-col items-center gap-1 w-full px-1.5">
            <button
              onClick={() => {
                if (activePanel === "files" && !isSidebarCollapsed) {
                  setIsSidebarCollapsed(true);
                } else {
                  setActivePanel("files");
                  setIsSidebarCollapsed(false);
                }
              }}
              title="Explorer (Files & Assets)"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activePanel === "files" && !isSidebarCollapsed
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Folder className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (activePanel === "search" && !isSidebarCollapsed) {
                  setIsSidebarCollapsed(true);
                } else {
                  setActivePanel("search");
                  setIsSidebarCollapsed(false);
                }
              }}
              title="Global Search & Replace"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activePanel === "search" && !isSidebarCollapsed
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (activePanel === "agent" && !isSidebarCollapsed) {
                  setIsSidebarCollapsed(true);
                } else {
                  setActivePanel("agent");
                  setIsSidebarCollapsed(false);
                }
              }}
              title="Autonomous AI Agent (Full Codebase Generation)"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
                activePanel === "agent" && !isSidebarCollapsed
                  ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 absolute top-1.5 right-1.5"></span>
            </button>

            <button
              onClick={() => {
                if (activePanel === "ai" && !isSidebarCollapsed) {
                  setIsSidebarCollapsed(true);
                } else {
                  setActivePanel("ai");
                  setIsSidebarCollapsed(false);
                }
              }}
              title="AI Chat Assistant"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activePanel === "ai" && !isSidebarCollapsed
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Code2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (activePanel === "history" && !isSidebarCollapsed) {
                  setIsSidebarCollapsed(true);
                } else {
                  setActivePanel("history");
                  setIsSidebarCollapsed(false);
                }
              }}
              title="Version Snapshots & Checkpoints"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activePanel === "history" && !isSidebarCollapsed
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (activePanel === "terminal" && !isSidebarCollapsed) {
                  setIsSidebarCollapsed(true);
                } else {
                  setActivePanel("terminal");
                  setIsSidebarCollapsed(false);
                }
              }}
              title="Sandboxed Terminal CLI"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activePanel === "terminal" && !isSidebarCollapsed
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Tool Icons */}
          <div className="flex flex-col items-center gap-1.5 w-full px-1.5">
            <button
              onClick={() => setIsDeployOpen(true)}
              title="Open Deploy Center"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors"
            >
              <Rocket className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Editor & Workspace Settings"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Collapsible Left Panel (Desktop) */}
        {!isSidebarCollapsed && (
          <div className="w-72 sm:w-80 h-full border-r border-slate-800 bg-slate-900 shrink-0 hidden md:flex flex-col z-10">
            {activePanel === "files" && <FileExplorer />}
            {activePanel === "search" && <GlobalSearch />}
            {activePanel === "ai" && <AIAssistantPane />}
            {activePanel === "agent" && <AIAgentPane />}
            {activePanel === "history" && <VersionHistory />}
            {activePanel === "terminal" && <TerminalPane />}
          </div>
        )}

        {/* DESKTOP SPLIT VIEW: Monaco Editor (Left) & Preview + Console (Right) */}
        <div
          ref={containerRef}
          className="flex-1 flex overflow-hidden relative hidden md:flex"
        >
          {/* Left Split: Monaco Editor */}
          <div
            className="h-full flex flex-col overflow-hidden"
            style={{ width: `${splitRatio}%` }}
          >
            <MonacoEditorPane />
          </div>

          {/* Draggable Divider */}
          <div
            onMouseDown={() => setIsDraggingSplit(true)}
            className={`w-1.5 bg-slate-800/80 hover:bg-indigo-500 cursor-col-resize transition-colors shrink-0 select-none ${
              isDraggingSplit ? "bg-indigo-500 ring-2 ring-indigo-500/30" : ""
            }`}
          />

          {/* Right Split: Live Preview & Bottom Console / Terminal */}
          <div
            className="h-full flex flex-col overflow-hidden bg-slate-950"
            style={{ width: `${100 - splitRatio}%` }}
          >
            {/* Live Sandbox Preview Top Section */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <PreviewPane />
            </div>

            {/* Bottom Console / Terminal Drawer Toggle Bar */}
            <div className="h-8 bg-slate-900 border-t border-b border-slate-800 px-3 flex items-center justify-between text-xs text-slate-400 select-none shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBottomTab("console");
                    setIsBottomConsoleOpen(true);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    isBottomConsoleOpen && bottomTab === "console"
                      ? "bg-slate-950 text-indigo-400 border border-slate-800"
                      : "hover:text-slate-200"
                  }`}
                >
                  <TerminalIcon className="w-3 h-3" />
                  <span>Console</span>
                  {errorCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold">
                      {errorCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setBottomTab("terminal");
                    setIsBottomConsoleOpen(true);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    isBottomConsoleOpen && bottomTab === "terminal"
                      ? "bg-slate-950 text-indigo-400 border border-slate-800"
                      : "hover:text-slate-200"
                  }`}
                >
                  <span>CLI Terminal</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsBottomConsoleOpen(!isBottomConsoleOpen)}
                  title={isBottomConsoleOpen ? "Collapse Console" : "Expand Console"}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  {isBottomConsoleOpen ? <ChevronRight className="w-3.5 h-3.5 rotate-90" /> : <ChevronRight className="w-3.5 h-3.5 -rotate-90" />}
                </button>
              </div>
            </div>

            {/* Bottom Expandable Drawer */}
            {isBottomConsoleOpen && (
              <div className="h-56 bg-slate-950 border-t border-slate-800 shrink-0 overflow-hidden">
                {bottomTab === "console" ? (
                  <ConsolePane onFixErrorWithAI={handleFixErrorWithAI} />
                ) : (
                  <TerminalPane />
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE VIEW (Phones / Small Tablets): Single-Tab Focused Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden md:hidden">
          {mobileTab === "files" && (
            <div className="flex-1 overflow-hidden">
              <FileExplorer />
            </div>
          )}

          {mobileTab === "editor" && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <MonacoEditorPane />
            </div>
          )}

          {mobileTab === "preview" && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <PreviewPane />
            </div>
          )}

          {mobileTab === "agent" && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <AIAgentPane />
            </div>
          )}

          {mobileTab === "console" && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <ConsolePane onFixErrorWithAI={handleFixErrorWithAI} />
            </div>
          )}

          {/* Mobile Bottom Navigation Bar */}
          <nav className="h-14 bg-slate-900 border-t border-slate-800 grid grid-cols-5 items-center px-1 shrink-0 z-30 select-none">
            <button
              onClick={() => setMobileTab("files")}
              className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
                mobileTab === "files"
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span className="text-[10px]">Files</span>
            </button>

            <button
              onClick={() => setMobileTab("editor")}
              className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
                mobileTab === "editor"
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span className="text-[10px]">Editor</span>
            </button>

            <button
              onClick={() => {
                setMobileTab("preview");
                runPreview();
              }}
              className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
                mobileTab === "preview"
                  ? "text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="text-[10px]">Preview</span>
            </button>

            <button
              onClick={() => setMobileTab("agent")}
              className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all relative ${
                mobileTab === "agent"
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px]">AI Agent</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 absolute top-1 right-3"></span>
            </button>

            <button
              onClick={() => setMobileTab("console")}
              className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all relative ${
                mobileTab === "console"
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TerminalIcon className="w-4 h-4" />
              <span className="text-[10px]">Console</span>
              {errorCount > 0 && (
                <span className="absolute top-1 right-2 px-1 py-0.1 text-[9px] font-bold rounded-full bg-rose-600 text-white">
                  {errorCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Global Modals */}
      <DeployCenterModal isOpen={isDeployOpen} onClose={() => setIsDeployOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenDeploy={() => setIsDeployOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ProjectProvider>
          <MainIDE />
        </ProjectProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

