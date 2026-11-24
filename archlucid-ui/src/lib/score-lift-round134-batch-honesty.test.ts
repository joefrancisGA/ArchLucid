import { describe, expect, it } from "vitest";
import { FIRST_REVIEW_GUIDE_PROGRESS_LOAD_FAILURE_LINE } from "@/lib/first-review-guide/first-review-guide-progress-load-failure-copy";
import {
  FIRST_REVIEW_GUIDE_WALKTHROUGH_EMPTY_NOT_LOAD_FAILURE_LINE,
  FIRST_REVIEW_GUIDE_WALKTHROUGH_LOAD_FAILURE_LINE,
} from "@/lib/first-review-guide/first-review-guide-walkthrough-empty-not-load-failure-copy";
import { GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TENANT_COLLECTION_LINE } from "@/lib/golden-sponsor-package-walkthrough-tenant-collection-copy";
import {
  SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_LEAD,
  SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_TITLE,
} from "@/lib/product-line/securenow-pilot-spine-accelerator-index-copy";

describe("score-lift round134 batch honesty", () => {
  it("first review walkthrough, golden tenant collection, pilot accelerator index", () => {
    expect(FIRST_REVIEW_GUIDE_PROGRESS_LOAD_FAILURE_LINE).toContain("not an empty");
    expect(FIRST_REVIEW_GUIDE_WALKTHROUGH_LOAD_FAILURE_LINE).toContain("failed checklist");
    expect(FIRST_REVIEW_GUIDE_WALKTHROUGH_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not the same");
    expect(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TENANT_COLLECTION_LINE).toContain("subscription");
    expect(SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_TITLE).toContain("accelerator");
    expect(SECURENOW_PILOT_SPINE_ACCELERATOR_INDEX_LEAD).toContain("fixture");
  });
});
