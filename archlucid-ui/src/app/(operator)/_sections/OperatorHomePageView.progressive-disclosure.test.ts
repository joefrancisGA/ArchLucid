import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "OperatorHomePageView.tsx"),
  "utf8",
);

describe("OperatorHomePageView progressive disclosure", () => {
  it("places Continue setup after hero and before workspace activity", () => {
    const heroIndex = source.indexOf("PilotCommandCenterCard");
    const continueSetupIndex = source.indexOf('<OperatorHomeContinueSetupSlot placement="prominent" />');
    const reviewsIndex = source.indexOf('aria-labelledby="operator-home-reviews-heading"');
    const exploreSampleIndex = source.indexOf("<OperatorHomeExploreSampleSection />");

    expect(heroIndex).toBeGreaterThan(-1);
    expect(continueSetupIndex).toBeGreaterThan(heroIndex);
    expect(reviewsIndex).toBeGreaterThan(continueSetupIndex);
    expect(exploreSampleIndex).toBeGreaterThan(reviewsIndex);
    expect(source).not.toContain("<OperatorHomeContinueSetupCard");
    expect(source).not.toContain("<OperatorHomeSampleReviewPreview />");
  });

  it("keeps workspace metrics behind default-closed disclosure below recent reviews", () => {
    expect(source).toContain("OperatorHomeWorkspaceContextDisclosure");
    expect(source).not.toContain("<OperatorHomeDeltaPanel />");
    expect(source).not.toContain("<OperatorHomeWorkspaceStatusPanel />");

    const disclosureSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../components/operator-home/OperatorHomeWorkspaceContextDisclosure.tsx"),
      "utf8",
    );

    expect(disclosureSource).toContain('data-testid="operator-home-workspace-context"');
    expect(disclosureSource).toContain("useNavCommittedArchitectureReview");
    expect(disclosureSource).toContain("readOperatorHomeDisclosureExpanded");
    expect(disclosureSource).toContain("false");
    expect(disclosureSource).toContain('data-testid="operator-home-workspace-metrics-details-toggle"');
  });
});
