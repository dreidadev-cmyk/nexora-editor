import React, { useRef, useEffect, useState } from "react";
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import {
  X,
  FileCode,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  Code2,
  Copy,
  Terminal as TerminalIcon,
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { useSettings } from "../../context/SettingsContext";

export const MonacoEditorPane: React.FC = () => {
  const {
    currentProject,
    activeFile,
    openTabs,
    setActiveFile,
    closeTab,
    openFileInTab,
    updateFileContent,
    runPreview,
    isMobile,
  } = useProject();

  const { settings } = useSettings();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      runPreview();
    });

    editor.focus();
  };

  const handleContentChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.id, value);
    }
  };

  const getMonacoLanguage = (lang: string): string => {
    switch (lang) {
      case "javascript":
      case "jsx":
        return "javascript";
      case "typescript":
      case "tsx":
        return "typescript";
      case "html":
        return "html";
      case "css":
        return "css";
      case "json":
        return "json";
      case "markdown":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  };

  const copyFileContent = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mobile quick symbol inserter
  const insertSymbol = (sym: string) => {
    if (!editorRef.current) return;
    const selection = editorRef.current.getSelection();
    const id = { major: 1, minor: 1 };
    const text = sym;
    const op = { identifier: id, range: selection, text: text, forceMoveMarkers: true };
    editorRef.current.executeEdits("mobile_toolbar", [op]);
    editorRef.current.focus();
  };

  const quickSymbols = [
    { label: "< >", insert: "<>" },
    { label: "</>", insert: "</>" },
    { label: "{ }", insert: "{}" },
    { label: "( )", insert: "()" },
    { label: "[ ]", insert: "[]" },
    { label: "=>", insert: " => " },
    { label: '" "', insert: '""' },
    { label: ";", insert: ";" },
    { label: "=", insert: " = " },
    { label: "$", insert: "$" },
    { label: "const", insert: "const " },
    { label: "let", insert: "let " },
    { label: "function", insert: "function " },
    { label: "return", insert: "return " },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Multi-file Tabs Bar */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2 select-none overflow-x-auto scrollbar-none shrink-0">
        <div className="flex items-center gap-1 min-w-0">
          {openTabs.map((tab) => {
            const file = currentProject?.files.find((f) => f.id === tab.fileId);
            if (!file) return null;
            const isActive = activeFile?.id === file.id;

            return (
              <div
                key={file.id}
                onClick={() => openFileInTab(file.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer border-t-2 transition-all shrink-0 ${
                  isActive
                    ? "bg-slate-950 border-indigo-500 text-slate-100 font-medium"
                    : "bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{file.name}</span>
                {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-slate-800 p-0.5 rounded text-slate-400 hover:text-white transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Editor Actions Right */}
        <div className="flex items-center gap-1 shrink-0 pl-2">
          {activeFile && (
            <>
              <button
                onClick={formatCode}
                title="Format Document (Shift+Alt+F)"
                className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:inline"
              >
                Format
              </button>
              <button
                onClick={copyFileContent}
                title="Copy File Contents"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 min-h-0 relative">
        {activeFile ? (
          <Editor
            height="100%"
            language={getMonacoLanguage(activeFile.language)}
            value={activeFile.content}
            onChange={handleContentChange}
            onMount={handleEditorDidMount}
            theme={settings.theme === "light" ? "light" : "vs-dark"}
            options={{
              fontSize: settings.fontSize || 14,
              tabSize: settings.tabSize || 2,
              minimap: { enabled: !isMobile && settings.minimap },
              wordWrap: settings.wordWrap ? "on" : "off",
              lineNumbers: settings.lineNumbers ? "on" : "off",
              fontLigatures: settings.fontLigatures,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 24 },
              renderLineHighlight: "all",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              formatOnPaste: settings.formatOnSave,
              bracketPairColorization: { enabled: true },
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Code2 className="w-12 h-12 mb-3 text-slate-700 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-400 mb-1">No File Selected</p>
            <p className="text-xs text-slate-600 max-w-xs">
              Select a file from the explorer or create a new file to begin writing code.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Quick Symbol Toolbar */}
      <div className="h-10 bg-slate-900 border-t border-slate-800 flex items-center px-2 gap-1 overflow-x-auto scrollbar-none select-none shrink-0 z-10 md:hidden">
        {quickSymbols.map((item) => (
          <button
            key={item.label}
            onClick={() => insertSymbol(item.insert)}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 active:bg-indigo-600 active:text-white transition-all shrink-0"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
