import React, { useState } from "react";
import { ExternalLink, Smartphone, Tablet, Laptop, Monitor, RefreshCw, AlertTriangle, RotateCw, Maximize2, X, Play } from "lucide-react";
import { useProject, DEVICE_PRESETS } from "../../context/ProjectContext";
import { buildSandboxHtml } from "../../lib/bundler";

export const PreviewPane: React.FC = () => {
  const { currentProject, previewKey, runPreview, selectedPreviewDevice, setDevicePreset, runtimeErrors, setActivePanel } = useProject();
  const [zoomLevel, setZoomLevel] = useState(100);
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
    if (!isPreviewOpen) return openPreview();
    runPreview();
  };
  const openInNewTab = () => {
    if (!htmlContent) return;
    const url = URL.createObjectURL(new Blob([htmlContent], { type: "text/html" }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const previewWidth = currentPreset.width ? (isRotated ? currentPreset.height : currentPreset.width) : undefined;
  const previewHeight = currentPreset.height ? (isRotated ? currentPreset.width : currentPreset.height) : undefined;

  if (!isPreviewOpen) {
    return (
      <div className="nexora-preview-closed h-full min-h-0 w-full bg-transparent flex items-center justify-center p-4 text-center">
        <button onClick={openPreview} disabled={!currentProject} className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/10 px-4 py-2.5 text-sm font-bold text-indigo-300 transition hover:border-indigo-400/50 hover:bg-indigo-600/20 hover:text-white disabled:opacity-40">
          <Play className="h-4 w-4 fill-current" /> Run Preview
        </button>
      </div>
    );
  }

  return (
    <div className={`nexora-preview-overlay fixed inset-3 sm:inset-5 lg:inset-8 z-[100] flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 ${isFullscreen ? "!inset-0 !rounded-none" : ""}`}>
      <div className="min-h-10 bg-slate-900/95 border-b border-slate-800 px-2 sm:px-3 py-1.5 flex items-center justify-between select-none shrink-0 text-slate-300 text-xs gap-2 backdrop-blur">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 overflow-x-auto scrollbar-none">
          <button onClick={() => setDevicePreset("custom")} className={`px-2 py-1 rounded text-xs whitespace-nowrap ${selectedPreviewDevice === "custom" ? "bg-slate-950 text-indigo-400 font-semibold border border-slate-800" : "text-slate-400 hover:text-slate-200"}`}>Fluid</button>
          <button onClick={() => setDevicePreset("mobile")} title="Mobile" className={`p-1.5 rounded ${selectedPreviewDevice === "mobile" ? "bg-slate-950 text-indigo-400 border border-slate-800" : "text-slate-400 hover:bg-slate-800"}`}><Smartphone className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDevicePreset("tablet")} title="Tablet" className={`p-1.5 rounded ${selectedPreviewDevice === "tablet" ? "bg-slate-950 text-indigo-400 border border-slate-800" : "text-slate-400 hover:bg-slate-800"}`}><Tablet className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDevicePreset("laptop")} title="Laptop" className="hidden sm:block p-1.5 rounded text-slate-400 hover:bg-slate-800"><Laptop className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDevicePreset("desktop")} title="Desktop" className="hidden sm:block p-1.5 rounded text-slate-400 hover:bg-slate-800"><Monitor className="w-3.5 h-3.5" /></button>
        </div>
        {errorCount > 0 && <button onClick={() => setActivePanel("terminal")} className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] shrink-0"><AlertTriangle className="w-3 h-3" />{errorCount} Error{errorCount > 1 ? "s" : ""}</button>}
        <div className="flex items-center gap-0.5 shrink-0">
          {selectedPreviewDevice !== "custom" && <button onClick={() => setIsRotated(v => !v)} title="Rotate" className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><RotateCw className="w-3.5 h-3.5" /></button>}
          <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} title="Zoom out" className="hidden sm:block px-1.5 py-1 rounded text-slate-400 hover:bg-slate-800">−</button>
          <span className="hidden sm:inline text-[10px] text-slate-500 w-8 text-center">{zoomLevel}%</span>
          <button onClick={() => setZoomLevel(z => Math.min(150, z + 10))} title="Zoom in" className="hidden sm:block px-1.5 py-1 rounded text-slate-400 hover:bg-slate-800">+</button>
          <button onClick={refreshPreview} title="Refresh" className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={openInNewTab} title="Open in new tab" className="hidden sm:block p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></button>
          <button onClick={() => setIsFullscreen(v => !v)} title="Fullscreen" className="hidden sm:block p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Maximize2 className="w-3.5 h-3.5" /></button>
          <button onClick={closePreview} title="Close Preview" aria-label="Close Preview" className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-950/70 hover:text-rose-300"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-slate-950/95 flex items-center justify-center p-1.5 sm:p-4 overflow-auto">
        <div className={`flex items-center justify-center overflow-hidden bg-white ${selectedPreviewDevice === "custom" ? "w-full h-full rounded-lg" : "rounded-xl sm:rounded-2xl border-2 sm:border-4 border-slate-800 shadow-2xl"}`} style={{ width: previewWidth ? `${previewWidth}px` : "100%", height: previewHeight ? `${previewHeight}px` : "100%", maxWidth: "100%", maxHeight: "100%", transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined, transformOrigin: "center center" }}>
          <iframe key={`sandbox_${previewKey}`} srcDoc={htmlContent} title="Nexora Live Sandbox" sandbox="allow-scripts allow-modals allow-forms allow-same-origin" className="w-full h-full border-0 bg-white" />
        </div>
      </div>
    </div>
  );
};
