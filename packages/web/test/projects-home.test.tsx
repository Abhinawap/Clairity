import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectsHome } from "../components/projects-home";

describe("ProjectsHome", () => {
  it("renders the workspace heading, counts, and local projects", () => {
    const html = renderToStaticMarkup(<ProjectsHome />);
    expect(html).toContain("Local workspaces / 03");
    expect(html).toContain("Your");
    expect(html).toContain("rojects");
    expect(html).toContain("font-dirtyline");
    expect(html).toContain("hero-landing");
    expect(html).toContain("harbor-console");
    expect(html).toContain("studio-portfolio");
    expect(html).toContain("New project");
    expect(html).toContain("Live sessions");
    expect(html).toContain("Scene nodes");
    expect(html).toContain("Cards");
    expect(html).toContain("Rows");
    expect(html).toContain('aria-label="Project layout"');
    expect(html).toContain("Extension session");
  });

  it("exposes the project and account routes", () => {
    const html = renderToStaticMarkup(<ProjectsHome />);
    expect(html).toContain('href="/editor?workspace=hero-landing"');
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/"');
    expect(html).toContain("Open hero-landing in the editor");
    expect(html).toContain("Search projects");
    expect(html).toContain('aria-keyshortcuts="/"');
  });

  it("uses local project data without placeholder vendors", () => {
    const html = renderToStaticMarkup(<ProjectsHome />);
    expect(html).toContain("Tailwind CSS");
    expect(html).toContain("Inline styles");
    expect(html).not.toContain("acme");
    expect(html).not.toContain("Acme");
  });
});
