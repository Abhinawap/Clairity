import { ArrowUpRight, ChevronDown, Layers, MousePointer2, Square, Type } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DesignReviewShip } from "./design-review-ship";
import { InsideCodebaseSection } from "./inside-codebase";
import { StartBanner } from "./start-banner";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { label: "Editor", href: "/editor" },
  { label: "Projects", href: "/projects" },
  { label: "How it works", href: "#how-it-works" },
];

type CodeTone = "comment" | "add" | "remove" | "muted" | "default";

const codeLines: { n: number; sign?: "+" | "-"; text: string; tone: CodeTone }[] = [
  { n: 9, text: "export function Hero() {", tone: "muted" },
  { n: 10, text: "  return (", tone: "muted" },
  { n: 11, text: '    <section className="grid gap-6">', tone: "default" },
  { n: 12, sign: "-", text: '      <h1 className="text-5xl">', tone: "remove" },
  { n: 12, sign: "+", text: '      <h1 className="text-7xl tracking-tight">', tone: "add" },
  { n: 13, text: "        Ship the real diff.", tone: "default" },
  { n: 14, text: "      </h1>", tone: "muted" },
  { n: 15, sign: "+", text: "      <Canvas layers={scene} />", tone: "add" },
  { n: 16, text: "    </section>", tone: "muted" },
  { n: 17, text: "  );", tone: "muted" },
  { n: 18, text: "}", tone: "muted" },
];

const toneClass: Record<CodeTone, string> = {
  comment: "text-[#DAF5EE]/35",
  add: "bg-[#09BC8A]/10 text-[#8CEBC8]",
  remove: "bg-[#FF4D00]/10 text-[#FFAA97]",
  muted: "text-[#DAF5EE]/40",
  default: "text-[#DAF5EE]/75",
};

