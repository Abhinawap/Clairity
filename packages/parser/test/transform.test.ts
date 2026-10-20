import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { IRNode } from "../src/ir";
import { parseFile } from "../src/parse";
import { editClasses } from "../src/transform";

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
    expect(() => editClasses(code, FILE, id("li"), { removed: [], added: ["p-2"] })).toThrow(/<li> has no className/);
  });
});
