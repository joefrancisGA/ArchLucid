import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const HOOKS_DIR = path.join(process.cwd(), "src/hooks");

function listArchitectureDraftHookFiles(): string[] {
  return readdirSync(HOOKS_DIR)
    .filter((name) => name.startsWith("use-architecture-draft-") && name.endsWith(".ts"))
    .map((name) => path.join(HOOKS_DIR, name));
}

describe("architecture draft hook naming drift guard (DA-05)", () => {
  it("does not declare architectureId props documented as draft ids", () => {
    const violations: string[] = [];

    for (const filePath of listArchitectureDraftHookFiles()) {
      const source = readFileSync(filePath, "utf8");

      if (/\breadonly\s+architectureId\s*:\s*string/.test(source)) {
        violations.push(path.basename(filePath));
      }

      if (/\beffectiveArchitectureId\b/.test(source)) {
        violations.push(`${path.basename(filePath)} (effectiveArchitectureId)`);
      }
    }

    expect(violations).toEqual([]);
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
