import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round151 wave H4 mounted contract", () => {
  it("pipes agent readiness substrate on factory, ask, and attack path", () => {
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "remediation-factory-agent-readiness-substrate",
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.tsx")).toContain(
      "infra-ask-agent-readiness-substrate",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx")).toContain(
      "attack-path-agent-readiness-substrate",
    );
  });
});
