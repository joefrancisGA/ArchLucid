import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round152 wave H3 mounted contract", () => {
  it("pipes cutting-edge substrate on ranked paths, path inspect, and attack path", () => {
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "remediation-ranked-paths-cutting-edge-substrate",
    );
    expect(readUiSource("components/security/SecurityEvidencePathInspectPanel.tsx")).toContain(
      "path-inspect-cutting-edge-substrate",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx")).toContain(
      "attack-path-cutting-edge-substrate",
    );
  });
});
