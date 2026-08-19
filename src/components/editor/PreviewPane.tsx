import React, { useState } from "react";
import {
  ExternalLink,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  RefreshCw,
  AlertTriangle,
  RotateCw,
  Maximize2,
  X,
  Play,
} from "lucide-react";
import { useProject, DEVICE_PRESETS } from "../../context/ProjectContext";
import { buildSandboxHtml } from "../../lib/bundler";

export const PreviewPane: React.FC = () => {
  const {
    currentProject,
    previewKey,
    runPreview,
    selectedPreviewDevice,
    setDevicePreset,
    runtimeErrors,
    setActivePanel,
  } = useProject();

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isRotated, setIsRotated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const errorCount = runtimeErrors.length;
  const currentPreset = DEVICE_PRESETS[selectedPreviewDevice];
  const htmlContent = currentProject ? buildSandboxHtml(currentProject.files) : "";

  const openPreview = () => {
    if (!currentProject) return;
    setIsPreviewOpen(true);
    runPreview();
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setIsFullscreen(false);
  };

  const refreshPreview = () => {
    if (!isPreviewOpen) {
      openPreview();
      return;
    }
    runPreview();
  };

  const openInNewTab = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const previewWidth = currentPreset.width
    ? isRotated ? currentPreset.height : currentPreset.width
    : undefined;
  const previewHeight = currentPreset.height
    ? isRotated ? currentPreset.width : currentPreset.height
    : undefined;

  if (!isPreviewOpen) {
    return (
      <div className="h-full min-h-0 bg-slate-950 flex items-center justify-center p-4 sm:p-8 text-center overflow-auto">
        <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8 shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/15 border border-indigo-500/20">
            <Play className="h-5 w-5 text-indigo-400" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">Preview is closed</h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-400">
            Run your project when you're ready. The preview sandbox will open only after you click Run.
          </p>
          <button
            onClick={openPreview}
            disabled={!currentProject}
            className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="h-4 w-4 fill-current" />
            Run Preview
          </button>
          <p className="mt-3 text-[10px] text-slate-500">Works on desktop, tablet, and mobile layouts.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full min-h-0 bg-slate-950 border-l border-slate-800 overflow-hidden relative ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      <div className="min-h-10 bg-slate-900 border-b border-slate-800 px-2 sm:px-3 py-1.5 flex items-center justify-between select-none shrink-0 text-slate-300 text-xs gap-2">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 overflow-x-auto scrollbar-none">
          <button onClick={() => setDevicePreset("custom")} title="Responsive Fluid View" className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${selectedPreviewDevice === "custom" ? "bg-slate-950 text-indigo-400 font-semibold border border-slate-800" : "text-slate-400 hover:text-slate-200"}`}>Fluid</button>
          <button onClick={() => setDevicePreset("mobile")} title="Mobile View" className={`p-1.5 rounded transition-colors ${selectedPreviewDevice === "mobile" ? "bg-slate-950 text-indigo-400 border border-slate-800" : "text-slate-400 hover:text-slate-200"}`}><Smartphone className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDevicePreset("tablet")} title="Tablet View" className={`p-1.5 rounded transition-colors ${selectedPreviewDevice === "tablet" ? "bg-slate-950 text-indigo-400 border border-slate-800" : "text-slate-400 hover:text-slate-200"}`}><Tablet className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDevicePreset("laptop")} title="Laptop View" className={`p-1.5 rounded transition-colors ${selectedPreviewDevice === "laptop" ? "bg-slate-950 text-indigo-400 border border-slate-800" : "text-slate-400 hover:text-slate-200"}`}><Laptop className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDevicePreset("desktop")} title="Desktop View" className={`p-1.5 rounded transition-colors ${selectedPreviewDevice === "desktop" ? "bg-slate-950 text-indigo-400 border border-slate-800" : "text-slate-400 hover:text-slate-200"}`}><Monitor className="w-3.5 h-3.5" /></button>
        </div>

        {errorCount > 0 && (
          <button onClick={() => setActivePanel("terminal")} className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] hover:bg-rose-900 transition-colors shrink-0">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>{errorCount} Error{errorCount > 1 ? "s" : ""}</span>
          </button>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {selectedPreviewDevice !== "custom" && <button onClick={() => setIsRotated((v) => !v)} title="Rotate" className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"><RotateCw className="w-3.5 h-3.5" /></button>}
          <button onClick={() => setZoomLevel((z) => Math.max(50, z - 10))} title="Zoom out" className="hidden sm:block px-1.5 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800">−</button>
          <span className="hidden sm:inline text-[10px] text-slate-500 w-8 text-center">{zoomLevel}%</span>
          <button onClick={() => setZoomLevel((z) => Math.min(150, z + 10))} title="Zoom in" className="hidden sm:block px-1.5 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800">+</button>
          <button onClick={refreshPreview} title="Refresh Preview" className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={openInNewTab} title="Open in New Tab" className="hidden sm:block p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"><ExternalLink className="w-3.5 h-3.5" /></button>
          <button onClick={() => setIsFullscreen((v) => !v)} title="Fullscreen" className="hidden sm:block p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"><Maximize2 className="w-3.5 h-3.5" /></button>
          <button onClick={closePreview} title="Close Preview" aria-label="Close Preview" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-950/70 hover:text-rose-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-950/90 flex items-center justify-center p-1.5 sm:p-4 overflow-auto">
        <div
          className={`transition-all duration-200 flex items-center justify-center ${selectedPreviewDevice === "custom" ? "w-full h-full" : "rounded-xl sm:rounded-2xl border-2 sm:border-4 border-slate-800 shadow-2xl overflow-hidden bg-white"}`}
          style={{
            width: previewWidth ? `${previewWidth}px` : "100%",
            height: previewHeight ? `${previewHeight}px` : "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
            transformOrigin: "center center",
          }}
        >
          <iframe
            key={`sandbox_${previewKey}`}
            srcDoc={htmlContent}
            title="Nexora Live Sandbox"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
