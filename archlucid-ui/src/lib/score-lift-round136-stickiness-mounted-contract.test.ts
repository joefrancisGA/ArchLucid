import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round136 stickiness mounted contract", () => {
  it("second capture path delta strip on findings and drift", () => {
    const findingsHeader = readUiSource("app/(operator)/governance/findings/GovernanceFindingsQueueHeader.tsx");
    const drift = readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx");

    expect(findingsHeader).toContain("governance-findings-header-second-capture-path-delta");
    expect(findingsHeader).toContain("SecureNowSecondCapturePathDeltaHonestyStrip");

    expect(drift).toContain("infra-drift-second-capture-path-delta");
    expect(drift).toContain("infra-drift-diffs-empty-later-second-capture");
  });
});
