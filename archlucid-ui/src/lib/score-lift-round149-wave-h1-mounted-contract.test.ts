import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round149 wave H1 mounted contract", () => {
  it("pipes time-to-value next step on home, findings header, and drift", () => {
    expect(readUiSource("components/product-line/SecureNowHomeEnvironmentContext.tsx")).toContain(
      "securenow-home-time-to-value-next-step",
    );
    const findings = readUiSource("app/(operator)/governance/findings/GovernanceFindingsQueueHeader.tsx");
    expect(findings).toContain("governance-findings-time-to-value-next-step");
    expect(findings).toContain("SecureNowTimeToValueNextStepAuto");
    const drift = readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx");
    expect(drift).toContain("infra-drift-time-to-value-next-step");
  });
});
