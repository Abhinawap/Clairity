"use client";

import {
  ArrowRight,
  ArrowUpRight,
  FolderGit2,
  Layers,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { useEffect, useMemo, useRef, useState } from "react";
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
  updatedMinutes: number;
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
    updatedMinutes: 0,
  },
  {
    id: "proj_harbor",
    name: "harbor-console",
    path: "~/projects/harbor-console",
    entryFile: "app/(dashboard)/page.tsx",
    framework: "Next.js 16",
    stylingConvention: "Tailwind CSS",
    connected: false,
    nodeCount: 28,
    updatedAt: "2h ago",
    updatedMinutes: 120,
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
    updatedMinutes: 1440,
  },
];

type Filter = "all" | "connected" | "recent";
type View = "cards" | "rows";

const fieldClass =
  "h-11 w-full rounded-none border border-brand-offblack/15 bg-brand-foam/60 px-3 font-mono text-xs text-brand-offblack placeholder:text-brand-teal/50 transition-colors focus:border-brand-emerald focus:outline-none focus:ring-2 focus:ring-brand-emerald/15 dark:border-brand-foam/15 dark:bg-brand-offblack/40 dark:text-brand-foam dark:placeholder:text-brand-foam/35";

const labelClass =
  "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-brand-teal/75 dark:text-brand-foam/55";

const two = (value: number) => value.toString().padStart(2, "0");

