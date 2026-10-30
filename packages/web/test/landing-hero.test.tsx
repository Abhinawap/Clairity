import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingHero } from "../components/landing-hero";

describe("LandingHero", () => {
  it("renders the editorial hero copy with Dirtyline accent glyphs", () => {
    const html = renderToStaticMarkup(<LandingHero />);
    expect(html).toContain("YOU<span class=\"hero-accent\">R</span> DESI<span class=\"hero-accent\">GN</span>");
    expect(html).toContain("Y<span class=\"hero-accent\">O</span>UR FILES.");
    expect(html).toContain("SUPE<span class=\"hero-accent\">R</span>CHARGED; WITH");
    expect(html).toContain("hero-ai");
    expect(html).toContain("hero-mark");
  });

  it("links the canvas and code surfaces to the editor", () => {
    const html = renderToStaticMarkup(<LandingHero />);
    expect(html).toContain("Get started");
    expect(html).toContain("href=\"/editor\"");
    expect(html).toContain("href=\"/projects\"");
    expect(html).toContain("Install extension");
    expect(html).toContain("Open the editor");
    expect(html).toContain("View local projects");
  });

  it("renders the hover/scroll hooks used by the hero interactions", () => {
    const html = renderToStaticMarkup(<LandingHero />);
    expect(html).toContain("hero-top");
    expect(html).toContain("hero-canvas");
    expect(html).toContain("canvas-layers");
    expect(html).toContain("hero-code");
    expect(html).toContain("hero-code-expansion");
    expect(html).toContain("hero-code-track");
  });
});
