import { describe, expect, it } from "vitest";
import { SPECIALTY_TEMPLATE_AUTHORITY_LOAD_FAILURE_LINE } from "@/lib/help/specialty-template-authority-load-failure-copy";
import { SPECIALTY_REVIEW_TEMPLATES_PREVIEW_FIXTURE_LINE } from "@/lib/help/specialty-template-preview-fixture-copy";
import { REMEDIATION_FACTORY_RANKED_PATHS_EMPTY_ACCELERATOR_LINE } from "@/lib/remediation-factory/remediation-factory-ranked-paths-empty-accelerator-handoff-copy";
import { GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PARTIAL_CAPTURE_LINE } from "@/lib/golden-sponsor-package-walkthrough-partial-capture-copy";
import { buildGoldenSponsorPackageWalkthroughStepHref } from "@/lib/golden-sponsor-package-walkthrough";

describe("score-lift round135 batch honesty", () => {
  it("accelerator batch copy and step deep links", () => {
    expect(SPECIALTY_TEMPLATE_AUTHORITY_LOAD_FAILURE_LINE).toContain("not read-only");
    expect(SPECIALTY_REVIEW_TEMPLATES_PREVIEW_FIXTURE_LINE).toContain("illustrative");
    expect(REMEDIATION_FACTORY_RANKED_PATHS_EMPTY_ACCELERATOR_LINE).toContain("fixture");
    expect(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PARTIAL_CAPTURE_LINE).toContain("Sample");
    expect(buildGoldenSponsorPackageWalkthroughStepHref("sponsor-export")).toContain("walkthrough=sponsor-package");
    expect(buildGoldenSponsorPackageWalkthroughStepHref("review-findings")).toContain("walkthrough=sponsor-package");
  });
});
