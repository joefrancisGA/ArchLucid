import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const templatePath = path.join(
  repoRoot,
  "docs/architecture/ui_route_traffic_estimates.template.md",
);
const libDir = path.join(repoRoot, "archlucid-ui/src/lib");

function loadRows(markdown) {
  const start = markdown.indexOf("## Master table");
  const rows = new Map();

  for (const line of markdown.slice(start).split("\n")) {
    if (!line.startsWith("|")) {
      continue;
    }

    const cells = line.split("|").map((cell) => cell.trim());

    if (cells.length < 9 || cells[1] === "ID") {
      continue;
    }

    rows.set(cells[1], {
      path: cells[2] ?? "",
      section: cells[7] ?? "",
      notes: cells[8] ?? "",
    });
  }

  return rows;
}

function replaceTrafficNoteExport(text, noteConstName, noteValue) {
  const marker = `export const ${noteConstName} =`;
  const start = text.indexOf(marker);

  if (start < 0) {
    return text;
  }

  const afterMarker = text.slice(start + marker.length);
  const match = afterMarker.match(/^\s*(\r?\n\s*)?("(?:\\.|[^"\\])*");/);

  if (match === null) {
    throw new Error(`Could not parse ${noteConstName}`);
  }

  const replacement = `\n  ${JSON.stringify(noteValue)};`;

  return text.slice(0, start + marker.length) + replacement + text.slice(start + marker.length + match[0].length);
}

const rows = loadRows(fs.readFileSync(templatePath, "utf8"));
let updated = 0;

for (const file of fs.readdirSync(libDir)) {
  if (!file.startsWith("ui-route-traffic-") || !file.endsWith(".ts") || file.endsWith(".test.ts")) {
    continue;
  }

  const fullPath = path.join(libDir, file);
  const text = fs.readFileSync(fullPath, "utf8");
  const rowIdMatch = text.match(/export const \w+_TRAFFIC_ROW_ID = "([^"]+)"/);
  const noteConstMatch = text.match(/export const (\w+_TRAFFIC_NOTE) =/);

  if (rowIdMatch === null || noteConstMatch === null) {
    continue;
  }

  const row = rows.get(rowIdMatch[1]);

  if (row === undefined) {
    continue;
  }

  const next = replaceTrafficNoteExport(text, noteConstMatch[1], row.notes);

  if (next !== text) {
    fs.writeFileSync(fullPath, next, "utf8");
    updated += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`total updated ${updated}`);
