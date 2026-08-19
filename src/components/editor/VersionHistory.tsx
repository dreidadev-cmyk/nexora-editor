import React, { useState } from "react";
import { History, Plus, RotateCcw, Check, Calendar, FileCode } from "lucide-react";
import { useProject } from "../../context/ProjectContext";

export const VersionHistory: React.FC = () => {
  const { currentProject, versionHistory, saveVersionSnapshot, restoreVersion } = useProject();
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState<string | null>(null);

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel.trim()) return;
    saveVersionSnapshot(snapshotLabel.trim(), "User manual checkpoint");
    setSnapshotLabel("");
  };

  const handleConfirmRestore = (id: string) => {
    restoreVersion(id);
    setShowConfirmRestore(null);
  };

  const selectedVersion = versionHistory.find((v) => v.id === selectedVersionId);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 text-xs select-none">
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[11px] text-slate-400">
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span>Version Snapshots</span>
        </div>
      </div>

      {/* Create Snapshot Form */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        <form onSubmit={handleCreateSnapshot} className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-300">Create Checkpoint</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="e.g. Added auth modal, Fixed navbar"
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!snapshotLabel.trim()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Version Snapshots List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {versionHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p>No snapshots recorded yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Snapshots are automatically created during AI changes or manual saves.
            </p>
          </div>
        ) : (
          versionHistory.map((ver) => {
            const isSelected = selectedVersionId === ver.id;
            const dateStr = new Date(ver.timestamp).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={ver.id}
                onClick={() => setSelectedVersionId(isSelected ? null : ver.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-950 border-indigo-500/80 shadow-md"
                    : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-100 text-xs">{ver.label}</span>
                  <span className="text-[10px] font-mono text-slate-400">{dateStr}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>{ver.files.length} files stored</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirmRestore(ver.id);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-800 hover:border-indigo-500 transition-all font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Files in Snapshot:
                    </span>
                    <div className="max-h-24 overflow-y-auto space-y-0.5 font-mono text-[10px] text-slate-400">
                      {ver.files.map((f) => (
                        <div key={f.id} className="flex items-center gap-1.5">
                          <FileCode className="w-3 h-3 text-slate-500" />
                          <span>{f.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmRestore && (
        <div className="p-3 bg-rose-950/90 border-t border-rose-800 text-rose-200 space-y-2">
          <p className="text-xs font-semibold">Restore this snapshot?</p>
          <p className="text-[11px] text-rose-300">
            Your current working files will be replaced with this version. An automatic backup will be saved first.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowConfirmRestore(null)}
              className="px-2.5 py-1 rounded bg-slate-900 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmRestore(showConfirmRestore)}
              className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-colors"
            >
              Yes, Restore
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
