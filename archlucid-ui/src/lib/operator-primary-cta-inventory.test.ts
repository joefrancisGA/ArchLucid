import { describe, expect, it } from "vitest";

import {
  listOperatorPrimaryCtaEntriesByPattern,
  listOperatorPrimaryCtaVerifiedEntries,
  OPERATOR_PRIMARY_CTA_INVENTORY,
  OPERATOR_PRIMARY_CTA_PATTERNS,
} from "@/lib/operator-primary-cta-inventory";

describe("operator-primary-cta-inventory (TB-1543)", () => {
  it("names the four primary-CTA patterns from the design-system contract", () => {
    expect(OPERATOR_PRIMARY_CTA_PATTERNS).toEqual([
      "header-create-reveals-panel",
      "header-create-always",
      "header-start",
      "empty-footer-create",
    ]);
  });

  it("keeps verified exemplars on the allowlist with stable test ids", () => {
    const verified = listOperatorPrimaryCtaVerifiedEntries();

    expect(verified.length).toBeGreaterThanOrEqual(6);

    const ids = verified.map((entry) => entry.id);
    expect(ids).toContain("digests-browse");
    expect(ids).toContain("recurrence-schedules");
    expect(ids).toContain("reviews-hub");
    expect(ids).toContain("advisory-schedules");
    expect(ids).toContain("advisory-scans-empty");
    expect(ids).toContain("alert-rules-rules-tab");
    expect(ids).toContain("alert-routing");

    for (const entry of verified) {
      expect(entry.primaryTestId.trim().length).toBeGreaterThan(0);
      expect(entry.componentOrModule.trim().length).toBeGreaterThan(0);
    }
  });

  it("tracks header-start and empty-footer-create exemplars separately", () => {
    const headerStart = listOperatorPrimaryCtaEntriesByPattern("header-start");
    const emptyFooterCreate = listOperatorPrimaryCtaEntriesByPattern("empty-footer-create");

    expect(headerStart.map((entry) => entry.id)).toContain("reviews-hub");
    expect(emptyFooterCreate.map((entry) => entry.id)).toContain("recurrence-schedules");
  });

  it("uses unique inventory ids for TB-1544 allowlist extension", () => {
    const ids = OPERATOR_PRIMARY_CTA_INVENTORY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
