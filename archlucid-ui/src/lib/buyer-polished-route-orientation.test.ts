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
    expect(result?.line).toContain("across this workspace");
  });

  it("keeps executive summary orientation for the showcase run", () => {
    const base = `/executive/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`;
    const o = buyerPolishedRouteOrientation(base);

    expect(o?.label).toBe("Executive summary");
    expect(o?.line).toContain(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
  });

  it("orients the evidence graph route with trace-focused copy", () => {
    const o = buyerPolishedRouteOrientation("/graph");

    expect(o?.label).toBe("Evidence graph");
    expect(o?.line).toContain("Explore review evidence connections.");
  });

  it("orients the portfolio dashboard route", () => {
    const o = buyerPolishedRouteOrientation("/dashboard");

    expect(o?.label).toBe("Portfolio overview");
    expect(o?.line).toContain("committed review packages");
  });

  it("orients the executive scorecard route", () => {
    const o = buyerPolishedRouteOrientation("/executive/scorecard");

    expect(o?.label).toBe("Executive scorecard");
    expect(o?.line).toBe("Value metrics and recommended actions.");
  });

  it("orients the ask route with evidence-grounding copy", () => {
    const o = buyerPolishedRouteOrientation("/ask");

    expect(o?.label).toBe("Ask this review");
    expect(o?.line).toContain("signed review record");
    expect(o?.line).toContain("cite evidence");
  });

  it("orients the advisory route with recommendation copy", () => {
    const o = buyerPolishedRouteOrientation("/advisory");

    expect(o?.label).toBe("Architecture advisory");
    expect(o?.line).toContain("Recommended changes");
  });

  it("orients advisory sub-routes (e.g. ?tab=schedules) consistently", () => {
    const o = buyerPolishedRouteOrientation("/advisory?tab=schedules");

    expect(o?.label).toBe("Architecture advisory");
  });

  it("orients the operator security-trust route for procurement reviewers", () => {
    const o = buyerPolishedRouteOrientation("/workspace/security-trust");

    expect(o?.label).toBe("Security & trust");
    expect(o?.line).toContain("Procurement-facing security posture");
  });
});
