import React, { useState } from "react";
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  Check,
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { ConsoleLogItem, LogLevel } from "../../types";

interface ConsolePaneProps {
  onFixErrorWithAI?: (err: ConsoleLogItem) => void;
}

export const ConsolePane: React.FC<ConsolePaneProps> = ({ onFixErrorWithAI }) => {
  const { consoleLogs, clearConsoleLogs, setActivePanel } = useProject();
  const [filterLevel, setFilterLevel] = useState<"all" | LogLevel>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const errorCount = consoleLogs.filter((l) => l.type === "error").length;
  const warnCount = consoleLogs.filter((l) => l.type === "warn").length;
  const logCount = consoleLogs.filter((l) => l.type === "log" || l.type === "info").length;

  const filteredLogs = consoleLogs.filter((log) => {
    if (filterLevel !== "all" && log.type !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const copyAllLogs = () => {
    const text = consoleLogs
      .map((l) => `[${l.type.toUpperCase()}] ${l.timestamp} - ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFixWithAI = (log: ConsoleLogItem) => {
    if (onFixErrorWithAI) {
      onFixErrorWithAI(log);
    } else {
      setActivePanel("agent");
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-300 text-xs select-none">
      {/* Console Header Bar */}
      <div className="h-9 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-200">Console</span>

          <div className="flex items-center gap-1 ml-2 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterLevel("all")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterLevel === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({consoleLogs.length})
            </button>
            <button
              onClick={() => setFilterLevel("error")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                filterLevel === "error" ? "bg-rose-950 text-rose-300 border border-rose-800" : "text-rose-400"
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>{errorCount}</span>
            </button>
            <button
              onClick={() => setFilterLevel("warn")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                filterLevel === "warn" ? "bg-amber-950 text-amber-300 border border-amber-800" : "text-amber-400"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{warnCount}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
            <Search className="w-3 h-3 mr-1" />
            <input
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[11px] text-white focus:outline-none w-20 sm:w-28"
            />
          </div>

          <button
            onClick={copyAllLogs}
            title="Copy Console Logs"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={clearConsoleLogs}
            title="Clear Console"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Output List */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-600">
            {consoleLogs.length === 0 ? "Console is empty. Run your project to view logs." : "No logs matching current filter."}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isError = log.type === "error";
            const isWarn = log.type === "warn";
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className={`p-2 rounded-lg border transition-all ${
                  isError
                    ? "bg-rose-950/40 border-rose-900/60 text-rose-200"
                    : isWarn
                    ? "bg-amber-950/40 border-amber-900/60 text-amber-200"
                    : "bg-slate-900/60 border-slate-800/80 text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {isError ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    )}

                    <div className="min-w-0 break-words whitespace-pre-wrap">
                      <span>{log.message}</span>
                      {(log.file || log.line) && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {log.file || "inline"}:{log.line || 1}:{log.col || 1}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isError && (
                      <button
                        onClick={() => handleFixWithAI(log)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Fix with AI</span>
                      </button>
                    )}

                    {log.stack && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Stack trace */}
                {isExpanded && log.stack && (
                  <div className="mt-2 p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 overflow-x-auto">
                    <pre>{log.stack}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
