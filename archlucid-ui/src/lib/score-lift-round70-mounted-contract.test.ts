import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round70 mounted contract", () => {
  it("findings filter, policy packs, standards filter, graph loaded, factory queue", () => {
    expect(
      readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx"),
    ).toContain("GovernanceFindingsFilterNoMatchPartialHonesty");
    expect(readUiSource("app/(operator)/governance/policy-packs/_sections/PolicyPacksRegisteredListSection.tsx")).toContain(
      "PolicyPacksRegisteredListEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/policy-packs/_sections/PolicyPacksWorkspaceSelectionSection.tsx")).toContain(
      "PolicyPacksWorkspaceSelectionEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/policy-packs/_sections/PolicyPacksEnforcedRulesTable.tsx")).toContain(
      "PolicyPacksEnforcedRulesEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/standards-and-rules/_sections/GovernanceResolutionPageView.tsx")).toContain(
      "StandardsRulesFilterPartialHonesty",
    );
    expect(readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx")).toContain(
      "GraphLoadedZeroNodesPartialCaptureHonesty",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "RemediationFactoryPriorityQueueEmptyPartialHonesty",
    );
  });
});