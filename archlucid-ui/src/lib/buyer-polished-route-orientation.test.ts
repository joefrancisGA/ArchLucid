import { describe, expect, it } from "vitest";

import { GOVERNANCE_OVERVIEW_PAGE_LEAD } from "@/lib/governance-overview-copy";
import { SEARCH_PAGE_SUBTITLE } from "@/app/(operator)/search/_sections/search-page-copy";
import { BUYER_VALUE_REPORT_PAGE_SUBTITLE } from "@/lib/buyer-polish-copy";
import {
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

import { buyerPolishedRouteOrientation } from "./buyer-polished-route-orientation";

describe("buyerPolishedRouteOrientation", () => {
  it("scopes search copy when searchRunId is set", () => {
    expect(
      buyerPolishedRouteOrientation("/search", { searchRunId: SHOWCASE_STATIC_DEMO_RUN_ID })?.label,
    ).toBe("Search this review's evidence");
  });

  it("returns null for unscoped /search — OperatorPageHeader owns SEARCH_PAGE_SUBTITLE (TB-1436)", () => {
    expect(buyerPolishedRouteOrientation("/search")).toBeNull();
    expect(buyerPolishedRouteOrientation("/search")?.line).not.toBe(SEARCH_PAGE_SUBTITLE);
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

  it("orients architecture intelligence", () => {
    const o = buyerPolishedRouteOrientation("/architecture-intelligence");

    expect(o?.label).toBe("Architecture intelligence");
    expect(o?.line).toContain("Closed-loop reasoning");
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

  it("returns null for advisory scans — the page carries its own OperatorPageHeader lead (TB-1125)", () => {
    expect(buyerPolishedRouteOrientation("/governance/advisory-scans")).toBeNull();
    expect(buyerPolishedRouteOrientation("/advisory")).toBeNull();
  });

  it("returns null for advisory schedules deep links — same page chrome (TB-1125)", () => {
    expect(buyerPolishedRouteOrientation("/governance/advisory-scans?tab=schedules")).toBeNull();
  });

  it("returns null for recurrence schedules — not governance overview pending-approvals blurb (TB-1129)", () => {
    expect(buyerPolishedRouteOrientation("/governance/recurrence-schedules")).toBeNull();
    expect(buyerPolishedRouteOrientation("/governance/recurrence-schedules/")).toBeNull();
  });

  it("returns null for governance setup — not pending-approvals overview blurb (TB-1136)", () => {
    expect(buyerPolishedRouteOrientation("/governance/setup")).toBeNull();
    expect(buyerPolishedRouteOrientation("/governance/setup/")).toBeNull();
    expect(buyerPolishedRouteOrientation("/governance/first-30-days")).toBeNull();
    expect(buyerPolishedRouteOrientation("/governance/setup")?.line).not.toBe(GOVERNANCE_OVERVIEW_PAGE_LEAD);
  });

  it("returns null for audit trail — OperatorPageHeader owns the page lead (TB-1435)", () => {
    expect(buyerPolishedRouteOrientation("/governance/audit")).toBeNull();
    expect(buyerPolishedRouteOrientation("/audit")).toBeNull();
    expect(buyerPolishedRouteOrientation("/governance/audit")?.line).not.toBe(GOVERNANCE_OVERVIEW_PAGE_LEAD);
  });

  it("returns null for alert-rules — OperatorPageHeader owns configuration subtitle (TB-1435)", () => {
    expect(buyerPolishedRouteOrientation("/governance/alert-rules")).toBeNull();
    expect(buyerPolishedRouteOrientation("/governance/alert-rules")?.line).not.toBe(GOVERNANCE_OVERVIEW_PAGE_LEAD);
  });

  it("orients the operator security-trust route for procurement reviewers", () => {
    const canonical = buyerPolishedRouteOrientation("/settings/security-trust");
    const legacy = buyerPolishedRouteOrientation("/workspace/security-trust");

    expect(canonical?.label).toBe("Security & trust");
    expect(canonical?.line).toContain("Procurement-facing security posture");
    expect(legacy).toEqual(canonical);
  });

  it("returns null for value-report sponsor hero routes — page header owns the lead (TB-1437)", () => {
    expect(buyerPolishedRouteOrientation("/value-report")).toBeNull();
    expect(buyerPolishedRouteOrientation("/value-report/pilot")).toBeNull();
    expect(buyerPolishedRouteOrientation("/value-report/roi")).toBeNull();
    expect(buyerPolishedRouteOrientation(SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH)).toBeNull();
    expect(buyerPolishedRouteOrientation(SPONSOR_REPORT_PILOT_OUTCOMES_PATH)).toBeNull();
    expect(buyerPolishedRouteOrientation(SPONSOR_REPORT_ROI_SUMMARY_PATH)).toBeNull();
    expect(buyerPolishedRouteOrientation("/value-report")?.line).not.toBe(BUYER_VALUE_REPORT_PAGE_SUBTITLE);
  });

  it("returns null for bare /governance — OperatorPageHeader owns the overview lead (TB-1434)", () => {
    expect(buyerPolishedRouteOrientation("/governance")).toBeNull();
    expect(buyerPolishedRouteOrientation("/governance")?.line).not.toBe(GOVERNANCE_OVERVIEW_PAGE_LEAD);
  });

  it("orients /governance with showcase runId as sample review context", () => {
    const o = buyerPolishedRouteOrientation("/governance", { searchRunId: SHOWCASE_STATIC_DEMO_RUN_ID });

    expect(o?.label).toBe("Sample review context");
    expect(o?.line).toContain("Claims Intake sample review");
  });
});
