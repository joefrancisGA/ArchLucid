import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findSemanticSupportBandDeskGuardViolations,
  type SemanticSupportBandDeskGuardViolation,
} from "@/lib/findings/semantic-support-band-desk-guard";
import { SEMANTIC_SUPPORT_BAND_DESK_GUARDED_PATHS } from "@/lib/findings/semantic-support-band-desk-inventory";

const uiRoot = join(process.cwd());

describe("semantic-support-band-desk-guard (AS-072)", () => {
  it("guarded Working decision-grade surfaces include the semantic support band chip", () => {
    const violations = findSemanticSupportBandDeskGuardViolations(uiRoot);

    expect(violations, formatViolations(violations)).toEqual([]);
    expect(SEMANTIC_SUPPORT_BAND_DESK_GUARDED_PATHS.length).toBeGreaterThan(0);
  });
});

function formatViolations(violations: readonly SemanticSupportBandDeskGuardViolation[]): string {
  if (violations.length === 0) {
    return "";
  }

  return violations.map((violation) => `${violation.relativePath}: ${violation.message}`).join("\n");
}
