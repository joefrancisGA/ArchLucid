import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round150 wave H2 mounted contract", () => {
  it("pipes adoption friction next step on infrastructure overview, remediation factory, and drift", () => {
    expect(readUiSource("app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx")).toContain(
      "infrastructure-overview-adoption-friction-next-step",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "remediation-factory-adoption-friction-next-step",
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx")).toContain(
      "infra-drift-adoption-friction-next-step",
    );
  });
});
