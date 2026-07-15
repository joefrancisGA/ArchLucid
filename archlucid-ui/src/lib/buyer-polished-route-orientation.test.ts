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
    const base = `/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`;
    const o = buyerPolishedRouteOrientation(base);

    expect(o?.label).toBe("Executive summary");
    expect(o?.line).toContain(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
  });

  it("returns null for evidence graph — the page carries its own lifecycle banner and header", () => {
    expect(buyerPolishedRouteOrientation("/graph")).toBeNull();
  });

  it("orients the portfolio dashboard route", () => {
    const o = buyerPolishedRouteOrientation("/dashboard");

    expect(o?.label).toBe("Executive dashboard");
    expect(o?.line).toContain("committed reviews");
  });

  it("orients the executive scorecard route", () => {
    const o = buyerPolishedRouteOrientation("/executive/scorecard");

    expect(o?.label).toBe("Sponsor scorecard");
    expect(o?.line).toBe("Value metrics and recommended actions.");
  });

  it("orients the operator review scorecard route without repeating scorecard in the layer label", () => {
    const o = buyerPolishedRouteOrientation("/scorecard");

    expect(o?.label).toBe("Insights");
    expect(o?.line).toBe("Value metrics and recommended actions.");
  });

  it("returns null for ask — the page carries its own hero copy", () => {
    expect(buyerPolishedRouteOrientation("/ask")).toBeNull();
  });

  it("returns null for risk register — the page carries its own governance banner", () => {
    expect(buyerPolishedRouteOrientation("/governance/findings")).toBeNull();
  });

  it("returns null for risk exceptions — the page carries its own governance banner", () => {
    expect(buyerPolishedRouteOrientation("/governance/risk-exceptions")).toBeNull();
  });

  it("returns null for policy packs — the page carries its own policy-pack basis banner", () => {
    expect(buyerPolishedRouteOrientation("/governance/policy-packs")).toBeNull();
    expect(buyerPolishedRouteOrientation("/policy-packs")).toBeNull();
  });

  it("returns null for standards & rules — the page carries its own governance banner", () => {
    expect(buyerPolishedRouteOrientation("/governance/resolution")).toBeNull();
  });

  it("returns null for alerts — the page carries its own governance context header", () => {
    expect(buyerPolishedRouteOrientation("/governance/alerts")).toBeNull();
    expect(buyerPolishedRouteOrientation("/alerts")).toBeNull();
  });

  it("returns null for compare — the page carries its own workspace header", () => {
    expect(buyerPolishedRouteOrientation("/compare")).toBeNull();
  });

  it("returns null for create-architecture intake at /reviews/new", () => {
    expect(buyerPolishedRouteOrientation("/reviews/new")).toBeNull();
  });

  it("orients the advisory route with recommendation copy", () => {
    const o = buyerPolishedRouteOrientation("/advisory");

    expect(o?.label).toBe("Advisory scans");
    expect(o?.line).toContain("Prioritized follow-up");
  });

  it("orients advisory sub-routes (e.g. ?tab=schedules) consistently", () => {
    const o = buyerPolishedRouteOrientation("/advisory?tab=schedules");

    expect(o?.label).toBe("Advisory scans");
  });

  it("orients the operator security-trust route for procurement reviewers", () => {
    const canonical = buyerPolishedRouteOrientation("/settings/security-trust");
    const legacy = buyerPolishedRouteOrientation("/workspace/security-trust");

    expect(canonical?.label).toBe("Security & trust");
    expect(canonical?.line).toContain("Procurement-facing security posture");
    expect(legacy).toEqual(canonical);
  });

  it("orients the sponsor value report route", () => {
    const o = buyerPolishedRouteOrientation("/value-report");

    expect(o?.label).toBe("Value report");
    expect(o?.line).toContain("sponsor-ready summaries");
  });

  it("orients bare /governance as the workspace overview", () => {
    const o = buyerPolishedRouteOrientation("/governance");

    expect(o?.label).toBe("Governance");
    expect(o?.line).toContain("Workspace governance status");
  });

  it("orients /governance with showcase runId as sample review context", () => {
    const o = buyerPolishedRouteOrientation("/governance", { searchRunId: SHOWCASE_STATIC_DEMO_RUN_ID });

    expect(o?.label).toBe("Sample review context");
    expect(o?.line).toContain("Claims Intake sample review");
  });
});
