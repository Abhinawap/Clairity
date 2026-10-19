import { parseComponent } from "../src/parser/parseComponent";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: tsx scripts/test-parser.ts <path-to-component>");
  process.exit(1);
}

const result = parseComponent(filePath);
console.log(JSON.stringify(result, null, 2));