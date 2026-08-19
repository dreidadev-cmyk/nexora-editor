import React, { useState } from "react";
import {
  Settings,
  X,
  Moon,
  Sun,
  Code2,
  Database,
  Smartphone,
  Shield,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { AppTheme } from "../../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, setTheme, resetSettings } = useSettings();
  const { user, isSupabaseActive, updateSupabaseCredentials, deleteAccount } = useAuth();

  const [activeTab, setActiveTab] = useState<"editor" | "theme" | "supabase" | "android" | "account">("editor");

  const [supabaseUrlInput, setSupabaseUrlInput] = useState(
    localStorage.getItem("nexora_supabase_url") || ""
  );
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(
    localStorage.getItem("nexora_supabase_key") || ""
  );
  const [supabaseSaved, setSupabaseSaved] = useState(false);

  if (!isOpen) return null;

  const themes: Array<{ id: AppTheme; name: string; desc: string; bg: string }> = [
    { id: "dark", name: "Slate Dark", desc: "Default balanced deep slate theme", bg: "bg-slate-900 border-indigo-500" },
    { id: "light", name: "High-Contrast Light", desc: "Crisp white background for daylight", bg: "bg-slate-100 border-slate-300 text-slate-900" },
    { id: "amoled", name: "AMOLED Pitch Black", desc: "Pure #000000 for OLED mobile screens", bg: "bg-black border-slate-700" },
    { id: "nord", name: "Nordic Arctic", desc: "Soothing icy cyan and muted blue palette", bg: "bg-[#2e3440] border-[#88c0d0]" },
    { id: "cyberpunk", name: "Cyberpunk Glow", desc: "High-energy neon yellow and purple aesthetic", bg: "bg-[#120420] border-[#ffee00]" },
  ];

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
    setSupabaseSaved(true);
    setTimeout(() => setSupabaseSaved(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">Preferences & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-4 gap-2 bg-slate-950/30 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab("editor")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "editor"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab("theme")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "theme"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Themes
          </button>
          <button
            onClick={() => setActiveTab("supabase")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "supabase"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Supabase Auth & DB</span>
            {isSupabaseActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>
          <button
            onClick={() => setActiveTab("android")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "android"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Android (Capacitor)
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "account"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Account & Danger
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs">
          {/* EDITOR TAB */}
          {activeTab === "editor" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 text-xs block">Font Size</span>
                  <span className="text-[11px] text-slate-400">Monaco code font size: {settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={11}
                  max={22}
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                  className="w-32 accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 text-xs block">Tab Size</span>
                  <span className="text-[11px] text-slate-400">Indentation spacing</span>
                </div>
                <div className="flex gap-1.5">
                  {[2, 4].map((size) => (
                    <button
                      key={size}
                      onClick={() => updateSettings({ tabSize: size })}
                      className={`px-3 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                        settings.tabSize === size
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      {size} spaces
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 text-xs block">Code Minimap</span>
                  <span className="text-[11px] text-slate-400">Display mini overview scrollbar on desktop</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.minimap}
                  onChange={(e) => updateSettings({ minimap: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 text-xs block">Word Wrap</span>
                  <span className="text-[11px] text-slate-400">Wrap long lines to fit viewport width</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 text-xs block">Line Numbers</span>
                  <span className="text-[11px] text-slate-400">Show line gutter numbers</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.lineNumbers}
                  onChange={(e) => updateSettings({ lineNumbers: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 text-xs block">Font Ligatures</span>
                  <span className="text-[11px] text-slate-400">Render code symbols like =&gt;, !=, ===</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.fontLigatures}
                  onChange={(e) => updateSettings({ fontLigatures: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* THEMES TAB */}
          {activeTab === "theme" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Choose Workspace Theme:</label>
              <div className="space-y-2">
                {themes.map((th) => (
                  <div
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      settings.theme === th.id
                        ? "bg-indigo-950/40 border-indigo-500 shadow-md"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-100">{th.name}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{th.desc}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg border ${th.bg}`}></div>
                      {settings.theme === th.id && (
                        <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUPABASE TAB */}
          {activeTab === "supabase" && (
            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200 text-xs">Supabase Cloud Sync</span>
                <p className="text-[11px] text-slate-400">
                  Connect your own Supabase project URL and anon public key to persist projects and authenticate across devices.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Supabase Anon Public Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSupabaseUrlInput("");
                    setSupabaseKeyInput("");
                    updateSupabaseCredentials("", "");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs"
                >
                  Clear Credentials
                </button>

                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </button>
              </div>

              {supabaseSaved && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs text-center font-medium">
                  ✓ Supabase credentials configured and active!
                </div>
              )}
            </form>
          )}

          {/* ANDROID TAB */}
          {activeTab === "android" && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Android Build Configuration</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Nexora Editor includes native Capacitor configuration (`capacitor.config.ts`), mobile touch toolbars, hardware back button listeners, and responsive mobile UX.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-indigo-400 font-bold">Package as Android APK / AAB:</div>
                <div className="text-slate-400">1. npm run build</div>
                <div className="text-slate-400">2. npx cap sync android</div>
                <div className="text-slate-400">3. npx cap open android</div>
              </div>
            </div>
          )}

          {/* ACCOUNT & DANGER TAB */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200 text-xs">Developer Profile</span>
                <p className="text-[11px] text-slate-400">
                  Signed in as: <strong className="text-indigo-400">{user?.name}</strong> ({user?.email})
                </p>
              </div>

              <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </div>
                <p className="text-[11px] text-rose-300 leading-snug">
                  Resetting will clear all local projects and restore default factory demo state.
                </p>

                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to reset all projects and editor preferences?")) {
                      deleteAccount();
                      resetSettings();
                      onClose();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-md shadow-rose-600/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset All Workspace Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
