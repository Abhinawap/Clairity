import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InsideCodebaseSection, InsideCodebase, EditorSnippetGraphic } from "../components/inside-codebase";

describe("InsideCodebaseSection", () => {
  it("renders the headline in Dirtyline font", () => {
    const html = renderToStaticMarkup(<InsideCodebaseSection />);
    expect(html).toContain("RigHt inside your");
    expect(html).toContain("codebase.");
    expect(html).toContain("font-dirtyline");
  });

  it("renders the explanatory copy using Plus Jakarta Sans (font-sans)", () => {
    const html = renderToStaticMarkup(<InsideCodebaseSection />);
    expect(html).toContain(
      "Your AI works with the files that make up your actual project, instead of leaving you with a snippet to copy manually."
    );
    expect(html).toContain("font-sans");
  });

  it("renders the GET THE EXTENSION button in Dirtyline font with brutalist shadow", () => {
    const html = renderToStaticMarkup(<InsideCodebaseSection />);
    expect(html).toContain("get the extension");
    expect(html).toContain("bg-[#DAF5EE]");
    expect(html).toContain("text-[#004346]");
    expect(html).toContain("box-shadow:-4px 10px 0px #080C0E");
  });

  it("renders the editor page snippet with layers and syntax highlighted code", () => {
    const html = renderToStaticMarkup(<EditorSnippetGraphic />);
    expect(html).toContain("Clairity");
    expect(html).toContain("components/hero.tsx");
    expect(html).toContain("components/hero.tsx · 35 lines");
    expect(html).toContain("LAYERS");
    expect(html).toContain("section");
    expect(html).toContain("h1");
    expect(html).toContain("The website builder you&#39;re");
  });

  it("exports InsideCodebase as an alias for InsideCodebaseSection", () => {
    expect(InsideCodebase).toBe(InsideCodebaseSection);
  });
});
