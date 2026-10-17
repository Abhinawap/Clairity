// Runs against a local clone of the demo project (never committed, see docs/specs/parser-spike.md):
//   DEMO_DIR=~/StudySes/clairity-demo pnpm --filter parser test
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
