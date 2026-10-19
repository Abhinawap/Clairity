import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { IRNode } from "../src/ir";
import { parseFile } from "../src/parse";

const FILE = "components/hero.tsx";
const code = readFileSync(new URL("./fixtures/hero.tsx", import.meta.url), "utf8");
const lines = code.split("\n");
const roots = parseFile(code, FILE);
const all = (nodes: IRNode[]): IRNode[] => nodes.flatMap((n) => [n, ...all(n.children)]);
const find = (name: string) => all(roots).find((n) => n.name === name)!;
const at = (n: IRNode) => lines[n.source.line - 1].slice(n.source.column);

describe("parseFile", () => {
  it("returns one root per outermost JSX expression, with exact source and a location-based id", () => {
    expect(roots.map((r) => r.name)).toEqual(["section", "span"]);
    const [section] = roots;
    expect(section.source).toEqual({ file: FILE, line: 6, column: 4, endLine: 30, endColumn: 14 });
    expect(section.id).toBe(createHash("sha1").update("components/hero.tsx:section:6:4").digest("hex").slice(0, 12));
    expect(new Set(all(roots).map((n) => n.id)).size).toBe(all(roots).length);
  });

  it("points every element and trimmed text run at its own source", () => {
    for (const name of ["Image", "br", "li", "motion.div"]) expect(at(find(name))).toMatch(new RegExp(`^<${name}\\b`));
    expect(at(find("h1").children[0])).toMatch(/^The website builder/);
    expect(at(find("h1").children[2])).toMatch(/^looking for/);
  });

  it("builds the scene graph: text, components, literal props, read-only nodes, hoisted fragments, .map and conditionals", () => {
    const box = (top: string, right: string, bottom: string, left: string) => ({ top, right, bottom, left });
    const textRun = (text: string) => ({ type: "text", name: "#text", text, children: [] });
    const notLiteral = { editable: false, reason: "className is not a string literal" };

    expect(roots[0]).toMatchObject({
      type: "element", name: "section", style: {}, passthroughClasses: ["relative"], editable: true,
      children: [{
        name: "div",
        style: { margin: box("0", "auto", "0", "auto"), padding: box("0", "1rem", "0", "1rem") },
        passthroughClasses: ["max-w-6xl", "sm:px-6"],
        children: [
          { type: "component", name: "Image", editable: true, props: { width: 32, alt: "Avatar" }, style: { borderRadius: "calc(infinity * 1px)" }, children: [] },
          {
            name: "h1", editable: true,
            props: { "data-aos-delay": 150 },
            style: { margin: box("0", "0", "1.5rem", "0"), fontSize: "var(--text-5xl)", fontWeight: "var(--font-weight-bold)" },
            passthroughClasses: ["md:text-6xl"],
            children: [textRun("The website builder you're"), { name: "br", passthroughClasses: ["max-lg:hidden"] }, textRun("looking for")],
          },
          { name: "a", props: { href: "#0" }, ...notLiteral, children: [textRun("Start"), { name: "span", ...notLiteral, children: [textRun("->")] }] },
          {
            name: "button", editable: false, reason: "spreads props, so its className may be overridden",
            style: { width: "15rem", borderRadius: "var(--radius-lg)" }, children: [textRun("Learn More")],
          },
          { name: "ul", editable: true, passthroughClasses: ["[&_span]:opacity-0"], children: [{ name: "li", props: {}, children: [] }] },
          { type: "component", name: "motion.div", editable: true, props: { hidden: true }, style: { margin: box("1rem", "0", "0", "0") }, children: [] },
        ],
      }],
    });
    expect(find("Image").props).not.toHaveProperty("src");
    expect(roots[0].children[0].children).toHaveLength(6);
    expect(roots[1]).toMatchObject({ name: "span", style: { fontSize: "var(--text-xs)" }, children: [textRun("New")] });
  });

  it("throws the Babel error for a file it cannot parse", () => {
    expect(() => parseFile("export default () => <div>", FILE)).toThrow(/Unexpected token|Unterminated JSX/);
  });
});
