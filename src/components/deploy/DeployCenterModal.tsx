import React, { useState } from "react";
import {
  Rocket,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Globe,
  Download,
  Server,
  Cloud,
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { DeploymentRecord } from "../../types";

interface DeployCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployCenterModal: React.FC<DeployCenterModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, deployments, triggerDeployment, exportProjectZip } = useProject();
  const [selectedTarget, setSelectedTarget] = useState<"vercel" | "cloudflare" | "netlify" | "static">("vercel");
  const [isDeploying, setIsDeploying] = useState(false);
  const [activeDeployment, setActiveDeployment] = useState<DeploymentRecord | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const targets = [
    {
      id: "vercel" as const,
      name: "Vercel",
      desc: "Instant serverless global edge hosting with automated CI/CD.",
      icon: <Globe className="w-5 h-5 text-black bg-white rounded p-0.5" />,
    },
    {
      id: "cloudflare" as const,
      name: "Cloudflare Pages",
      desc: "Hyper-fast edge network with unlimited bandwidth.",
      icon: <Cloud className="w-5 h-5 text-amber-500" />,
    },
    {
      id: "netlify" as const,
      name: "Netlify",
      desc: "Composable web platform with continuous Git deployment.",
      icon: <Server className="w-5 h-5 text-teal-400" />,
    },
    {
      id: "static" as const,
      name: "Static Web Host",
      desc: "Standalone HTML5 / CSS / JS package ready for any static host.",
      icon: <Rocket className="w-5 h-5 text-indigo-400" />,
    },
  ];

  const handleStartDeploy = async () => {
    if (!currentProject) return;
    setIsDeploying(true);
    setErrorNotice(null);

    try {
      const dep = await triggerDeployment(selectedTarget);
      setActiveDeployment(dep);
    } catch (err: any) {
      setErrorNotice(err.message || "Deployment failed");
    } finally {
      setIsDeploying(false);
    }
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
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Nexora Deploy Center</h2>
              <p className="text-[11px] text-slate-400">
                Deploy <span className="text-indigo-400 font-semibold">{currentProject?.name}</span> to modern web cloud hosts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Target Providers Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Select Deployment Target:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {targets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTarget(t.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedTarget === t.id
                      ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950"
                      : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    {t.icon}
                    <span className="font-bold text-xs text-slate-100">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment Trigger Button */}
          <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleStartDeploy}
              disabled={isDeploying}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Rocket className={`w-4 h-4 ${isDeploying ? "animate-spin" : ""}`} />
              <span>{isDeploying ? "Validating & Deploying..." : `Deploy to ${selectedTarget.toUpperCase()}`}</span>
            </button>

            <button
              onClick={exportProjectZip}
              className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export ZIP</span>
            </button>
          </div>

          {errorNotice && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorNotice}</div>
            </div>
          )}

          {/* Active / Latest Deployment Logs */}
          {activeDeployment && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeDeployment.status === "deployed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : activeDeployment.status === "failed" ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  )}
                  <span className="font-bold text-xs text-slate-200 uppercase">
                    Status: {activeDeployment.status}
                  </span>
                </div>

                {activeDeployment.liveUrl && (
                  <a
                    href={activeDeployment.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all"
                  >
                    <span>Open Live App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Logs Stream Box */}
              <div className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto space-y-1">
                {activeDeployment.logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Deployments */}
          {deployments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Deployment History</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-xs">
                {deployments.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">
                        {d.targetProvider}
                      </span>
                      <span className="text-slate-300 text-xs">{d.projectName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleTimeString()}</span>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          d.status === "deployed" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
