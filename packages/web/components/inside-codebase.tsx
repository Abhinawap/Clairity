"use client";

import { ChevronDown, Code2, Component, FileCode2, Lock, Type } from "lucide-react";
import { useState } from "react";

interface LayerNode {
  id: string;
  name: string;
  type: "element" | "component" | "text";
  depth: number;
  isText?: boolean;
  locked?: boolean;
  hasChevron?: boolean;
  lineRange: [number, number]; // [startLine, endLine]
}

const LAYERS_DATA: LayerNode[] = [
  { id: "section", name: "section", type: "element", depth: 0, hasChevron: true, lineRange: [6, 31] },
  { id: "div", name: "div", type: "element", depth: 1, hasChevron: true, lineRange: [7, 30] },
  { id: "image", name: "Image", type: "component", depth: 2, hasChevron: false, lineRange: [9, 9] },
  { id: "h1", name: "h1", type: "element", depth: 2, hasChevron: true, lineRange: [10, 13] },
  { id: "text-builder", name: '"The visual frontend t..."', type: "text", depth: 3, isText: true, lineRange: [11, 11] },
  { id: "br", name: "br", type: "element", depth: 3, hasChevron: false, lineRange: [11, 11] },
  { id: "text-looking", name: '"looking for"', type: "text", depth: 3, isText: true, lineRange: [12, 12] },
  { id: "a", name: "a", type: "element", depth: 2, hasChevron: true, locked: true, lineRange: [14, 17] },
  { id: "text-start", name: '"Start"', type: "text", depth: 3, isText: true, lineRange: [15, 15] },
  { id: "span", name: "span", type: "element", depth: 2, hasChevron: true, locked: true, lineRange: [16, 16] },
  { id: "text-arrow", name: '"->"', type: "text", depth: 3, isText: true, lineRange: [16, 16] },
  { id: "button", name: "button", type: "element", depth: 2, hasChevron: true, locked: true, lineRange: [18, 20] },
  { id: "text-learn", name: '"Learn More"', type: "text", depth: 3, isText: true, lineRange: [19, 19] },
];

interface CodeLine {
  num: number;
  html: string;
}

