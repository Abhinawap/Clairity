import type { IRNode } from "parser";
import type { CSSProperties } from "react";

type Box = NonNullable<IRNode["style"]["padding"]>;
const box = (b: Box) => `${b.top} ${b.right} ${b.bottom} ${b.left}`;

// A Node's resolved style as inline CSS for the canvas preview: padding and margin collapse to shorthand.
export function styleToCss({ padding, margin, ...rest }: IRNode["style"]): CSSProperties {
  return { ...rest, ...(padding && { padding: box(padding) }), ...(margin && { margin: box(margin) }) };
}
