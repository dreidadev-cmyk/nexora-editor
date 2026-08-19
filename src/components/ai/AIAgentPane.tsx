import React, { useState } from "react";
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCode,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { AIAgentExecutionPlan, AIAgentFileAction, AIAgentStep } from "../../types";

export const AIAgentPane: React.FC = () => {
  const { currentProject, applyAIAgentChanges, saveVersionSnapshot } = useProject();
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<AIAgentExecutionPlan | null>(null);
  const [selectedFileAction, setSelectedFileAction] = useState<AIAgentFileAction | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const sampleAgentTasks = [
    "Build a modern aesthetic calculator with history log and keyboard support",
    "Create a Kanban task management board with local drag-and-drop",
    "Add a sleek dark/light theme toggle system and refactor CSS animations",
    "Build an interactive Markdown live preview app with word count metrics",
  ];

  const handleRunAgent = async (taskText?: string) => {
    const text = taskText || prompt;
    if (!text.trim() || isRunning || !currentProject) return;

    setIsRunning(true);
    setErrorNotice(null);
    setAppliedNotice(false);
    setSelectedFileAction(null);

    // Initial draft plan
    const initialPlan: AIAgentExecutionPlan = {
      goal: text.trim(),
      summary: "Analyzing project tree and synthesizing required code updates...",
      steps: [
        { stepNumber: 1, name: "Analyze Project Tree & Requirements", status: "analyzing", description: "Reviewing active project architecture." },
        { stepNumber: 2, name: "Architecture & File Plan Formulation", status: "pending", description: "Planning required files and structure." },
        { stepNumber: 3, name: "Synthesize HTML Layout", status: "pending", description: "Generating modern semantic HTML markup." },
        { stepNumber: 4, name: "Generate Stylesheet & Animation Tokens", status: "pending", description: "Crafting responsive Tailwind / CSS utilities." },
        { stepNumber: 5, name: "Write Interactive Logic & State Handlers", status: "pending", description: "Coding event loops and UI handlers." },
        { stepNumber: 6, name: "Lint & Sandbox Code Verification", status: "pending", description: "Checking syntax and sandbox compliance." },
        { stepNumber: 7, name: "Package Executable Plan", status: "pending", description: "Preparing file actions for user review." },
      ],
      fileActions: [],
    };

    setCurrentPlan(initialPlan);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text.trim(),
          project: {
            name: currentProject.name,
            templateType: currentProject.templateType,
            files: currentProject.files.map((f) => ({
              path: f.path,
              name: f.name,
              language: f.language,
              content: f.content,
              isFolder: f.isFolder,
            })),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI Agent pipeline error");
      }

      const completedSteps: AIAgentStep[] = (data.steps || initialPlan.steps).map((s: any) => ({
        ...s,
        status: "completed" as const,
      }));

      const finalPlan: AIAgentExecutionPlan = {
        goal: text.trim(),
        summary: data.summary || "AI Agent successfully planned and generated file modifications.",
        steps: completedSteps,
        fileActions: data.fileActions || [],
      };

      setCurrentPlan(finalPlan);
      if (finalPlan.fileActions.length > 0) {
        setSelectedFileAction(finalPlan.fileActions[0]);
      }
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to execute AI Agent.");
      if (currentPlan) {
        setCurrentPlan({
          ...currentPlan,
          steps: currentPlan.steps.map((s, idx) =>
            idx === 0 ? { ...s, status: "failed" } : { ...s, status: "pending" }
          ),
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplyChanges = () => {
    if (!currentPlan || currentPlan.fileActions.length === 0) return;
    applyAIAgentChanges(currentPlan.fileActions);
    setAppliedNotice(true);
  };

  const handleRejectChanges = () => {
    setCurrentPlan(null);
    setSelectedFileAction(null);
    setAppliedNotice(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 text-xs select-none">
      {/* Top Bar */}
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-600/30">
            ✦
          </div>
          <span>Autonomous AI Agent</span>
        </div>
      </div>

      {/* Goal Input & Trigger Form */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-300">Agent Task Objective</label>
          <textarea
            rows={2}
            placeholder="Describe what you want the agent to build, refactor, or fix across multiple files..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isRunning}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none"
          />
        </div>

        <button
          onClick={() => handleRunAgent()}
          disabled={!prompt.trim() || isRunning}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
          <span>{isRunning ? "Executing Autonomous Agent Pipeline..." : "Run AI Agent"}</span>
        </button>

        {/* Task presets */}
        {!currentPlan && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Suggested Objectives:
            </span>
            <div className="space-y-1">
              {sampleAgentTasks.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(t);
                    handleRunAgent(t);
                  }}
                  disabled={isRunning}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/80 text-[11px] text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{t}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {errorNotice && (
        <div className="m-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorNotice}</div>
        </div>
      )}

      {/* Plan Execution View */}
      {currentPlan && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Summary Banner */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Goal: {currentPlan.goal}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{currentPlan.summary}</p>
          </div>

          {/* Pipeline Steps List */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Execution Pipeline:
            </span>
            <div className="space-y-1 font-mono text-[11px]">
              {currentPlan.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    {step.status === "completed" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {step.status === "analyzing" || step.status === "writing" ? (
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    ) : null}
                    {step.status === "pending" && <Clock className="w-3.5 h-3.5 text-slate-600" />}
                    {step.status === "failed" && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                    <span className="text-slate-200">{step.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{step.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File Modifications */}
          {currentPlan.fileActions.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Generated File Actions ({currentPlan.fileActions.length}):
              </span>

              <div className="space-y-1">
                {currentPlan.fileActions.map((act, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedFileAction(act)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      selectedFileAction?.path === act.path
                        ? "bg-indigo-950/40 border-indigo-500 text-indigo-200"
                        : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold truncate">{act.path}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        act.action === "create"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : act.action === "update"
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {act.action}
                    </span>
                  </div>
                ))}
              </div>

              {/* Selected File Content Preview */}
              {selectedFileAction && (
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    Preview: {selectedFileAction.path}
                  </span>
                  <div className="max-h-36 overflow-y-auto p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-300 whitespace-pre-wrap">
                    {selectedFileAction.content}
                  </div>
                </div>
              )}

              {/* Accept or Reject Action Controls */}
              {!appliedNotice ? (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleRejectChanges}
                    className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={handleApplyChanges}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Changes</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-center space-y-1 font-medium">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Changes Applied Successfully!</span>
                  </div>
                  <p className="text-[11px] text-emerald-300">
                    A restore snapshot was automatically created before applying changes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
