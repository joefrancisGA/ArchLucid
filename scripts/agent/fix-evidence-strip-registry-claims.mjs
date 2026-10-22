import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const registryPath = path.join(
  repoRoot,
  "archlucid-ui/src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
);

function resolveImportPath(importPath) {
  const relative = importPath.replace(/^@\//, "");
  return path.join(repoRoot, "archlucid-ui/src", relative.replace(/\//g, path.sep) + ".ts");
}

function moduleExportsClaimDiscipline(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const source = fs.readFileSync(filePath, "utf8");
  return /export const \w+_CLAIM_DISCIPLINE\b/.test(source);
}

let content = fs.readFileSync(registryPath, "utf8");
const removedSymbols = new Set();

const importBlockRegex =
  /import\s*\{([^}]+)\}\s*from\s*"(@\/lib\/[^"]+)";/gs;

for (const match of content.matchAll(importBlockRegex)) {
  const importBody = match[1];
  const importPath = match[2];
  const filePath = resolveImportPath(importPath);

  if (!importBody.includes("_CLAIM_DISCIPLINE")) {
    continue;
  }

  if (moduleExportsClaimDiscipline(filePath)) {
    continue;
  }

  const claimLines = importBody
    .split(",")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter(
      (line) =>
        line.includes("_CLAIM_DISCIPLINE") ||
        line.includes("_CLAIM_DISCIPLINE_HEADING") ||
        line.includes("_CLAIM_HEADING_ID"),
    );

  for (const line of claimLines) {
    const symbol = line.split(/\s+/).pop()?.replace(/,$/, "");
    if (symbol) {
      removedSymbols.add(symbol);
    }
  }

  const keptLines = importBody
    .split(",")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter(
      (line) =>
        !line.includes("_CLAIM_DISCIPLINE") &&
        !line.includes("_CLAIM_DISCIPLINE_HEADING") &&
        !line.includes("_CLAIM_HEADING_ID"),
    );

  if (keptLines.length === 0) {
    throw new Error(`Import block would be empty after cleanup: ${importPath}`);
  }

  const replacement = `import {\n  ${keptLines.join(",\n  ")},\n} from "${importPath}";`;
  content = content.replace(match[0], replacement);
}

const importedSymbols = new Set();
for (const match of content.matchAll(/import\s*\{([^}]+)\}/gs)) {
  for (const symbol of match[1]
    .split(",")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)) {
    importedSymbols.add(symbol);
  }
}

content = content.replace(
  /\r?\n\s*claim=\{([A-Z0-9_]+)\}\r?\n\s*claimHeading=\{([A-Z0-9_]+)\}\r?\n\s*claimHeadingId=\{([A-Z0-9_]+)\}\r?\n\s*claimStyle=\{EVIDENCE_CLAIM_STYLE\.operatorNeutral\}/g,
  (full, claimSymbol, headingSymbol, idSymbol) => {
    if (
      importedSymbols.has(claimSymbol) &&
      importedSymbols.has(headingSymbol) &&
      importedSymbols.has(idSymbol)
    ) {
      return full;
    }

    return "";
  },
);

for (const propName of ["claim", "claimHeading", "claimHeadingId"]) {
  content = content.replace(
    new RegExp(`\\r?\\n\\s*${propName}=\\{([A-Z0-9_]+)\\}`, "g"),
    (full, symbol) => (importedSymbols.has(symbol) ? full : ""),
  );
}

content = content.replace(
  /\r?\n\s*claimStyle=\{EVIDENCE_CLAIM_STYLE\.operatorNeutral\}/g,
  "",
);

content = content.replace(
  /sourcesStyle=\{EVIDENCE_SOURCES_STYLE\.operatorNeutral\}/g,
  "sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}",
);

fs.writeFileSync(registryPath, content, "utf8");
console.log(`Removed ${removedSymbols.size} claim symbol(s) from evidence strip registry.`);
