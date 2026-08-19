import React, { useState, useRef } from "react";
import {
  Plus,
  Folder,
  Code2,
  Sparkles,
  Search,
  Trash2,
  Copy,
  ExternalLink,
  Calendar,
  Layers,
  Upload,
  Download,
  Terminal,
  Cpu,
  Smartphone,
  Globe,
  Rocket,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  FileCode,
  FilePlus,
  Box,
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import { PROJECT_TEMPLATES } from "../../lib/templates";
import { ProjectTemplateType } from "../../types";

interface UserDashboardProps {
  onOpenProject: () => void;
  onOpenDeploy: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onOpenProject,
  onOpenDeploy,
  onOpenSettings,
  onOpenAuth,
}) => {
  const {
    projects,
    currentProject,
    createNewProject,
    loadProject,
    deleteProject,
    duplicateProject,
    importProjectZip,
    exportProjectZip,
  } = useProject();

  const { user, isSupabaseActive } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "web" | "mobile" | "templates">("all");
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectTemplate, setNewProjectTemplate] = useState<ProjectTemplateType>("react_app");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    createNewProject(newProjectName.trim(), newProjectTemplate, newProjectDesc.trim());
    setIsCreatingCustom(false);
    setNewProjectName("");
    setNewProjectDesc("");
    onOpenProject();
  };

  const handleQuickTemplateLaunch = (templateId: ProjectTemplateType) => {
    const templateObj = PROJECT_TEMPLATES[templateId];
    const name = templateObj ? templateObj.name : "New Project";
    createNewProject(name, templateId, templateObj?.description || "");
    onOpenProject();
  };

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importProjectZip(file);
      onOpenProject();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-600/30">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">Nexora</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                IDE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Android & PC Multi-File Code Editor with Monaco & Live Sandbox
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsCreatingCustom(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </button>

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 text-xs font-bold border border-slate-700">
              {user?.name ? user.name[0].toUpperCase() : "G"}
            </div>
            <span className="hidden md:inline">{user?.name || "Guest"}</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Hero Banner with Quick Actions */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
          <div className="max-w-2xl space-y-3 z-10 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack Monaco Editor • Autonomous AI Agent • Instant Live Preview</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Build & Ship Web & Mobile Apps with Zero Friction.
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Create multi-file React, Tailwind, Vanilla JS, and full-stack projects. Run in an isolated sandbox, prompt the autonomous AI agent, export to ZIP or Capacitor Android APK.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleQuickTemplateLaunch("react_app")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <Code2 className="w-4 h-4" />
                <span>Start React App</span>
              </button>

              <button
                onClick={() => handleQuickTemplateLaunch("tailwind_app")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-colors"
              >
                <Box className="w-4 h-4 text-cyan-400" />
                <span>Tailwind CSS Template</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Import ZIP</span>
                <input
                  type="file"
                  accept=".zip"
                  ref={fileInputRef}
                  onChange={handleZipUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Templates Carousel / Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Quick Start Templates</span>
              </h2>
              <p className="text-xs text-slate-400">Launch a production-ready boilerplate in one click</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.entries(PROJECT_TEMPLATES) as [ProjectTemplateType, (typeof PROJECT_TEMPLATES)[ProjectTemplateType]][]).map(([templateKey, template]) => (
              <div
                key={templateKey}
                onClick={() => handleQuickTemplateLaunch(templateKey)}
                className="group p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/40 group-hover:text-indigo-300 transition-colors">
                      {templateKey === "react_app" && <Code2 className="w-5 h-5 text-cyan-400" />}
                      {templateKey === "tailwind_app" && <Box className="w-5 h-5 text-indigo-400" />}
                      {templateKey === "dashboard" && <Globe className="w-5 h-5 text-emerald-400" />}
                      {templateKey === "portfolio" && <FileCode className="w-5 h-5 text-amber-400" />}
                      {templateKey === "landing" && <Rocket className="w-5 h-5 text-rose-400" />}
                      {templateKey === "vanilla_js" && <Cpu className="w-5 h-5 text-yellow-400" />}
                      {templateKey === "minecraft_server" && <Terminal className="w-5 h-5 text-emerald-500" />}
                      {templateKey === "blank" && <FilePlus className="w-5 h-5 text-slate-400" />}
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                      {template.files.length} files
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 mt-1 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-indigo-400 font-semibold group-hover:text-indigo-300">
                  <span>Create Project</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Existing Projects Section */}
        <section className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                <span>Your Projects ({projects.length})</span>
              </h2>
              <p className="text-xs text-slate-400">
                {isSupabaseActive ? "Synced with Supabase Cloud & Local Storage" : "Saved in Local Storage (Sign in for Cloud Sync)"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">No projects found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {searchQuery ? "Try a different search query or filter" : "Get started by creating your first project or picking a template above."}
                </p>
              </div>
              <button
                onClick={() => setIsCreatingCustom(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((proj) => {
                const isCurrent = currentProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      loadProject(proj.id);
                      onOpenProject();
                    }}
                    className={`group p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl hover:-translate-y-0.5 ${
                      isCurrent
                        ? "bg-slate-900/90 border-indigo-500/60 ring-1 ring-indigo-500/20"
                        : "bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 text-indigo-400 border border-slate-800">
                          {proj.templateType.replace("_", " ").toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateProject(proj.id);
                            }}
                            title="Duplicate Project"
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete "${proj.name}"?`)) {
                                deleteProject(proj.id);
                              }
                            }}
                            title="Delete Project"
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                          <span className="truncate">{proj.name}</span>
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Active" />
                          )}
                        </h3>
                        <p className="text-slate-400 text-xs line-clamp-2 mt-1 leading-relaxed">
                          {proj.description || "Custom multi-file coding project"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <FileCode className="w-3 h-3 text-slate-500" />
                        {proj.files.filter((f) => !f.isFolder).length} files
                      </span>

                      <span className="flex items-center gap-1 text-indigo-400 group-hover:text-indigo-300 font-sans font-semibold">
                        <span>Open IDE</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* New Project Creation Modal */}
      {isCreatingCustom && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsCreatingCustom(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Create New Project</span>
              </h3>
              <button
                onClick={() => setIsCreatingCustom(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Cool Web App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Starter Template</label>
                <select
                  value={newProjectTemplate}
                  onChange={(e) => setNewProjectTemplate(e.target.value as ProjectTemplateType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="react_app">React 19 + Tailwind CSS</option>
                  <option value="tailwind_app">Tailwind CSS Modern Boilerplate</option>
                  <option value="dashboard">Analytics SaaS Dashboard</option>
                  <option value="portfolio">Developer Portfolio</option>
                  <option value="landing">High-Converting Landing Page</option>
                  <option value="vanilla_js">Vanilla HTML5 + JS Canvas</option>
                  <option value="minecraft_server">Minecraft Server Status UI</option>
                  <option value="blank">Blank Clean Workspace</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Description (Optional)</label>
                <textarea
                  placeholder="What are you building?"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
