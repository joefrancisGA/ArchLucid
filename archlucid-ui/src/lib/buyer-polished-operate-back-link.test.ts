import { describe, expect, it } from "vitest";

import {
  buyerPolishedOperateBackLink,
  isBuyerOperateBackLinkRedundantWithBreadcrumbs,
  resolveBuyerOperateBackLinkWhenShellBreadcrumbsHidden,
} from "./buyer-polished-operate-back-link";

describe("buyerPolishedOperateBackLink", () => {
  it("returns showcase package link for golden-path satellites", () => {
    expect(buyerPolishedOperateBackLink("/insights/evidence-graph?runId=x")).toEqual({
      label: "Back to review",
      href: "/reviews/claims-intake-modernization",
    });
    expect(buyerPolishedOperateBackLink("/audit")).toEqual({
      label: "Back to review",
      href: "/reviews/claims-intake-modernization",
    });
    expect(buyerPolishedOperateBackLink("/signed-records/a1c2e3f4-a5b6-7890-abcd-ef1234567890")).toEqual({
      label: "Back to review",
      href: "/reviews/claims-intake-modernization",
    });
    expect(buyerPolishedOperateBackLink("/insights/ask-review-questions")).toEqual({
      label: "Back to review",
      href: "/reviews/claims-intake-modernization",
    });
    expect(buyerPolishedOperateBackLink("/insights/compare-two-reviews?prior=claims-intake-run-v1&later=claims-intake-run-v2")).toBeNull();
  });

  it("returns null when already on or under the showcase package", () => {
    expect(buyerPolishedOperateBackLink("/reviews/claims-intake-modernization")).toBeNull();
    expect(buyerPolishedOperateBackLink("/reviews/claims-intake-modernization/findings/f1")).toBeNull();
    expect(buyerPolishedOperateBackLink("/")).toBeNull();
  });
});

describe("resolveBuyerOperateBackLinkWhenShellBreadcrumbsHidden", () => {
  it("returns back link on buyer satellite routes when shell breadcrumbs and journey stepper are absent", () => {
    expect(
      resolveBuyerOperateBackLinkWhenShellBreadcrumbsHidden({
        pathnameWithSearch: "/insights/ask-review-questions",
        searchRunId: "",
        showShellBreadcrumbs: false,
        buyerGoldenJourneyNav: null,
      }),
    ).toEqual({
      label: "Back to review",
      href: "/reviews/claims-intake-modernization",
    });
  });

  it("returns null when shell breadcrumbs or golden journey already orient the route", () => {
    expect(
      resolveBuyerOperateBackLinkWhenShellBreadcrumbsHidden({
        pathnameWithSearch: "/insights/ask-review-questions",
        searchRunId: "",
        showShellBreadcrumbs: true,
        buyerGoldenJourneyNav: null,
      }),
    ).toBeNull();
    expect(
      resolveBuyerOperateBackLinkWhenShellBreadcrumbsHidden({
        pathnameWithSearch: "/graph?runId=claims-intake-modernization",
        searchRunId: "claims-intake-modernization",
        showShellBreadcrumbs: false,
        buyerGoldenJourneyNav: {
          summaryLine: "Step 3 of 5 · Evidence trail",
          prev: null,
          next: null,
          currentStepIndex: 2,
        },
      }),
    ).toBeNull();
  });
});

describe("isBuyerOperateBackLinkRedundantWithBreadcrumbs", () => {
  const backLink = {
    label: "Back to review",
    href: "/reviews/claims-intake-modernization",
  } as const;

  it("is redundant when query runId matches the back-link href", () => {
    expect(isBuyerOperateBackLinkRedundantWithBreadcrumbs("claims-intake-modernization", backLink)).toBe(true);
  });

  it("is not redundant without a scoped runId", () => {
    expect(isBuyerOperateBackLinkRedundantWithBreadcrumbs("", backLink)).toBe(false);
  });

  it("is not redundant when query runId targets a different package", () => {
    expect(isBuyerOperateBackLinkRedundantWithBreadcrumbs("other-run", backLink)).toBe(false);
  });
});
