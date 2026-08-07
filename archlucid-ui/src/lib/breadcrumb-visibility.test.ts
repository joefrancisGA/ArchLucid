import { describe, expect, it } from "vitest";

import type { BreadcrumbItem } from "./breadcrumb-map";
import { getBreadcrumbs } from "./breadcrumb-map";
import { shouldShowBreadcrumbTrail } from "./breadcrumb-visibility";
import { resolveBuyerGoldenJourneyNav } from "./buyer-golden-journey-nav";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "./showcase-static-demo";

function trail(pathname: string, options?: Parameters<typeof getBreadcrumbs>[1]): readonly BreadcrumbItem[] {
  return getBreadcrumbs(pathname, options);
}

describe("shouldShowBreadcrumbTrail", () => {
  it("hides single-crumb and home trails", () => {
    expect(shouldShowBreadcrumbTrail("/", trail("/"))).toBe(false);
    expect(shouldShowBreadcrumbTrail("/governance/policy-packs", trail("/governance/policy-packs"))).toBe(false);
  });

  it("hides shallow two-level trails that mirror sidebar active state", () => {
    expect(shouldShowBreadcrumbTrail("/governance/dashboard", trail("/governance/dashboard"))).toBe(false);
    expect(shouldShowBreadcrumbTrail("/governance/findings", trail("/governance/findings"))).toBe(false);
    expect(shouldShowBreadcrumbTrail("/governance/alert-rules", trail("/governance/alert-rules"))).toBe(false);
    expect(shouldShowBreadcrumbTrail("/administration/billing", trail("/administration/billing"))).toBe(
      true,
    );
    expect(
      shouldShowBreadcrumbTrail("/integrations/cloud-connections", trail("/integrations/cloud-connections")),
    ).toBe(false);
    expect(
      shouldShowBreadcrumbTrail("/insights/pilot-outcomes", trail("/insights/pilot-outcomes")),
    ).toBe(false);
    expect(shouldShowBreadcrumbTrail("/governance/audit", trail("/governance/audit", { buyerPolishedShell: true }))).toBe(
      false,
    );
  });

  it("shows detail pages and deep trails", () => {
    const reviewId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    expect(shouldShowBreadcrumbTrail(`/architecture/reviews/${reviewId}`, trail(`/architecture/reviews/${reviewId}`))).toBe(true);
    expect(
      shouldShowBreadcrumbTrail(`/architecture/reviews/${reviewId}/provenance`, trail(`/architecture/reviews/${reviewId}/provenance`)),
    ).toBe(true);
    expect(shouldShowBreadcrumbTrail("/governance/policy-packs/1", trail("/governance/policy-packs/1"))).toBe(true);
    expect(
      shouldShowBreadcrumbTrail(
        "/governance/approval-requests/e2e-approval-001/lineage",
        trail("/governance/approval-requests/e2e-approval-001/lineage"),
      ),
    ).toBe(true);
    expect(shouldShowBreadcrumbTrail("/architecture/architectures/new", trail("/architecture/architectures/new"))).toBe(true);
    expect(shouldShowBreadcrumbTrail("/administration/identity/sso-wizard", trail("/administration/identity/sso-wizard"))).toBe(
      true,
    );
  });

  it("shows help topics and cross-namespace orientation paths", () => {
    expect(shouldShowBreadcrumbTrail("/help/evidence-trail", trail("/help/evidence-trail"))).toBe(true);
    expect(shouldShowBreadcrumbTrail("/help/scope", trail("/help/scope"))).toBe(true);
    expect(shouldShowBreadcrumbTrail("/audit", trail("/audit"))).toBe(true);
    expect(
      shouldShowBreadcrumbTrail("/administration/connection-status", trail("/administration/connection-status")),
    ).toBe(true);
    expect(
      shouldShowBreadcrumbTrail(
        "/internal/recommendation-learning",
        trail("/internal/recommendation-learning"),
      ),
    ).toBe(true);
    expect(
      shouldShowBreadcrumbTrail("/internal/product-learning", trail("/internal/product-learning")),
    ).toBe(true);
    expect(shouldShowBreadcrumbTrail("/internal/integrations/itsm", trail("/internal/integrations/itsm"))).toBe(true);
  });

  it("hides when the page renders its own breadcrumb wayfinding", () => {
    expect(
      shouldShowBreadcrumbTrail(
        `/governance/signed-records/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`,
        trail(`/governance/signed-records/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`),
      ),
    ).toBe(false);
    expect(
      shouldShowBreadcrumbTrail(
        "/architecture/reviews/e2e-fixture-run-001/findings/e2e-finding-001",
        trail("/architecture/reviews/e2e-fixture-run-001/findings/e2e-finding-001"),
      ),
    ).toBe(false);
  });

  it("hides on buyer golden journey spine routes", () => {
    const reviewPath = `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`;

    expect(
      shouldShowBreadcrumbTrail(reviewPath, trail(reviewPath), {
        buyerGoldenJourneyNav: resolveBuyerGoldenJourneyNav(reviewPath),
      }),
    ).toBe(false);
  });

  it("shows run-scoped hub trails only when golden journey stepper is absent", () => {
    expect(
      shouldShowBreadcrumbTrail(
        "/insights/evidence-graph",
        trail("/insights/evidence-graph", { buyerPolishedShell: true, queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID }),
        {
          queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
          buyerGoldenJourneyNav: resolveBuyerGoldenJourneyNav("/insights/evidence-graph", {
            searchRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
          }),
        },
      ),
    ).toBe(false);
    expect(
      shouldShowBreadcrumbTrail("/governance/approval-queue", trail("/governance/approval-queue", { queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID }), {
        queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
        buyerGoldenJourneyNav: resolveBuyerGoldenJourneyNav("/governance/approval-queue", {
          searchRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
        }),
      }),
    ).toBe(false);
    expect(
      shouldShowBreadcrumbTrail("/governance/approval-queue", trail("/governance/approval-queue", { queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID }), {
        queryRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
        buyerGoldenJourneyNav: null,
      }),
    ).toBe(true);
  });

  it("shows trails when reviews list return href preserves filters", () => {
    const reviewId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const filteredListHref = "/architecture/reviews?projectId=default&status=open";

    expect(
      shouldShowBreadcrumbTrail(`/architecture/reviews/${reviewId}`, trail(`/architecture/reviews/${reviewId}`, { reviewsListReturnHref: filteredListHref }), {
        reviewsListReturnHref: filteredListHref,
      }),
    ).toBe(true);
  });

  it("hides run-scoped hub trails when runId does not inject a review parent crumb", () => {
    expect(
      shouldShowBreadcrumbTrail("/insights/evidence-graph", trail("/insights/evidence-graph", { buyerPolishedShell: true, queryRunId: "other-review" }), {
        queryRunId: "other-review",
      }),
    ).toBe(false);
  });
});
