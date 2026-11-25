import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}
describe("score lift round138 ranked path Ask mounted contract", () => {
  it("drift workbench handoff", () => {
    const drift = readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx");
    expect(drift).toContain("infra-drift-ranked-path-ask-handoff");
    expect(drift).toContain("urlSecurityEvidencePathId");
  });
  it("findings queue handoff", () => {
    const findings = readUiSource("app/(operator)/governance/findings/GovernanceAssignedToMePathInspectSection.tsx");
    expect(findings).toContain("governance-findings-ranked-path-ask-handoff");
  });
});
