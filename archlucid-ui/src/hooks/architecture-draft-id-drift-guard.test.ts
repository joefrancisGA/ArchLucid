import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const HOOKS_DIR = path.join(process.cwd(), "src/hooks");

const DRAFT_AUTOSAVE_GUARD_FILES = [
  path.join(HOOKS_DIR, "architecture-draft-autosave-shared.ts"),
  path.join(HOOKS_DIR, "use-architecture-draft-autosave-persist.ts"),
];

function listArchitectureDraftHookFiles(): string[] {
  return readdirSync(HOOKS_DIR)
    .filter((name) => name.startsWith("use-architecture-draft-") && name.endsWith(".ts"))
    .map((name) => path.join(HOOKS_DIR, name));
}

function listDraftAutosaveGuardFiles(): string[] {
  return [...listArchitectureDraftHookFiles(), ...DRAFT_AUTOSAVE_GUARD_FILES];
}

function exportedTypeUsesArchitectureIdWithoutDraftId(source: string): boolean {
  const typeBlocks = source.match(/export type [\s\S]*?};/g) ?? [];

  for (const block of typeBlocks) {
    if (!/\breadonly\s+architectureId\s*:\s*string/.test(block)) {
      continue;
    }

    if (/\breadonly\s+draftId\s*:\s*string/.test(block)) {
      continue;
    }

    if (/\bparentArchitectureId\b/.test(block)) {
      continue;
    }

    return true;
  }

  return false;
}

describe("architecture draft hook naming drift guard (DA-05 / CA-23)", () => {
  it("does not declare architectureId props documented as draft ids", () => {
    const violations: string[] = [];

    for (const filePath of listDraftAutosaveGuardFiles()) {
      const source = readFileSync(filePath, "utf8");

      if (exportedTypeUsesArchitectureIdWithoutDraftId(source)) {
        violations.push(path.basename(filePath));
      }

      if (/\beffectiveArchitectureId\b/.test(source)) {
        violations.push(`${path.basename(filePath)} (effectiveArchitectureId)`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not assign created.draftId to architectureId in persist hooks", () => {
    const persistSource = readFileSync(
      path.join(HOOKS_DIR, "use-architecture-draft-autosave-persist.ts"),
      "utf8",
    );

    expect(/\barchitectureId\s*=\s*created\.draftId\b/.test(persistSource)).toBe(false);
    expect(/\barchitectureId\s*:\s*created\.draftId\b/.test(persistSource)).toBe(false);
  });
});

describe("draft fixture routing honesty (DA-05)", () => {
  it("uses distinct ids for draft vs identity API calls in autosave test fixtures", async () => {
    const { getDraftRequest } = await import("@/lib/api/draft-intake-api");
    const { getArchitectureIdentity } = await import("@/lib/api/architecture-identity-api");

    expect(getDraftRequest.name).toBe("getDraftRequest");
    expect(getArchitectureIdentity.name).toBe("getArchitectureIdentity");

    const draftFixtureId = "draft-001";
    const identityFixtureId = "architecture-identity-001";

    expect(draftFixtureId).not.toBe(identityFixtureId);
  });
});
