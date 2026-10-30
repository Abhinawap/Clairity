import { parse } from "@babel/parser";
import type { JSXElement, JSXText } from "@babel/types";
import type { IRNode } from "./ir";
import { babelOptions, classNameAttr, classNameLiteral, elementId, jsxName, lineIndex, nodeId, outermostJsx, readOnlyReason, textRun } from "./parse";
import { styleClasses } from "./tailwind";

/** Every JSXElement in the tree, outermost first. */
function eachElement(node: unknown, visit: (el: JSXElement) => void): void {
  outermostJsx(node, (el) => {
    if (el.type === "JSXElement") {
      visit(el);
      eachElement(el.openingElement.attributes, visit);
    }
    eachElement(el.children, visit);
  });
}

/** Replaces removed tokens in place by added ones, deletes leftovers, appends the rest. */
function editTokens(value: string, removed: string[], added: string[], tag: string): string {
  const parts = value.split(/(\s+)/); // whitespace kept as its own entries so spacing survives
  const queue = [...added];
  for (const token of removed) {
    const i = parts.indexOf(token);
    if (i === -1) throw new Error(`"${token}" is not in the className of <${tag}>`);
    const replacement = queue.shift();
    if (replacement !== undefined) parts[i] = replacement;
    else if (i > 0 && /^\s+$/.test(parts[i - 1])) parts.splice(i - 1, 2);
    else parts.splice(i, /^\s+$/.test(parts[i + 1] ?? "") ? 2 : 1);
  }
  const out = parts.join("");
  return queue.length ? [out.trimEnd(), ...queue].filter(Boolean).join(" ") : out;
}

/**
 * Applies a class change to one element by splicing a new className literal over the old one,
 * so every other byte of the file (indentation, line endings, parentheses) stays as it was.
 * Throws rather than guessing when the node, className or token can't be found.
 *
 * ponytail: splicing covers attribute-value edits only; structural edits (insert, add attribute) will need
 * recast, which reprinted whole return blocks for tab-indented files and parenthesised roots (SPIKE-NOTES §5)
 */
export function editClasses(code: string, file: string, id: string, change: { added: string[]; removed: string[] }): string {
  const at = lineIndex(code);
  let target: JSXElement | undefined;
  eachElement(parse(code, babelOptions).program, (el) => {
    if (!target && elementId(file, el, at) === id) target = el;
  });
  if (!target) throw new Error(`No JSX element with id ${id} in ${file}`);

  const tag = jsxName(target);
  const reason = readOnlyReason(target);
  if (reason) throw new Error(`<${tag}> is read-only: ${reason}`);
  const attr = classNameAttr(target);
  if (!attr) {
    // No className yet: add one right after the tag name, leaving the rest of the tag as it was.
    if (change.removed.length) throw new Error(`<${tag}> has no className to remove "${change.removed[0]}" from`);
    const at = target.openingElement.name.end!;
    return `${code.slice(0, at)} className="${change.added.join(" ")}"${code.slice(at)}`;
  }

  const next = editTokens(classNameLiteral(attr)!, change.removed, change.added, tag);
  // the literal holding the classes: "…", '…', {"…"} or {`…`}; reuse its own quote character
  const literal = attr.value!.type === "JSXExpressionContainer" ? attr.value!.expression : attr.value!;
  const quote = code[literal.start!];
  return code.slice(0, literal.start!) + quote + next + quote + code.slice(literal.end!);
}

/** The static className of the element with this id ("" when it has none), for working out a style change. */
function classNameOf(code: string, file: string, id: string): string {
  const at = lineIndex(code);
  let found: string | undefined;
  eachElement(parse(code, babelOptions).program, (el) => {
    if (found === undefined && elementId(file, el, at) === id) {
      const attr = classNameAttr(el);
      found = attr ? (classNameLiteral(attr) ?? "") : "";
    }
  });
  if (found === undefined) throw new Error(`No JSX element with id ${id} in ${file}`);
  return found;
}

/**
 * Gives one element new style values by rewriting only the classes that set them (see styleClasses), so a width
 * of "240px" turns w-48 into w-60 and every other class and byte stays.
 */
export function editStyle(code: string, file: string, id: string, style: Partial<IRNode["style"]>): string {
  return editClasses(code, file, id, styleClasses(classNameOf(code, file, id), style));
}

/**
 * Replaces one text run's text, splicing over that run only, so a <br /> or another run in the same element stays.
 * Text that JSX would read as code ({, }, <, >) is written as a string expression.
 */
export function editText(code: string, file: string, id: string, text: string): string {
  const at = lineIndex(code);
  let target: { start: number; end: number } | undefined;
  const visit = (node: unknown): void => {
    if (target || !node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    const n = node as JSXText;
    if (n.type === "JSXText") {
      const run = textRun(code, n);
      if (run) {
        const { line, column } = at(run.start);
        if (nodeId(file, "#text", line, column) === id) target = run;
      }
      return;
    }
    for (const [key, value] of Object.entries(n)) if (key !== "loc" && key !== "extra" && !key.endsWith("Comments")) visit(value);
  };
  visit(parse(code, babelOptions).program);
  if (!target) throw new Error(`No text run with id ${id} in ${file}`);
  const written = /[{}<>]/.test(text) ? `{${JSON.stringify(text)}}` : text;
  return code.slice(0, target.start) + written + code.slice(target.end);
}

/** One Edit for editNodes: new style values, new text for a text run, or a class change. */
export type NodeEdit = {
  node: Pick<IRNode, "id" | "source">;
  style?: Partial<IRNode["style"]>;
  text?: string;
  classes?: { added: string[]; removed: string[] };
};

/**
 * Applies several Edits to one file's code. They run from the last node to the first, so a splice never shifts a
 * node that a later Edit still finds by its position-based id. Throws, leaving the caller's code untouched, if any
 * Edit can't be made or the result no longer parses.
 */
export function editNodes(code: string, file: string, edits: NodeEdit[]): string {
  const lastFirst = (a: NodeEdit, b: NodeEdit) => b.node.source.line - a.node.source.line || b.node.source.column - a.node.source.column;
  let out = code;
  for (const e of [...edits].sort(lastFirst)) {
    if (e.text !== undefined) out = editText(out, file, e.node.id, e.text);
    if (e.classes) out = editClasses(out, file, e.node.id, e.classes);
    if (e.style) out = editStyle(out, file, e.node.id, e.style);
  }
  parse(out, babelOptions);
  return out;
}
