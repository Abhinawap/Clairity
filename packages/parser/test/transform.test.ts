import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { IRNode } from "../src/ir";
import { parseFile } from "../src/parse";
import { editClasses, editNodes, editStyle, editText } from "../src/transform";

const FILE = "components/hero.tsx";
const code = readFileSync(new URL("./fixtures/hero.tsx", import.meta.url), "utf8");
const all = (nodes: IRNode[]): IRNode[] => nodes.flatMap((n) => [n, ...all(n.children)]);
const id = (name: string) => all(parseFile(code, FILE)).find((n) => n.name === name)!.id;

/** [lineNumber, before, after] for every line that differs. */
function changedLines(before: string, after: string) {
  const a = before.split("\n");
  const b = after.split("\n");
  expect(b).toHaveLength(a.length);
  return a.flatMap((line, i) => (line === b[i] ? [] : [[i + 1, line, b[i]]]));
}

describe("editClasses", () => {
  it("swaps one token in place, leaving sm:px-6 and every other line alone", () => {
    const out = editClasses(code, FILE, id("div"), { removed: ["px-4"], added: ["px-6"] });
    expect(changedLines(code, out)).toEqual([
      [7, `      <div className="mx-auto max-w-6xl px-4 sm:px-6">`, `      <div className="mx-auto max-w-6xl px-6 sm:px-6">`],
    ]);
  });

  it("removes and appends tokens when the counts differ", () => {
    const out = editClasses(code, FILE, id("h1"), { removed: ["mb-6", "md:text-6xl"], added: ["mb-8"] });
    expect(changedLines(code, out)).toEqual([
      [10, `        <h1 className="mb-6 text-5xl font-bold md:text-6xl" data-aos-delay={150}>`, `        <h1 className="mb-8 text-5xl font-bold" data-aos-delay={150}>`],
    ]);
  });

  it("keeps the element's id stable, so the edited file still resolves the node", () => {
    const out = editClasses(code, FILE, id("div"), { removed: ["px-4"], added: ["px-6"] });
    expect(all(parseFile(out, FILE)).find((n) => n.id === id("div"))?.style.padding?.left).toBe("1.5rem");
  });

  it("edits a component's root element inside return ( … ) without reprinting it", () => {
    const out = editClasses(code, FILE, id("section"), { removed: [], added: ["overflow-hidden"] });
    expect(changedLines(code, out)).toEqual([[6, `    <section className="relative">`, `    <section className="relative overflow-hidden">`]]);
  });

  it("leaves tab indentation alone", () => {
    const tabbed = "export function A() {\n\treturn (\n\t\t<section>\n\t\t\t<div className=\"p-4\" />\n\t\t</section>\n\t);\n}\n";
    const div = parseFile(tabbed, FILE)[0].children[0];
    expect(editClasses(tabbed, FILE, div.id, { removed: ["p-4"], added: ["p-6"] })).toBe(tabbed.replace("p-4", "p-6"));
  });

  it("keeps the quote style of {`…`} and '…' classNames", () => {
    const src = "const A = () => <div className={`p-4`}><b className='p-4' /></div>;\n";
    const [div] = parseFile(src, FILE);
    const once = editClasses(src, FILE, div.id, { removed: ["p-4"], added: ["p-6"] });
    expect(once).toBe("const A = () => <div className={`p-6`}><b className='p-4' /></div>;\n");
  });

  it("keeps CRLF line endings", () => {
    const crlf = code.replaceAll("\n", "\r\n");
    const out = editClasses(crlf, FILE, all(parseFile(crlf, FILE)).find((n) => n.name === "div")!.id, { removed: ["px-4"], added: ["px-6"] });
    expect(out).toBe(crlf.replace("px-4 sm:px-6", "px-6 sm:px-6"));
  });

  it("refuses to edit read-only nodes, matching parseFile", () => {
    expect(() => editClasses(code, FILE, id("button"), { removed: ["w-60"], added: ["w-64"] })).toThrow(/<button> is read-only: spreads props/);
  });

  it("throws instead of guessing", () => {
    expect(() => editClasses(code, FILE, "nope", { removed: [], added: ["p-2"] })).toThrow(/No JSX element with id nope/);
    expect(() => editClasses(code, FILE, id("div"), { removed: ["px-9"], added: [] })).toThrow(/"px-9" is not in the className of <div>/);
    expect(() => editClasses(code, FILE, id("a"), { removed: [], added: ["p-2"] })).toThrow(/<a> is read-only: className is not a string literal/);
    expect(() => editClasses(code, FILE, id("li"), { removed: ["p-2"], added: [] })).toThrow(/<li> has no className to remove "p-2"/);
  });

  it("adds a className right after the tag name when the element has none", () => {
    const out = editClasses(code, FILE, id("li"), { removed: [], added: ["p-2"] });
    expect(changedLines(code, out)).toEqual([[24, `              <li key={item}>{item}</li>`, `              <li className="p-2" key={item}>{item}</li>`]]);
  });
});

