import React, { useState } from "react";
import {
  Play,
  Save,
  Sparkles,
  Rocket,
  Download,
  Settings,
  FolderTree,
  Search,
  History,
  Terminal,
  Share2,
  ExternalLink,
  ChevronDown,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Maximize2,
  User as UserIcon,
  Home,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import { shareProjectLink } from "../../lib/capacitor";

interface HeaderProps {
  onOpenDashboard: () => void;
  onOpenDeploy: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDashboard,
  onOpenDeploy,
  onOpenSettings,
  onOpenAuth,
}) => {
  const {
    currentProject,
    renameProject,
    isSaving,
    lastSavedAt,
    runPreview,
    exportProjectZip,
    activePanel,
    setActivePanel,
    viewMode,
    setViewMode,
    selectedPreviewDevice,
    setDevicePreset,
    setCommandPaletteOpen,
    isMobile,
  } = useProject();

  const { user } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(currentProject?.name || "Nexora Project");
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProject && titleValue.trim()) {
      renameProject(currentProject.id, titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const ok = await shareProjectLink(
      currentProject?.name || "Nexora Project",
      "Check out this code created on Nexora Editor!",
      url
    );
    if (ok) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: Brand & Project Name */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={onOpenDashboard}
          title="Return to Dashboard / Projects"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors group shrink-0"
        >
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-600/30">
            N
          </div>
          <span className="font-bold text-xs sm:text-sm tracking-tight hidden sm:inline">Nexora</span>
        </button>

        <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

        {/* Project Name Editor */}
        <div className="min-w-0 flex items-center gap-2">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center">
              <input
                type="text"
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                className="px-2 py-1 text-xs sm:text-sm font-semibold rounded bg-slate-950 border border-indigo-500 text-slate-100 focus:outline-none"
              />
            </form>
          ) : (
            <button
              onClick={() => {
                setTitleValue(currentProject?.name || "");
                setIsEditingTitle(true);
              }}
              title="Click to rename project"
              className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white truncate max-w-[140px] sm:max-w-[220px] text-left px-1 py-0.5 rounded hover:bg-slate-800/80 transition-colors"
            >
              {currentProject?.name || "Untitled Project"}
            </button>
          )}

          {/* Autosave Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {lastSavedAt ? `Saved ${lastSavedAt}` : "Saved"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Desktop Quick Tools */}
      <div className="hidden md:flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          onClick={runPreview}
          title="Run / Refresh Live Preview"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run</span>
        </button>

        <button
          onClick={() => setActivePanel(activePanel === "agent" ? "files" : "agent")}
          title="Open Nexora AI Agent"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activePanel === "agent"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          <span>AI Agent</span>
        </button>

        <button
          onClick={onOpenDeploy}
          title="Open Deploy Center"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all border border-slate-800"
        >
          <Rocket className="w-3.5 h-3.5 text-cyan-400" />
          <span>Deploy</span>
        </button>
      </div>

      {/* Right: Actions, Export, Shortcuts, User */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (Ctrl+K or Cmd+K)"
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs transition-colors"
        >
          <span>⌘K</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          title="Share Project URL"
          className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors relative"
        >
          <Share2 className="w-4 h-4" />
          {shareSuccess && (
            <span className="absolute -bottom-8 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
              Link Copied!
            </span>
          )}
        </button>

        {/* Export ZIP */}
        <button
          onClick={exportProjectZip}
          title="Export Project as ZIP archive"
          className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Settings (Theme, Editor, AI, Supabase)"
          className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Account / Profile */}
        <button
          onClick={onOpenAuth}
          title={user?.isAnonymous ? "Sign In / Connect Cloud" : `Signed in as ${user?.email}`}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 text-xs font-bold border border-slate-700">
            {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-3 h-3" />}
          </div>
          <span className="hidden xl:inline truncate max-w-[100px]">{user?.name || "Account"}</span>
        </button>
      </div>
    </header>
  );
};
