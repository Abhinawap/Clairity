"use client";
import { ArrowUpRight, FolderGit2, Layers, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
    <div className="flex min-h-full flex-col bg-[#F2FBF9] text-[#172A3A] dark:bg-[#080C0E] dark:text-[#F2FBF9] transition-colors">
      <header className="flex h-14 items-center gap-3 border-b border-[#DAF5EE] bg-white px-6 dark:border-[#004346]/70 dark:bg-[#080C0E] transition-colors">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center focus-visible:outline-2 focus-visible:outline-[#09BC8A]">
            <Image
              src="/logos/Clairity_Black.svg"
              alt="Clairity"
              width={117}
              height={24}
              priority
              className="h-6 w-auto dark:hidden"
            />
            <Image
              src="/logos/Clairity_White.svg"
              alt="Clairity"
              width={117}
              height={24}
              priority
              className="hidden h-6 w-auto dark:block"
            />
          </Link>

          <span className="rounded bg-[#DAF5EE] px-2 py-0.5 text-xs font-medium text-[#004346] dark:bg-[#004346] dark:text-[#DAF5EE]">
            Projects
          </span>
        </div>

        <span className="ml-auto flex items-center gap-2 text-xs text-[#004346] dark:text-[#DAF5EE]/80">
          <span className="size-2 rounded-full bg-[#09BC8A]" aria-hidden />
          {connectedCount} live extension {connectedCount === 1 ? "session" : "sessions"}
        </span>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-[#09BC8A] px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#09BC8A]/90 focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-[#080C0E] transition-colors"
            >
              <Plus className="size-3.5" aria-hidden /> New Project
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 dark:bg-black/75 backdrop-blur-xs" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#DAF5EE] bg-white p-5 shadow-xl text-[#172A3A] dark:border-[#004346] dark:bg-[#172A3A] dark:text-[#F2FBF9] transition-colors">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-sm font-semibold text-[#172A3A] dark:text-[#F2FBF9]">Add Local Project</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close dialog"
                    className="grid size-6 cursor-pointer place-items-center rounded text-[#004346]/60 hover:bg-[#DAF5EE] dark:text-[#DAF5EE]/60 dark:hover:bg-[#004346] dark:hover:text-[#F2FBF9]"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="mt-1 text-xs text-[#004346]/70 dark:text-[#DAF5EE]/70">
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
                  <span className="font-medium text-[#004346] dark:text-[#DAF5EE]">Project name</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="marketing-site"
                    className="h-8 w-full rounded-md border border-[#DAF5EE] bg-[#F2FBF9]/60 px-2.5 font-mono text-xs text-[#172A3A] placeholder:text-[#004346]/40 focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#080C0E]/70 dark:text-[#F2FBF9] dark:placeholder:text-[#DAF5EE]/40"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-[#004346] dark:text-[#DAF5EE]">Workspace path</span>
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="~/projects/marketing-site"
                    className="h-8 w-full rounded-md border border-[#DAF5EE] bg-[#F2FBF9]/60 px-2.5 font-mono text-xs text-[#172A3A] placeholder:text-[#004346]/40 focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#080C0E]/70 dark:text-[#F2FBF9] dark:placeholder:text-[#DAF5EE]/40"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block space-y-1">
                    <span className="font-medium text-[#004346] dark:text-[#DAF5EE]">Entry file</span>
                    <input
                      type="text"
                      value={entryFile}
                      onChange={(e) => setEntryFile(e.target.value)}
                      className="h-8 w-full rounded-md border border-[#DAF5EE] bg-[#F2FBF9]/60 px-2.5 font-mono text-xs text-[#172A3A] focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#080C0E]/70 dark:text-[#F2FBF9]"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-medium text-[#004346] dark:text-[#DAF5EE]">Framework</span>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className="h-8 w-full rounded-md border border-[#DAF5EE] bg-white px-2 text-xs text-[#172A3A] focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#080C0E] dark:text-[#F2FBF9]"
                    >
                      <option>Next.js 16</option>
                      <option>Next.js 15</option>
                    </select>
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="font-medium text-[#004346] dark:text-[#DAF5EE]">Styling convention</span>
                  <select
                    value={stylingConvention}
                    onChange={(e) => setStylingConvention(e.target.value as StylingConvention)}
                    className="h-8 w-full rounded-md border border-[#DAF5EE] bg-white px-2 text-xs text-[#172A3A] focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#080C0E] dark:text-[#F2FBF9]"
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
                      className="h-8 cursor-pointer rounded-md border border-[#DAF5EE] px-3 text-xs text-[#004346] hover:bg-[#DAF5EE] dark:border-[#004346] dark:text-[#DAF5EE] dark:hover:bg-[#004346] transition-colors"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="h-8 cursor-pointer rounded-md bg-[#09BC8A] px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#09BC8A]/90 dark:text-[#080C0E] transition-colors"
                  >
                    Add Project
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <a
          href="https://github.com/Abhinawap/Clairity"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
          className="grid size-8 place-items-center rounded-md text-[#004346] hover:bg-[#DAF5EE] focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-[#DAF5EE] dark:hover:bg-[#004346] transition-colors"
        >
          <Image
            src="/logos/GitHub_Invertocat_Black.svg"
            alt=""
            width={16}
            height={16}
            className="size-4 dark:hidden"
            aria-hidden
          />
          <Image
            src="/logos/GitHub_Invertocat_White.svg"
            alt=""
            width={16}
            height={16}
            className="hidden size-4 dark:block"
            aria-hidden
          />
        </a>
        <ThemeToggle />
        <Link
          href="/login"
          className="rounded-md border border-[#DAF5EE] px-2.5 py-1 text-xs font-medium text-[#004346] hover:bg-[#DAF5EE] hover:text-[#172A3A] focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:border-[#004346] dark:text-[#DAF5EE] dark:hover:bg-[#004346] dark:hover:text-[#F2FBF9] transition-colors"
        >
          Sign out
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#172A3A] dark:text-[#F2FBF9]">Your Projects</h1>
            <p className="mt-1 text-xs text-[#004346]/70 dark:text-[#DAF5EE]/70">
              Your local source files are the only artifact—every visual Edit or accepted Proposal writes a minimal code diff.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#004346]/40 dark:text-[#DAF5EE]/40" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search projects"
                placeholder="Search name, path, or file…"
                className="h-8 w-64 rounded-md border border-[#DAF5EE] bg-white pr-3 pl-8 text-xs text-[#172A3A] placeholder:text-[#004346]/40 focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#172A3A]/70 dark:text-[#F2FBF9] dark:placeholder:text-[#DAF5EE]/40 transition-colors"
              />
            </div>

            <div className="flex rounded-md border border-[#DAF5EE] bg-white p-0.5 text-xs dark:border-[#004346] dark:bg-[#172A3A]/70 transition-colors" role="group" aria-label="Filter projects">
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
                    className={`cursor-pointer rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-[#004346] text-[#F2FBF9] dark:bg-[#09BC8A] dark:text-[#080C0E] dark:font-semibold"
                        : "text-[#004346]/70 hover:text-[#172A3A] dark:text-[#DAF5EE]/70 dark:hover:text-[#F2FBF9]"
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
              className="group flex flex-col justify-between rounded-lg border border-[#DAF5EE] bg-white p-4 shadow-xs transition-colors hover:border-[#09BC8A] dark:border-[#004346]/80 dark:bg-[#172A3A] dark:shadow-md dark:hover:border-[#09BC8A]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="size-4 shrink-0 text-[#09BC8A]" aria-hidden />
                    <h2 className="font-mono text-sm font-semibold text-[#172A3A] dark:text-[#F2FBF9]">{project.name}</h2>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      project.connected
                        ? "bg-[#DAF5EE] text-[#004346] dark:bg-[#004346] dark:text-[#09BC8A]"
                        : "bg-[#F2FBF9] text-[#004346]/60 dark:bg-[#080C0E]/50 dark:text-[#DAF5EE]/60"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${project.connected ? "bg-[#09BC8A]" : "bg-[#004346]/40 dark:bg-[#004346]"}`} aria-hidden />
                    {project.connected ? `Connected · ${project.devServer}` : "Offline"}
                  </span>
                </div>

                <p className="mt-2 truncate font-mono text-xs text-[#004346]/70 dark:text-[#DAF5EE]/70">{project.path}</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-[#004346]/50 dark:text-[#DAF5EE]/50">Entry: {project.entryFile}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded bg-[#F2FBF9] px-2 py-0.5 text-[11px] font-medium text-[#004346] dark:bg-[#080C0E]/60 dark:text-[#DAF5EE]">
                    {project.framework}
                  </span>
                  <span className="rounded bg-[#DAF5EE] px-2 py-0.5 text-[11px] font-medium text-[#004346] dark:bg-[#004346] dark:text-[#DAF5EE]">
                    {project.stylingConvention}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#DAF5EE] pt-3 text-xs dark:border-[#004346]/60">
                <span className="flex items-center gap-1.5 text-[#004346]/70 dark:text-[#DAF5EE]/70">
                  <Layers className="size-3.5 text-[#09BC8A]" aria-hidden />
                  {project.nodeCount} Nodes · {project.updatedAt}
                </span>
                <Link
                  href="/editor"
                  className="inline-flex items-center gap-1 font-medium text-[#004346] hover:text-[#09BC8A] dark:text-[#09BC8A] dark:hover:text-[#DAF5EE] transition-colors"
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
