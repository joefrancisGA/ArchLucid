import { describe, expect, it } from "vitest";

import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import {
  buildCloudFirstInventoryCoach,
  cloudConnectionIndicatesSuccessfulPull,
  CLOUD_FIRST_INVENTORY_COACH_STEPS,
  CLOUD_FIRST_INVENTORY_COACH_TITLE,
  CLOUD_FIRST_INVENTORY_START_REVIEW_HREF,
  resolveCloudFirstInventoryCoachPhase,
} from "@/lib/cloud-first-inventory-coach";

describe("cloud-first-inventory-coach (TB-2222)", () => {
  it("resolves empty / post-connect / post-pull phases", () => {
    expect(resolveCloudFirstInventoryCoachPhase({ hasConnection: false, hasSuccessfulPull: false })).toBe(
      "empty",
    );
    expect(resolveCloudFirstInventoryCoachPhase({ hasConnection: true, hasSuccessfulPull: false })).toBe(
      "post-connect",
    );
    expect(resolveCloudFirstInventoryCoachPhase({ hasConnection: true, hasSuccessfulPull: true })).toBe(
      "post-pull",
    );
  });

  it("teaches attach then start review instead of idle collection copy", () => {
    const view = buildCloudFirstInventoryCoach({ hasConnection: true, hasSuccessfulPull: true });

    expect(view.title).toBe(CLOUD_FIRST_INVENTORY_COACH_TITLE);
    expect(view.replacesIdleEmpty).toBe(true);
    expect(view.body.toLowerCase()).not.toContain("no collection activity");
    expect(view.steps.map((step) => step.id)).toEqual(["attach", "start-review"]);
    expect(view.steps).toEqual([...CLOUD_FIRST_INVENTORY_COACH_STEPS]);
    expect(view.primaryCtaLabel).toBe(BUYER_START_ARCHITECTURE_REVIEW_CTA);
    expect(view.primaryCtaHref).toBe(CLOUD_FIRST_INVENTORY_START_REVIEW_HREF);
    expect(view.body.toLowerCase()).toContain("attach");
    expect(view.body.toLowerCase()).toContain("review");
  });

  it("post-connect body warns against stopping at idle collection lists", () => {
    const view = buildCloudFirstInventoryCoach({ hasConnection: true, hasSuccessfulPull: false });

    expect(view.phase).toBe("post-connect");
    expect(view.body.toLowerCase()).toMatch(/idle|collection/);
    expect(view.body.toLowerCase()).toContain("attach");
  });

  it("detects successful pull from lastPolledUtc or healthy status", () => {
    expect(cloudConnectionIndicatesSuccessfulPull({ lastPolledUtc: "2026-08-10T12:00:00.000Z" })).toBe(true);
    expect(cloudConnectionIndicatesSuccessfulPull({ status: "Ready" })).toBe(true);
    expect(cloudConnectionIndicatesSuccessfulPull({ status: "Configured" })).toBe(false);
    expect(cloudConnectionIndicatesSuccessfulPull({})).toBe(false);
  });
});
