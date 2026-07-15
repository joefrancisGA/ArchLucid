import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "OperatorHomePageView.tsx"),
  "utf8",
);

describe("OperatorHomePageView progressive disclosure", () => {
  it("places workspace activity after hero and examples via state-aware placement", () => {
    const heroIndex = source.indexOf("PilotCommandCenterCard");
    const reviewsIndex = source.indexOf('aria-labelledby="operator-home-reviews-heading"');
    const examplesPlacementIndex = source.indexOf("<OperatorHomeExamplesPlacement");

    expect(heroIndex).toBeGreaterThan(-1);
    expect(reviewsIndex).toBeGreaterThan(heroIndex);
    expect(examplesPlacementIndex).toBeGreaterThan(reviewsIndex);
    expect(source).not.toContain("<OperatorHomeContinueSetupCard");
    expect(source).not.toContain("<OperatorHomeContinueSetupSlot");
    expect(source).not.toContain("<OperatorHomeSampleReviewPreview />");
    expect(source).not.toContain("OperatorHomeDemoOperations");
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
