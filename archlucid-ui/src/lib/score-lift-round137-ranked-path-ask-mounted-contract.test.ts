import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}
describe("score lift round137 ranked path Ask mounted contract", () => {
  it("submits securityEvidencePathId from Infrastructure Ask", () => {
    const askClient = readUiSource("app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.tsx");
    expect(askClient).toContain("securityEvidencePathId");
    expect(askClient).toContain("infra-ask-ranked-path-scope");
  });
  it("handoff from remediation factory and path inspect", () => {
    const factory = readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx");
    const inspect = readUiSource("components/security/SecurityEvidencePathInspectPanel.tsx");
    expect(factory).toContain("RemediationFactoryRankedPathAskHandoff");
    expect(inspect).toContain("security-evidence-path-inspect-ranked-path-ask");
  });
});
