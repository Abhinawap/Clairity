import { parseComponent } from "../src/parser/parseComponent";
import { applyChanges } from "../src/parser/diffApplier";
import type { IRNode } from "shared";

const filePath = process.argv[2];

// Parse the file to build a nodeId -> position lookup, same as a real
// caller (the backend) would do using the cached scene graph.
function buildLookup(nodes: IRNode[], map = new Map<string, { line: number; column: number }>()) {
  for (const n of nodes) {
    map.set(n.id, { line: n.source.line, column: n.source.column });
    buildLookup(n.children, map);
  }
  return map;
}

const nodes = parseComponent(filePath);
const lookup = buildLookup(nodes);

// Grab the first two node ids found, for a quick multi-change test.
const ids = [...lookup.keys()];
console.log("Available node ids (first 5):", ids.slice(0, 5));

if (ids.length < 2) {
  console.error("Need at least 2 nodes to test a multi-change batch.");
  process.exit(1);
}

const result = applyChanges(filePath, lookup, [
  { id: "c1", kind: "style", nodeId: ids[0], property: "backgroundColor", before: undefined, after: "#000000" },
  { id: "c2", kind: "style", nodeId: ids[1], property: "borderRadius", before: undefined, after: "9999px" },
]);

console.log(result);