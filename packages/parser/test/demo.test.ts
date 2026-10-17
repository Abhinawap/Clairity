// Runs against a local clone of the demo project (never committed, see docs/specs/parser-spike.md):
//   git clone --depth 1 https://github.com/cruip/tailwind-landing-page-template ../clairity-demo   (next to this repo)
//   pnpm --filter parser test:demo        (DEMO_DIR overrides the clone location)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { IRNode } from "../src/ir";
import { parseFile } from "../src/parse";
import { editClasses } from "../src/transform";

const DEMO_DIR = process.env.DEMO_DIR;
const all = (nodes: IRNode[]): IRNode[] => nodes.flatMap((n) => [n, ...all(n.children)]);
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: DEMO_DIR, encoding: "utf8" });

describe.skipIf(!DEMO_DIR)("demo project", () => {
  it("edits px-4 -> px-6 in the real hero as a one-line, Prettier-clean diff", () => {
    const file = "components/hero-home.tsx";
    const path = join(DEMO_DIR!, file);
    const original = readFileSync(path, "utf8");
    const container = all(parseFile(original, file)).find((n) => n.passthroughClasses?.includes("sm:px-6"))!;
    expect(container.name).toBe("div");

    try {
      writeFileSync(path, editClasses(original, file, container.id, { removed: ["px-4"], added: ["px-6"] }));
      const diff = run("git", ["diff", "--unified=0", "--", file]);
      console.log(diff);
      expect(run("git", ["diff", "--numstat", "--", file]).trim()).toBe(`1\t1\t${file}`);
      expect(diff).toContain(`+      <div className="mx-auto max-w-6xl px-6 sm:px-6">`);
      expect(() => run("npx", ["-y", "prettier@3", "--check", file])).not.toThrow();
    } finally {
      writeFileSync(path, original);
    }
  }, 60_000);

  it("round-trips a class edit on every editable node: one changed line, then byte-identical", () => {
    const files = run("git", ["ls-files", "*.tsx"]).trim().split("\n");
    let edits = 0;
    for (const file of files) {
      const original = readFileSync(join(DEMO_DIR!, file), "utf8");
      for (const node of all(parseFile(original, file))) {
        if (!node.editable || !node.passthroughClasses) continue; // text, or no static className
        const added = editClasses(original, file, node.id, { removed: [], added: ["clairity-probe"] });
        const changed = original.split("\n").filter((line, i) => line !== added.split("\n")[i]);
        expect(changed, `${file}:${node.source.line} <${node.name}>`).toHaveLength(1);
        expect(editClasses(added, file, node.id, { removed: ["clairity-probe"], added: [] }), `${file}:${node.source.line}`).toBe(original);
        edits++;
      }
    }
    console.log(`${edits} round-trip edits across ${files.length} files`);
    expect(edits).toBeGreaterThan(200);
  });

  it("parses every demo component, and reports read-only nodes", () => {
    const files = run("git", ["ls-files", "*.tsx"]).trim().split("\n");
    const rows = files.map((file) => {
      const nodes = all(parseFile(readFileSync(join(DEMO_DIR!, file), "utf8"), file));
      const readOnly = nodes.filter((n) => !n.editable);
      return { file, nodes: nodes.length, readOnly: readOnly.length, reasons: [...new Set(readOnly.map((n) => `${n.name}: ${n.reason}`))] };
    });
    console.table(rows.map(({ reasons, ...r }) => r));
    console.log(rows.filter((r) => r.readOnly).map((r) => `${r.file}\n  ${r.reasons.join("\n  ")}`).join("\n"));
    expect(rows.length).toBeGreaterThan(10);
  });
});
