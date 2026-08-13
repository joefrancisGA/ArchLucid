import { describe, expect, it } from "vitest";

import {
  buyerPolishedOperateBackLink,
  isBuyerOperateBackLinkRedundantWithScopedRun,
  isDeepHierarchyRouteWithoutShowcaseBackLink,
  resolveBuyerOperateBackLink,
} from "@/lib/buyer/buyer-polished-operate-back-link";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const packageHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

describe("buyerPolishedOperateBackLink", () => {
  it("returns null on the showcase package itself", () => {
    expect(buyerPolishedOperateBackLink(packageHref)).toBeNull();
    expect(buyerPolishedOperateBackLink(`${packageHref}/findings`)).toBeNull();
  });

  it("returns Back to review on satellite diligence routes", () => {
    expect(buyerPolishedOperateBackLink("/insights/evidence-graph?runId=x")).toEqual({
      label: "Back to review",
      href: packageHref,
    });
    expect(buyerPolishedOperateBackLink("/governance/findings")).toEqual({
      label: "Back to review",
      href: packageHref,
    });
  });

  it("returns null on deep governance hierarchy routes", () => {
    expect(
      buyerPolishedOperateBackLink("/governance/approval-requests/e2e-approval-001/lineage"),
    ).toBeNull();
    expect(buyerPolishedOperateBackLink("/governance/policy-packs/healthcare-claims-v3-pack")).toBeNull();
  });
});

describe("isDeepHierarchyRouteWithoutShowcaseBackLink", () => {
  it("flags approval-request and policy-pack detail trails", () => {
    expect(
      isDeepHierarchyRouteWithoutShowcaseBackLink("/governance/approval-requests/e2e-approval-001/lineage"),
    ).toBe(true);
    expect(isDeepHierarchyRouteWithoutShowcaseBackLink("/governance/findings")).toBe(false);
  });
});

describe("resolveBuyerOperateBackLink", () => {
  it("returns back link on buyer satellite routes when golden journey is absent", () => {
    expect(
      resolveBuyerOperateBackLink({
        pathnameWithSearch: "/insights/evidence-graph",
        searchRunId: "",
        buyerGoldenJourneyNav: null,
      }),
    ).toEqual({ label: "Back to review", href: packageHref });
  });

  it("returns null when golden journey already orients the route", () => {
    expect(
      resolveBuyerOperateBackLink({
        pathnameWithSearch: "/insights/evidence-graph",
        searchRunId: "",
        buyerGoldenJourneyNav: {
          summaryLine: "Step 1 of 5",
          prev: null,
          next: null,
          currentStepIndex: 0,
        },
      }),
    ).toBeNull();
  });

  it("returns null on deep approval-request lineage (no showcase strip link)", () => {
    expect(
      resolveBuyerOperateBackLink({
        pathnameWithSearch: "/governance/approval-requests/claims-intake-approval-001/lineage",
        searchRunId: "",
        buyerGoldenJourneyNav: null,
      }),
    ).toBeNull();
  });
});

describe("isBuyerOperateBackLinkRedundantWithScopedRun", () => {
  const backLink = { label: "Back to review", href: "/architecture/reviews/claims-intake-modernization" };

  it("is redundant when search runId matches the back-link package", () => {
    expect(isBuyerOperateBackLinkRedundantWithScopedRun("claims-intake-modernization", backLink)).toBe(true);
  });

  it("is not redundant when search runId is empty", () => {
    expect(isBuyerOperateBackLinkRedundantWithScopedRun("", backLink)).toBe(false);
  });

  it("is not redundant when search runId differs", () => {
    expect(isBuyerOperateBackLinkRedundantWithScopedRun("other-run", backLink)).toBe(false);
  });
});
