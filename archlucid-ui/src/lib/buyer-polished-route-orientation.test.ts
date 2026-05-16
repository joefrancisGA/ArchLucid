import { describe, expect, it } from "vitest";

import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

import { buyerPolishedRouteOrientation } from "./buyer-polished-route-orientation";

describe("buyerPolishedRouteOrientation", () => {
  it("scopes search copy when searchRunId is set", () => {
    expect(
      buyerPolishedRouteOrientation("/search", { searchRunId: SHOWCASE_STATIC_DEMO_RUN_ID })?.label,
    ).toBe("Search this review's evidence");
  });

  it("uses tenant-wide search framing when searchRunId is absent", () => {
    const result = buyerPolishedRouteOrientation("/search");

    expect(result?.label).toBe("Search review evidence");
    expect(result?.line).toContain("tenant-scoped");
  });

  it("keeps executive summary orientation for the showcase run", () => {
    expect(
      buyerPolishedRouteOrientation(`/executive/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)?.line,
    ).toContain(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
  });
});
