import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round73 mounted contract", () => {
  it("factory metrics and ranked paths load failures, ranked paths empties, patterns catalog", () => {
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "RemediationFactoryExecutiveMetricsLoadFailurePartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "RemediationFactoryRankedPathsLoadFailurePartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "RemediationFactoryRankedPathsViewFilterEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "RemediationFactoryRankedPathsEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/remediation-patterns/RemediationPatternsClient.tsx")).toContain(
      "RemediationPatternsCatalogEmptyPartialHonesty",
    );
  });
});