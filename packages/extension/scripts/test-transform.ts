import { applyEdit } from "../src/parser/transform";

const filePath = process.argv[2];
const line = parseInt(process.argv[3], 10);
const column = parseInt(process.argv[4], 10);
const property = process.argv[5] as any;
const value = process.argv[6];

const result = applyEdit(filePath, line, column, { nodeId: "test", property, value });
console.log(result);