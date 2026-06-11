import { describe, expect, it } from "vitest";

import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";
import { detectStalledReview, STALLED_REVIEW_THRESHOLD_MS } from "@/lib/usability/stalled-review-detection";
import { readCorePilotProgressSnapshot } from "@/lib/usability/core-pilot-progress-tracker";
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

  it("readCorePilotProgressSnapshot returns five steps", () => {
    const snapshot = readCorePilotProgressSnapshot();

    expect(snapshot.totalCount).toBe(5);
  });

  it("routeViewExplanationForPathname covers graph", () => {
    const explanation = routeViewExplanationForPathname("/graph");

    expect(explanation?.title.toLowerCase()).toContain("evidence");
  });

  it("canonical product terms use audit trail and signed manifest", () => {
    expect(AUDIT_TRAIL_LABEL).toBe("Audit trail");
    expect(SIGNED_MANIFEST_LABEL).toBe("Signed manifest");
  });
});
