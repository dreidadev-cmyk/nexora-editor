import React, { useState } from "react";
import { User, X, Mail, Lock, Sparkles, ArrowRight, ShieldCheck, Database, KeyRound, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SUPABASE_SQL_SCHEMA } from "../../lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    loginWithEmail,
    signUpWithEmail,
    logout,
    continueAsGuest,
    isSupabaseActive,
    supabaseConfig,
    updateSupabaseCredentials,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "config">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [urlInput, setUrlInput] = useState(supabaseConfig.url || "");
  const [keyInput, setKeyInput] = useState(supabaseConfig.key || "");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      if (mode === "config") {
        if (!urlInput.trim() || !keyInput.trim()) {
          setErrorNotice("Please enter both Supabase Project URL and Anon Public Key.");
          setIsLoading(false);
          return;
        }
        updateSupabaseCredentials(urlInput.trim(), keyInput.trim());
        setSuccessNotice("Supabase credentials saved successfully. You can now sign in.");
        setMode("login");
        setIsLoading(false);
        return;
      }

      if (mode === "login") {
        const res = await loginWithEmail(email, password);
        if (!res.success) {
          setErrorNotice(res.error || "Login failed");
        } else {
          onClose();
        }
      } else {
        const res = await signUpWithEmail(email, password, name);
        if (!res.success) {
          setErrorNotice(res.error || "Sign up failed");
        } else if (res.error) {
          // Success with info message (e.g. check email)
          setSuccessNotice(res.error);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setErrorNotice(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 text-slate-300 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/30">
              N
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {user && !user.isAnonymous
                  ? "Cloud Developer Profile"
                  : mode === "config"
                  ? "Configure Supabase Cloud"
                  : mode === "login"
                  ? "Sign In with Supabase"
                  : "Create Cloud Account"}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSupabaseActive ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <p className="text-[11px] text-slate-400">
                  {isSupabaseActive ? "Supabase Cloud Connected" : "Local Workspace (Offline Mode)"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logged in User State */}
        {user && !user.isAnonymous ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-100 block">{user.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{user.email}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Projects automatically sync with your Supabase account.</span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : mode === "config" ? (
          /* Supabase Setup View */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                <Database className="w-3.5 h-3.5" />
                <span>Connect Your Supabase Project</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Provide your Supabase URL & Anon Key from your Supabase Dashboard &gt; Project Settings &gt; API.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Supabase Project URL</label>
              <input
                type="text"
                required
                placeholder="https://xyzproject.supabase.co"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono placeholder-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Supabase Anon Public Key</label>
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono placeholder-slate-600"
              />
            </div>

            {/* SQL Copy Helper */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-300 block text-[11px]">Database Schema & RLS</span>
                <span className="text-[10px] text-slate-400">Copy SQL for `projects` & `project_files` tables</span>
              </div>
              <button
                type="button"
                onClick={handleCopySchema}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? "Copied" : "Copy SQL"}</span>
              </button>
            </div>

            {errorNotice && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-[11px] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorNotice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Save & Connect Supabase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex justify-between items-center pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-indigo-400 hover:underline"
              >
                ← Back to Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  continueAsGuest();
                  onClose();
                }}
                className="text-slate-400 hover:text-white"
              >
                Continue in Offline Mode
              </button>
            </div>
          </form>
        ) : (
          /* Sign In / Sign Up View */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isSupabaseActive && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl space-y-1 text-[11px] text-amber-200">
                <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                  <Database className="w-3.5 h-3.5" />
                  <span>Supabase Not Configured</span>
                </div>
                <p className="text-[10.5px] text-amber-300/90 leading-snug">
                  Cloud authentication requires a Supabase project. You can continue using local workspace offline, or connect Supabase credentials.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("config")}
                  className="mt-1 text-xs font-bold text-amber-400 underline hover:text-amber-300 block"
                >
                  Configure Supabase Cloud →
                </button>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Your Full Name</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-indigo-500">
                  <User className="w-3.5 h-3.5 text-slate-500 mr-2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-indigo-500">
                <Mail className="w-3.5 h-3.5 text-slate-500 mr-2" />
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Password</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-indigo-500">
                <Lock className="w-3.5 h-3.5 text-slate-500 mr-2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-600"
                />
              </div>
            </div>

            {errorNotice && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-[11px] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorNotice}</span>
              </div>
            )}

            {successNotice && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg text-[11px]">
                {successNotice}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isSupabaseActive}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>
                {isLoading
                  ? "Authenticating with Supabase..."
                  : mode === "login"
                  ? "Sign In with Supabase"
                  : "Create Account with Supabase"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="pt-2 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setErrorNotice(null);
                  setSuccessNotice(null);
                  setMode(mode === "login" ? "signup" : "login");
                }}
                className="text-indigo-400 hover:underline"
              >
                {mode === "login" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
              </button>

              <button
                type="button"
                onClick={() => {
                  continueAsGuest();
                  onClose();
                }}
                className="text-slate-400 hover:text-white"
              >
                Offline Guest Mode
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
