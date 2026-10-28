import { readFileSync, writeFileSync } from "node:fs";
import * as recast from "recast";
import * as babelParser from "@babel/parser";
import * as t from "@babel/types";
import type { IRNode } from "shared";
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

export type TransformEdit = {
  nodeId: string;
  property: keyof IRNode["style"];
  value: string;
};

export type TransformResult =
  | { ok: true }
  | { ok: false; error: string };

export function applyEdit(
  filePath: string,
  targetLine: number,
  targetColumn: number,
  edit: TransformEdit
): TransformResult {
  const originalCode = readFileSync(filePath, "utf-8");
  let ast;
  try {
    ast = recast.parse(originalCode, recastOptions);
  } catch (err) {
    return { ok: false, error: `Parse failed: ${(err as Error).message}` };
  }

  let found = false;

  recast.types.visit(ast, {
    visitJSXOpeningElement(path) {
      const node = path.node;
      const loc = node.loc;
      if (
        loc &&
        loc.start.line === targetLine &&
        loc.start.column === targetColumn
      ) {
        found = true;
        rewriteClassName(node, edit);
        return false;
      }
      this.traverse(path);
    },
  });

  if (!found) {
    return { ok: false, error: `No element found at ${filePath}:${targetLine}:${targetColumn}` };
  }

  let output: string;
  try {
    output = recast.print(ast).code;
  } catch (err) {
    return { ok: false, error: `Reprint failed: ${(err as Error).message}` };
  }

  try {
    babelParser.parse(output, { sourceType: "module", plugins: ["jsx", "typescript"] });
  } catch (err) {
    return { ok: false, error: `Output does not parse, write rolled back: ${(err as Error).message}` };
  }

  writeFileSync(filePath, output, "utf-8");
  return { ok: true };
}

function rewriteClassName(openingElement: any, edit: TransformEdit) {
  const classNameAttr = openingElement.attributes.find(
    (attr: any): attr is t.JSXAttribute =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === "className"
  );

  const prefix = getPropertyPrefix(edit.property);
  const newClass = styleValueToClass(edit.property, edit.value) ?? arbitraryClass(edit.property, edit.value);

  if (!classNameAttr) {
    openingElement.attributes.push(
      t.jsxAttribute(t.jsxIdentifier("className"), t.stringLiteral(newClass))
    );
    return;
  }

  if (!t.isStringLiteral(classNameAttr.value)) {
    return;
  }

  const tokens = classNameAttr.value.value.split(/\s+/).filter(Boolean);
  const withoutOld = prefix ? tokens.filter((tok: string) => !tok.startsWith(prefix)) : tokens;
  classNameAttr.value = t.stringLiteral([...withoutOld, newClass].join(" "));
}

function arbitraryClass(property: keyof IRNode["style"], value: string): string {
  const prefix = getPropertyPrefix(property) ?? "";
  return `${prefix}[${value}]`;
}