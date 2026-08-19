import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  Project,
  ProjectFile,
  OpenTab,
  IDEPanel,
  EditorViewMode,
  DevicePreset,
  DeviceType,
  ConsoleLogItem,
  RuntimeError,
  ProjectVersion,
  DeploymentRecord,
  ProjectTemplateType,
  AIAgentFileAction,
} from "../types";
import { createProjectFromTemplate, getFileLanguage } from "../lib/templates";
import { exportProjectToZip, downloadBlob, importProjectFromZip } from "../lib/zip";
import { syncProjectToSupabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";

export const DEVICE_PRESETS: Record<DeviceType, DevicePreset> = {
  mobile: { id: "mobile", name: "Mobile", width: 390, height: 844 },
  tablet: { id: "tablet", name: "Tablet", width: 768, height: 1024 },
  laptop: { id: "laptop", name: "Laptop", width: 1366, height: 768 },
  desktop: { id: "desktop", name: "Desktop", width: 1440, height: 900 },
  custom: { id: "custom", name: "Responsive / Fluid", width: 0, height: 0 },
};

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  activeFile: ProjectFile | null;
  openTabs: OpenTab[];
  activePanel: IDEPanel;
  viewMode: EditorViewMode;
  devicePreset: DevicePreset;
  isSaving: boolean;
  lastSavedAt: string | null;
  consoleLogs: ConsoleLogItem[];
  runtimeErrors: RuntimeError[];
  versionHistory: ProjectVersion[];
  deployments: DeploymentRecord[];
  previewKey: number;
  commandPaletteOpen: boolean;
  isMobile: boolean;
  selectedPreviewDevice: DeviceType;
  // Methods
  setCurrentProject: (proj: Project | null) => void;
  createNewProject: (template: ProjectTemplateType, name?: string) => Project;
  selectProjectById: (id: string) => void;
  renameProject: (id: string, newName: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  createFile: (name: string, parentPath?: string, content?: string) => ProjectFile;
  createFolder: (name: string, parentPath?: string) => ProjectFile;
  updateFileContent: (fileId: string, content: string) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  duplicateFile: (fileId: string) => void;
  openFileInTab: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  setActiveFile: (file: ProjectFile | null) => void;
  setActivePanel: (panel: IDEPanel) => void;
  setViewMode: (mode: EditorViewMode) => void;
  setDevicePreset: (preset: DeviceType) => void;
  runPreview: () => void;
  clearConsoleLogs: () => void;
  saveVersionSnapshot: (label?: string, reason?: string) => void;
  restoreVersion: (versionId: string) => void;
  exportProjectZip: () => Promise<void>;
  importProjectZip: (file: File) => Promise<Project>;
  applyAIAgentChanges: (actions: AIAgentFileAction[]) => void;
  triggerDeployment: (target: "vercel" | "cloudflare" | "netlify" | "static") => Promise<DeploymentRecord>;
  setCommandPaletteOpen: (open: boolean) => void;
}

const PROJECTS_STORAGE_KEY = "nexora_projects_v2";
const VERSIONS_STORAGE_KEY = "nexora_versions_v2";

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activePanel, setActivePanel] = useState<IDEPanel>("files");
  const [viewMode, setViewMode] = useState<EditorViewMode>("ide");
  const [selectedPreviewDevice, setSelectedPreviewDevice] = useState<DeviceType>("custom");
  const [devicePreset, setDevicePresetState] = useState<DevicePreset>(DEVICE_PRESETS.custom);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogItem[]>([]);
  const [runtimeErrors, setRuntimeErrors] = useState<RuntimeError[]>([]);
  const [versionHistory, setVersionHistory] = useState<ProjectVersion[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [previewKey, setPreviewKey] = useState<number>(1);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect Mobile Viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && viewMode === "ide") {
        setViewMode("mobile_editor");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sandbox Console Interceptor Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === "nexora_sandbox") {
        if (event.data.type === "console") {
          const logItem: ConsoleLogItem = event.data.payload;
          setConsoleLogs((prev) => [...prev.slice(-300), logItem]);

          if (logItem.type === "error") {
            setRuntimeErrors((prev) => [
              ...prev.slice(-20),
              {
                message: logItem.message,
                line: logItem.line,
                col: logItem.col,
                file: logItem.file,
                stack: logItem.stack,
                timestamp: logItem.timestamp,
              },
            ]);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Initialize Projects
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (savedProjects) {
        const parsed: Project[] = JSON.parse(savedProjects);
        if (parsed.length > 0) {
          setProjects(parsed);
          loadProject(parsed[0]);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load saved projects:", e);
    }

    // Default: Nexora Demo Website
    const initialProject = createProjectFromTemplate("portfolio", "Nexora Demo Website");
    setProjects([initialProject]);
    loadProject(initialProject);
    saveProjectsToStorage([initialProject]);
  }, []);

  const saveProjectsToStorage = (projs: Project[]) => {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projs));
    } catch (e) {
      console.warn("LocalStorage save projects error:", e);
    }
  };

  const loadProject = (project: Project) => {
    setCurrentProject(project);
    // Find entry or primary file
    const entry =
      project.files.find((f) => !f.isFolder && (f.isEntry || f.name.toLowerCase() === "index.html")) ||
      project.files.find((f) => !f.isFolder) ||
      null;

    setActiveFile(entry);
    if (entry) {
      setOpenTabs([{ fileId: entry.id, filePath: entry.path }]);
    } else {
      setOpenTabs([]);
    }
    setConsoleLogs([]);
    setRuntimeErrors([]);
    setPreviewKey((k) => k + 1);
    loadVersions(project.id);
  };

  const loadVersions = (projectId: string) => {
    try {
      const allVersions = localStorage.getItem(`${VERSIONS_STORAGE_KEY}_${projectId}`);
      if (allVersions) {
        setVersionHistory(JSON.parse(allVersions));
      } else {
        setVersionHistory([]);
      }
    } catch {
      setVersionHistory([]);
    }
  };

  const setDevicePreset = (preset: DeviceType) => {
    setSelectedPreviewDevice(preset);
    setDevicePresetState(DEVICE_PRESETS[preset]);
  };

  // Debounced Project Autosave & Supabase sync
  const triggerAutoSave = useCallback(
    (updatedProject: Project) => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      setIsSaving(true);
      autoSaveTimerRef.current = setTimeout(async () => {
        setProjects((prev) => {
          const next = prev.map((p) => (p.id === updatedProject.id ? updatedProject : p));
          saveProjectsToStorage(next);
          return next;
        });

        if (user && !user.isAnonymous) {
          await syncProjectToSupabase(updatedProject, user.id);
        }

        setIsSaving(false);
        setLastSavedAt(new Date().toLocaleTimeString());
      }, settings.autoSaveDelay || 1200);
    },
    [settings.autoSaveDelay, user]
  );

  const createNewProject = (template: ProjectTemplateType, name?: string): Project => {
    const newProj = createProjectFromTemplate(template, name, user?.id);
    const updated = [newProj, ...projects];
    setProjects(updated);
    saveProjectsToStorage(updated);
    loadProject(newProj);
    return newProj;
  };

  const selectProjectById = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (target) {
      loadProject(target);
    }
  };

  const renameProject = (id: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = projects.map((p) => (p.id === id ? { ...p, name: newName.trim(), updatedAt: new Date().toISOString() } : p));
    setProjects(updated);
    saveProjectsToStorage(updated);
    if (currentProject && currentProject.id === id) {
      setCurrentProject({ ...currentProject, name: newName.trim(), updatedAt: new Date().toISOString() });
    }
  };

  const duplicateProject = (id: string) => {
    const source = projects.find((p) => p.id === id);
    if (!source) return;

    const dup: Project = {
      ...JSON.parse(JSON.stringify(source)),
      id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [dup, ...projects];
    setProjects(updated);
    saveProjectsToStorage(updated);
  };

  const deleteProject = (id: string) => {
    const remaining = projects.filter((p) => p.id !== id);
    if (remaining.length === 0) {
      const fallback = createProjectFromTemplate("portfolio", "Nexora Demo Website");
      remaining.push(fallback);
    }
    setProjects(remaining);
    saveProjectsToStorage(remaining);

    if (currentProject && currentProject.id === id) {
      loadProject(remaining[0]);
    }
  };

  const createFile = (name: string, parentPath?: string, content: string = ""): ProjectFile => {
    if (!currentProject) throw new Error("No active project");

    const cleanName = name.trim();
    const filePath = parentPath ? `${parentPath}/${cleanName}`.replace(/^\//, "") : cleanName;

    const newFile: ProjectFile = {
      id: `file_${Math.random().toString(36).slice(2, 9)}`,
      name: cleanName,
      path: filePath,
      content,
      language: getFileLanguage(cleanName),
      isFolder: false,
      updatedAt: new Date().toISOString(),
      isEntry: cleanName.toLowerCase() === "index.html",
    };

    const updatedFiles = [...currentProject.files.filter((f) => f.path !== filePath), newFile];
    const updatedProj: Project = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProj);
    triggerAutoSave(updatedProj);
    openFileInTab(newFile.id);

    return newFile;
  };

  const createFolder = (name: string, parentPath?: string): ProjectFile => {
    if (!currentProject) throw new Error("No active project");

    const cleanName = name.trim();
    const folderPath = parentPath ? `${parentPath}/${cleanName}`.replace(/^\//, "") : cleanName;

    const newFolder: ProjectFile = {
      id: `folder_${Math.random().toString(36).slice(2, 9)}`,
      name: cleanName,
      path: folderPath,
      content: "",
      language: "plaintext",
      isFolder: true,
      updatedAt: new Date().toISOString(),
    };

    const updatedFiles = [...currentProject.files.filter((f) => f.path !== folderPath), newFolder];
    const updatedProj: Project = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProj);
    triggerAutoSave(updatedProj);

    return newFolder;
  };

  const updateFileContent = (fileId: string, content: string) => {
    if (!currentProject) return;

    const updatedFiles = currentProject.files.map((f) =>
      f.id === fileId ? { ...f, content, updatedAt: new Date().toISOString() } : f
    );

    const updatedProj: Project = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProj);
    if (activeFile && activeFile.id === fileId) {
      setActiveFile({ ...activeFile, content, updatedAt: new Date().toISOString() });
    }

    // Mark tab dirty
    setOpenTabs((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, isDirty: true } : t))
    );

    triggerAutoSave(updatedProj);
  };

  const deleteFile = (fileId: string) => {
    if (!currentProject) return;
    const target = currentProject.files.find((f) => f.id === fileId);
    if (!target) return;

    // If folder, delete all children with prefix path
    let updatedFiles: ProjectFile[];
    if (target.isFolder) {
      updatedFiles = currentProject.files.filter(
        (f) => f.id !== fileId && !f.path.startsWith(`${target.path}/`)
      );
    } else {
      updatedFiles = currentProject.files.filter((f) => f.id !== fileId);
    }

    const updatedProj: Project = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProj);
    closeTab(fileId);

    if (activeFile && activeFile.id === fileId) {
      const remainingFile = updatedFiles.find((f) => !f.isFolder) || null;
      setActiveFile(remainingFile);
      if (remainingFile) {
        openFileInTab(remainingFile.id);
      }
    }

    triggerAutoSave(updatedProj);
  };

  const renameFile = (fileId: string, newName: string) => {
    if (!currentProject || !newName.trim()) return;
    const clean = newName.trim();

    const target = currentProject.files.find((f) => f.id === fileId);
    if (!target) return;

    const pathParts = target.path.split("/");
    pathParts[pathParts.length - 1] = clean;
    const newPath = pathParts.join("/");

    const updatedFiles = currentProject.files.map((f) => {
      if (f.id === fileId) {
        return {
          ...f,
          name: clean,
          path: newPath,
          language: f.isFolder ? ("plaintext" as const) : getFileLanguage(clean),
          updatedAt: new Date().toISOString(),
        };
      }
      if (target.isFolder && f.path.startsWith(`${target.path}/`)) {
        return {
          ...f,
          path: f.path.replace(target.path, newPath),
        };
      }
      return f;
    });

    const updatedProj: Project = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProj);
    if (activeFile && activeFile.id === fileId) {
      setActiveFile({
        ...activeFile,
        name: clean,
        path: newPath,
        language: getFileLanguage(clean),
      });
    }

    triggerAutoSave(updatedProj);
  };

  const duplicateFile = (fileId: string) => {
    if (!currentProject) return;
    const target = currentProject.files.find((f) => f.id === fileId);
    if (!target || target.isFolder) return;

    const parts = target.name.split(".");
    const ext = parts.length > 1 ? `.${parts.pop()}` : "";
    const base = parts.join(".");
    const dupName = `${base}-copy${ext}`;

    createFile(dupName, target.path.includes("/") ? target.path.split("/").slice(0, -1).join("/") : undefined, target.content);
  };

  const openFileInTab = (fileId: string) => {
    if (!currentProject) return;
    const target = currentProject.files.find((f) => f.id === fileId);
    if (!target || target.isFolder) return;

    setActiveFile(target);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.fileId === fileId)) {
        return prev;
      }
      return [...prev, { fileId: target.id, filePath: target.path, isDirty: false }];
    });
  };

  const closeTab = (fileId: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.fileId !== fileId);
      if (activeFile && activeFile.id === fileId) {
        if (next.length > 0) {
          const nextTarget = currentProject?.files.find((f) => f.id === next[next.length - 1].fileId);
          setActiveFile(nextTarget || null);
        } else {
          setActiveFile(null);
        }
      }
      return next;
    });
  };

  const runPreview = () => {
    setPreviewKey((k) => k + 1);
  };

  const clearConsoleLogs = () => {
    setConsoleLogs([]);
    setRuntimeErrors([]);
  };

  const saveVersionSnapshot = (label?: string, reason?: string) => {
    if (!currentProject) return;

    const newVersion: ProjectVersion = {
      id: `ver_${Date.now().toString(36)}`,
      versionNumber: (versionHistory.length > 0 ? versionHistory[0].versionNumber : 0) + 1,
      label: label || `Version ${(versionHistory.length > 0 ? versionHistory[0].versionNumber : 0) + 1}`,
      timestamp: new Date().toISOString(),
      files: JSON.parse(JSON.stringify(currentProject.files)),
      snapshotReason: reason || "Manual checkpoint",
    };

    const updatedVersions = [newVersion, ...versionHistory].slice(0, 30);
    setVersionHistory(updatedVersions);

    try {
      localStorage.setItem(`${VERSIONS_STORAGE_KEY}_${currentProject.id}`, JSON.stringify(updatedVersions));
    } catch {}
  };

  const restoreVersion = (versionId: string) => {
    if (!currentProject) return;
    const target = versionHistory.find((v) => v.id === versionId);
    if (!target) return;

    // Snapshot before restore
    saveVersionSnapshot(`Pre-Restore Backup`, "Automated backup before version restoration");

    const updatedProj: Project = {
      ...currentProject,
      files: JSON.parse(JSON.stringify(target.files)),
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProj);
    const entry =
      updatedProj.files.find((f) => !f.isFolder && (f.isEntry || f.name.toLowerCase() === "index.html")) ||
      updatedProj.files.find((f) => !f.isFolder) ||
      null;

    setActiveFile(entry);
    if (entry) {
      setOpenTabs([{ fileId: entry.id, filePath: entry.path }]);
    }
    triggerAutoSave(updatedProj);
    runPreview();
  };

  const exportProjectZip = async () => {
    if (!currentProject) return;
    const blob = await exportProjectToZip(currentProject);
    const safeName = currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "nexora-project";
    downloadBlob(blob, `${safeName}.zip`);
  };

  const importProjectZip = async (file: File): Promise<Project> => {
    const imported = await importProjectFromZip(file);
    const updated = [imported, ...projects];
    setProjects(updated);
    saveProjectsToStorage(updated);
    loadProject(imported);
    return imported;
  };

  const applyAIAgentChanges = (actions: AIAgentFileAction[]) => {
    if (!currentProject) return;

    saveVersionSnapshot("Pre-AI Changes", "Backup before applying AI Agent modifications");

    let currentFiles = [...currentProject.files];

    for (const act of actions) {
      if (act.action === "create" || act.action === "update") {
        const pathParts = act.path.split("/").filter(Boolean);
        const fileName = pathParts[pathParts.length - 1];

        // Create parent folders if any
        if (pathParts.length > 1) {
          let accumulated = "";
          for (let i = 0; i < pathParts.length - 1; i++) {
            accumulated = accumulated ? `${accumulated}/${pathParts[i]}` : pathParts[i];
            if (!currentFiles.some((f) => f.path === accumulated)) {
              currentFiles.push({
                id: `folder_${Math.random().toString(36).slice(2, 9)}`,
                name: pathParts[i],
                path: accumulated,
                content: "",
                language: "plaintext",
                isFolder: true,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }

        const existingIndex = currentFiles.findIndex((f) => f.path === act.path);
        if (existingIndex >= 0) {
          currentFiles[existingIndex] = {
            ...currentFiles[existingIndex],
            content: act.content,
            updatedAt: new Date().toISOString(),
          };
        } else {
          currentFiles.push({
            id: `file_${Math.random().toString(36).slice(2, 9)}`,
            name: fileName,
            path: act.path,
            content: act.content,
            language: getFileLanguage(fileName),
            isFolder: false,
            updatedAt: new Date().toISOString(),
            isEntry: fileName.toLowerCase() === "index.html",
          });
        }
      } else if (act.action === "delete") {
        currentFiles = currentFiles.filter((f) => f.path !== act.path);
      }
    }

    const updatedProj: Project = {
      ...currentProject,
      files: currentFiles,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProj);

    if (activeFile) {
      const refreshedActive = currentFiles.find((f) => f.path === activeFile.path);
      if (refreshedActive) {
        setActiveFile(refreshedActive);
      }
    }

    triggerAutoSave(updatedProj);
    runPreview();
  };

  const triggerDeployment = async (
    target: "vercel" | "cloudflare" | "netlify" | "static"
  ): Promise<DeploymentRecord> => {
    if (!currentProject) throw new Error("No active project to deploy.");

    const newDep: DeploymentRecord = {
      id: `dep_${Date.now().toString(36)}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      targetProvider: target,
      status: "building",
      logs: [
        `[Deploy] Starting deployment pipeline for "${currentProject.name}" on ${target.toUpperCase()}...`,
        `[Deploy] Packaging ${currentProject.files.length} project files...`,
      ],
      createdAt: new Date().toISOString(),
    };

    setDeployments((prev) => [newDep, ...prev]);

    try {
      const res = await fetch("/api/deploy/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: currentProject, targetProvider: target }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deployment failed");
      }

      const completedDep: DeploymentRecord = {
        ...newDep,
        status: "deployed",
        liveUrl: data.liveUrl,
        logs: [...newDep.logs, ...data.logs, `[Deploy] Success! Live preview available at: ${data.liveUrl}`],
      };

      setDeployments((prev) => prev.map((d) => (d.id === newDep.id ? completedDep : d)));
      return completedDep;
    } catch (err: any) {
      const failedDep: DeploymentRecord = {
        ...newDep,
        status: "failed",
        error: err.message || "Failed to deploy",
        logs: [...newDep.logs, `[Deploy Error] ${err.message || "Pipeline execution failed"}`],
      };
      setDeployments((prev) => prev.map((d) => (d.id === newDep.id ? failedDep : d)));
      throw err;
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        activeFile,
        openTabs,
        activePanel,
        viewMode,
        devicePreset,
        isSaving,
        lastSavedAt,
        consoleLogs,
        runtimeErrors,
        versionHistory,
        deployments,
        previewKey,
        commandPaletteOpen,
        isMobile,
        selectedPreviewDevice,
        setCurrentProject,
        createNewProject,
        selectProjectById,
        renameProject,
        duplicateProject,
        deleteProject,
        createFile,
        createFolder,
        updateFileContent,
        deleteFile,
        renameFile,
        duplicateFile,
        openFileInTab,
        closeTab,
        setActiveFile,
        setActivePanel,
        setViewMode,
        setDevicePreset,
        runPreview,
        clearConsoleLogs,
        saveVersionSnapshot,
        restoreVersion,
        exportProjectZip,
        importProjectZip,
        applyAIAgentChanges,
        triggerDeployment,
        setCommandPaletteOpen,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within a ProjectProvider");
  return context;
};
