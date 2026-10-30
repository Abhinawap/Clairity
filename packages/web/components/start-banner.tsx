import Image from "next/image";
import Link from "next/link";
import React from "react";

export interface StartBannerProps {
  /** Target URL when clicked. Defaults to "/editor". */
  href?: string;
  /** Click handler if used as an action button. */
  onClick?: () => void;
  /** Call-to-action text. Defaults to "START NOW >". */
  label?: string;
  /** Custom CSS classes for the container. */
  className?: string;
  /** Target window/tab for the link (e.g. "_blank"). */
  target?: string;
  /** Rel attribute for external links. */
  rel?: string;
  /** Whether to hide the trailing chevron arrow. */
  hideArrow?: boolean;
  /** Compact height variant (min-h-[120px] instead of min-h-[174px]). */
  compact?: boolean;
}

/**
 * StartBanner / CtaBanner:
 * Recreates Figma node 80-698 from CLAIRITY.
 * Features an authentic circuit grid matrix on the left fading into brand navy (#172A3A),
 * a solid teal bottom accent border (#004346), and typography in Dirtyline 36daysoftype font.
 */
export function StartBanner({
  href = "/editor",
  onClick,
  label = "stArt now >",
  className = "",
  target,
  rel,
  hideArrow = false,
  compact = false,
}: StartBannerProps) {
  // Normalize label so that trailing ">" or "&gt;" is separated into an animated glyph
  const cleanLabel = label.replace(/\s*>$/, "").trim();
  const hasArrow = !hideArrow && (label.trim().endsWith(">") || !hideArrow);

  const containerClasses = [
    "group relative block w-full overflow-hidden select-none",
    "bg-[#172A3A] border-b-4 border-[#004346]",
    "transition-all duration-300 hover:border-[#09BC8A]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#09BC8A]",
    compact ? "h-[120px]" : "h-[140px] sm:h-[160px] md:h-[174px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const innerContent = (
    <>
      {/* Circuit pattern on the left fading to brand navy on the right */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-full max-w-[880px] select-none overflow-hidden"
        aria-hidden="true"
      >
        <Image
          src="/assets/circuit-pattern.png"
          alt=""
          width={880}
          height={170}
          priority
          unoptimized
          className="h-full w-auto max-w-none object-contain object-left opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>

      {/* Subtle glow wash on hover */}
      <div
        className="pointer-events-none absolute inset-0 bg-radial from-[#09BC8A]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Text CTA on the right, aligned with the lower circuit channel */}
      <div className="relative z-10 flex h-full items-end justify-end pb-8 pr-6 sm:pb-9 sm:pr-12 md:pb-10 md:pr-24 lg:pr-32">
        <div className="flex items-center gap-2.5 font-dirtyline text-2xl tracking-[0.04em] text-[#F2FBF9] transition-all duration-300 group-hover:text-[#09BC8A] group-hover:drop-shadow-[0_0_16px_rgba(9,188,138,0.45)] sm:text-[26px] md:text-[28px]">
          <span>{cleanLabel}</span>
          {hasArrow && (
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1.5"
            >
              &gt;
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (onClick && !href) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${containerClasses} text-left cursor-pointer`}
      >
        {innerContent}
      </button>
    );
  }

  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      onClick={onClick}
      className={containerClasses}
    >
      {innerContent}
    </Link>
  );
}

// Export aliases for flexible imports
export const CtaBanner = StartBanner;
export const StartNowBanner = StartBanner;
export default StartBanner;
