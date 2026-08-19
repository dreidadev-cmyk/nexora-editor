import React, { useState, useEffect, useRef } from "react";
import {
  RotateCcw,
  Maximize2,
  ExternalLink,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { useProject, DEVICE_PRESETS } from "../../context/ProjectContext";
import { buildSandboxHtml } from "../../lib/bundler";
import { DeviceType } from "../../types";

export const PreviewPane: React.FC = () => {
  const {
    currentProject,
    previewKey,
    runPreview,
    selectedPreviewDevice,
    setDevicePreset,
    consoleLogs,
    runtimeErrors,
    setActivePanel,
  } = useProject();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isRotated, setIsRotated] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const errorCount = runtimeErrors.length;
  const currentPreset = DEVICE_PRESETS[selectedPreviewDevice];

  const htmlContent = currentProject ? buildSandboxHtml(currentProject.files) : "";

  const openInNewTab = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Dimensions based on rotation
  const previewWidth = currentPreset.width
    ? isRotated
      ? currentPreset.height
      : currentPreset.width
    : undefined;

  const previewHeight = currentPreset.height
    ? isRotated
      ? currentPreset.width
      : currentPreset.height
    : undefined;

  return (
    <div
      className={`flex flex-col h-full bg-slate-950 border-l border-slate-800 overflow-hidden relative ${
        isFullscreen ? "fixed inset-0 z-50 bg-slate-950" : ""
      }`}
    >
      {/* Top Preview Controls Bar */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between select-none shrink-0 text-slate-300 text-xs">
        {/* Device Switcher */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDevicePreset("custom")}
            title="Responsive Fluid View"
            className={`px-2 py-1 rounded text-xs transition-colors ${
              selectedPreviewDevice === "custom"
                ? "bg-slate-950 text-indigo-400 font-semibold border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Fluid
          </button>

          <button
            onClick={() => setDevicePreset("mobile")}
            title="Mobile View (390px)"
            className={`p-1.5 rounded transition-colors ${
              selectedPreviewDevice === "mobile"
                ? "bg-slate-950 text-indigo-400 border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDevicePreset("tablet")}
            title="Tablet View (768px)"
            className={`p-1.5 rounded transition-colors ${
              selectedPreviewDevice === "tablet"
                ? "bg-slate-950 text-indigo-400 border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDevicePreset("laptop")}
            title="Laptop View (1366px)"
            className={`p-1.5 rounded transition-colors ${
              selectedPreviewDevice === "laptop"
                ? "bg-slate-950 text-indigo-400 border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDevicePreset("desktop")}
            title="Desktop View (1440px)"
            className={`p-1.5 rounded transition-colors ${
              selectedPreviewDevice === "desktop"
                ? "bg-slate-950 text-indigo-400 border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Error notice if any */}
        {errorCount > 0 && (
          <button
            onClick={() => setActivePanel("terminal")}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] hover:bg-rose-900 transition-colors"
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>{errorCount} Error{errorCount > 1 ? "s" : ""}</span>
          </button>
        )}

        {/* Right Tools: Rotate, Zoom, Refresh, Popout, Fullscreen */}
        <div className="flex items-center gap-1">
          {selectedPreviewDevice !== "custom" && (
            <button
              onClick={() => setIsRotated(!isRotated)}
              title="Rotate Screen Orientation"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={runPreview}
            title="Refresh Live Preview"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={openInNewTab}
            title="Open in New Window / Tab"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-950/90 flex items-center justify-center p-2 sm:p-4 overflow-auto">
        <div
          className={`transition-all duration-200 flex items-center justify-center ${
            selectedPreviewDevice === "custom"
              ? "w-full h-full"
              : "rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden bg-white"
          }`}
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
            ref={iframeRef}
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
