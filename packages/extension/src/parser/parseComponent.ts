import { resolveStyles } from "./styleResolver";

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import type { IRNode } from "shared";

function makeId(file: string, line: number, column: number, name: string): string {
  return createHash("sha1").update(`${file}:${line}:${column}:${name}`).digest("hex").slice(0, 12);
}

function getAttrValue(attr: t.JSXAttribute): string | number | boolean {
  if (!attr.value) return true; // boolean prop, e.g. <input disabled>
  if (t.isStringLiteral(attr.value)) return attr.value.value;
  if (t.isJSXExpressionContainer(attr.value)) {
    const expr = attr.value.expression;
    if (t.isStringLiteral(expr)) return expr.value;
    if (t.isNumericLiteral(expr)) return expr.value;
    if (t.isBooleanLiteral(expr)) return expr.value;
    return "[expression]"; // can't statically resolve — flagged below
  }
  return "[unknown]";
}

function convertElement(node: t.JSXElement, file: string): IRNode {
  const opening = node.openingElement;
  const name = t.isJSXIdentifier(opening.name) ? opening.name.name : "unknown";
  const line = node.loc?.start.line ?? 0;
  const column = node.loc?.start.column ?? 0;

  const props: Record<string, string | number | boolean> = {};
  let passthroughClasses: string[] = [];
  let editable = true;
  let reason: string | undefined;

  for (const attr of opening.attributes) {
    if (t.isJSXSpreadAttribute(attr)) {
      editable = false;
      reason = "has spread props";
      continue;
    }
    if (!t.isJSXIdentifier(attr.name)) continue;
    const attrName = attr.name.name;

    if (attrName === "className") {
      const value = getAttrValue(attr);
      if (typeof value === "string") {
        passthroughClasses = value.split(/\s+/).filter(Boolean);
      } else {
        editable = false;
        reason = "className is a computed expression";
      }
      continue;
    }

    props[attrName] = getAttrValue(attr);
  }

  const children: IRNode[] = [];
  const textParts: string[] = [];

  for (const child of node.children) {
    if (t.isJSXElement(child)) {
      children.push(convertElement(child, file));
    } else if (t.isJSXText(child)) {
      const trimmed = child.value.replace(/\s+/g, " ").trim();
      if (trimmed) textParts.push(trimmed);
    } else if (t.isJSXExpressionContainer(child)) {
      const expr = child.expression;

      if (t.isStringLiteral(expr)) {
        if (expr.value.trim()) textParts.push(expr.value);
        } else if (t.isNumericLiteral(expr)) {
          textParts.push(String(expr.value));
        } else if (!t.isJSXEmptyExpression(expr)) {
          editable = false;
          reason = reason ?? "has dynamic JSX content";
      }
    }
  }

  const text = textParts.length > 0 ? textParts.join(" ") : undefined;

  return {
    id: makeId(file, line, column, name),
    type: "element",
    name,
    props,
    style: {}, // filled by the style resolver, built next
    styleSource: "tailwind",
    passthroughClasses,
    text,
    children,
    source: {
      file,
      line,
      column,
      endLine: node.loc?.end.line ?? line,
      endColumn: node.loc?.end.column ?? column,
    },
    editable,
    reason,
  };
}

export function parseComponent(filePath: string): IRNode[] {
  const code = readFileSync(filePath, "utf-8");
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const roots: IRNode[] = [];

  traverse(ast, {
    JSXElement(path) {
      // only collect top-level JSX elements (not ones already visited as children)
      if (!t.isJSXElement(path.parent) && !t.isJSXFragment(path.parent)) {
        roots.push(convertElement(path.node, filePath));
      }
    },
  });

  return roots.map(resolveStyles);
}