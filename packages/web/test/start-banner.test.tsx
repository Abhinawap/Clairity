import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StartBanner, CtaBanner } from "../components/start-banner";

describe("StartBanner", () => {
  it("renders as a link by default with target URL and label", () => {
    const html = renderToStaticMarkup(<StartBanner href="/editor" />);
    expect(html).toContain('href="/editor"');
    expect(html).toContain("stArt now");
    expect(html).toContain("&gt;");
    expect(html).toContain("font-dirtyline");
    expect(html).toContain("circuit-pattern.png");
  });

  it("renders custom label and target", () => {
    const html = renderToStaticMarkup(
      <StartBanner href="/projects" label="CUSTOM CTA >" target="_blank" />
    );
    expect(html).toContain('href="/projects"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("CUSTOM CTA");
  });

  it("renders as button when onClick is provided without href", () => {
    const html = renderToStaticMarkup(
      <StartBanner href="" onClick={() => {}} label="CLICK ME" />
    );
    expect(html).toContain("<button");
    expect(html).toContain("CLICK ME");
  });

  it("exports CtaBanner as an alias", () => {
    expect(CtaBanner).toBe(StartBanner);
  });
});
