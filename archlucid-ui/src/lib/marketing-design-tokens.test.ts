import { describe, expect, it } from "vitest";

import {
  MARKETING_LAYOUT,
  MARKETING_PRIMARY_CTA_CLASS,
  MARKETING_SURFACES,
  MARKETING_TYPOGRAPHY,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

describe("marketing design tokens", () => {
  it("reuses operator page and typography scales", () => {
    expect(MARKETING_LAYOUT.page).toBe(OPERATOR_LAYOUT.page);
    expect(MARKETING_TYPOGRAPHY.pageTitle).toBe(OPERATOR_TYPOGRAPHY.pageTitle);
    expect(MARKETING_TYPOGRAPHY.body).toBe(OPERATOR_TYPOGRAPHY.body);
  });

  it("uses enterprise card surfaces instead of pastel marketing fills", () => {
    expect(MARKETING_SURFACES.card).toContain("bg-al-surface-raised");
    expect(MARKETING_SURFACES.card).toContain("rounded-md");
    expect(MARKETING_SURFACES.highlightPanel).toContain("bg-al-surface-raised");
  });

  it("keeps primary marketing CTA on AA-safe teal fills", () => {
    expect(MARKETING_PRIMARY_CTA_CLASS).toContain("bg-teal-800");
    expect(MARKETING_PRIMARY_CTA_CLASS).not.toMatch(/\bbg-teal-[67]00\b/);
    expect(MARKETING_PRIMARY_CTA_CLASS).not.toContain("dark:bg-teal-600");
  });
});
