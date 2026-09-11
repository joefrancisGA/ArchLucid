import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");
const UI_SRC = join(process.cwd(), "src");

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".cs"]);

function walkFiles(rootDir: string, relativeDir: string, results: string[]): void {
  const absoluteDir = join(rootDir, relativeDir);
  let entries: string[];

  try {
    entries = readdirSync(absoluteDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const relativePath = relativeDir.length > 0 ? `${relativeDir}/${entry}` : entry;
    const absolutePath = join(rootDir, relativePath);
    let stat;

    try {
      stat = statSync(absolutePath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      if (entry === "obj" || entry === "bin" || entry === "node_modules") {
        continue;
      }

      walkFiles(rootDir, relativePath, results);
      continue;
    }

    const extension = entry.includes(".") ? entry.slice(entry.lastIndexOf(".")) : "";

    if (!SOURCE_EXTENSIONS.has(extension)) {
      continue;
    }

    if (entry.includes(".test.") || entry.endsWith("Tests.cs") || entry.endsWith(".generated.ts")) {
      continue;
    }

    results.push(relativePath);
  }
}

describe("lost-write PATCH CAS ratchets (LW-028 / LW-035 / LW-050)", () => {
  it("production C# PatchDraftRequest construction includes ExpectedUpdatedUtc or ForceOverwrite", () => {
    const files: string[] = [];
    walkFiles(REPO_ROOT, "ArchLucid.Cli", files);
    walkFiles(REPO_ROOT, "ArchLucid.Application", files);

    const violations: string[] = [];

    for (const relativePath of files) {
      if (!relativePath.endsWith(".cs")) {
        continue;
      }

      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");

      if (!source.includes("new PatchDraftRequest")) {
        continue;
      }

      if (!source.includes("ExpectedUpdatedUtc") && !source.includes("ForceOverwrite")) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });

  it("UI production patchDraftRequest call sites attach CAS or use the requiring wrapper", () => {
    const files: string[] = [];
    walkFiles(UI_SRC, "", files);
    const violations: string[] = [];

    for (const relativePath of files) {
      if (relativePath === "lib/api/draft-intake-api-crud.ts") {
        continue;
      }

      const source = readFileSync(join(UI_SRC, relativePath), "utf8");

      if (!source.includes("patchDraftRequest(")) {
        continue;
      }

      const hasCas =
        source.includes("expectedUpdatedUtc")
        || source.includes("forceOverwrite")
        || source.includes("withDraftPatchCas")
        || source.includes("patchDraftRequestRequiringCas");

      if (!hasCas) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });

  it("CLI admit stage still copies created.Value.UpdatedUtc", () => {
    const path = join(REPO_ROOT, "ArchLucid.Cli/Commands/DraftNewCommandAdmitStage.cs");

    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8")).toContain("ExpectedUpdatedUtc = created.Value.UpdatedUtc");
  });
});
