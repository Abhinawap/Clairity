import { createHash } from "node:crypto";
import { parse, type ParserOptions } from "@babel/parser";
import type { JSXAttribute, JSXElement, JSXFragment, JSXText, Node } from "@babel/types";
import type { IRNode } from "./ir";
import { resolveTailwind } from "./tailwind";

// Shared with the transformer so both read the same AST.
export const babelOptions: ParserOptions = { sourceType: "module", plugins: ["jsx", "typescript"] };

/** Same hash the data-ir-id Babel plugin must produce. See docs/adr/0001. */
export function nodeId(file: string, name: string, line: number, column: number): string {
  return createHash("sha1").update(`${file}:${name}:${line}:${column}`).digest("hex").slice(0, 12);
}

/**
 * Maps a character offset to Babel's line (1-based) and column (0-based), counting the same line terminators.
 * Offsets rather than `loc`, so trimmed text runs and elements go through one calculation.
 */
export function lineIndex(code: string) {
  const starts = [0];
  for (const m of code.matchAll(/\r\n?|[\n\u2028\u2029]/g)) starts.push(m.index + m[0].length);
  return (offset: number) => {
    let i = 0;
    while (i + 1 < starts.length && starts[i + 1] <= offset) i++;
    return { line: i + 1, column: offset - starts[i] };
  };
}

export function elementId(file: string, el: JSXElement, at: ReturnType<typeof lineIndex>): string {
  const { line, column } = at(el.start!);
  return nodeId(file, jsxName(el), line, column);
}

export function jsxName(el: JSXElement): string {
  const print = (n: JSXElement["openingElement"]["name"]): string =>
    n.type === "JSXIdentifier" ? n.name
    : n.type === "JSXNamespacedName" ? `${n.namespace.name}:${n.name.name}`
    : `${print(n.object as typeof n)}.${n.property.name}`;
  return print(el.openingElement.name);
}

const attrName = (attr: JSXAttribute) =>
  attr.name.type === "JSXIdentifier" ? attr.name.name : `${attr.name.namespace.name}:${attr.name.name.name}`;

export function classNameAttr(el: JSXElement): JSXAttribute | undefined {
  return el.openingElement.attributes.find((a): a is JSXAttribute => a.type === "JSXAttribute" && attrName(a) === "className");
}

/** The className string when it is static: "a b", {"a b"} or {`a b`}; undefined otherwise. */
export function classNameLiteral(attr: JSXAttribute): string | undefined {
  const v = attr.value;
  if (v?.type === "StringLiteral") return v.value;
  if (v?.type !== "JSXExpressionContainer") return undefined;
  const e = v.expression;
  if (e.type === "StringLiteral") return e.value;
  if (e.type === "TemplateLiteral" && e.expressions.length === 0) return e.quasis[0].value.cooked ?? undefined;
  return undefined;
}

/** Why the tool must not edit this element's classes, or undefined when it may. */
export function readOnlyReason(el: JSXElement): string | undefined {
  if (el.openingElement.attributes.some((a) => a.type === "JSXSpreadAttribute")) return "spreads props, so its className may be overridden";
  const cls = classNameAttr(el);
  if (cls && classNameLiteral(cls) === undefined) return "className is not a string literal";
  return undefined;
}

/**
 * The source range of a text run: the JSXText's own range without its leading and trailing whitespace, and the
 * text as the scene graph shows it (whitespace collapsed). Undefined for whitespace-only JSXText, which is no run.
 * Shared by parseFile (the run's id and source) and editText (where to splice), so both find the same run.
 */
export function textRun(code: string, t: JSXText): { start: number; end: number; text: string } | undefined {
  const text = t.value.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  const raw = code.slice(t.start!, t.end!);
  return { start: t.start! + raw.length - raw.trimStart().length, end: t.end! - (raw.length - raw.trimEnd().length), text };
}

/** Visits every outermost JSXElement under `node`, not descending into the elements themselves. */
export function outermostJsx(node: unknown, visit: (el: JSXElement | JSXFragment) => void): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach((child) => outermostJsx(child, visit));
  const n = node as Node;
  if (n.type === "JSXElement" || n.type === "JSXFragment") return visit(n);
  for (const [key, value] of Object.entries(n)) {
    if (key !== "loc" && key !== "extra" && !key.endsWith("Comments")) outermostJsx(value, visit);
  }
}

/** Parses one file into its scene graph roots. `file` is the project-relative POSIX path. */
export function parseFile(code: string, file: string): IRNode[] {
  const ast = parse(code, babelOptions);
  const at = lineIndex(code);

  const irNode = (type: IRNode["type"], name: string, start: number, end: number): IRNode => {
    const s = at(start);
    const e = at(end);
    return {
      id: nodeId(file, name, s.line, s.column),
      type,
      name,
      props: {},
      style: {},
      styleSource: type === "text" ? "unknown" : "tailwind",
      children: [],
      source: { file, line: s.line, column: s.column, endLine: e.line, endColumn: e.column },
      editable: true,
    };
  };

  const text = (t: JSXText): IRNode | undefined => {
    const run = textRun(code, t);
    return run && { ...irNode("text", "#text", run.start, run.end), text: run.text };
  };

  const children = (kids: (JSXElement | JSXFragment)["children"]): IRNode[] =>
    kids.flatMap((kid): IRNode[] => {
      if (kid.type === "JSXText") return [text(kid)].filter((t) => t !== undefined);
      if (kid.type === "JSXElement") return [element(kid)];
      if (kid.type === "JSXFragment") return children(kid.children);
      const found: IRNode[] = [];
      outermostJsx(kid, (el) => found.push(...(el.type === "JSXElement" ? [element(el)] : children(el.children))));
      return found;
    });

  const element = (el: JSXElement): IRNode => {
    const name = jsxName(el);
    const n = irNode(/^[A-Z]|\./.test(name) ? "component" : "element", name, el.start!, el.end!);

    const reason = readOnlyReason(el);
    if (reason) {
      n.editable = false;
      n.reason = reason;
    }
    const cls = classNameAttr(el);
    const literal = cls && classNameLiteral(cls);
    if (literal !== undefined) Object.assign(n, resolveTailwind(literal));

    for (const attr of el.openingElement.attributes) {
      if (attr.type === "JSXSpreadAttribute") continue;
      const key = attrName(attr);
      if (key === "className" || key === "style") continue;
      const value = attr.value;
      if (value === null || value === undefined) n.props[key] = true;
      else if (value.type === "StringLiteral") n.props[key] = value.value;
      else if (value.type === "JSXExpressionContainer") {
        const e = value.expression;
        if (e.type === "StringLiteral" || e.type === "NumericLiteral" || e.type === "BooleanLiteral") n.props[key] = e.value;
      }
    }

    // JSX passed through attributes (icon={<Icon />}) still renders, so it is a child too
    outermostJsx(el.openingElement.attributes, (inner) => n.children.push(...children([inner])));
    n.children.push(...children(el.children));
    return n;
  };

  const roots: IRNode[] = [];
  outermostJsx(ast.program, (el) => roots.push(...children([el])));
  return roots;
}
