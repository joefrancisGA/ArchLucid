import { describe, expect, it } from "vitest";

import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

import {
  buyerAuditTrailGovernanceSummaryCounts,
  buyerFacingAuditTrailScopeLabel,
  formatAuditTrailPageTitle,
  formatAuditTrailReviewFilterChipLabel,
  formatBuyerAuditResultsStatusLine,
  isTechnicalAuditRunIdentifier,
} from "@/lib/audit-trail-page-helpers";

describe("formatAuditTrailPageTitle", () => {
  it("uses a human review name for the showcase run", () => {
    expect(formatAuditTrailPageTitle(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(
      `Audit trail for ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}`,
    );
  });

  it("avoids raw technical ids in the page title", () => {
    expect(formatAuditTrailPageTitle("c85c9b3ff2ab4d1e9f0a1234567890ab")).toBe("Audit trail");
  });
});

describe("buyerFacingAuditTrailScopeLabel", () => {
  it("returns null for technical run ids", () => {
    expect(buyerFacingAuditTrailScopeLabel("c85c9b3ff2ab4d1e9f0a1234567890ab")).toBeNull();
  });

  it("returns a shortened showcase label", () => {
    expect(buyerFacingAuditTrailScopeLabel(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(
      SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
    );
  });
});

describe("formatAuditTrailReviewFilterChipLabel", () => {
  it("uses a review label when one is known", () => {
    expect(formatAuditTrailReviewFilterChipLabel(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(
      `Review: ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}`,
    );
  });

  it("falls back when only a technical id is known", () => {
    expect(formatAuditTrailReviewFilterChipLabel("c85c9b3ff2ab4d1e9f0a1234567890ab")).toBe("Review selected");
  });
});

describe("isTechnicalAuditRunIdentifier", () => {
  it("treats showcase ids as non-technical", () => {
    expect(isTechnicalAuditRunIdentifier(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(false);
  });

  it("treats uuid-like ids as technical", () => {
    expect(isTechnicalAuditRunIdentifier("c85c9b3ff2ab4d1e9f0a1234567890ab")).toBe(true);
  });
});

describe("buyerAuditTrailGovernanceSummaryCounts", () => {
  it("counts governance categories and last activity from demo events", () => {
    const summary = buyerAuditTrailGovernanceSummaryCounts(getDemoSampleAuditTrailEvents());

    expect(summary.totalEvents).toBeGreaterThan(0);
    expect(summary.evidenceChanges).toBeGreaterThan(0);
    expect(summary.approvals).toBeGreaterThan(0);
    expect(summary.lastActivityUtc).not.toBeNull();
  });

  it("returns zeros for an empty list", () => {
    expect(buyerAuditTrailGovernanceSummaryCounts([])).toEqual({
      totalEvents: 0,
      decisions: 0,
      evidenceChanges: 0,
      approvals: 0,
      exports: 0,
      lastActivityUtc: null,
    });
  });
});

describe("formatBuyerAuditResultsStatusLine", () => {
  it("uses buyer-friendly empty and populated copy", () => {
    expect(formatBuyerAuditResultsStatusLine(0, false, false)).toBe("No audit events in this view");
    expect(formatBuyerAuditResultsStatusLine(3, true, false)).toBe("3+ audit events in this view");
    expect(formatBuyerAuditResultsStatusLine(1, false, true)).toBe("Loading audit events…");
  });
});