function CodeTrack() {
  return (
    <div className="hero-code-track" aria-hidden>
      {[0, 1].map((copy) => (
        <div key={copy}>
          {codeLines.map((line, i) => (
            <p key={`${copy}-${i}`} className={`flex gap-2 px-3 py-0.5 sm:gap-3 sm:px-4 ${toneClass[line.tone]}`}>
              <span className="w-4 shrink-0 text-right text-[#DAF5EE]/20">{line.n}</span>
              <span className="w-3 shrink-0 text-center">{line.sign ?? " "}</span>
              <span className="min-w-0 truncate">{line.text}</span>
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

function AiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" fill="none" aria-hidden className={className}>
      <path
        d="M51 7C34 1 15 9 11 24c-4 15 8 27 22 25 12-2 18-13 13-23-5-10-20-11-26-1-7 12 2 27 20 38 4 3 8 5 12 6"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LayerPanel() {
  return (
    <div
      aria-hidden
      className="canvas-layers absolute inset-y-0 left-0 z-10 w-[46%] border-r border-[#DAF5EE]/15 bg-[#003538]/95 px-3 py-4 backdrop-blur-sm sm:w-[38%] sm:px-4"
    >
      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-[#DAF5EE]/45">
        <span>Layers</span>
        <Layers className="size-3" />
      </div>
      <div className="mt-3 space-y-1 font-mono text-[10px] leading-5">
        <div className="flex items-center gap-1.5 text-[#DAF5EE]/85">
          <ChevronDown className="size-3" aria-hidden /> Hero
          <span className="ml-auto text-[9px] text-[#DAF5EE]/30">section</span>
        </div>
        <div className="flex items-center gap-1.5 pl-4 text-[#DAF5EE]/60">
          <Type className="size-3" aria-hidden /> Heading
        </div>
        <div className="flex items-center gap-1.5 rounded-sm bg-[#09BC8A]/15 px-1 py-0.5 pl-5 text-[#DAF5EE]">
          <Square className="size-3 text-[#09BC8A]" aria-hidden /> Button
          <span className="ml-auto text-[9px] text-[#09BC8A]">selected</span>
        </div>
        <div className="flex items-center gap-1.5 pl-4 text-[#DAF5EE]/60">
          <MousePointer2 className="size-3" aria-hidden /> Image
        </div>
        <div className="flex items-center gap-1.5 pl-4 text-[#DAF5EE]/60">
          <Type className="size-3" aria-hidden /> Copy
        </div>
      </div>
      <div className="mt-4 border-t border-[#DAF5EE]/10 pt-3 font-mono text-[9px] leading-4 text-[#DAF5EE]/35">
        <p className="truncate">components/hero.tsx</p>
        <p className="text-[#09BC8A]">line 14 · edited</p>
      </div>
    </div>
  );
}

function CanvasBlock() {
  return (
    <div className="hero-canvas relative min-h-[330px] overflow-hidden bg-[#004346] text-[#DAF5EE] sm:min-h-[390px] lg:min-h-[460px]">
      <div aria-hidden className="canvas-grid absolute inset-0" />
      <LayerPanel />
      <div className="canvas-cta absolute left-1/2 top-1/2 z-20 w-[min(76%,240px)]">
        <p className="mb-2 text-center font-mono text-[10px] tracking-[0.12em] text-[#DAF5EE]/50">button · w 240px</p>
        <div className="relative">
          <Link
            href="/editor"
            className="group/btn relative flex h-12 items-center justify-center gap-1.5 rounded-lg bg-[#09BC8A] text-sm font-semibold text-[#002b2d] outline-none transition-colors hover:bg-[#2ad3a3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DAF5EE]"
          >
            Get started
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" aria-hidden />
          </Link>
          <span aria-hidden className="pointer-events-none absolute -inset-2 border border-dashed border-[#DAF5EE]/70" />
          <span aria-hidden className="pointer-events-none absolute -left-2.5 -top-2.5 size-1.5 bg-[#DAF5EE]" />
          <span aria-hidden className="pointer-events-none absolute -right-2.5 -top-2.5 size-1.5 bg-[#DAF5EE]" />
          <span aria-hidden className="pointer-events-none absolute -bottom-2.5 -left-2.5 size-1.5 bg-[#DAF5EE]" />
          <span aria-hidden className="pointer-events-none absolute -bottom-2.5 -right-2.5 size-1.5 bg-[#DAF5EE]" />
        </div>
      </div>
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#DAF5EE]/40">
        <span className="size-1.5 rounded-full bg-[#09BC8A]" aria-hidden /> Live canvas
      </div>
    </div>
  );
}

function CodeBlock() {
  return (
    <Link
      href="/editor"
      aria-label="Open the editor and review the generated code diff"
      className="hero-code relative block overflow-hidden border border-[#080C0E]/10 bg-[#05090A] text-[#DAF5EE] shadow-[0_24px_70px_-38px_rgba(8,12,14,0.65)] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#09BC8A] dark:border-[#F2FBF9]/10"
    >
      <div className="flex items-center gap-2 border-b border-[#DAF5EE]/10 px-3 py-2.5 font-mono text-[10px] text-[#DAF5EE]/50 sm:px-4">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-[#09BC8A]" />
          <span className="size-2 rounded-full bg-[#DAF5EE]/25" />
          <span className="size-2 rounded-full bg-[#DAF5EE]/10" />
        </span>
        <span className="ml-2 truncate">components/hero.tsx</span>
        <span className="ml-auto text-[#DAF5EE]/30">line 14</span>
      </div>

      <div className="py-3 font-mono text-[10px] leading-6 sm:text-[11px]" aria-hidden>
        {codeLines.slice(0, 8).map((line, i) => (
          <p key={i} className={`flex gap-2 px-3 sm:gap-3 sm:px-4 ${toneClass[line.tone]}`}>
            <span className="w-4 shrink-0 text-right text-[#DAF5EE]/20">{line.n}</span>
            <span className="w-3 shrink-0 text-center">{line.sign ?? " "}</span>
            <span className="min-w-0 truncate">{line.text}</span>
          </p>
        ))}
      </div>

      <div className="hero-code-expansion">
        <div className="min-h-0 overflow-hidden">
          <div className="hero-code-window hero-code-mask border-t border-[#DAF5EE]/10">
            <CodeTrack />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#DAF5EE]/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#DAF5EE]/35 sm:px-4">
        <span>diff · +12 −9</span>
        <span className="flex items-center gap-1 text-[#09BC8A]">
          review &amp; accept <ArrowUpRight className="size-3" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function LandingHero() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-[#F8F5EE] text-[#080C0E] transition-colors dark:bg-[#080C0E] dark:text-[#F2FBF9]">
      <header className="relative z-30 flex h-16 items-center gap-4 border-b border-[#080C0E]/10 px-4 sm:px-6 lg:px-10 dark:border-[#F2FBF9]/10">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#09BC8A]">
          <Image
            src="/logos/Clairity_Black.svg"
            alt="Clairity"
            width={117}
            height={24}
            priority
            className="h-5 w-auto dark:hidden"
          />
          <Image
            src="/logos/Clairity_White.svg"
            alt="Clairity"
            width={117}
            height={24}
            priority
            className="hidden h-5 w-auto dark:block"
          />
          <span className="hidden rounded-sm border border-[#080C0E]/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#080C0E]/45 sm:inline dark:border-[#F2FBF9]/20 dark:text-[#F2FBF9]/45">
            beta
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-5 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#080C0E]/55 outline-none transition-colors hover:text-[#080C0E] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#09BC8A] dark:text-[#F2FBF9]/55 dark:hover:text-[#F2FBF9]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <a
            href="https://github.com/Abhinawap/Clairity"
            target="_blank"
            rel="noreferrer"
            aria-label="Clairity on GitHub"
            className="grid size-9 place-items-center rounded-md text-[#080C0E]/60 outline-none transition-colors hover:bg-[#080C0E]/5 hover:text-[#080C0E] focus-visible:outline-2 focus-visible:outline-[#09BC8A] sm:size-8 dark:text-[#F2FBF9]/60 dark:hover:bg-[#F2FBF9]/10 dark:hover:text-[#F2FBF9]"
          >
            <Image src="/logos/GitHub_Invertocat_Black.svg" alt="" width={16} height={16} className="size-4 dark:hidden" aria-hidden />
            <Image src="/logos/GitHub_Invertocat_White.svg" alt="" width={16} height={16} className="hidden size-4 dark:block" aria-hidden />
          </a>
          <ThemeToggle />
          <Link
            href="https://github.com/Abhinawap/Clairity"
            target="_blank"
            rel="noreferrer"
            className="ml-1 inline-flex h-9 items-center gap-1.5 bg-[#080C0E] px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F8F5EE] outline-none transition-colors hover:bg-[#004346] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#09BC8A] sm:h-8 dark:bg-[#DAF5EE] dark:text-[#080C0E] dark:hover:bg-[#09BC8A]"
          >
            <span className="hidden sm:inline">Install extension</span>
            <span className="sm:hidden">Install</span>
            <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-[1440px] px-4 pb-8 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mb-4 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.24em] text-[#080C0E]/40 dark:text-[#F2FBF9]/40">
            <span className="flex items-center gap-2">
              <span className="size-1.5 bg-[#FF4D00]" aria-hidden /> Visual editing for real React code
            </span>
            <span className="hidden sm:inline">01 / Canvas → 02 / Code</span>
          </div>

          <div className="hero-top gap-4 lg:gap-6">
            <div className="flex min-w-0 flex-col pt-1 sm:pr-4 lg:pt-2">
              <p className="hero-title text-[clamp(2rem,4vw,3.75rem)] font-medium leading-[0.95] tracking-[-0.045em]">
                YOU<span className="hero-accent">R</span> DESI<span className="hero-accent">GN</span>,{" "}
                <span aria-hidden className="text-[#080C0E]/40 dark:text-[#F2FBF9]/40">&gt;</span>
              </p>
            </div>
            <CanvasBlock />
          </div>

          <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[1.55fr_1fr] lg:items-end lg:gap-6">
            <CodeBlock />
            <div className="flex items-end justify-start pb-1 lg:pb-2">
              <Link
                href="/editor"
                className="group/label inline-flex items-end gap-1.5 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#09BC8A]"
              >
                <span aria-hidden className="pb-1 font-mono text-lg font-light text-[#080C0E]/35 dark:text-[#F2FBF9]/35">&lt;</span>
                <span className="text-[clamp(1.5rem,3vw,2.75rem)] font-medium leading-none tracking-[-0.045em]">
                  Y<span className="hero-accent">O</span>UR FILES.
                </span>
              </Link>
            </div>
          </div>

          <h1 className="hero-headline mt-3 flex items-center gap-2 text-[clamp(2rem,7.5vw,7rem)] leading-[0.84] tracking-[-0.055em] lg:mt-4 lg:gap-3">
            <AiMark className="hero-mark h-[0.82em] w-[0.6em] shrink-0 text-[#FF4D00]" />
            <span className="hero-word min-w-0">
              SUPE<span className="hero-accent">R</span>CHARGED; WITH <span className="hero-ai">AI</span>
            </span>
          </h1>
        </section>
        
        {/* Start Now CTA Strip from Figma (node 80-698) */}
        <section aria-label="Start Now">
          <StartBanner href="/editor" />
        </section>
        
        {/* Feature: Right Inside Your Codebase */}
        <InsideCodebaseSection />
        
        {/* Workflow: Design, Review, & Ship */}
        <DesignReviewShip id="how-it-works" />

        <section aria-label="About Clairity" className="border-t border-[#080C0E]/10 dark:border-[#F2FBF9]/10">
          <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_0.9fr] lg:gap-12 lg:px-10 lg:py-12">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#080C0E]/40 dark:text-[#F2FBF9]/40">
                The artifact is your source
              </p>
              <p className="mt-3 max-w-[54ch] text-[15px] leading-relaxed text-[#080C0E]/70 dark:text-[#F2FBF9]/70">
                Clairity opens your real React/Next.js page, lets you select and edit it visually, then writes the smallest
                possible diff back to your code. No design file to drift out of sync.
              </p>
            </div>

            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#080C0E]/40 dark:text-[#F2FBF9]/40">
                Start here
              </p>
              <div className="mt-3 flex flex-col items-start gap-2.5">
                <Link
                  href="/editor"
                  className="inline-flex h-11 items-center gap-1.5 bg-[#080C0E] px-3.5 text-xs font-semibold text-[#F8F5EE] outline-none transition-colors hover:bg-[#004346] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#09BC8A] sm:h-9 dark:bg-[#DAF5EE] dark:text-[#080C0E] dark:hover:bg-[#09BC8A]"
                >
                  Open the editor <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
                <Link
                  href="/projects"
                  className="-my-2 py-2 text-xs font-medium text-[#080C0E]/60 underline decoration-[#080C0E]/20 underline-offset-4 outline-none transition-colors hover:text-[#080C0E] focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-[#F2FBF9]/60 dark:decoration-[#F2FBF9]/20 dark:hover:text-[#F2FBF9]"
                >
                  View local projects
                </Link>
              </div>
            </div>

            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#080C0E]/40 dark:text-[#F2FBF9]/40">
                Under the hood
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.13em] text-[#080C0E]/55 dark:text-[#F2FBF9]/55">
                <li>Next.js 16</li>
                <li>React 19</li>
                <li>Tailwind v4</li>
                <li>TypeScript</li>
                <li className="col-span-2 flex items-center gap-2 pt-1 text-[#09BC8A]">
                  <span className="size-1.5 rounded-full bg-[#09BC8A]" aria-hidden /> Extension in preview
                </li>
              </ul>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 border-t border-[#080C0E]/10 px-4 py-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[#080C0E]/35 sm:px-6 lg:px-10 dark:border-[#F2FBF9]/10 dark:text-[#F2FBF9]/35">
            <span>© 2026 Clairity</span>
            <span>Built for code, not screenshots</span>
          </div>
        </section>
      </main>
    </div>
  );
}