describe("editStyle", () => {
  const h1 = () => all(parseFile(code, FILE)).find((n) => n.name === "h1")!;

  it("turns a dragged width into the matching scale class, as in the project spec (240px is w-60)", () => {
    const out = editStyle(code, FILE, id("Image"), { width: "240px" });
    expect(changedLines(code, out)).toEqual([
      [9, `        <Image className="rounded-full" src={avatar} width={32} alt="Avatar" />`, `        <Image className="rounded-full w-60" src={avatar} width={32} alt="Avatar" />`],
    ]);
  });

  it("changes color without touching the font size, though both are text- classes", () => {
    const out = editStyle(code, FILE, h1().id, { color: "var(--color-slate-900)" });
    expect(changedLines(code, out)).toEqual([
      [10, `        <h1 className="mb-6 text-5xl font-bold md:text-6xl" data-aos-delay={150}>`, `        <h1 className="mb-6 text-5xl font-bold md:text-6xl text-slate-900" data-aos-delay={150}>`],
    ]);
  });

  it("replaces the class that sets a property in place, and leaves its responsive variant alone", () => {
    const out = editStyle(code, FILE, h1().id, { fontSize: "var(--text-6xl)" });
    expect(out).toContain(`className="mb-6 text-6xl font-bold md:text-6xl"`);
  });

  it("falls back to an arbitrary value, and replaces it on the next Edit", () => {
    const once = editStyle(code, FILE, h1().id, { color: "#0f172a" });
    expect(once).toContain(`className="mb-6 text-5xl font-bold md:text-6xl text-[#0f172a]"`);
    const twice = editStyle(once, FILE, h1().id, { color: "#111827" });
    expect(twice).toContain(`className="mb-6 text-5xl font-bold md:text-6xl text-[#111827]"`);
  });

  it("writes padding in the fewest classes, replacing the old axis classes", () => {
    const out = editStyle(code, FILE, id("div"), { padding: { top: "0.5rem", right: "1.5rem", bottom: "0.5rem", left: "1.5rem" } });
    expect(out).toContain(`className="mx-auto max-w-6xl px-6 sm:px-6 py-2"`);
  });

  it("reads back as the style it was asked for", () => {
    const style = { width: "15rem", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-blue-600)", fontWeight: "var(--font-weight-semibold)" };
    const out = editStyle(code, FILE, id("Image"), style);
    expect(all(parseFile(out, FILE)).find((n) => n.name === "Image")!.style).toEqual(style);
  });
});

describe("editText", () => {
  const runs = (src: string) => all(parseFile(src, FILE)).find((n) => n.name === "h1")!.children.filter((n) => n.type === "text");

  it("replaces one text run and keeps the <br /> and the other run", () => {
    const [, looking] = runs(code);
    const out = editText(code, FILE, looking.id, "searching for");
    expect(changedLines(code, out)).toEqual([[12, `          looking for`, `          searching for`]]);
    expect(runs(out).map((r) => r.text)).toEqual(["The website builder you're", "searching for"]);
  });

  it("writes text JSX would read as code as a string expression", () => {
    const [builder] = runs(code);
    const out = editText(code, FILE, builder.id, "Build {fast} <now>");
    expect(out).toContain(`{"Build {fast} <now>"} <br`);
  });

  it("throws for an id that is not a text run", () => {
    expect(() => editText(code, FILE, id("h1"), "x")).toThrow(/No text run with id/);
  });
});

describe("editNodes", () => {
  const nodes = () => all(parseFile(code, FILE));
  const h1 = () => nodes().find((n) => n.name === "h1")!;

  it("applies several Edits on one line and its children in one pass, whatever order they come in", () => {
    const [builder, looking] = h1().children.filter((n) => n.type === "text");
    const br = h1().children.find((n) => n.name === "br")!;
    // The text before <br /> grows, which shifts the <br />'s column: editing last-first still finds it.
    const out = editNodes(code, FILE, [
      { node: builder, text: "The visual editor you're" },
      { node: h1(), style: { color: "#0f172a", fontSize: "var(--text-6xl)" } },
      { node: br, classes: { added: ["md:hidden"], removed: ["max-lg:hidden"] } },
      { node: looking, text: "waiting for" },
    ]);
    expect(changedLines(code, out)).toEqual([
      [10, `        <h1 className="mb-6 text-5xl font-bold md:text-6xl" data-aos-delay={150}>`, `        <h1 className="mb-6 text-6xl font-bold md:text-6xl text-[#0f172a]" data-aos-delay={150}>`],
      [11, `          The website builder you're <br className="max-lg:hidden" />`, `          The visual editor you're <br className="md:hidden" />`],
      [12, `          looking for`, `          waiting for`],
    ]);
  });

  it("throws and changes nothing when one Edit can't be made", () => {
    const button = nodes().find((n) => n.name === "button")!;
    expect(() => editNodes(code, FILE, [{ node: h1(), style: { color: "#000" } }, { node: button, style: { width: "1rem" } }])).toThrow(/read-only/);
  });
});
