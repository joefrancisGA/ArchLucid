import { describe, expect, it } from "vitest";

import {
  appendBuyerCtoDemoTourStartQuery,
  BUYER_CTO_DEMO_TOUR_QUERY_PARAM,
  getStartCtoDemoTourHref,
  resolveBuyerCtoDemoTourNavigation,
} from "@/lib/buyer-cto-demo-tour";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer-golden-journey-nav";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";

describe("appendBuyerCtoDemoTourStartQuery", () => {
  it("appends the tour start query flag", () => {
    expect(appendBuyerCtoDemoTourStartQuery("/executive/reviews/x")).toBe(
      `/executive/reviews/x?${BUYER_CTO_DEMO_TOUR_QUERY_PARAM}=1`,
    );
    expect(appendBuyerCtoDemoTourStartQuery("/graph?runId=x")).toBe(
      `/graph?runId=x&${BUYER_CTO_DEMO_TOUR_QUERY_PARAM}=1`,
    );
  });
});

describe("getStartCtoDemoTourHref", () => {
  it("starts the tour on golden journey step 1", () => {
    expect(getStartCtoDemoTourHref()).toBe(
      appendBuyerCtoDemoTourStartQuery(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0].href),
    );
    expect(getStartCtoDemoTourHref()).toContain(getShowcaseExecutiveHref());
  });
});

describe("resolveBuyerCtoDemoTourNavigation", () => {
  it("maps executive summary to step 1 navigation", () => {
    const nav = resolveBuyerCtoDemoTourNavigation(getShowcaseExecutiveHref());

    expect(nav.stepIndex).toBe(0);
    expect(nav.onSpine).toBe(true);
    expect(nav.summaryLine).toContain("Step 1 of 5");
    expect(nav.prev).toBeNull();
    expect(nav.next?.label).toBe("Signed manifest");
    expect(nav.presenterLine.length).toBeGreaterThan(20);
  });

  it("returns off-path guidance for unrelated routes", () => {
    const nav = resolveBuyerCtoDemoTourNavigation("/settings");

    expect(nav.onSpine).toBe(false);
    expect(nav.stepIndex).toBeNull();
    expect(nav.next?.href).toBe(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0].href);
  });
});
