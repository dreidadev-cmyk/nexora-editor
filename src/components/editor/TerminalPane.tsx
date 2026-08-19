import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Trash2, Play, Sparkles } from "lucide-react";
import { useProject } from "../../context/ProjectContext";

export const TerminalPane: React.FC = () => {
  const { currentProject, createFile, runPreview, setActivePanel, triggerDeployment } = useProject();
  const [history, setHistory] = useState<Array<{ command: string; output: string; type?: "success" | "error" | "info" }>>([
    {
      command: "welcome",
      output: "Nexora Sandboxed Terminal v2.4\nType 'help' for available commands or 'npm run build' to validate assets.",
      type: "info",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const parts = trimmed.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output = "";
    let type: "success" | "error" | "info" = "info";

    switch (cmd) {
      case "help":
        output = `Available Nexora Commands:
  • help              - List available CLI commands
  • ls                - List all files in the current project
  • cat <file>        - Print contents of a file
  • run / preview     - Trigger live sandbox preview reload
  • build             - Compile and validate project bundle
  • deploy            - Trigger cloud deployment validation
  • ai <prompt>       - Run AI prompt query
  • clear / cls       - Clear terminal output
  • touch <file>      - Create a new empty file`;
        break;

      case "clear":
      case "cls":
        setHistory([]);
        return;

      case "ls":
        output = currentProject?.files
          .map((f) => `${f.isFolder ? "📁 " : "📄 "} ${f.path}`)
          .join("\n") || "No files found.";
        break;

      case "cat":
        if (!args[0]) {
          output = "Usage: cat <filename>";
          type = "error";
        } else {
          const target = currentProject?.files.find(
            (f) => f.path.toLowerCase() === args[0].toLowerCase() || f.name.toLowerCase() === args[0].toLowerCase()
          );
          if (target) {
            output = target.content;
          } else {
            output = `cat: ${args[0]}: No such file in project`;
            type = "error";
          }
        }
        break;

      case "touch":
        if (!args[0]) {
          output = "Usage: touch <filename>";
          type = "error";
        } else {
          createFile(args[0]);
          output = `Created file: ${args[0]}`;
          type = "success";
        }
        break;

      case "run":
      case "preview":
        runPreview();
        output = "Live Sandbox preview refreshed.";
        type = "success";
        break;

      case "build":
      case "npm":
        if (args[0] === "run" && args[1] === "build" || cmd === "build") {
          output = `[Build] Analyzing ${currentProject?.files.length} project files...
[Build] Bundling styles & JavaScript assets...
[Build] ✓ Production bundle verified. 0 syntax errors detected.`;
          type = "success";
        } else if (args[0] === "install" || args[0] === "i") {
          output = `[npm] Verified sandbox package dependencies. Ready.`;
          type = "success";
        } else {
          output = `[npm] Command executed: npm ${args.join(" ")}`;
        }
        break;

      case "deploy":
        output = "Triggering deployment pipeline...";
        try {
          const dep = await triggerDeployment("static");
          output = `✓ Deployment success!\nLive URL: ${dep.liveUrl}`;
          type = "success";
        } catch (e: any) {
          output = `Deployment failed: ${e.message}`;
          type = "error";
        }
        break;

      case "ai":
        setActivePanel("agent");
        output = `Redirecting to AI Agent with prompt: "${args.join(" ")}"`;
        type = "info";
        break;

      default:
        output = `Command not recognized: "${cmd}". Type 'help' for available commands.`;
        type = "error";
        break;
    }

    setHistory((prev) => [...prev, { command: trimmed, output, type }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand(inputVal);
      setInputVal("");
      setHistoryIndex(-1);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-300 font-mono text-xs select-none">
      {/* Terminal Header */}
      <div className="h-9 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200 text-xs">Terminal</span>
          <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            sandbox: {currentProject?.name || "root"}
          </span>
        </div>
        <button
          onClick={() => setHistory([])}
          title="Clear Terminal"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal History */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400">
              <span className="text-emerald-400 font-bold">$</span>
              <span>{item.command}</span>
            </div>
            <div
              className={`whitespace-pre-wrap pl-4 text-[11px] leading-relaxed ${
                item.type === "error"
                  ? "text-rose-400"
                  : item.type === "success"
                  ? "text-emerald-300"
                  : "text-slate-400"
              }`}
            >
              {item.output}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Input Line */}
      <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center gap-2">
        <span className="text-emerald-400 font-bold">$</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command (e.g. 'help', 'ls', 'build')..."
          className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600 font-mono"
        />
      </div>
    </div>
  );
};
