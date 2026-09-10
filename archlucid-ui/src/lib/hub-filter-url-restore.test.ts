import { describe, expect, it } from "vitest";

import {
  parseReviewsHubInventoryFilter,
  parseReviewsHubInventorySearchQuery,
  reviewsHubInventoryHrefFromSearch,
} from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-inventory-filters";
import {
  governanceFindingsNlFacetsFromSearchParams,
  governanceFindingsNlFacetsHrefFromSearch,
} from "@/lib/governance/governance-findings-queue-nl-facets-url";
import {
  parseGovernanceFindingsHideGenericFromSearch,
  governanceFindingsHideGenericHrefFromSearch,
} from "@/lib/governance/governance-findings-hide-generic-url";
import {
  resolveFindingJobViewFromSearchParam,
  reviewFindingsJobViewHrefFromSearch,
} from "@/lib/findings/review-findings-job-view-url";
import { riskRegisterFilterFromQuery } from "@/lib/architecture/architecture-risk-register-page";

/** SD-07 — hub refresh restores filter/sort/facet state from URL (no component-only SoT). */
describe("hub filter URL restore (SD-07)", () => {
  it("hydrates reviews hub filter and search from shareable query params", () => {
    const search = "?filter=needs-attention&q=payments";

    expect(parseReviewsHubInventoryFilter("needs-attention")).toBe("needs-attention");
    expect(parseReviewsHubInventorySearchQuery("payments")).toBe("payments");
    expect(reviewsHubInventoryHrefFromSearch(search, "needs-attention")).toBe(
      "/architecture/reviews?filter=needs-attention&q=payments",
    );
  });

  it("hydrates policy findings register filter, job view, nl facets, and hide-generic from URL", () => {
    const search =
      "?filter=high-severity&jobView=deferred&severity=critical&status=open&hideGeneric=1";

    expect(riskRegisterFilterFromQuery("high-severity")).toBe("high-severity");
    expect(resolveFindingJobViewFromSearchParam("deferred")).toBe("deferred");
    expect(governanceFindingsNlFacetsFromSearchParams(new URLSearchParams(search))).toEqual({
      severity: "critical",
      status: "open",
      titleKeywords: [],
    });
    expect(parseGovernanceFindingsHideGenericFromSearch("1")).toBe(true);

    const clearedJobView = reviewFindingsJobViewHrefFromSearch(
      governanceFindingsNlFacetsHrefFromSearch(
        governanceFindingsHideGenericHrefFromSearch(search, true, "/governance/findings"),
        { severity: "critical", status: "open", titleKeywords: [] },
        "/governance/findings",
      ),
      "/governance/findings",
      "deferred",
    );

    expect(clearedJobView).toContain("filter=high-severity");
    expect(clearedJobView).toContain("jobView=deferred");
    expect(clearedJobView).toContain("severity=critical");
    expect(clearedJobView).toContain("hideGeneric=1");
  });
});
