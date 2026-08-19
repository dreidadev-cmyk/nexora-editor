import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Project, ProjectFile } from "../types";

let supabaseClient: SupabaseClient | null = null;
let currentSupabaseUrl: string = "";
let currentSupabaseKey: string = "";

export const SUPABASE_SQL_SCHEMA = `-- Nexora Editor Supabase Database Schema & RLS Setup
-- Run this in your Supabase SQL Editor to enable real Cloud Sync:

create table if not exists public.projects (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  template_type text not null,
  visibility text default 'private',
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.project_files (
  id text primary key,
  project_id text references public.projects(id) on delete cascade not null,
  name text not null,
  path text not null,
  content text default '',
  language text not null,
  is_folder boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.projects enable row level security;
alter table public.project_files enable row level security;

-- Projects RLS Policies
create policy "Users can view own projects" 
  on public.projects for select 
  using (auth.uid() = user_id);

create policy "Users can insert own projects" 
  on public.projects for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own projects" 
  on public.projects for update 
  using (auth.uid() = user_id);

create policy "Users can delete own projects" 
  on public.projects for delete 
  using (auth.uid() = user_id);

-- Project Files RLS Policies
create policy "Users can manage files for own projects" 
  on public.project_files for all 
  using (
    exists (
      select 1 from public.projects 
      where public.projects.id = public.project_files.project_id 
      and public.projects.user_id = auth.uid()
    )
  );
`;

export function getSupabaseClient(): SupabaseClient | null {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

  const savedUrl = localStorage.getItem("nexora_supabase_url") || envUrl;
  const savedKey = localStorage.getItem("nexora_supabase_key") || envKey;

  if (!savedUrl || !savedKey) {
    return null;
  }

  if (supabaseClient && currentSupabaseUrl === savedUrl && currentSupabaseKey === savedKey) {
    return supabaseClient;
  }

  try {
    currentSupabaseUrl = savedUrl;
    currentSupabaseKey = savedKey;
    supabaseClient = createClient(savedUrl, savedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseClient;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
}

export function configureCustomSupabase(url: string, key: string) {
  if (!url.trim() || !key.trim()) {
    localStorage.removeItem("nexora_supabase_url");
    localStorage.removeItem("nexora_supabase_key");
    supabaseClient = null;
    currentSupabaseUrl = "";
    currentSupabaseKey = "";
    return;
  }
  localStorage.setItem("nexora_supabase_url", url.trim());
  localStorage.setItem("nexora_supabase_key", key.trim());
  supabaseClient = null;
  currentSupabaseUrl = "";
  currentSupabaseKey = "";
  getSupabaseClient();
}

export function getStoredSupabaseConfig(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
  return {
    url: localStorage.getItem("nexora_supabase_url") || envUrl,
    key: localStorage.getItem("nexora_supabase_key") || envKey,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

// Database project sync helper
export async function syncProjectToSupabase(project: Project, userId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !userId) return false;

  try {
    const { error: projError } = await client.from("projects").upsert(
      {
        id: project.id,
        user_id: userId,
        name: project.name,
        description: project.description || "",
        template_type: project.templateType,
        visibility: project.visibility || "private",
        tags: project.tags || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (projError) {
      console.warn("Supabase project sync notice:", projError.message);
      return false;
    }

    // Upsert project files
    const fileRecords = project.files.map((f) => ({
      id: f.id,
      project_id: project.id,
      name: f.name,
      path: f.path,
      content: f.content || "",
      language: f.language,
      is_folder: f.isFolder,
      updated_at: f.updatedAt || new Date().toISOString(),
    }));

    if (fileRecords.length > 0) {
      const { error: filesError } = await client.from("project_files").upsert(fileRecords, { onConflict: "id" });
      if (filesError) {
        console.warn("Supabase files sync notice:", filesError.message);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.warn("Supabase project sync exception:", err);
    return false;
  }
}

// Fetch user's cloud projects from Supabase
export async function fetchUserProjectsFromSupabase(userId: string): Promise<Project[]> {
  const client = getSupabaseClient();
  if (!client || !userId) return [];

  try {
    const { data: projectRows, error: pError } = await client
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (pError || !projectRows) {
      console.warn("Could not fetch remote projects:", pError?.message);
      return [];
    }

    const projects: Project[] = [];

    for (const p of projectRows) {
      const { data: fileRows } = await client
        .from("project_files")
        .select("*")
        .eq("project_id", p.id);

      const files: ProjectFile[] = (fileRows || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        path: f.path,
        content: f.content || "",
        language: f.language,
        isFolder: f.is_folder || false,
        updatedAt: f.updated_at,
      }));

      projects.push({
        id: p.id,
        name: p.name,
        description: p.description,
        templateType: p.template_type,
        visibility: p.visibility,
        tags: p.tags || [],
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        files: files.length > 0 ? files : [],
      });
    }

    return projects;
  } catch (err) {
    console.warn("Supabase fetch user projects error:", err);
    return [];
  }
}
