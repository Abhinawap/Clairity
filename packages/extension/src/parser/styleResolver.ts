import type { IRNode } from "shared";

const TAILWIND_MAP: Record<string, Partial<IRNode["style"]>> = {

  "p-0": { padding: { top: "0px", right: "0px", bottom: "0px", left: "0px" } },
  "p-1": { padding: { top: "4px", right: "4px", bottom: "4px", left: "4px" } },
  "p-2": { padding: { top: "8px", right: "8px", bottom: "8px", left: "8px" } },
  "p-4": { padding: { top: "16px", right: "16px", bottom: "16px", left: "16px" } },
  "p-5": { padding: { top: "20px", right: "20px", bottom: "20px", left: "20px" } },
  "p-6": { padding: { top: "24px", right: "24px", bottom: "24px", left: "24px" } },

  "px-1.5": { padding: { top: "0px", right: "6px", bottom: "0px", left: "6px" } },
  "px-5": { padding: { top: "0px", right: "20px", bottom: "0px", left: "20px" } },
  "px-16": { padding: { top: "0px", right: "64px", bottom: "0px", left: "64px" } },
  "py-0.5": { padding: { top: "2px", right: "0px", bottom: "2px", left: "0px" } },
  "py-32": { padding: { top: "128px", right: "0px", bottom: "128px", left: "0px" } },

  "rounded": { borderRadius: "4px" },
  "rounded-full": { borderRadius: "9999px" },

  "h-5": { height: "20px" },
  "h-12": { height: "48px" },
  "w-4": { width: "16px" },
  "w-full": { width: "100%" },

  "text-black": { color: "#000000" },
  "text-white": { color: "#ffffff" },
  "bg-white": { backgroundColor: "#ffffff" },
  "bg-black": { backgroundColor: "#000000" },

  "text-3xl": { fontSize: "30px" },
  "text-lg": { fontSize: "18px" },
  "font-semibold": { fontWeight: "600" },
  "font-medium": { fontWeight: "500" },
};

export function resolveStyles(node: IRNode): IRNode {
  if (node.passthroughClasses && node.passthroughClasses.length > 0) {
    const unresolved: string[] = [];
    let resolvedStyle: IRNode["style"] = { ...node.style };

    for (const cls of node.passthroughClasses) {
      const mapped = TAILWIND_MAP[cls];
      if (mapped) {
        resolvedStyle = { ...resolvedStyle, ...mapped };
      } else {
        unresolved.push(cls);
      }
    }

    node.style = resolvedStyle;
    node.passthroughClasses = unresolved;
  }

  for (const child of node.children) {
    resolveStyles(child);
  }

  return node;
}