export function ProjectsHome() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("cards");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [entryFile, setEntryFile] = useState("app/page.tsx");
  const [framework, setFramework] = useState("Next.js 16");
  const [stylingConvention, setStylingConvention] =
    useState<StylingConvention>("Tailwind CSS");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (open) return;
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const connectedCount = projects.filter((project) => project.connected).length;
  const totalNodes = projects.reduce(
    (sum, project) => sum + project.nodeCount,
    0,
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      if (filter === "connected" && !project.connected) return false;
      if (!q) return true;
      return (
        project.name.toLowerCase().includes(q) ||
        project.path.toLowerCase().includes(q) ||
        project.entryFile.toLowerCase().includes(q) ||
        project.framework.toLowerCase().includes(q) ||
        project.stylingConvention.toLowerCase().includes(q)
      );
    });

    return filter === "recent"
      ? [...filtered].sort((a, b) => a.updatedMinutes - b.updatedMinutes)
      : filtered;
  }, [projects, query, filter]);

  const clearFilters = () => {
    setQuery("");
    setFilter("all");
  };

  const createProject = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const slug =
      trimmed
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "untitled";

    setProjects((previous) => [
      {
        id: `proj_${Date.now()}`,
        name: trimmed,
        path: path.trim() || `~/projects/${slug}`,
        entryFile: entryFile.trim() || "app/page.tsx",
        framework,
        stylingConvention,
        connected: false,
        nodeCount: 0,
        updatedAt: "Just now",
        updatedMinutes: 0,
      },
      ...previous,
    ]);

    setQuery("");
    setFilter("all");
    setName("");
    setPath("");
    setEntryFile("app/page.tsx");
    setOpen(false);
  };

  const filters = [
    { id: "all" as const, label: "All", count: projects.length },
    { id: "connected" as const, label: "Connected", count: connectedCount },
    { id: "recent" as const, label: "Recent", count: null },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="relative min-h-[100dvh] bg-brand-paper text-brand-offblack transition-colors selection:bg-brand-emerald selection:text-brand-offblack dark:bg-brand-offblack dark:text-brand-foam">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_1px_1px,#080c0e1a_1px,transparent_0)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)] dark:bg-[radial-gradient(circle_at_1px_1px,#f2fbf912_1px,transparent_0)]"
        />

        <header className="sticky top-0 z-30 border-b border-brand-offblack/10 bg-brand-paper/90 backdrop-blur-md dark:border-brand-foam/10 dark:bg-brand-offblack/85">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:px-10">
            <Link
              href="/"
              className="mr-1 flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-emerald"
            >
              <Image
                src="/logos/Clairity_Black.svg"
                alt="Clairity"
                width={117}
                height={24}
                priority
                className="h-5 w-auto dark:hidden sm:h-6"
              />
              <Image
                src="/logos/Clairity_White.svg"
                alt="Clairity"
                width={117}
                height={24}
                priority
                className="hidden h-5 w-auto dark:block sm:h-6"
              />
            </Link>

            <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-teal/60 sm:flex dark:text-brand-foam/45">
              <span aria-hidden>/</span> workspace
            </span>

            <div className="ml-auto flex items-center gap-1">
              <span className="mr-1 hidden items-center gap-2 border border-brand-offblack/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-brand-teal/80 md:inline-flex dark:border-brand-foam/15 dark:text-brand-foam/60">
                <span
                  className="size-1.5 bg-brand-emerald motion-safe:animate-pulse"
                  aria-hidden
                />
                {connectedCount} live
              </span>

              <a
                href="https://github.com/Abhinawap/Clairity"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub repository"
                className="grid size-9 place-items-center text-brand-teal transition-colors hover:bg-brand-offblack/5 hover:text-brand-offblack focus-visible:outline-2 focus-visible:outline-brand-emerald sm:size-8 dark:text-brand-foam/70 dark:hover:bg-brand-foam/10 dark:hover:text-brand-foam"
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
                className="ml-1 inline-flex h-9 items-center border border-brand-offblack/15 px-2.5 text-[11px] font-medium text-brand-teal transition-colors hover:border-brand-offblack hover:bg-brand-offblack hover:text-brand-paper focus-visible:outline-2 focus-visible:outline-brand-emerald sm:px-3 dark:border-brand-foam/15 dark:text-brand-foam/70 dark:hover:border-brand-foam dark:hover:bg-brand-foam dark:hover:text-brand-offblack"
              >
                Sign out
              </Link>
            </div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-[1440px] px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-10">
          <section
            aria-labelledby="projects-heading"
            className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
          >
            <div>
              <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-brand-teal/75 dark:text-brand-foam/50">
                <span className="size-1.5 bg-brand-emerald" aria-hidden />
                Local workspaces / {two(projects.length)}
              </p>
              <h1
                id="projects-heading"
                className="mt-4 text-[clamp(2.25rem,5.5vw,4rem)] font-medium leading-[0.92] tracking-[-0.055em] text-brand-offblack dark:text-brand-foam"
              >
                Your{" "}
                <span className="font-dirtyline font-normal text-brand-teal dark:text-brand-emerald">
                  P
                </span>
                rojects
              </h1>
              <p className="mt-4 max-w-[56ch] text-sm leading-6 text-brand-teal/80 dark:text-brand-foam/60">
                Point Clairity at a local React or Next.js workspace. Visual
                edits resolve to the smallest source diff, and nothing leaves
                your machine.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="group inline-flex h-11 items-center gap-3 bg-brand-offblack pl-5 pr-4 text-sm font-semibold text-brand-paper transition-colors hover:bg-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald dark:bg-brand-foam dark:text-brand-offblack dark:hover:bg-brand-mint"
                >
                  <Plus
                    className="size-4 text-brand-emerald transition-transform duration-300 group-hover:rotate-90 dark:text-brand-teal"
                    aria-hidden
                  />
                  New project
                </button>
              </Dialog.Trigger>
              <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-brand-teal/70 dark:text-brand-foam/45">
                <span className="size-1.5 bg-brand-emerald" aria-hidden />
                Extension connects on open
              </p>
            </div>
          </section>

          <dl className="mt-10 grid grid-cols-3 divide-x divide-brand-offblack/10 border-y border-brand-offblack/10 dark:divide-brand-foam/10 dark:border-brand-foam/10">
            <div className="py-4 pr-3 sm:py-5 sm:pr-5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-teal/65 dark:text-brand-foam/45">
                Projects
              </dt>
              <dd className="mt-1 font-mono text-2xl tracking-[-0.03em] text-brand-offblack sm:text-3xl dark:text-brand-foam">
                {two(projects.length)}
              </dd>
            </div>
            <div className="px-3 py-4 sm:px-5 sm:py-5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-teal/65 dark:text-brand-foam/45">
                Live sessions
              </dt>
              <dd className="mt-1 font-mono text-2xl tracking-[-0.03em] text-brand-teal sm:text-3xl dark:text-brand-emerald">
                {two(connectedCount)}
              </dd>
            </div>
            <div className="py-4 pl-3 sm:py-5 sm:pl-5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-teal/65 dark:text-brand-foam/45">
                Scene nodes
              </dt>
              <dd className="mt-1 font-mono text-2xl tracking-[-0.03em] text-brand-offblack sm:text-3xl dark:text-brand-foam">
                {two(totalNodes)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 border-b border-brand-offblack/10 pb-4 dark:border-brand-foam/10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label="Filter projects"
              >
                {filters.map((tab) => {
                  const active = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilter(tab.id)}
                      aria-pressed={active}
                      className={`inline-flex h-10 cursor-pointer items-center gap-2 border px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald ${
                        active
                          ? "border-brand-offblack bg-brand-offblack text-brand-paper dark:border-brand-foam dark:bg-brand-foam dark:text-brand-offblack"
                          : "border-brand-offblack/15 text-brand-teal/80 hover:border-brand-offblack/40 hover:bg-brand-mint/30 hover:text-brand-offblack dark:border-brand-foam/15 dark:text-brand-foam/60 dark:hover:border-brand-foam/40 dark:hover:bg-brand-teal/20 dark:hover:text-brand-foam"
                      }`}
                    >
                      {tab.label}
                      {tab.count !== null ? (
                        <span
                          className={`text-[9px] tabular-nums ${
                            active
                              ? "text-brand-emerald dark:text-brand-teal"
                              : "text-brand-teal/60 dark:text-brand-foam/40"
                          }`}
                        >
                          {two(tab.count)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div
                  className="flex h-10 w-fit items-center border border-brand-offblack/15 bg-brand-paper/60 p-0.5 dark:border-brand-foam/15 dark:bg-brand-foam/5"
                  role="group"
                  aria-label="Project layout"
                >
                  {(
                    [
                      { id: "cards", label: "Cards", icon: LayoutGrid },
                      { id: "rows", label: "Rows", icon: List },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const active = view === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setView(option.id)}
                        aria-pressed={active}
                        className={`inline-flex h-9 cursor-pointer items-center gap-1.5 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-brand-emerald ${
                          active
                            ? "bg-brand-offblack text-brand-paper dark:bg-brand-foam dark:text-brand-offblack"
                            : "text-brand-teal/70 hover:bg-brand-mint/40 hover:text-brand-offblack dark:text-brand-foam/55 dark:hover:bg-brand-teal/20 dark:hover:text-brand-foam"
                        }`}
                      >
                        <Icon className="size-3.5" aria-hidden />
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-[240px]">
                  <label htmlFor="project-search" className="sr-only">
                    Search projects
                  </label>
                  <Search
                    className="pointer-events-none absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-brand-teal/50 dark:text-brand-foam/40"
                    aria-hidden
                  />
                  <input
                    ref={searchRef}
                    id="project-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-keyshortcuts="/"
                    placeholder="Search name, path, or file"
                    className="h-10 w-full appearance-none border-b border-brand-offblack/20 bg-transparent pl-6 pr-12 text-sm text-brand-offblack placeholder:text-brand-teal/50 focus:border-brand-emerald focus:outline-none dark:border-brand-foam/20 dark:text-brand-foam dark:placeholder:text-brand-foam/40 [&::-webkit-search-cancel-button]:appearance-none"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute right-0 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-brand-teal/60 transition-colors hover:text-brand-offblack focus-visible:outline-2 focus-visible:outline-brand-emerald dark:text-brand-foam/50 dark:hover:text-brand-foam"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  ) : (
                    <kbd className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 border border-brand-offblack/15 px-1.5 py-0.5 font-mono text-[9px] text-brand-teal/60 sm:block dark:border-brand-foam/15 dark:text-brand-foam/40">
                      /
                    </kbd>
                  )}
                </div>
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="mt-2 flex flex-col items-start gap-6 py-16 sm:py-24">
              <span className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-brand-teal/65 dark:text-brand-foam/45">
                <span className="grid size-10 place-items-center border border-brand-offblack/15 dark:border-brand-foam/15">
                  <FolderGit2 className="size-4" aria-hidden />
                </span>
                No matches
              </span>
              <div>
                <p className="text-2xl font-medium tracking-[-0.03em] sm:text-3xl">
                  No workspaces here.
                </p>
                <p className="mt-2 max-w-[48ch] text-sm leading-6 text-brand-teal/80 dark:text-brand-foam/60">
                  Try a different name or path, or register a local React
                  workspace to start mapping its scene graph.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {query || filter !== "all" ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-10 items-center border border-brand-offblack/20 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-teal transition-colors hover:border-brand-offblack hover:text-brand-offblack focus-visible:outline-2 focus-visible:outline-brand-emerald dark:border-brand-foam/20 dark:text-brand-foam/65 dark:hover:border-brand-foam dark:hover:text-brand-foam"
                  >
                    Clear filters
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex h-10 items-center gap-2 bg-brand-offblack px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-paper transition-colors hover:bg-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald dark:bg-brand-foam dark:text-brand-offblack dark:hover:bg-brand-mint"
                >
                  New project
                  <Plus className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ) : view === "cards" ? (
            <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {visible.map((project, index) => (
                <li
                  key={project.id}
                  className={project.connected ? "md:col-span-2" : ""}
                >
                  <Link
                    href={`/editor?workspace=${encodeURIComponent(project.name)}`}
                    aria-label={`Open ${project.name} in the editor`}
                    className={`group relative flex h-full min-h-[220px] flex-col border p-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-emerald sm:p-6 ${
                      project.connected
                        ? "border-brand-offblack/20 bg-brand-mint/35 hover:bg-brand-mint/55 dark:border-brand-emerald/30 dark:bg-brand-teal/20 dark:hover:bg-brand-teal/30"
                        : "border-brand-offblack/15 bg-brand-paper hover:border-brand-offblack/35 hover:bg-brand-mint/20 dark:border-brand-foam/15 dark:bg-brand-foam/[0.03] dark:hover:border-brand-foam/30 dark:hover:bg-brand-teal/15"
                    }`}
                  >
                    {project.connected ? (
                      <span
                        className="absolute inset-x-0 top-0 h-[3px] bg-brand-emerald"
                        aria-hidden
                      />
                    ) : null}

                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-10 place-items-center border border-brand-offblack/15 font-mono text-[11px] tabular-nums text-brand-teal/75 transition-colors group-hover:border-brand-offblack/35 dark:border-brand-foam/15 dark:text-brand-foam/50">
                        {two(index + 1)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${
                          project.connected
                            ? "border-brand-emerald/40 bg-brand-emerald/10 text-brand-teal dark:text-brand-emerald"
                            : "border-brand-offblack/15 text-brand-teal/60 dark:border-brand-foam/15 dark:text-brand-foam/45"
                        }`}
                        title={
                          project.devServer
                            ? `Connected at ${project.devServer}`
                            : undefined
                        }
                      >
                        {project.connected ? (
                          <span className="relative flex size-1.5">
                            <span className="absolute inline-flex size-full bg-brand-emerald opacity-50 motion-safe:animate-ping" />
                            <span className="relative inline-flex size-1.5 bg-brand-emerald" />
                          </span>
                        ) : (
                          <span className="size-1.5 bg-brand-offblack/25 dark:bg-brand-foam/20" />
                        )}
                        {project.connected ? "Live" : "Idle"}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-1 flex-col md:flex-row md:gap-10">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <h2 className="truncate font-mono text-lg font-semibold tracking-[-0.02em] text-brand-offblack transition-colors group-hover:text-brand-teal dark:text-brand-foam dark:group-hover:text-brand-mint">
                          {project.name}
                        </h2>
                        <p className="mt-1 truncate font-mono text-[11px] text-brand-teal/70 dark:text-brand-foam/45">
                          {project.path}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-teal/70 dark:text-brand-foam/45">
                          <span>{project.framework}</span>
                          <span
                            aria-hidden
                            className="text-brand-teal/25 dark:text-brand-foam/20"
                          >
                            /
                          </span>
                          <span>{project.stylingConvention}</span>
                          <span
                            aria-hidden
                            className="text-brand-teal/25 dark:text-brand-foam/20"
                          >
                            /
                          </span>
                          <span className="max-w-full truncate">
                            {project.entryFile}
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-4 border-t border-brand-offblack/10 pt-4 dark:border-brand-foam/10">
                          <div className="flex items-center gap-3 font-mono text-[10px] text-brand-teal/65 dark:text-brand-foam/45">
                            <span className="flex items-center gap-1.5">
                              <Layers
                                className="size-3 text-brand-teal/50 dark:text-brand-foam/35"
                                aria-hidden
                              />
                              {project.nodeCount === 0
                                ? "Unscanned"
                                : `${project.nodeCount} nodes`}
                            </span>
                            <span>{project.updatedAt}</span>
                          </div>
                          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-teal transition-colors group-hover:text-brand-offblack dark:text-brand-emerald dark:group-hover:text-brand-mint">
                            Open
                            <ArrowUpRight
                              className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                              aria-hidden
                            />
                          </span>
                        </div>
                      </div>

                      {project.connected ? (
                        <div className="hidden shrink-0 flex-col justify-between border-l border-brand-emerald/30 pl-8 md:flex md:w-48">
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brand-teal/60 dark:text-brand-foam/45">
                              Extension session
                            </p>
                            <p className="mt-2 font-mono text-xs text-brand-teal dark:text-brand-emerald">
                              {project.devServer}
                            </p>
                          </div>
                          <div className="font-mono text-[9px] uppercase leading-4 tracking-[0.14em] text-brand-teal/60 dark:text-brand-foam/45">
                            <span className="mb-2 block size-1.5 bg-brand-emerald motion-safe:animate-pulse" />
                            Last frame synced
                            <br />
                            {project.updatedAt}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <div className="mt-2 hidden grid-cols-[3rem_minmax(0,1.6fr)_minmax(0,1.05fr)_minmax(0,0.8fr)_6.5rem] items-center gap-4 border-y border-brand-offblack/10 bg-brand-mint/30 px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-brand-teal lg:grid dark:border-brand-foam/10 dark:bg-brand-teal/20 dark:text-brand-foam/70">
                <span>No.</span>
                <span>Workspace</span>
                <span>Stack</span>
                <span>Activity</span>
                <span className="text-right">Open</span>
              </div>

              <ul className="divide-y divide-brand-offblack/10 border-t border-brand-offblack/10 dark:divide-brand-foam/10 dark:border-brand-foam/10 lg:border-t-0">
                {visible.map((project, index) => (
                  <li key={project.id}>
                    <Link
                      href={`/editor?workspace=${encodeURIComponent(project.name)}`}
                      aria-label={`Open ${project.name} in the editor`}
                      className={`group relative grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-2 py-4 transition-colors hover:bg-brand-mint/40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-emerald sm:grid-cols-[2.5rem_minmax(0,1.4fr)_minmax(0,0.9fr)_auto] sm:px-3 lg:grid-cols-[3rem_minmax(0,1.6fr)_minmax(0,1.05fr)_minmax(0,0.8fr)_6.5rem] lg:gap-4 lg:px-4 dark:hover:bg-brand-teal/20 ${
                        project.connected
                          ? "bg-brand-mint/30 dark:bg-brand-teal/15"
                          : ""
                      }`}
                    >
                      {project.connected ? (
                        <span
                          className="absolute inset-y-0 left-0 w-[3px] bg-brand-emerald"
                          aria-hidden
                        />
                      ) : null}

                      <span className="font-mono text-[10px] tabular-nums text-brand-teal/60 dark:text-brand-foam/35">
                        {two(index + 1)}
                      </span>

                      <div className="min-w-0">
                        <h2 className="truncate font-mono text-[13px] font-semibold tracking-[-0.01em] text-brand-offblack transition-colors group-hover:text-brand-teal sm:text-sm dark:text-brand-foam dark:group-hover:text-brand-mint">
                          {project.name}
                        </h2>
                        <p className="mt-1 truncate font-mono text-[10px] text-brand-teal/70 sm:text-[11px] dark:text-brand-foam/45">
                          {project.path}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9px] uppercase tracking-[0.1em] text-brand-teal/65 sm:hidden dark:text-brand-foam/45">
                          <span>{project.framework}</span>
                          <span aria-hidden>/</span>
                          <span>{project.stylingConvention}</span>
                          <span aria-hidden>/</span>
                          <span>
                            {project.nodeCount === 0
                              ? "Unscanned"
                              : `${project.nodeCount} nodes`}
                          </span>
                        </div>
                      </div>

                      <div className="hidden min-w-0 sm:block">
                        <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-brand-teal/75 dark:text-brand-foam/55">
                          {project.framework}
                          <span className="mx-1.5 text-brand-teal/30 dark:text-brand-foam/25">
                            /
                          </span>
                          {project.stylingConvention}
                        </p>
                        <p className="mt-1 truncate font-mono text-[10px] text-brand-teal/60 dark:text-brand-foam/40">
                          {project.entryFile}
                        </p>
                      </div>

                      <div className="hidden lg:block">
                        <p className="flex items-center gap-1.5 font-mono text-[10px] text-brand-teal/75 dark:text-brand-foam/55">
                          <Layers
                            className="size-3 text-brand-teal/50 dark:text-brand-foam/35"
                            aria-hidden
                          />
                          {project.nodeCount === 0
                            ? "Not scanned"
                            : `${project.nodeCount} nodes`}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-brand-teal/60 dark:text-brand-foam/40">
                          {project.updatedAt}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        {project.connected ? (
                          <span
                            className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-brand-teal sm:inline-flex dark:text-brand-emerald"
                            title={
                              project.devServer
                                ? `Connected at ${project.devServer}`
                                : undefined
                            }
                          >
                            <span className="relative flex size-1.5">
                              <span className="absolute inline-flex size-full bg-brand-emerald opacity-50 motion-safe:animate-ping" />
                              <span className="relative inline-flex size-1.5 bg-brand-emerald" />
                            </span>
                            Live
                          </span>
                        ) : (
                          <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-brand-teal/60 sm:inline dark:text-brand-foam/45">
                            Idle
                          </span>
                        )}
                        <span className="grid size-9 place-items-center border border-brand-offblack/15 text-brand-offblack transition-colors group-hover:border-brand-offblack group-hover:bg-brand-offblack group-hover:text-brand-paper dark:border-brand-foam/15 dark:text-brand-foam dark:group-hover:border-brand-foam dark:group-hover:bg-brand-foam dark:group-hover:text-brand-offblack">
                          <ArrowUpRight
                            className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <footer className="mt-14 flex flex-col gap-2 border-t border-brand-offblack/10 pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-brand-teal/65 sm:flex-row sm:items-center sm:justify-between dark:border-brand-foam/10 dark:text-brand-foam/35">
            <span>Clairity / local-first frontend editor</span>
            <span>Source files stay on this machine</span>
          </footer>
        </main>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-brand-offblack/55 backdrop-blur-[2px] dark:bg-brand-offblack/80" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-none border border-brand-offblack bg-brand-paper text-brand-offblack shadow-[8px_8px_0_0_rgba(8,12,14,0.16)] focus:outline-none dark:border-brand-foam/20 dark:bg-brand-navy dark:text-brand-foam dark:shadow-[8px_8px_0_0_rgba(0,0,0,0.45)]">
          <div className="h-1 bg-brand-emerald" aria-hidden />

          <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-teal/70 dark:text-brand-foam/45">
                Register workspace / {two(projects.length + 1)}
              </p>
              <Dialog.Title className="mt-2 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                Add a local project
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="grid size-10 shrink-0 place-items-center border border-brand-offblack/15 text-brand-teal transition-colors hover:border-brand-offblack hover:bg-brand-offblack hover:text-brand-paper focus-visible:outline-2 focus-visible:outline-brand-emerald dark:border-brand-foam/15 dark:text-brand-foam/65 dark:hover:border-brand-foam dark:hover:bg-brand-foam dark:hover:text-brand-offblack"
              >
                <X className="size-4" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mt-2 max-w-[48ch] px-5 text-xs leading-5 text-brand-teal/80 sm:px-6 dark:text-brand-foam/60">
            Point Clairity at a React or Next.js workspace. Opening it with the
            extension maps the scene graph and enables visual edits.
          </Dialog.Description>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              createProject();
            }}
            className="mt-5 space-y-4 px-5 pb-5 sm:px-6 sm:pb-6"
          >
            <div>
              <label htmlFor="project-name" className={labelClass}>
                Project name
              </label>
              <input
                id="project-name"
                type="text"
                required
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="marketing-site"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="project-path" className={labelClass}>
                Workspace path
              </label>
              <input
                id="project-path"
                type="text"
                value={path}
                onChange={(event) => setPath(event.target.value)}
                placeholder="~/projects/marketing-site"
                className={fieldClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="project-entry" className={labelClass}>
                  Entry file
                </label>
                <input
                  id="project-entry"
                  type="text"
                  value={entryFile}
                  onChange={(event) => setEntryFile(event.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="project-framework" className={labelClass}>
                  Framework
                </label>
                <select
                  id="project-framework"
                  value={framework}
                  onChange={(event) => setFramework(event.target.value)}
                  className={`${fieldClass} [color-scheme:light] dark:[color-scheme:dark]`}
                >
                  <option>Next.js 16</option>
                  <option>Next.js 15</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="project-styling" className={labelClass}>
                Styling convention
              </label>
              <select
                id="project-styling"
                value={stylingConvention}
                onChange={(event) =>
                  setStylingConvention(
                    event.target.value as StylingConvention,
                  )
                }
                className={`${fieldClass} [color-scheme:light] dark:[color-scheme:dark]`}
              >
                <option value="Tailwind CSS">Tailwind CSS</option>
                <option value="Inline styles">Inline styles</option>
                <option value="CSS-in-JS">CSS-in-JS</option>
              </select>
            </div>

            <p className="flex items-start gap-2 border border-brand-offblack/10 bg-brand-mint/30 px-3 py-2.5 font-mono text-[9px] uppercase leading-4 tracking-[0.12em] text-brand-teal/75 dark:border-brand-foam/10 dark:bg-brand-teal/15 dark:text-brand-foam/50">
              <span
                className="mt-1 size-1.5 shrink-0 bg-brand-emerald"
                aria-hidden
              />
              The extension connects the workspace on open
            </p>

            <div className="flex items-center justify-end gap-2 border-t border-brand-offblack/10 pt-4 dark:border-brand-foam/10">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-10 items-center px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-teal/75 transition-colors hover:text-brand-offblack focus-visible:outline-2 focus-visible:outline-brand-emerald dark:text-brand-foam/55 dark:hover:text-brand-foam"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!name.trim()}
                className="inline-flex h-10 items-center gap-2 bg-brand-offblack px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-paper transition-colors hover:bg-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-emerald disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-foam dark:text-brand-offblack dark:hover:bg-brand-mint"
              >
                Register project
                <ArrowRight className="size-3.5" aria-hidden />
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
