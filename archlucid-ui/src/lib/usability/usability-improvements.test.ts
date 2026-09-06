import { describe, expect, it } from "vitest";

import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";
import { detectStalledReview, STALLED_REVIEW_THRESHOLD_MS } from "@/lib/usability/stalled-review-detection";
import {
  parseCorePilotProgressFromSnapshot,
  readCorePilotProgressSnapshot,
} from "@/lib/usability/core-pilot-progress-tracker";
import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";
import { AUDIT_TRAIL_LABEL, SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

describe("usability improvements", () => {
  it("ensureCorrelationId generates when missing", () => {
    const id = ensureCorrelationId(null);

    expect(id.length).toBeGreaterThan(10);
  });

  it("detectStalledReview flags long-running reviews", () => {
    const started = new Date(Date.now() - STALLED_REVIEW_THRESHOLD_MS - 60_000).toISOString();
    const signal = detectStalledReview(started, false);

    expect(signal.isStalled).toBe(true);
    expect(signal.elapsedMinutes).toBeGreaterThan(14);
  });

  it("detectStalledReview suppresses stall guidance when run is dead-lettered", () => {
    const started = new Date(Date.now() - STALLED_REVIEW_THRESHOLD_MS - 60_000).toISOString();
    const signal = detectStalledReview(started, false, Date.now(), true);

    expect(signal.isStalled).toBe(false);
    expect(signal.elapsedMinutes).toBe(0);
  });

  it("readCorePilotProgressSnapshot returns seven steps", () => {
    const snapshot = readCorePilotProgressSnapshot();

    expect(snapshot.totalCount).toBe(7);
  });

  it("parseCorePilotProgressFromSnapshot treats empty server snapshot as zero complete", () => {
    const snapshot = parseCorePilotProgressFromSnapshot("");

    expect(snapshot.completedCount).toBe(0);
    expect(snapshot.nextStepIndex).toBe(0);
  });

  it("parseCorePilotProgressFromSnapshot counts completed flags", () => {
    const snapshot = parseCorePilotProgressFromSnapshot("11000");

    expect(snapshot.completedCount).toBe(2);
    expect(snapshot.nextStepIndex).toBe(2);
  });

  it("routeViewExplanationForPathname returns null for evidence graph — header owns help copy", () => {
    expect(routeViewExplanationForPathname("/insights/evidence-graph")).toBeNull();
  });

  it("routeViewExplanationForPathname covers alerts hubs (TB-2216)", () => {
    expect(routeViewExplanationForPathname("/governance/alerts")?.title).toBe("Alerts");
    expect(routeViewExplanationForPathname("/alerts")?.title).toBe("Alerts");
  });

  it("routeViewExplanationForPathname returns null for governance routes — page headers own orientation", () => {
    expect(routeViewExplanationForPathname("/governance")).toBeNull();
    expect(routeViewExplanationForPathname("/governance/policy-packs")).toBeNull();
    expect(routeViewExplanationForPathname("/governance/standards-and-rules")).toBeNull();
    // Risk exceptions own layer guidance plus the approval banner, so no shell banner.
    expect(routeViewExplanationForPathname("/governance/exceptions")).toBeNull();
    expect(routeViewExplanationForPathname("/governance/findings")).toBeNull();
  });

  it("routeViewExplanationForPathname covers compare hub (TB-2216)", () => {
    expect(routeViewExplanationForPathname("/insights/compare-two-reviews")?.title).toBe("Compare two reviews");
  });

  it("routeViewExplanationForPathname returns null for governance audit — page owns orientation", () => {
    expect(routeViewExplanationForPathname("/governance/audit")).toBeNull();
    expect(routeViewExplanationForPathname("/audit")).toBeNull();
  });

  it("canonical product terms use audit trail and Finalized review record", () => {
    expect(AUDIT_TRAIL_LABEL).toBe("Audit trail");
    expect(SIGNED_MANIFEST_LABEL).toBe("Finalized review record");
  });
});
