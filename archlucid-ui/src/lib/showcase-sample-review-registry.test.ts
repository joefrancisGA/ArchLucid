import { describe, expect, it } from "vitest";

import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  isShowcaseCanonicalPrimaryFindingRoute,
  showcasePrimaryFindingDetailHref,
  showcaseSpecimenFindingsHref,
  showcaseSpecimenSignedReviewRecordHref,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

describe("showcase-sample-review-registry", () => {
  it("keeps home card and spine ids aligned", () => {
    expect(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);
    expect(SHOWCASE_SAMPLE_REVIEW_REGISTRY.primaryFindingId).toBe(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID);
    expect(SHOWCASE_HOME_AHA_MOMENT.id).toBe(SHOWCASE_SAMPLE_REVIEW_REGISTRY.primaryFindingId);
  });

  it("builds canonical review and finding detail hrefs", () => {
    expect(showcaseSampleReviewPackageHref()).toBe("/architecture/reviews/claims-intake-modernization");
    expect(showcaseSpecimenSignedReviewRecordHref()).toBe(
      "/architecture/reviews/claims-intake-modernization?reviewTab=review-package",
    );
    expect(showcaseSpecimenFindingsHref()).toBe(
      "/architecture/reviews/claims-intake-modernization?reviewTab=findings",
    );
    expect(showcasePrimaryFindingDetailHref()).toBe(
      "/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk",
    );
  });

  it("recognizes canonical showcase finding routes including legacy run aliases", () => {
    expect(isShowcaseCanonicalPrimaryFindingRoute("claims-intake-modernization", "phi-minimization-risk")).toBe(true);
    expect(isShowcaseCanonicalPrimaryFindingRoute("claims-intake-modernization-run", "phi-minimization-risk")).toBe(
      true,
    );
    expect(isShowcaseCanonicalPrimaryFindingRoute("claims-intake-modernization", "phi-minimization-risk-abc")).toBe(
      true,
    );
    expect(isShowcaseCanonicalPrimaryFindingRoute("claims-intake-modernization", "other-finding")).toBe(false);
    expect(isShowcaseCanonicalPrimaryFindingRoute("other-run", "phi-minimization-risk")).toBe(false);
  });
});
