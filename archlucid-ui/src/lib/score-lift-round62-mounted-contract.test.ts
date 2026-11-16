import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round62 mounted contract", () => {
  it("drift, diagram, register, resource hub, path inspect, first review", () => {
    expect(readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx")).toContain(
      "infra-drift-partial-capture",
    );
    expect(
      readUiSource("app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient.tsx"),
    ).toContain("infra-diagram-reconcile-partial-capture");
    expect(readUiSource("app/(operator)/governance/decision-register/DecisionRegisterPageShell.tsx")).toContain(
      "decision-register-empty-partial-capture",
    );
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain("resource-hub-terraform-advisory-not-apply");
    expect(readUiSource("components/security/SecurityEvidencePathInspectPanel.tsx")).toContain(
      "security-evidence-path-inspect-partial-capture",
    );
    expect(readUiSource("app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuidePageClient.tsx")).toContain(
      "first-review-partial-capture-before-start",
    );
  });

  it("scorecard savings hero annual without quarterly line", () => {
    expect(readUiSource("app/(operator)/insights/architecture-scorecard/_sections/ScorecardMetricCard.tsx")).toContain(
      "scorecard-savings-hero-annual-without-quarterly-non-summing",
    );
  });
});