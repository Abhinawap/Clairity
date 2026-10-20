// ponytail: copy of packages/shared/src/ir.ts from feat/scaffold-monorepo; import from "shared" once that branch merges
export type BoxValue = {
  top: string; right: string; bottom: string; left: string;
};

export type IRNode = {
  id: string;                        // stable hash of file + loc + element name
  type: "element" | "component" | "text";
  name: string;                      // "button", "Hero", "#text"
  props: Record<string, string | number | boolean>;
  style: {
    width?: string; height?: string;
    padding?: BoxValue; margin?: BoxValue;
    borderRadius?: string; backgroundColor?: string; color?: string;
    fontSize?: string; fontWeight?: string; lineHeight?: string;
    display?: string; gap?: string; alignItems?: string; justifyContent?: string;
    opacity?: string; boxShadow?: string; border?: string;
  };
  styleSource: "tailwind" | "inline" | "css-in-js" | "unknown";
  passthroughClasses?: string[];
  text?: string;
  children: IRNode[];
  source: { file: string; line: number; column: number; endLine: number; endColumn: number };
  editable: boolean;
  reason?: string;
};
