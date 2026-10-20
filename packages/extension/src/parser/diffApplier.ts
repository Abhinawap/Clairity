import { readFileSync, writeFileSync } from "node:fs";
import * as recast from "recast";
import * as babelParser from "@babel/parser";
import * as t from "@babel/types";
import type { IRNode, Change } from "shared";
import { styleValueToClass, getPropertyPrefix } from "./styleToClass";

const recastOptions = {
  parser: {
    parse(source: string) {
      return babelParser.parse(source, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
        tokens: true,
      });
    },
  },
};

export type ApplyChangesResult =
  | { ok: true; appliedIds: string[] }
  | { ok: false; error: string; appliedIds: string[] };

export function applyChanges(
  filePath: string,
  nodeLookup: Map<string, { line: number; column: number }>,
  changes: (Change & { id: string })[]
): ApplyChangesResult {
  const originalCode = readFileSync(filePath, "utf-8");
  let ast;
  try {
    ast = recast.parse(originalCode, recastOptions);
  } catch (err) {
    return { ok: false, error: `Parse failed: ${(err as Error).message}`, appliedIds: [] };
  }

  const appliedIds: string[] = [];

  for (const change of changes) {
    if (change.kind === "insert" || change.kind === "source") {
      return {
        ok: false,
        error: `Change kind "${change.kind}" not supported yet (planned for v1/v2)`,
        appliedIds,
      };
    }

    const pos = nodeLookup.get(change.nodeId);
    if (!pos) {
      return { ok: false, error: `Unknown nodeId: ${change.nodeId}`, appliedIds };
    }

    let found = false;
    recast.types.visit(ast, {
      visitJSXOpeningElement(path) {
        const node: any = path.node;
        const loc = node.loc;
        if (loc && loc.start.line === pos.line && loc.start.column === pos.column) {
          found = true;
          if (change.kind === "style") {
            rewriteClassName(node, change.property as keyof IRNode["style"], change.after);
          } else if (change.kind === "text") {
            rewriteText(path, change.after);
          } else if (change.kind === "class") {
            rewriteClasses(node, change.added, change.removed);
          }
          return false;
        }
        this.traverse(path);
      },
    });

    if (!found) {
      return { ok: false, error: `No AST node found for nodeId ${change.nodeId}`, appliedIds };
    }
    appliedIds.push(change.id);
  }

  let output: string;
  try {
    output = recast.print(ast).code;
  } catch (err) {
    return { ok: false, error: `Reprint failed: ${(err as Error).message}`, appliedIds: [] };
  }

  try {
    babelParser.parse(output, { sourceType: "module", plugins: ["jsx", "typescript"] });
  } catch (err) {
    return {
      ok: false,
      error: `Output does not parse, write rolled back: ${(err as Error).message}`,
      appliedIds: [],
    };
  }

  writeFileSync(filePath, output, "utf-8");
  return { ok: true, appliedIds };
}

function rewriteClassName(openingElement: any, property: keyof IRNode["style"], value: string) {
  const classNameAttr = openingElement.attributes.find(
    (attr: any): attr is t.JSXAttribute =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === "className"
  );
  const prefix = getPropertyPrefix(property);
  const newClass = styleValueToClass(property, value) ?? `${prefix ?? ""}[${value}]`;

  if (!classNameAttr) {
    openingElement.attributes.push(
      t.jsxAttribute(t.jsxIdentifier("className"), t.stringLiteral(newClass))
    );
    return;
  }
  if (!t.isStringLiteral(classNameAttr.value)) return;

  const tokens = classNameAttr.value.value.split(/\s+/).filter(Boolean);
  const withoutOld = prefix ? tokens.filter((tok: string) => !tok.startsWith(prefix)) : tokens;
  classNameAttr.value = t.stringLiteral([...withoutOld, newClass].join(" "));
}

function rewriteClasses(openingElement: any, added: string[], removed: string[]) {
  const classNameAttr = openingElement.attributes.find(
    (attr: any): attr is t.JSXAttribute =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === "className"
  );
  if (!classNameAttr || !t.isStringLiteral(classNameAttr.value)) return;

  let tokens = classNameAttr.value.value.split(/\s+/).filter(Boolean);
  tokens = tokens.filter((tok: string) => !removed.includes(tok));
  tokens.push(...added.filter((cls: string) => !tokens.includes(cls)));
  classNameAttr.value = t.stringLiteral(tokens.join(" "));
}

function rewriteText(path: any, newText: string) {
  const jsxElement = path.parentPath.node;
  jsxElement.children = [t.jsxText(newText)];
}