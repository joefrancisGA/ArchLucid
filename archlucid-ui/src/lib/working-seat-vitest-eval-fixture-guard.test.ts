import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const architectureRoot = path.join(process.cwd(), "src/app/(operator)/architecture");

function collectTestFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("working-seat vitest eval fixture guard (WS-22)", () => {
  it("does not hardcode buyer-polished true in default architecture tests", () => {
    const offenders: string[] = [];

    for (const filePath of collectTestFiles(architectureRoot)) {
      const fileName = path.basename(filePath);

      if (fileName.includes(".buyer-polished.") || fileName.includes(".guided.")) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");

      if (/isBuyerPolishedOperatorShellEnv:\s*\(\)\s*=>\s*true/.test(source)) {
        offenders.push(path.relative(process.cwd(), filePath));
      }

      if (/useProductionEvalChrome:\s*\(\)\s*=>\s*true/.test(source)) {
        offenders.push(path.relative(process.cwd(), filePath));
      }
    }

    expect(offenders).toEqual([]);
  });
});
