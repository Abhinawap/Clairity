import React from "react";
import { Check, ChevronRight, Code2, Layers, MousePointer2, Sparkles } from "lucide-react";

export interface WorkflowStep {
  id?: string;
  title: string;
  description: string;
  media?: React.ReactNode;
  previewType?: "inspect" | "controls" | "diff" | "accept" | "wireframe";
}

export interface DesignReviewShipProps {
  id?: string;
  className?: string;
  headline?: React.ReactNode;
  subheadline?: React.ReactNode;
  steps?: WorkflowStep[];
  wireframe?: boolean;
}

/**
 * Interactive micro-visuals for the 4 steps of Clarity's workflow
 */
function StepVisual({ type }: { type: "inspect" | "controls" | "diff" | "accept" | "wireframe" }) {
  if (type === "wireframe") {
    return null;
  }

  if (type === "inspect") {
    return (
      <div className="flex h-full w-full flex-col justify-between p-4 sm:p-5 select-none" aria-hidden>
        {/* Top mini browser chrome */}
        <div className="flex items-center justify-between border-b border-[#080C0E]/10 pb-2 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#080C0E]/20 dark:bg-white/20" />
            <span className="size-2 rounded-full bg-[#080C0E]/20 dark:bg-white/20" />
            <span className="size-2 rounded-full bg-[#080C0E]/20 dark:bg-white/20" />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#080C0E]/40 dark:text-white/40">
            preview · live
          </span>
        </div>

        {/* Mock visual canvas with selected button */}
        <div className="relative my-auto flex flex-col items-center justify-center py-4">
          <div className="mb-2 h-2 w-24 rounded-full bg-[#080C0E]/15 dark:bg-white/15" />
          <div className="mb-4 h-1.5 w-16 rounded-full bg-[#080C0E]/10 dark:bg-white/10" />

          {/* Selected target element with bounding box & handles */}
          <div className="relative">
            <div className="flex h-9 items-center justify-center rounded-lg bg-[#004346] px-4 text-xs font-semibold text-[#DAF5EE] shadow-sm">
              Hero Button
            </div>
            {/* Clairity cyan selection box */}
            <span className="pointer-events-none absolute -inset-1.5 border border-dashed border-[#09BC8A]" />
            <span className="absolute -left-2 -top-2 size-1.5 bg-[#09BC8A]" />
            <span className="absolute -right-2 -top-2 size-1.5 bg-[#09BC8A]" />
            <span className="absolute -bottom-2 -left-2 size-1.5 bg-[#09BC8A]" />
            <span className="absolute -bottom-2 -right-2 size-1.5 bg-[#09BC8A]" />

            {/* Element badge */}
            <span className="absolute -top-6 left-0 rounded bg-[#09BC8A] px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-[#002b2d]">
              &lt;Button /&gt;
            </span>

            {/* Hover cursor */}
            <div className="absolute -bottom-3 -right-3 flex items-center gap-1 text-[#080C0E] transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1 dark:text-[#DAF5EE]">
              <MousePointer2 className="size-4 fill-current drop-shadow-sm" />
            </div>
          </div>
        </div>

        {/* Bottom layer tree chip */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#080C0E]/10 bg-white/60 px-2.5 py-1.5 font-mono text-[9px] text-[#080C0E]/70 backdrop-blur-sm dark:border-white/10 dark:bg-[#002224]/80 dark:text-[#DAF5EE]/80">
          <Layers className="size-3 text-[#09BC8A]" />
          <span>Section</span>
          <ChevronRight className="size-2.5 text-[#080C0E]/30 dark:text-white/30" />
          <span className="font-semibold text-[#004346] dark:text-[#09BC8A]">Hero CTA</span>
        </div>
      </div>
    );
  }

  if (type === "controls") {
    return (
      <div className="flex h-full w-full flex-col justify-between p-4 sm:p-5 select-none" aria-hidden>
        {/* Inspector top bar */}
        <div className="flex items-center justify-between border-b border-[#080C0E]/10 pb-2 dark:border-white/10">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[#080C0E]/60 dark:text-[#DAF5EE]/60">
            Inspector
          </span>
          <span className="rounded bg-[#09BC8A]/20 px-1.5 py-0.5 font-mono text-[8px] font-medium text-[#004346] dark:text-[#09BC8A]">
            Auto-diff
          </span>
        </div>

        {/* Visual control controls */}
        <div className="my-auto space-y-3">
          {/* Padding control */}
          <div>
            <div className="mb-1 flex justify-between font-mono text-[9px] text-[#080C0E]/60 dark:text-[#DAF5EE]/60">
              <span>Padding</span>
              <span className="font-semibold text-[#080C0E] dark:text-[#DAF5EE]">24px</span>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-[#080C0E]/5 p-0.5 text-center font-mono text-[9px] dark:bg-white/5">
              <span className="py-1 text-[#080C0E]/40 dark:text-white/40">12px</span>
              <span className="py-1 text-[#080C0E]/40 dark:text-white/40">16px</span>
              <span className="rounded bg-[#09BC8A] py-1 font-semibold text-[#002b2d] shadow-xs">24px</span>
            </div>
          </div>

          {/* Color palette row */}
          <div>
            <span className="mb-1 block font-mono text-[9px] text-[#080C0E]/60 dark:text-[#DAF5EE]/60">Accent color</span>
            <div className="flex items-center gap-2">
              <span className="size-4 rounded-full bg-[#004346] ring-1 ring-black/10" />
              <span className="flex size-4 items-center justify-center rounded-full bg-[#09BC8A] ring-2 ring-[#004346] dark:ring-white">
                <Check className="size-2.5 text-[#002b2d]" />
              </span>
              <span className="size-4 rounded-full bg-[#FF4D00] ring-1 ring-black/10" />
              <span className="size-4 rounded-full bg-[#172A3A] ring-1 ring-black/10" />
            </div>
          </div>
        </div>

        {/* AI Prompt Input Bar */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#080C0E]/10 bg-white/75 px-2.5 py-2 font-mono text-[9px] text-[#080C0E]/80 shadow-xs backdrop-blur-sm dark:border-white/10 dark:bg-[#002224]/80 dark:text-[#DAF5EE]">
          <Sparkles className="size-3 shrink-0 text-[#FF4D00]" />
          <span className="min-w-0 truncate text-[9.5px]">Make padding 24px &amp; rounded</span>
          <span className="ml-auto shrink-0 rounded bg-[#09BC8A] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#002b2d]">
            AI
          </span>
        </div>
      </div>
    );
  }

  if (type === "diff") {
    return (
      <div className="flex h-full w-full flex-col justify-between overflow-hidden bg-[#05090A] p-4 font-mono text-[10px] text-[#DAF5EE] select-none sm:p-5" aria-hidden>
        {/* Code window header */}
        <div className="flex items-center justify-between border-b border-[#DAF5EE]/10 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#FF4D00]" />
            <span className="size-2 rounded-full bg-[#DAF5EE]/30" />
            <span className="size-2 rounded-full bg-[#09BC8A]" />
          </div>
          <span className="truncate text-[9px] text-[#DAF5EE]/50">hero-button.tsx</span>
          <span className="rounded bg-[#09BC8A]/15 px-1 py-0.5 text-[8px] text-[#8CEBC8]">+12 −4</span>
        </div>

        {/* Code diff lines */}
        <div className="my-auto space-y-1.5 py-2">
          <p className="truncate text-[#DAF5EE]/35">
            <span className="mr-2 text-[#DAF5EE]/20">11</span>
            export function HeroCTA() &#123;
          </p>
          <div className="rounded bg-[#FF4D00]/15 px-1.5 py-0.5 text-[#FFAA97]">
            <span className="mr-1.5 text-[#FF4D00]">-</span>
            <span className="truncate">&lt;button className=&quot;p-3&quot;&gt;</span>
          </div>
          <div className="rounded bg-[#09BC8A]/20 px-1.5 py-0.5 text-[#8CEBC8]">
            <span className="mr-1.5 text-[#09BC8A]">+</span>
            <span className="truncate">&lt;button className=&quot;p-6 rounded-2xl&quot;&gt;</span>
          </div>
          <p className="truncate text-[#DAF5EE]/35">
            <span className="mr-2 text-[#DAF5EE]/20">14</span>
            &#125;
          </p>
        </div>

        {/* Diff footer status */}
        <div className="flex items-center justify-between border-t border-[#DAF5EE]/10 pt-2 text-[8.5px] uppercase tracking-wider text-[#DAF5EE]/40">
          <span className="flex items-center gap-1">
            <Code2 className="size-3 text-[#09BC8A]" /> AST Verified
          </span>
          <span className="text-[#09BC8A]">Clean patch</span>
        </div>
      </div>
    );
  }

  // type === "accept"
  return (
    <div className="flex h-full w-full flex-col justify-between p-4 sm:p-5 select-none" aria-hidden>
      {/* Git branch banner */}
      <div className="flex items-center justify-between border-b border-[#080C0E]/10 pb-2 dark:border-white/10">
        <span className="font-mono text-[9px] text-[#080C0E]/50 dark:text-[#DAF5EE]/50">
          git: <strong className="font-semibold text-[#080C0E] dark:text-[#DAF5EE]">feat/landing</strong>
        </span>
        <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-[#09BC8A]">
          <span className="size-1.5 rounded-full bg-[#09BC8A] animate-pulse" /> Synced
        </span>
      </div>

      {/* Accept button & status card */}
      <div className="my-auto flex flex-col items-center justify-center text-center">
        <div className="relative mb-2.5">
          <div className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#09BC8A] px-4 font-sans text-xs font-bold text-[#002b2d] shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-[#2ad3a3]">
            <Check className="size-3.5 stroke-[3]" />
            Apply to Codebase
          </div>
          <span className="pointer-events-none absolute -inset-1 rounded-2xl border border-[#09BC8A]/40 animate-ping opacity-25" />
        </div>
        <p className="font-mono text-[9px] text-[#080C0E]/55 dark:text-[#DAF5EE]/55">
          Direct disk write · Zero drift
        </p>
      </div>

      {/* Confirmation toast */}
      <div className="flex items-center gap-2 rounded-lg border border-[#09BC8A]/30 bg-[#09BC8A]/10 px-2.5 py-1.5 font-mono text-[9px] text-[#004346] dark:text-[#8CEBC8]">
        <span className="flex size-3.5 items-center justify-center rounded-full bg-[#09BC8A] text-[#002b2d]">
          <Check className="size-2.5 stroke-[3]" />
        </span>
        <span className="truncate">Saved to packages/web/components</span>
      </div>
    </div>
  );
}

const defaultSteps: WorkflowStep[] = [
  {
    id: "step-1",
    title: "Pick an element directly on the page",
    description: "Click on any element in your website and see its structure in the layer tree. No guesswork, no manual selection.",
    previewType: "inspect",
  },
  {
    id: "step-2",
    title: "Adjust the design using visual controls or AI.",
    description: "Use the inspector for precise changes or let AI handle the details. Your intent, our tools.",
    previewType: "controls",
  },
  {
    id: "step-3",
    title: "Inspect the proposed changes in a code diff.",
    description: "See exactly what's changing, line by line. Keep control, catch issues, and make sure it fits your code standards.",
    previewType: "diff",
  },
  {
    id: "step-4",
    title: "Accept the changes into your project.",
    description: "Once you're happy, apply the changes. Clarity writes directly to your codebase. no copy-paste, no extra steps.",
    previewType: "accept",
  },
];

/**
 * DesignReviewShip Component
 *
 * Implements the 4-column workflow section from Clairity's design system:
 * - Headline uses Dirtyline 36daysoftype 2022 font
 * - Subtitle and card copy use Plus Jakarta Sans
 * - Mint background (#DAF5EE) matching Clairity's signature palette
 * - Responsive 4-column layout with rounded preview cards
 */
export function DesignReviewShip({
  id = "how-it-works",
  className = "",
  headline = "dEsIgn, Review, & ship",
  subheadline = "Clarity turns your design intent into real code changes. Select an element, edit visually or with AI, review the diff, and apply it directly to your project - all in your codebase.",
  steps = defaultSteps,
  wireframe = false,
}: DesignReviewShipProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`relative w-full bg-[#DAF5EE] text-[#080C0E] transition-colors dark:bg-[#07191C] dark:text-[#F2FBF9] ${className}`}
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 md:py-24 lg:px-12 lg:py-28 xl:px-16">
        {/* Header Section */}
        <div className="mx-auto max-w-4xl text-center">
          <h2
            id={`${id}-heading`}
            style={{
              fontFamily: "var(--font-dirtyline), 'Dirtyline 36Daysoftype 2022', serif",
              fontWeight: 400,
            }}
            className="font-dirtyline text-[clamp(2.25rem,5.5vw,5.25rem)] leading-[0.96] tracking-normal text-[#080C0E] dark:text-[#DAF5EE]"
          >
            {headline}
          </h2>

          {subheadline && (
            <p className="mx-auto mt-5 max-w-[760px] font-sans text-[clamp(0.95rem,1.25vw,1.15rem)] font-normal leading-relaxed text-[#080C0E]/75 sm:mt-6 dark:text-[#DAF5EE]/75">
              {subheadline}
            </p>
          )}
        </div>

        {/* 4 Cards Workflow Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-7 xl:gap-8">
          {steps.map((step, index) => {
            const previewType = wireframe ? "wireframe" : (step.previewType ?? "wireframe");

            return (
              <div
                key={step.id ?? `step-${index}`}
                className="group flex flex-col"
              >
                {/* Visual Placeholder / Mockup Card */}
                <div
                  className="relative aspect-[400/415] w-full overflow-hidden rounded-[22px] bg-[#D9D9D9] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_32px_-12px_rgba(0,67,70,0.18)] sm:rounded-[26px] dark:bg-[#122427] dark:group-hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)]"
                >
                  {step.media ? (
                    step.media
                  ) : (
                    <StepVisual type={previewType} />
                  )}
                </div>

                {/* Card Title */}
                <h3 className="mt-5 font-sans text-lg font-bold leading-snug tracking-tight text-[#080C0E] sm:mt-6 sm:text-[19px] lg:text-[20px] dark:text-[#F2FBF9]">
                  {step.title}
                </h3>

                {/* Card Description */}
                <p className="mt-2.5 font-sans text-sm font-normal leading-relaxed text-[#080C0E]/70 sm:mt-3 sm:text-[14.5px] dark:text-[#F2FBF9]/70">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Named alias for convenience
export const WorkflowSection = DesignReviewShip;
