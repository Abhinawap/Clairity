"use client";
import { ArrowUpRight, FolderGit2, Layers, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

type StylingConvention = "Tailwind CSS" | "Inline styles" | "CSS-in-JS";

type Project = {
  id: string;
  name: string;
  path: string;
  entryFile: string;
  framework: string;
  stylingConvention: StylingConvention;
  connected: boolean;
  devServer?: string;
  nodeCount: number;
  updatedAt: string;
};

const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj_hero",
    name: "hero-landing",
    path: "~/projects/hero-landing",
    entryFile: "components/hero.tsx",
    framework: "Next.js 16",
    stylingConvention: "Tailwind CSS",
    connected: true,
    devServer: "localhost:3000",
    nodeCount: 12,
    updatedAt: "Just now",
  },
  {
    id: "proj_acme",
    name: "acme-dashboard",
    path: "~/projects/acme-dashboard",
    entryFile: "app/dashboard/page.tsx",
    framework: "Next.js 16",
    stylingConvention: "Tailwind CSS",
    connected: false,
    nodeCount: 28,
    updatedAt: "2h ago",
  },
  {
    id: "proj_studio",
    name: "studio-portfolio",
    path: "~/projects/studio-portfolio",
    entryFile: "app/page.tsx",
    framework: "Next.js 15",
    stylingConvention: "Inline styles",
    connected: false,
    nodeCount: 19,
    updatedAt: "Yesterday",
  },
];

type Filter = "all" | "connected" | "recent";

// shortcut: holds projects in client state until the backend metadata endpoint (GET /sessions) lands
export function ProjectsHome() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [entryFile, setEntryFile] = useState("app/page.tsx");
  const [framework, setFramework] = useState("Next.js 16");
  const [stylingConvention, setStylingConvention] = useState<StylingConvention>("Tailwind CSS");

  const visible = projects.filter((p) => {
    if (filter === "connected" && !p.connected) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q) || p.entryFile.toLowerCase().includes(q);
  });

  const createProject = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    setProjects((prev) => [
      {
        id: `proj_${Date.now()}`,
        name: trimmed,
        path: path.trim() || `~/projects/${slug}`,
        entryFile: entryFile.trim() || "app/page.tsx",
        framework,
        stylingConvention,
        connected: false,
        nodeCount: 1,
        updatedAt: "Just now",
      },
      ...prev,
    ]);
    setName("");
    setPath("");
    setEntryFile("app/page.tsx");
    setOpen(false);
  };

  const connectedCount = projects.filter((p) => p.connected).length;

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex h-14 items-center gap-3 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-blue-600 text-xs font-bold text-white">C</span>
          <span className="font-semibold tracking-tight">Clairity</span>
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Projects
          </span>
        </div>

        <span className="ml-auto flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
          {connectedCount} live extension {connectedCount === 1 ? "session" : "sessions"}
        </span>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <Plus className="size-3.5" aria-hidden /> New Project
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-sm font-semibold">Add Local Project</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close dialog"
                    className="grid size-6 cursor-pointer place-items-center rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Register a React/Next.js workspace. Opening it in VS Code or Cursor with the Clairity extension connects its scene graph automatically.
              </Dialog.Description>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createProject();
                }}
                className="mt-4 space-y-3 text-xs"
              >
                <label className="block space-y-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Project name</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="marketing-site"
                    className="h-8 w-full rounded-md border border-zinc-200 bg-transparent px-2.5 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Workspace path</span>
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="~/projects/marketing-site"
                    className="h-8 w-full rounded-md border border-zinc-200 bg-transparent px-2.5 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block space-y-1">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Entry file</span>
                    <input
                      type="text"
                      value={entryFile}
                      onChange={(e) => setEntryFile(e.target.value)}
                      className="h-8 w-full rounded-md border border-zinc-200 bg-transparent px-2.5 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Framework</span>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option>Next.js 16</option>
                      <option>Next.js 15</option>
                    </select>
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Styling convention</span>
                  <select
                    value={stylingConvention}
                    onChange={(e) => setStylingConvention(e.target.value as StylingConvention)}
                    className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="Tailwind CSS">Tailwind CSS</option>
                    <option value="Inline styles">Inline styles</option>
                    <option value="CSS-in-JS">CSS-in-JS</option>
                  </select>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="h-8 cursor-pointer rounded-md border border-zinc-200 px-3 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="h-8 cursor-pointer rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-500"
                  >
                    Add Project
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <ThemeToggle />
        <Link
          href="/login"
          className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Sign out
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Your Projects</h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Your local source files are the only artifact—every visual Edit or accepted Proposal writes a minimal code diff.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-400" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search projects"
                placeholder="Search name, path, or file…"
                className="h-8 w-64 rounded-md border border-zinc-200 bg-white pr-3 pl-8 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div className="flex rounded-md border border-zinc-200 bg-white p-0.5 text-xs dark:border-zinc-800 dark:bg-zinc-900" role="group" aria-label="Filter projects">
              {(
                [
                  { id: "all", label: `All (${projects.length})` },
                  { id: "connected", label: `Connected (${connectedCount})` },
                  { id: "recent", label: "Recent" },
                ] as const
              ).map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded px-2.5 py-1 text-xs font-medium ${
                      active ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <article
              key={project.id}
              className="group flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-xs transition-colors hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="size-4 shrink-0 text-blue-500" aria-hidden />
                    <h2 className="font-mono text-sm font-semibold">{project.name}</h2>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      project.connected
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${project.connected ? "bg-emerald-500" : "bg-zinc-400"}`} aria-hidden />
                    {project.connected ? `Connected · ${project.devServer}` : "Offline"}
                  </span>
                </div>

                <p className="mt-2 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">{project.path}</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400 dark:text-zinc-500">Entry: {project.entryFile}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {project.framework}
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {project.stylingConvention}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                  <Layers className="size-3.5" aria-hidden />
                  {project.nodeCount} Nodes · {project.updatedAt}
                </span>
                <Link
                  href="/editor"
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  <span>Open in Editor</span>
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
