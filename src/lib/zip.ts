import JSZip from "jszip";
import { Project, ProjectFile } from "../types";
import { getFileLanguage } from "./templates";

export async function exportProjectToZip(project: Project): Promise<Blob> {
  const zip = new JSZip();

  for (const file of project.files) {
    if (!file.isFolder) {
      // Normalize path (strip leading slash)
      const cleanPath = file.path.startsWith("/") ? file.path.slice(1) : file.path;
      zip.file(cleanPath, file.content);
    }
  }

  // Include a README.md if not present
  if (!project.files.some((f) => f.name.toLowerCase() === "readme.md")) {
    zip.file(
      "README.md",
      `# ${project.name}\n\n${project.description || "Created with Nexora Editor."}\n\n## Slogan\nCode. Preview. Build. Deploy.\n`
    );
  }

  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importProjectFromZip(file: File | Blob, projectName?: string): Promise<Project> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const importedFiles: ProjectFile[] = [];
  const entries = Object.entries(loadedZip.files);

  for (const [relativePath, zipEntry] of entries) {
    // Ignore mac __MACOSX and hidden files if empty
    if (relativePath.includes("__MACOSX/") || relativePath.endsWith(".DS_Store")) {
      continue;
    }

    const pathParts = relativePath.split("/").filter(Boolean);
    const fileName = pathParts[pathParts.length - 1];

    if (zipEntry.dir) {
      importedFiles.push({
        id: `folder_${Math.random().toString(36).slice(2, 9)}`,
        name: fileName,
        path: relativePath.replace(/\/$/, ""),
        content: "",
        language: "plaintext",
        isFolder: true,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const content = await zipEntry.async("string");
      importedFiles.push({
        id: `file_${Math.random().toString(36).slice(2, 9)}`,
        name: fileName,
        path: relativePath,
        content,
        language: getFileLanguage(fileName),
        isFolder: false,
        updatedAt: new Date().toISOString(),
        isEntry: fileName.toLowerCase() === "index.html",
      });
    }
  }

  // Ensure an index.html exists
  if (!importedFiles.some((f) => !f.isFolder && f.name.toLowerCase() === "index.html")) {
    importedFiles.unshift({
      id: `file_entry_${Math.random().toString(36).slice(2, 9)}`,
      name: "index.html",
      path: "index.html",
      content: `<!DOCTYPE html><html><head><title>Imported Project</title></head><body><h1>Imported Project</h1></body></html>`,
      language: "html",
      isFolder: false,
      updatedAt: new Date().toISOString(),
      isEntry: true,
    });
  }

  const derivedName = projectName || (file instanceof File ? file.name.replace(/\.zip$/i, "") : "Imported Project");

  return {
    id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: derivedName || "Imported Project",
    description: "Imported from ZIP archive into Nexora Editor.",
    templateType: "blank",
    files: importedFiles,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visibility: "private",
    tags: ["imported", "zip"],
    version: 1,
  };
}
