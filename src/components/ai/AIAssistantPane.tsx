import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Copy, Check, RotateCcw, Bot, User, ArrowDownToLine } from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { AIMessage } from "../../types";
import { apiUrl, appConfig } from "../../config";

export const AIAssistantPane: React.FC = () => {
  const { currentProject, activeFile, updateFileContent, runPreview } = useProject();
  const [messages, setMessages] = useState<AIMessage[]>([
    { id: "msg_init", role: "assistant", content: "Hello! I am your **Nexora AI Assistant**. I can write code, explain components, debug errors, and suggest improvements. What would you like to build today?", timestamp: new Date().toISOString() },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const quickPrompts = [
    { label: "Explain Active File", prompt: "Explain how the current active file works and its key functions." },
    { label: "Add Dark Mode Toggle", prompt: "Add a modern dark/light mode toggle with smooth Tailwind classes." },
    { label: "Refactor & Clean Code", prompt: "Review the active file for performance optimizations and clean code improvements." },
    { label: "Find Potential Bugs", prompt: "Inspect the project for syntax mistakes, unhandled edge cases, or broken event handlers." },
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AIMessage = { id: `msg_${Date.now()}`, role: "user", content: textToSend.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputValue("");
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);
      const res = await fetch(apiUrl(appConfig.aiAssistantPath), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: textToSend.trim(),
          context: {
            activeFileName: activeFile?.name,
            activeFileContent: activeFile?.content,
            allFiles: currentProject?.files.map((f) => ({ path: f.path, language: f.language, isFolder: f.isFolder })),
          },
        }),
      });
      window.clearTimeout(timeout);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI Assistant service error");

      setMessages((prev) => [...prev, { id: `msg_${Date.now()}`, role: "assistant", content: data.reply || "I have analyzed your request.", timestamp: new Date().toISOString() }]);
    } catch (err: any) {
      const message = err?.name === "AbortError" ? "AI request timed out." : (err.message || "Failed to reach AI backend.");
      setMessages((prev) => [...prev, { id: `msg_${Date.now()}`, role: "assistant", content: `⚠️ **Error communicating with AI Assistant:**\n${message}`, timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    window.setTimeout(() => setCopiedIndex(null), appConfig.clipboardResetMs);
  };

  const extractAndApplyCode = (content: string) => {
    if (!activeFile) return;
    const match = content.match(/```(?:[a-z]+)?\n([\s\S]*?)```/);
    updateFileContent(activeFile.id, match?.[1] || content);
    runPreview();
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 text-xs select-none">
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200"><Sparkles className="w-4 h-4 text-indigo-400" /><span>AI Assistant</span></div>
        <button onClick={() => setMessages([{ id: "msg_init", role: "assistant", content: "Chat cleared. What can I help you with?", timestamp: new Date().toISOString() }])} title="Clear Chat History" className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"><RotateCcw className="w-3.5 h-3.5" /></button>
      </div>
      <div className="p-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        {quickPrompts.map((qp, idx) => <button key={idx} onClick={() => handleSendMessage(qp.prompt)} disabled={isLoading} className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/80 hover:text-indigo-300 text-[11px] whitespace-nowrap transition-all">{qp.label}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const hasCode = msg.content.includes("```");
          return <div key={msg.id} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow"><Bot className="w-3.5 h-3.5" /></div>}
            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${isUser ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"}`}>
              <div className="whitespace-pre-wrap select-text">{msg.content}</div>
              {!isUser && <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-800/60">
                <button onClick={() => copyToClipboard(msg.content, idx)} title="Copy response" className="p-1 rounded text-slate-400 hover:text-white">{copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}</button>
                {hasCode && activeFile && <button onClick={() => extractAndApplyCode(msg.content)} title="Apply code snippet to current active file" className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-medium transition-all"><ArrowDownToLine className="w-3 h-3" /><span>Apply to {activeFile.name}</span></button>}
              </div>}
            </div>
            {isUser && <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5"><User className="w-3.5 h-3.5" /></div>}
          </div>;
        })}
        {isLoading && <div className="flex items-center gap-2 text-indigo-400 text-xs p-2 bg-slate-950 rounded-xl border border-slate-800 max-w-[200px]"><Sparkles className="w-4 h-4 animate-spin" /><span>AI is crafting code...</span></div>}
        <div ref={chatBottomRef} />
      </div>
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
          <input type="text" placeholder="Ask AI anything or request code changes..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isLoading} className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600" />
          <button type="submit" disabled={!inputValue.trim() || isLoading} className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-white transition-all shadow-md shadow-indigo-600/30"><Send className="w-4 h-4" /></button>
        </form>
      </div>
    </div>
  );
};
