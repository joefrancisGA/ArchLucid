import { describe, expect, it } from "vitest";

import {
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_VALUE,
  buildGoldenSponsorPackageWalkthroughHref,
  buildGoldenSponsorPackageWalkthroughHrefFromReviewPath,
  isGoldenSponsorPackageWalkthroughIntent,
} from "./golden-sponsor-package-walkthrough";
import { SHOWCASE_SAMPLE_REVIEW_REGISTRY } from "./showcase-sample-review-registry";

describe("golden-sponsor-package-walkthrough", () => {
  it("builds a showcase review href with walkthrough query and sponsor-handoff hash", () => {
    const href = buildGoldenSponsorPackageWalkthroughHref();

    expect(href).toContain(
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId)}`,
    );
    expect(href).toContain(`walkthrough=${GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_VALUE}`);
    expect(href).toContain("#sponsor-handoff");
  });

  it("exposes four checklist steps ending in sponsor export", () => {
    expect(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS).toHaveLength(4);
    expect(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS.at(-1)?.id).toBe("sponsor-export");
  });

  it("detects walkthrough intent from query param", () => {
    expect(isGoldenSponsorPackageWalkthroughIntent("sponsor-package")).toBe(true);
    expect(isGoldenSponsorPackageWalkthroughIntent("other")).toBe(false);
    expect(isGoldenSponsorPackageWalkthroughIntent(null)).toBe(false);
  });

  it("augments a review detail path with walkthrough query and sponsor-handoff hash", () => {
    const href = buildGoldenSponsorPackageWalkthroughHrefFromReviewPath(
      "/architecture/reviews/tenant-featured-run",
    );

    expect(href).toBe(buildGoldenSponsorPackageWalkthroughHref("tenant-featured-run"));
  });
});
