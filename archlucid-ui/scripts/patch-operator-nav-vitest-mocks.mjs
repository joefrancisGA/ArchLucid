import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(repoRoot, "src");

const mockNeedle = 'vi.mock("@/components/operator/OperatorNavAuthorityProvider"';
const insertionMarker = "useOperatorNavAuthority:";

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, ent.name);

    if (ent.isDirectory()) {
      walk(filePath, out);
    } else if (/\.(test|spec)\.(ts|tsx)$/.test(ent.name)) {
      out.push(filePath);
    }
  }

  return out;
}

function extractRank(text) {
  const rankMatch = text.match(/useNavCallerAuthorityRank:\s*(?:vi\.fn\(\(\)\s*=>\s*)?(\d+)/);

  if (rankMatch !== null) {
    return rankMatch[1] ?? "3";
  }

  return "3";
}

function extractCommitted(text) {
  const committedMatch = text.match(
    /useNavCommittedArchitectureReview:\s*(?:vi\.fn\(\(\)\s*=>\s*)?([^,\n}]+)/,
  );

  if (committedMatch === null) {
    return "false";
  }

  return (committedMatch[1] ?? "false").trim();
}

function patchFile(filePath) {
  let text = fs.readFileSync(filePath, "utf8");

  if (
    !text.includes(mockNeedle) ||
    text.includes(insertionMarker) ||
    text.includes("createOperatorNavAuthorityVitestMock") ||
    text.includes("importOriginal")
  ) {
    return false;
  }

  const rank = extractRank(text);
  const committed = extractCommitted(text);
  const insertion = `  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: ${rank},
      hasCommittedArchitectureReview: ${committed},
    },
    callerAuthorityRank: ${rank},
    isAuthorityLoading: false,
  }),
`;

  const importLine =
    'import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";\n';

  if (!text.includes(importLine.trim())) {
    const vitestImport = text.match(/^import .+ from "vitest";\n/m);

    if (vitestImport !== null) {
      text = text.replace(vitestImport[0], `${vitestImport[0]}${importLine}`);
    } else {
      text = `${importLine}\n${text}`;
    }
  }

  const objectMockPattern =
    /(vi\.mock\("@\/components\/OperatorNavAuthorityProvider",\s*\(\)\s*=>\s*\(\{)([\s\S]*?)(\}\)\);)/;
  const asyncObjectMockPattern =
    /(vi\.mock\("@\/components\/OperatorNavAuthorityProvider",\s*async\s*\(\)\s*=>\s*\{[\s\S]*?return\s*\{)([\s\S]*?)(\};\s*\}\);)/;

  let replaced = text.replace(objectMockPattern, `$1$2${insertion}$3`);

  if (replaced === text) {
    replaced = text.replace(asyncObjectMockPattern, `$1$2${insertion}$3`);
  }

  if (replaced === text) {
    return false;
  }

  fs.writeFileSync(filePath, replaced, "utf8");

  return true;
}

const files = walk(srcRoot);
const patched = files.filter(patchFile);

console.log(`Patched ${patched.length} OperatorNavAuthorityProvider vitest mock(s).`);
for (const file of patched) {
  console.log(path.relative(repoRoot, file));
}
