import React, { useState, useRef } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  Plus,
  FolderPlus,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Upload,
  Download,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { ProjectFile } from "../../types";

export const FileExplorer: React.FC = () => {
  const {
    currentProject,
    activeFile,
    openFileInTab,
    createFile,
    createFolder,
    deleteFile,
    renameFile,
    duplicateFile,
    importProjectZip,
    exportProjectZip,
  } = useProject();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{
    fileId: string;
    x: number;
    y: number;
  } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [showNewModal, setShowNewModal] = useState<"file" | "folder" | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [targetParentPath, setTargetParentPath] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.isFolder) {
      return expandedFolders[file.path] ? (
        <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
      );
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "html":
        return <span className="text-xs font-bold text-orange-400 shrink-0">H</span>;
      case "css":
        return <span className="text-xs font-bold text-cyan-400 shrink-0">#</span>;
      case "js":
      case "mjs":
        return <span className="text-xs font-bold text-yellow-400 shrink-0">JS</span>;
      case "ts":
        return <span className="text-xs font-bold text-blue-400 shrink-0">TS</span>;
      case "jsx":
      case "tsx":
        return <span className="text-xs font-bold text-cyan-300 shrink-0">⚛</span>;
      case "json":
        return <FileJson className="w-4 h-4 text-amber-300 shrink-0" />;
      case "md":
        return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
      default:
        return <FileCode className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (showNewModal === "file") {
      createFile(newItemName.trim(), targetParentPath || undefined);
    } else if (showNewModal === "folder") {
      createFolder(newItemName.trim(), targetParentPath || undefined);
      setExpandedFolders((prev) => ({
        ...prev,
        [targetParentPath ? `${targetParentPath}/${newItemName.trim()}` : newItemName.trim()]: true,
      }));
    }
    setShowNewModal(null);
    setNewItemName("");
    setTargetParentPath("");
  };

  const handleRenameSubmit = (fileId: string) => {
    if (renameInput.trim()) {
      renameFile(fileId, renameInput.trim());
    }
    setRenamingId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".zip")) {
        importProjectZip(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          createFile(file.name, targetParentPath || undefined, content);
        };
        reader.readAsText(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Build tree data from flat list
  const files = currentProject?.files || [];

  return (
    <div
      className="h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none text-slate-300 text-xs"
      onClick={() => setContextMenu(null)}
    >
      {/* Explorer Top Toolbar */}
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
          Files
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setTargetParentPath("");
              setShowNewModal("file");
            }}
            title="New File"
            className="p-1 rounded hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setTargetParentPath("");
              setShowNewModal("folder");
            }}
            title="New Folder"
            className="p-1 rounded hover:bg-slate-800 hover:text-white transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import File or ZIP archive"
            className="p-1 rounded hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".zip,.html,.css,.js,.ts,.jsx,.tsx,.json,.md,.txt"
      />

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <p>No files in project.</p>
            <button
              onClick={() => setShowNewModal("file")}
              className="mt-2 text-indigo-400 hover:underline text-xs"
            >
              + Create index.html
            </button>
          </div>
        ) : (
          files.map((file) => {
            const isActive = activeFile?.id === file.id;
            const isRenaming = renamingId === file.id;

            return (
              <div
                key={file.id}
                onClick={() => {
                  if (file.isFolder) {
                    toggleFolder(file.path);
                  } else {
                    openFileInTab(file.id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ fileId: file.id, x: e.clientX, y: e.clientY });
                }}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 font-medium"
                    : "hover:bg-slate-800/60 text-slate-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {file.isFolder && (
                    <span className="text-slate-500">
                      {expandedFolders[file.path] ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                  {getFileIcon(file)}

                  {isRenaming ? (
                    <input
                      type="text"
                      autoFocus
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      onBlur={() => handleRenameSubmit(file.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit(file.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-950 px-1 py-0.5 rounded border border-indigo-500 text-xs text-white focus:outline-none w-full"
                    />
                  ) : (
                    <span className="truncate">{file.name}</span>
                  )}
                </div>

                {/* Hover action menu trigger */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu({
                        fileId: file.id,
                        x: e.currentTarget.getBoundingClientRect().right,
                        y: e.currentTarget.getBoundingClientRect().bottom,
                      });
                    }}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New File / Folder Inline Modal */}
      {showNewModal && (
        <div className="p-3 border-t border-slate-800 bg-slate-950">
          <form onSubmit={handleCreateSubmit} className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-300">
              Create New {showNewModal === "file" ? "File" : "Folder"}
            </span>
            <input
              type="text"
              autoFocus
              placeholder={showNewModal === "file" ? "e.g. style.css, App.jsx" : "e.g. components"}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-indigo-500 rounded text-white focus:outline-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowNewModal(null);
                  setNewItemName("");
                }}
                className="px-2 py-1 rounded bg-slate-800 text-[11px] text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-indigo-600 text-white font-semibold text-[11px]"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Context Menu Popup */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 text-xs text-slate-200 min-w-[140px]"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 150), left: Math.min(contextMenu.x, window.innerWidth - 160) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const file = files.find((f) => f.id === contextMenu.fileId);
              if (file) {
                setRenameInput(file.name);
                setRenamingId(file.id);
              }
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Rename</span>
          </button>

          <button
            onClick={() => {
              duplicateFile(contextMenu.fileId);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Duplicate</span>
          </button>

          <div className="h-px bg-slate-800 my-1"></div>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this file?")) {
                deleteFile(contextMenu.fileId);
              }
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/60 text-rose-400 text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
