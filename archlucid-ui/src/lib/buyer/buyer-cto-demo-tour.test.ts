import { describe, expect, it } from "vitest";

import {

  appendBuyerCtoDemoTourStartQuery,

  buildCtoDemoRunOfShowMarkdown,

  BUYER_CTO_DEMO_TOUR_QUERY_PARAM,

  buyerCtoDemoRemainingBudgetMinutes,

  buyerCtoDemoStepBudgetSeconds,

  buyerCtoDemoTourPresenterScript,

  clearBuyerCtoDemoVisitedSteps,

  formatCtoDemoStepBudgetLabel,
  formatCtoDemoStepTimer,

  getStartCtoDemoTourHref,

  readBuyerCtoDemoAutoplay,

  readBuyerCtoDemoSpotlight,

  readBuyerCtoDemoStoryId,

  readBuyerCtoDemoVisitedSteps,

  resolveBuyerCtoDemoTourNavigation,

  writeBuyerCtoDemoAutoplay,

  writeBuyerCtoDemoSpotlight,

  writeBuyerCtoDemoStoryId,

  writeBuyerCtoDemoVisitedStep,

} from "@/lib/buyer/buyer-cto-demo-tour";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";

import { getShowcaseSponsorHref } from "@/lib/buyer/buyer-safe-review-navigation";

describe("appendBuyerCtoDemoTourStartQuery", () => {

  it("appends the tour start query flag", () => {

    expect(appendBuyerCtoDemoTourStartQuery("/sponsor/reviews/x")).toBe(

      `/sponsor/reviews/x?${BUYER_CTO_DEMO_TOUR_QUERY_PARAM}=1`,

    );

    expect(appendBuyerCtoDemoTourStartQuery("/insights/evidence-graph?runId=x")).toBe(
      `/insights/evidence-graph?runId=x&${BUYER_CTO_DEMO_TOUR_QUERY_PARAM}=1`,
    );

  });

});

describe("getStartCtoDemoTourHref", () => {

  it("starts the tour on golden journey step 1", () => {

    expect(getStartCtoDemoTourHref()).toBe(

      appendBuyerCtoDemoTourStartQuery(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0].href),

    );

    expect(getStartCtoDemoTourHref()).toContain(getShowcaseSponsorHref());

  });

});

describe("formatCtoDemoStepTimer", () => {

  it("formats remaining seconds as M:SS", () => {

    expect(formatCtoDemoStepTimer(360)).toEqual({ display: "6:00", isOvertime: false });

    expect(formatCtoDemoStepTimer(47)).toEqual({ display: "0:47", isOvertime: false });

  });

  it("formats overtime as +M:SS over", () => {

    expect(formatCtoDemoStepTimer(-40)).toEqual({ display: "+0:40 over", isOvertime: true });

  });

});

describe("formatCtoDemoStepBudgetLabel", () => {
  it("formats the per-step budget label", () => {
    expect(formatCtoDemoStepBudgetLabel(0)).toBe("Budget: 6 min");
    expect(formatCtoDemoStepBudgetLabel(1)).toBe("Budget: 4 min");
  });
});

describe("buyerCtoDemoStepBudgetSeconds", () => {

  it("converts step budget minutes to seconds", () => {

    expect(buyerCtoDemoStepBudgetSeconds(0)).toBe(360);

    expect(buyerCtoDemoStepBudgetSeconds(1)).toBe(240);

  });

});

describe("buyerCtoDemoTourPresenterScript", () => {

  it("returns full scripts with at least three sentences each", () => {

    for (let index = 0; index < 5; index += 1) {

      const script = buyerCtoDemoTourPresenterScript(index);

      const sentences = script.split(". ").filter((part) => part.trim().length > 0);

      expect(sentences.length).toBeGreaterThanOrEqual(3);

      expect(script.length).toBeGreaterThan(80);

    }

  });

});

describe("resolveBuyerCtoDemoTourNavigation", () => {

  it("maps sponsor report to step 1 navigation", () => {

    const nav = resolveBuyerCtoDemoTourNavigation(getShowcaseSponsorHref());

    expect(nav.stepIndex).toBe(0);

    expect(nav.onSpine).toBe(true);

    expect(nav.summaryLine).toContain("Step 1 of 5");

    expect(nav.prev).toBeNull();

    expect(nav.next?.label).toBe("Sealed review record");

    expect(nav.presenterLine.length).toBeGreaterThan(20);

    expect(nav.presenterScript.length).toBeGreaterThan(nav.presenterLine.length);

  });

  it("returns off-path guidance for unrelated routes", () => {

    const nav = resolveBuyerCtoDemoTourNavigation("/administration");

    expect(nav.onSpine).toBe(false);

    expect(nav.stepIndex).toBeNull();

    expect(nav.next?.href).toBe(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0].href);

  });

});

describe("buyerCtoDemoRemainingBudgetMinutes", () => {

  it("sums remaining step budgets from the current index", () => {

    expect(buyerCtoDemoRemainingBudgetMinutes(0)).toBe(26);

    expect(buyerCtoDemoRemainingBudgetMinutes(4)).toBe(5);

  });

});

describe("visited step storage", () => {

  it("tracks visited golden-journey indices in sessionStorage", () => {

    sessionStorage.clear();

    clearBuyerCtoDemoVisitedSteps();

    expect(readBuyerCtoDemoVisitedSteps().size).toBe(0);

    writeBuyerCtoDemoVisitedStep(2);

    writeBuyerCtoDemoVisitedStep(0);

    expect(readBuyerCtoDemoVisitedSteps()).toEqual(new Set<number>([0, 2]));

    clearBuyerCtoDemoVisitedSteps();

    expect(readBuyerCtoDemoVisitedSteps().size).toBe(0);

  });

});

describe("buildCtoDemoRunOfShowMarkdown", () => {

  it("includes all five journey steps and keyboard shortcuts", () => {

    const markdown = buildCtoDemoRunOfShowMarkdown();

    expect(markdown).toContain("Sponsor report");

    expect(markdown).toContain("Sealed review record");

    expect(markdown).toContain("Evidence graph");

    expect(markdown).toContain("Governance approval");

    expect(markdown).toContain("Audit trail");

    expect(markdown).toContain("Press 1–5");

  });

});

describe("buyer cto demo tour presenter storage", () => {
  it("reads and writes autoplay, spotlight, and story id", () => {
    writeBuyerCtoDemoAutoplay(true);
    expect(readBuyerCtoDemoAutoplay()).toBe(true);
    writeBuyerCtoDemoAutoplay(false);
    expect(readBuyerCtoDemoAutoplay()).toBe(false);

    writeBuyerCtoDemoSpotlight(true);
    expect(readBuyerCtoDemoSpotlight()).toBe(true);

    writeBuyerCtoDemoStoryId("fintech");
    expect(readBuyerCtoDemoStoryId()).toBe("fintech");
  });
});

