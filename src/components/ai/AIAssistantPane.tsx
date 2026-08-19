import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Copy, Check, RotateCcw, Bot, User, ArrowDownToLine, KeyRound, X, Eye, EyeOff } from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { AIMessage } from "../../types";
import { apiUrl, appConfig } from "../../config";

const AI_KEY_STORAGE = "nexora_ai_api_key";

export const AIAssistantPane: React.FC = () => {
  const { currentProject, activeFile, updateFileContent, runPreview } = useProject();
  const [messages, setMessages] = useState<AIMessage[]>([{ id: "msg_init", role: "assistant", content: "Hello! I am your **Nexora AI Assistant**. Add your own AI API key to start. Your key is stored only in this browser and is sent only when you make an AI request.", timestamp: new Date().toISOString() }]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(AI_KEY_STORAGE) || "");
  const [keyDraft, setKeyDraft] = useState(() => localStorage.getItem(AI_KEY_STORAGE) || "");
  const [showKey, setShowKey] = useState(false);
  const [showKeySettings, setShowKeySettings] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const saveApiKey = () => {
    const value = keyDraft.trim();
    if (value) { localStorage.setItem(AI_KEY_STORAGE, value); setApiKey(value); }
    else { localStorage.removeItem(AI_KEY_STORAGE); setApiKey(""); }
    setShowKeySettings(false);
  };
  const clearApiKey = () => { localStorage.removeItem(AI_KEY_STORAGE); setApiKey(""); setKeyDraft(""); setShowKeySettings(false); };

  const quickPrompts = [
    { label: "Explain Active File", prompt: "Explain how the current active file works and its key functions." },
    { label: "Add Dark Mode Toggle", prompt: "Add a modern dark/light mode toggle with smooth Tailwind classes." },
    { label: "Refactor & Clean Code", prompt: "Review the active file for performance optimizations and clean code improvements." },
    { label: "Find Potential Bugs", prompt: "Inspect the project for syntax mistakes, unhandled edge cases, or broken event handlers." },
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if (!textToSend.trim() || isLoading) return;
    if (!apiKey) { setShowKeySettings(true); return; }
    const userMsg: AIMessage = { id: `msg_${Date.now()}`, role: "user", content: textToSend.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputValue("");
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);
      const res = await fetch(apiUrl(appConfig.aiAssistantPath), {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Nexora-AI-Key": apiKey },
        signal: controller.signal,
        body: JSON.stringify({ prompt: textToSend.trim(), context: { name: currentProject?.name, activeFileName: activeFile?.name, activeFileContent: activeFile?.content, allFiles: currentProject?.files.map((f) => ({ path: f.path, name: f.name, language: f.language, content: f.content, isFolder: f.isFolder })) } }),
      });
      window.clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI Assistant service error");
      setMessages((prev) => [...prev, { id: `msg_${Date.now()}`, role: "assistant", content: data.reply || "I have analyzed your request.", timestamp: new Date().toISOString() }]);
    } catch (err: any) {
      const message = err?.name === "AbortError" ? "AI request timed out." : (err.message || "Failed to reach AI backend.");
      setMessages((prev) => [...prev, { id: `msg_${Date.now()}`, role: "assistant", content: `⚠️ **Error communicating with AI Assistant:**\n${message}`, timestamp: new Date().toISOString() }]);
    } finally { setIsLoading(false); }
  };

  const copyToClipboard = (text: string, idx: number) => { navigator.clipboard.writeText(text); setCopiedIndex(idx); window.setTimeout(() => setCopiedIndex(null), appConfig.clipboardResetMs); };
  const extractAndApplyCode = (content: string) => { if (!activeFile) return; const match = content.match(/```(?:[a-z]+)?\n([\s\S]*?)```/); updateFileContent(activeFile.id, match?.[1] || content); runPreview(); };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 text-xs select-none">
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200"><Sparkles className="w-4 h-4 text-indigo-400" /><span>AI Assistant</span>{apiKey && <span title="Your own API key is configured" className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowKeySettings(true)} title="Configure your AI API key" className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"><KeyRound className="w-3.5 h-3.5" /></button>
          <button onClick={() => setMessages([{ id: "msg_init", role: "assistant", content: "Chat cleared. What can I help you with?", timestamp: new Date().toISOString() }])} title="Clear Chat History" className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"><RotateCcw className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {!apiKey && <button onClick={() => setShowKeySettings(true)} className="mx-3 mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/70 text-left hover:border-amber-600 transition-colors"><div className="flex items-center gap-2 text-amber-300 font-semibold"><KeyRound className="w-4 h-4" /> Add your AI API key</div><p className="text-[10px] text-amber-200/70 mt-1">Nexora does not provide or store an AI provider key. Use your own key.</p></button>}
      <div className="p-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        {quickPrompts.map((qp, idx) => <button key={idx} onClick={() => handleSendMessage(qp.prompt)} disabled={isLoading} className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/80 hover:text-indigo-300 text-[11px] whitespace-nowrap transition-all">{qp.label}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, idx) => { const isUser = msg.role === "user"; const hasCode = msg.content.includes("```"); return <div key={msg.id} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
          {!isUser && <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow"><Bot className="w-3.5 h-3.5" /></div>}
          <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${isUser ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"}`}>
            <div className="whitespace-pre-wrap select-text">{msg.content}</div>
            {!isUser && <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-800/60"><button onClick={() => copyToClipboard(msg.content, idx)} title="Copy response" className="p-1 rounded text-slate-400 hover:text-white">{copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}</button>{hasCode && activeFile && <button onClick={() => extractAndApplyCode(msg.content)} title="Apply code snippet to current active file" className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-medium transition-all"><ArrowDownToLine className="w-3 h-3" /><span>Apply to {activeFile.name}</span></button>}</div>}
          </div>
          {isUser && <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5"><User className="w-3.5 h-3.5" /></div>}
        </div>; })}
        {isLoading && <div className="flex items-center gap-2 text-indigo-400 text-xs p-2 bg-slate-950 rounded-xl border border-slate-800 max-w-[200px]"><Sparkles className="w-4 h-4 animate-spin" /><span>AI is crafting code...</span></div>}
        <div ref={chatBottomRef} />
      </div>
      <div className="p-3 bg-slate-950 border-t border-slate-800"><form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2"><input type="text" placeholder={apiKey ? "Ask AI anything or request code changes..." : "Add your API key to use AI..."} value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isLoading || !apiKey} className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600" /><button type="submit" disabled={!inputValue.trim() || isLoading || !apiKey} className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-white transition-all shadow-md shadow-indigo-600/30"><Send className="w-4 h-4" /></button></form></div>

      {showKeySettings && <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowKeySettings(false)}><div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><div><h3 className="text-sm font-bold text-white flex items-center gap-2"><KeyRound className="w-4 h-4 text-indigo-400" /> Your AI API Key</h3><p className="text-[10px] text-slate-400 mt-1">Nexora does not provide a shared AI key. Enter your own provider key.</p></div><button onClick={() => setShowKeySettings(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button></div>
        <div className="relative"><input type={showKey ? "text" : "password"} value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} placeholder="Paste your Gemini API key" autoComplete="off" className="w-full px-3 py-2.5 pr-10 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500" /><button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-2 top-2.5 text-slate-500 hover:text-white">{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">Your key is stored in this browser's local storage and is sent to the Nexora AI endpoint only with your request. Nexora does not persist it server-side. Never use a key you do not own or have permission to use.</div>
        <div className="flex justify-between mt-4"><button onClick={clearApiKey} disabled={!keyDraft} className="px-3 py-2 rounded-lg border border-rose-900/70 text-rose-300 hover:bg-rose-950/40 text-xs">Remove Key</button><button onClick={saveApiKey} disabled={!keyDraft.trim()} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs">Save Key</button></div>
      </div></div>}
    </div>
  );
};
