import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  FileCode,
  FolderPlus,
  Play,
  Save,
  Sparkles,
  Rocket,
  Download,
  Upload,
  Settings,
  Terminal,
  Moon,
  Sun,
  Layout,
  Layers,
  HelpCircle,
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { useSettings } from "../../context/SettingsContext";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeploy: () => void;
  onOpenSettings: () => void;
  onOpenDashboard: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenDeploy,
  onOpenSettings,
  onOpenDashboard,
}) => {
  const {
    createFile,
    createFolder,
    runPreview,
    exportProjectZip,
    setActivePanel,
    setViewMode,
    currentProject,
  } = useProject();

  const { settings, setTheme } = useSettings();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          setQuery("");
          setSelectedIndex(0);
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = [
    {
      id: "run",
      title: "Run Preview",
      category: "Execution",
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      action: () => {
        runPreview();
        onClose();
      },
    },
    {
      id: "ai_agent",
      title: "Open Nexora AI Agent",
      category: "AI",
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      action: () => {
        setActivePanel("agent");
        onClose();
      },
    },
    {
      id: "ai_assistant",
      title: "Open AI Chat Assistant",
      category: "AI",
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      action: () => {
        setActivePanel("ai");
        onClose();
      },
    },
    {
      id: "new_file",
      title: "New File",
      category: "Files",
      icon: <FileCode className="w-4 h-4 text-amber-400" />,
      action: () => {
        const name = prompt("Enter new file name (e.g. style.css, component.jsx):");
        if (name) createFile(name);
        onClose();
      },
    },
    {
      id: "new_folder",
      title: "New Folder",
      category: "Files",
      icon: <FolderPlus className="w-4 h-4 text-amber-400" />,
      action: () => {
        const name = prompt("Enter folder name (e.g. components, assets):");
        if (name) createFolder(name);
        onClose();
      },
    },
    {
      id: "deploy",
      title: "Deploy Project",
      category: "Deployment",
      icon: <Rocket className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onOpenDeploy();
        onClose();
      },
    },
    {
      id: "export_zip",
      title: "Export Project (ZIP)",
      category: "Export / Import",
      icon: <Download className="w-4 h-4 text-slate-300" />,
      action: () => {
        exportProjectZip();
        onClose();
      },
    },
    {
      id: "terminal",
      title: "Toggle Terminal Panel",
      category: "Tools",
      icon: <Terminal className="w-4 h-4 text-emerald-400" />,
      action: () => {
        setActivePanel("terminal");
        onClose();
      },
    },
    {
      id: "toggle_theme",
      title: settings.theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme",
      category: "Appearance",
      icon: settings.theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => {
        setTheme(settings.theme === "dark" ? "light" : "dark");
        onClose();
      },
    },
    {
      id: "settings",
      title: "Open Settings",
      category: "Preferences",
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      id: "dashboard",
      title: "Go to Dashboard / My Projects",
      category: "Navigation",
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onOpenDashboard();
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 sm:pt-28 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search action..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isSelected ? "text-white" : "text-slate-400"}>{cmd.icon}</span>
                    <span className="text-xs sm:text-sm font-medium">{cmd.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                      isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-950 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with ↑ ↓ and Enter</span>
          <span>Nexora Command System</span>
        </div>
      </div>
    </div>
  );
};
