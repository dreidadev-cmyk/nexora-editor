import React, { useState } from "react";
import { Search, Replace, FileCode, Check, ArrowRight } from "lucide-react";
import { useProject } from "../../context/ProjectContext";

export const GlobalSearch: React.FC = () => {
  const { currentProject, openFileInTab, updateFileContent } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [replacedNotice, setReplacedNotice] = useState<string | null>(null);

  interface MatchResult {
    fileId: string;
    fileName: string;
    filePath: string;
    lineNum: number;
    lineContent: string;
  }

  const results: MatchResult[] = [];

  if (searchTerm.trim() && currentProject) {
    for (const file of currentProject.files) {
      if (file.isFolder || !file.content) continue;

      const lines = file.content.split("\n");
      lines.forEach((line, idx) => {
        let isMatch = false;
        if (matchCase) {
          isMatch = wholeWord
            ? new RegExp(`\\b${searchTerm}\\b`).test(line)
            : line.includes(searchTerm);
        } else {
          isMatch = wholeWord
            ? new RegExp(`\\b${searchTerm}\\b`, "i").test(line)
            : line.toLowerCase().includes(searchTerm.toLowerCase());
        }

        if (isMatch) {
          results.push({
            fileId: file.id,
            fileName: file.name,
            filePath: file.path,
            lineNum: idx + 1,
            lineContent: line.trim(),
          });
        }
      });
    }
  }

  const handleReplaceAll = () => {
    if (!searchTerm.trim() || !currentProject) return;

    let modifiedCount = 0;
    for (const file of currentProject.files) {
      if (file.isFolder || !file.content) continue;

      let newContent = file.content;
      if (matchCase) {
        newContent = wholeWord
          ? newContent.replace(new RegExp(`\\b${searchTerm}\\b`, "g"), replaceTerm)
          : newContent.split(searchTerm).join(replaceTerm);
      } else {
        newContent = wholeWord
          ? newContent.replace(new RegExp(`\\b${searchTerm}\\b`, "gi"), replaceTerm)
          : newContent.replace(new RegExp(searchTerm, "gi"), replaceTerm);
      }

      if (newContent !== file.content) {
        updateFileContent(file.id, newContent);
        modifiedCount++;
      }
    }

    setReplacedNotice(`Replaced in ${modifiedCount} file(s).`);
    setTimeout(() => setReplacedNotice(null), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 text-xs select-none">
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
          Global Search & Replace
        </span>
      </div>

      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/40">
        {/* Search Input */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-500">
          <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search across project files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600"
          />
        </div>

        {/* Replace Input */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-500">
          <Replace className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600"
          />
        </div>

        {/* Options & Replace Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMatchCase(!matchCase)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                matchCase
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Match Case"
            >
              Aa
            </button>
            <button
              onClick={() => setWholeWord(!wholeWord)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                wholeWord
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Match Whole Word"
            >
              \b
            </button>
          </div>

          <button
            onClick={handleReplaceAll}
            disabled={!searchTerm.trim() || results.length === 0}
            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-[11px] transition-all"
          >
            Replace All
          </button>
        </div>

        {replacedNotice && (
          <div className="text-[11px] text-emerald-400 font-medium text-center">
            ✓ {replacedNotice}
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 text-[11px] text-slate-400">
          {searchTerm.trim()
            ? `${results.length} result(s) in ${new Set(results.map((r) => r.filePath)).size} file(s)`
            : "Type a query to search."}
        </div>

        {results.map((res, idx) => (
          <div
            key={idx}
            onClick={() => openFileInTab(res.fileId)}
            className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/60 cursor-pointer transition-colors space-y-1"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-200 truncate">{res.filePath}</span>
              <span className="text-slate-400 font-mono">Line {res.lineNum}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate bg-slate-900 p-1 rounded">
              {res.lineContent}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