const CODE_LINES: CodeLine[] = [
  {
    num: 1,
    html: '<span class="text-[#c084fc]">import</span> <span class="text-white">Image</span> <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">&quot;next/image&quot;</span>;',
  },
  {
    num: 2,
    html: '<span class="text-[#c084fc]">import</span> { <span class="text-white">cn</span> } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">&quot;@/lib/utils&quot;</span>;',
  },
  {
    num: 3,
    html: "",
  },
  {
    num: 4,
    html: '<span class="text-[#c084fc]">export default function</span> <span class="text-[#fbbf24]">Hero</span>({ <span class="text-white">items, show, active, ...props</span> }) {',
  },
  {
    num: 5,
    html: '  <span class="text-[#c084fc]">return</span> (',
  },
  {
    num: 6,
    html: '    &lt;<span class="text-[#60a5fa]">section</span> <span class="text-[#93c5fd]">className</span>=<span class="text-[#86efac]">&quot;relative&quot;</span>&gt;',
  },
  {
    num: 7,
    html: '      &lt;<span class="text-[#60a5fa]">div</span> <span class="text-[#93c5fd]">className</span>=<span class="text-[#86efac]">&quot;mx-auto max-w-6xl px-4 sm:px-6&quot;</span>&gt;',
  },
  {
    num: 8,
    html: '        <span class="text-zinc-500 italic">{/* Section header */}</span>',
  },
  {
    num: 9,
    html: '        &lt;<span class="text-[#818cf8]">Image</span> <span class="text-[#93c5fd]">className</span>=<span class="text-[#86efac]">&quot;rounded-full&quot;</span> <span class="text-[#93c5fd]">src</span>={<span class="text-white">avatar</span>} <span class="text-[#93c5fd]">width</span>={<span class="text-[#fdba74]">32</span>} <span class="text-[#93c5fd]">alt</span>=<span class="text-[#86efac]">&quot;Avatar&quot;</span> /&gt;',
  },
  {
    num: 10,
    html: '        &lt;<span class="text-[#60a5fa]">h1</span> <span class="text-[#93c5fd]">className</span>=<span class="text-[#86efac]">&quot;mb-6 text-5xl font-bold md:text-6xl&quot;</span> <span class="text-[#93c5fd]">data-aos-delay</span>={<span class="text-[#fdba74]">150</span>}&gt;',
  },
  {
    num: 11,
    html: '          The website builder you&#39;re &lt;<span class="text-[#60a5fa]">br</span> <span class="text-[#93c5fd]">className</span>=<span class="text-[#86efac]">&quot;max-lg:hidden&quot;</span> /&gt;',
  },
  {
    num: 12,
    html: "          looking for",
  },
  {
    num: 13,
    html: '        &lt;/<span class="text-[#60a5fa]">h1</span>&gt;',
  },
  {
    num: 14,
    html: '        &lt;<span class="text-[#60a5fa]">a</span> <span class="text-[#93c5fd]">className</span>={<span class="text-white">cn</span>(<span class="text-[#86efac]">&quot;btn&quot;</span>, active &amp;&amp; <span class="text-[#86efac]">&quot;bg-blue-500&quot;</span>)} <span class="text-[#93c5fd]">href</span>=<span class="text-[#86efac]">&quot;#0&quot;</span>&gt;',
  },
  {
    num: 15,
    html: '          Start{&quot; &quot;}',
  },
  {
    num: 16,
    html: '          &lt;<span class="text-[#60a5fa]">span</span> <span class="text-[#93c5fd]">className</span>={`ml-1 ${active ? <span class="text-[#86efac]">&quot;text-blue-300&quot;</span> : <span class="text-[#86efac]">&quot;&quot;</span>}`}&gt;-&amp;gt;&lt;/<span class="text-[#60a5fa]">span</span>&gt;',
  },
  {
    num: 17,
    html: '        &lt;/<span class="text-[#60a5fa]">a</span>&gt;',
  },
  {
    num: 18,
    html: '        &lt;<span class="text-[#60a5fa]">button</span> { ...props} <span class="text-[#93c5fd]">className</span>=<span class="text-[#86efac]">&quot;w-60 rounded-lg&quot;</span>&gt;',
  },
];

