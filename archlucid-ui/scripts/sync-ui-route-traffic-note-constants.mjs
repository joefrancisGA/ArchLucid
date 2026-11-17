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
  const byId = new Map();
  const byPath = new Map();

  for (const line of markdown.slice(start).split("\n")) {
    if (!line.startsWith("|")) {
      continue;
    }

    const cells = line.split("|").map((cell) => cell.trim().replace(/^`|`$/g, ""));

    if (cells.length < 10 || cells[1] === "ID") {
      continue;
    }

    const row = {
      id: cells[1],
      path: cells[2] ?? "",
      section: cells[7] ?? "",
      notes: cells[9] ?? "",
    };

    byId.set(row.id, row);
    byPath.set(row.path, row);
  }

  return { byId, byPath };
}

function replaceTrafficNoteExport(text, noteConstName, noteValue) {
  const marker = `export const ${noteConstName} =`;
  const start = text.indexOf(marker);

  if (start < 0) {
    return text;
  }

  const afterMarker = text.slice(start + marker.length);
  const match = afterMarker.match(/^\s*(\r?\n\s*)?("(?:\\.|[^"\\])*");/);

  if (match !== null) {
    const replacement = `\n  ${JSON.stringify(noteValue)};`;
    return (
      text.slice(0, start + marker.length) + replacement + text.slice(start + marker.length + match[0].length)
    );
  }

  const backtickMatch = afterMarker.match(/^\s*`(?:\\.|[^`\\])*`;/s);

  if (backtickMatch !== null) {
    const replacement = `\n  ${JSON.stringify(noteValue)};`;
    return (
      text.slice(0, start + marker.length) +
      replacement +
      text.slice(start + marker.length + backtickMatch[0].length)
    );
  }

  throw new Error(`Could not parse ${noteConstName}`);
}

function replaceStringExport(text, constName, value) {
  const pattern = new RegExp(`(export const ${constName} = )"[^"]*"`, "m");

  if (!pattern.test(text)) {
    return text;
  }

  return text.replace(pattern, `$1${JSON.stringify(value)}`);
}

function extractModulePath(text) {
  const pathMatch = text.match(/export const \w+_TRAFFIC_PATH\s*=\s*\n?\s*([^;\n]+);/);

  if (pathMatch === null) {
    return null;
  }

  const rhs = pathMatch[1].trim();

  if (rhs.startsWith('"') && rhs.endsWith('"')) {
    return JSON.parse(rhs);
  }

  return null;
}

const { byId, byPath } = loadRows(fs.readFileSync(templatePath, "utf8"));
let updated = 0;

for (const file of fs.readdirSync(libDir)) {
  if (!file.startsWith("ui-route-traffic-") || !file.endsWith(".ts") || file.endsWith(".test.ts")) {
    continue;
  }

  const fullPath = path.join(libDir, file);
  let text = fs.readFileSync(fullPath, "utf8");
  const rowIdMatch = text.match(/export const (\w+_TRAFFIC_ROW_ID) = "([^"]+)"/);
  const sectionMatch = text.match(/export const (\w+_TRAFFIC_SECTION) =/);
  const noteConstMatch = text.match(/export const (\w+_TRAFFIC_NOTE) =/);

  if (rowIdMatch === null || noteConstMatch === null) {
    continue;
  }

  let row = byId.get(rowIdMatch[2]);

  if (row === undefined) {
    const modulePath = extractModulePath(text);

    if (modulePath !== null) {
      row = byPath.get(modulePath);
    }
  }

  if (row === undefined) {
    continue;
  }

  let next = text;

  if (rowIdMatch[2] !== row.id) {
    next = replaceStringExport(next, rowIdMatch[1], row.id);
  }

  if (sectionMatch !== null) {
    next = replaceStringExport(next, sectionMatch[1], row.section);
  }

  next = replaceTrafficNoteExport(next, noteConstMatch[1], row.notes);

  if (next !== text) {
    fs.writeFileSync(fullPath, next, "utf8");
    updated += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`total updated ${updated}`);
