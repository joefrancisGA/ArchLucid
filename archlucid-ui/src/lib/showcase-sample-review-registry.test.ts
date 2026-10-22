import { describe, expect, it } from "vitest";

import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";
import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  isShowcaseCanonicalPrimaryFindingRoute,
  showcasePrimaryFindingDetailHref,
  showcaseSpecimenFindingsHref,
  showcaseSpecimenSealedReviewRecordHref,
  showcaseSpecimenSignedReviewRecordHref,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

describe("showcase-sample-review-registry", () => {
  it("keeps home card and spine ids aligned with the active primary sample", () => {
    expect(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);
    expect(SHOWCASE_STATIC_DEMO_RUN_ID).toBe(CUSTOMER_INTAKE_SAMPLE_RUN_ID);
    expect(SHOWCASE_SAMPLE_REVIEW_REGISTRY.primaryFindingId).toBe(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID);
    expect(SHOWCASE_HOME_AHA_MOMENT.id).toBe(SHOWCASE_SAMPLE_REVIEW_REGISTRY.primaryFindingId);
  });

  it("builds canonical review and finding detail hrefs", () => {
    expect(showcaseSampleReviewPackageHref()).toBe("/architecture/reviews/customer-intake-modernization");
    expect(showcaseSpecimenSealedReviewRecordHref()).toBe(
      "/architecture/reviews/customer-intake-modernization?reviewTab=review-package",
    );
    expect(showcaseSpecimenSignedReviewRecordHref()).toBe(showcaseSpecimenSealedReviewRecordHref());
    expect(showcaseSpecimenFindingsHref()).toBe(
      "/architecture/reviews/customer-intake-modernization?reviewTab=findings",
    );
    expect(showcasePrimaryFindingDetailHref()).toBe(
      "/architecture/reviews/customer-intake-modernization/findings/sensitive-data-minimization-risk",
    );
  });

  it("recognizes canonical showcase finding routes including legacy run aliases", () => {
    expect(
      isShowcaseCanonicalPrimaryFindingRoute("customer-intake-modernization", "sensitive-data-minimization-risk"),
    ).toBe(true);
    expect(
      isShowcaseCanonicalPrimaryFindingRoute("customer-intake-modernization-run", "sensitive-data-minimization-risk"),
    ).toBe(true);
    expect(
      isShowcaseCanonicalPrimaryFindingRoute("customer-intake-modernization", "sensitive-data-minimization-risk-abc"),
    ).toBe(true);
    expect(isShowcaseCanonicalPrimaryFindingRoute("customer-intake-modernization", "other-finding")).toBe(false);
    expect(isShowcaseCanonicalPrimaryFindingRoute("other-run", "sensitive-data-minimization-risk")).toBe(false);
  });
});