export function EditorSnippetGraphic() {
  const [selectedId, setSelectedId] = useState<string>("h1");

  const selectedNode = LAYERS_DATA.find((item) => item.id === selectedId) ?? LAYERS_DATA[3];
  const [startLine, endLine] = selectedNode.lineRange;

  return (
    <div className="relative overflow-hidden rounded-tl-2xl border-t border-l border-white/10 bg-[#080C0E] text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:rounded-tl-3xl">
      {/* Top Bar */}
      <div className="flex h-11 items-center border-b border-white/10 px-4 sm:px-6">
        <div className="flex w-52 shrink-0 items-center gap-2.5 sm:w-60">
          <span className="text-sm font-bold tracking-tight text-white">Clairity</span>
          <span className="font-mono text-xs text-white/50">components/hero.tsx</span>
        </div>
        <div className="hidden h-4 w-px bg-white/10 sm:block" />
        <div className="flex min-w-0 items-center gap-2 pl-4 font-mono text-xs text-white/60">
          <FileCode2 className="size-3.5 text-white/50" aria-hidden />
          <span className="truncate">components/hero.tsx · 35 lines</span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex flex-col sm:flex-row">
        {/* Left: Layers Panel */}
        <div className="w-full shrink-0 border-b border-white/10 py-3 font-mono text-xs sm:w-56 sm:border-b-0 sm:border-r lg:w-64">
          <div className="px-4 pb-2 text-[10px] font-semibold tracking-wider text-white/40">LAYERS</div>
          <div className="space-y-0.5">
            {LAYERS_DATA.map((node) => {
              const isSelected = node.id === selectedId;
              const indentPadding = node.depth * 14 + 12;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  style={{ paddingLeft: `${indentPadding}px` }}
                  className={`group flex h-7 w-full items-center gap-1.5 pr-3 text-left transition-colors ${
                    isSelected
                      ? "bg-[#1d4ed8] text-white font-medium"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {node.hasChevron ? (
                    <ChevronDown className={`size-3 shrink-0 ${isSelected ? "text-white" : "text-white/40"}`} aria-hidden />
                  ) : (
                    <span className="size-3 shrink-0" />
                  )}

                  {node.type === "component" ? (
                    <Component className="size-3 shrink-0 text-[#818cf8]" aria-hidden />
                  ) : node.type === "text" ? (
                    <Type className={`size-3 shrink-0 ${isSelected ? "text-white" : "text-white/40"}`} aria-hidden />
                  ) : (
                    <Code2 className={`size-3 shrink-0 ${isSelected ? "text-white" : "text-white/40"}`} aria-hidden />
                  )}

                  <span className={`truncate ${node.isText ? "text-[11px] text-white/55" : "text-xs text-white/85"}`}>
                    {node.name}
                  </span>

                  {node.locked && (
                    <Lock
                      className="ml-auto size-3 shrink-0 text-amber-400/80"
                      aria-label="Locked"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Editor View */}
        <div className="min-w-0 flex-1 overflow-x-auto py-3 font-mono text-[11px] leading-6 sm:text-xs">
          <table className="w-full border-collapse">
            <tbody>
              {CODE_LINES.map((line) => {
                const isHighlighted = line.num >= startLine && line.num <= endLine;

                return (
                  <tr
                    key={line.num}
                    className={`transition-colors ${
                      isHighlighted
                        ? "bg-[#111c38] text-white"
                        : "hover:bg-white/[0.03] text-white/80"
                    }`}
                  >
                    <td
                      className={`w-9 shrink-0 select-none pr-3 text-right text-[11px] sm:w-11 sm:pr-4 ${
                        isHighlighted
                          ? "text-[#60a5fa] font-semibold"
                          : "text-zinc-600"
                      }`}
                    >
                      {line.num}
                    </td>
                    <td
                      className="whitespace-pre pr-6"
                      dangerouslySetInnerHTML={{ __html: line.html || " " }}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function InsideCodebaseSection() {
  return (
    <section className="relative overflow-hidden bg-[#004346] text-[#DAF5EE] pt-14 sm:pt-20 lg:pt-28 pb-0">
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Header in Dirtyline font */}
        <h2 className="font-dirtyline text-white text-[clamp(2.5rem,5.5vw,5.5rem)] leading-[0.92] tracking-normal">
          RigHt inside your
          <br />
          codebase.
        </h2>

        {/* Two-Column Grid: Copy + CTA on Left, Editor Snippet on Right */}
        <div className="mt-10 sm:mt-14 lg:mt-16 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-5 flex flex-col justify-between pt-1 pb-10 sm:pb-14 lg:pb-28">
            <p className="font-sans text-[#DAF5EE]/90 text-base sm:text-lg lg:text-[19px] leading-relaxed max-w-[36ch]">
              Your AI works with the files that make up your actual project, instead of leaving you with a snippet to copy manually.
            </p>

            <div className="mt-10 sm:mt-16 lg:mt-24">
              <a
                href="https://github.com/Abhinawap/Clairity"
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex items-center justify-center font-dirtyline text-sm sm:text-base lg:text-lg text-[#004346] bg-[#DAF5EE] px-8 py-4 sm:px-10 sm:py-4.5 transition-all duration-150 hover:-translate-x-0.5 hover:translate-y-1 active:-translate-x-1 active:translate-y-2.5 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DAF5EE]"
                style={{
                  boxShadow: "-4px 10px 0px #080C0E",
                }}
              >
                get the extension
              </a>
            </div>
          </div>

          {/* Right Column: Editor Page Snippet */}
          <div className="lg:col-span-7 relative lg:-mr-16">
            <EditorSnippetGraphic />
          </div>
        </div>
      </div>
    </section>
  );
}

export const InsideCodebase = InsideCodebaseSection;
