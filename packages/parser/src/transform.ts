import { parse } from "@babel/parser";
import type { JSXElement } from "@babel/types";
import { babelOptions, classNameAttr, classNameLiteral, elementId, jsxName, lineIndex, outermostJsx, readOnlyReason } from "./parse";

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
  // ponytail: no className -> throw; adding the attribute comes with style→class mapping
  if (!attr) throw new Error(`<${tag}> has no className`);

  const next = editTokens(classNameLiteral(attr)!, change.removed, change.added, tag);
  // the literal holding the classes: "…", '…', {"…"} or {`…`}; reuse its own quote character
  const literal = attr.value!.type === "JSXExpressionContainer" ? attr.value!.expression : attr.value!;
  const quote = code[literal.start!];
  return code.slice(0, literal.start!) + quote + next + quote + code.slice(literal.end!);
}
