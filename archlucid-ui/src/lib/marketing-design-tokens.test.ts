import { describe, expect, it } from "vitest";

import {
  MARKETING_LAYOUT,
  MARKETING_MOTION,
  MARKETING_PRIMARY_CTA_CLASS,
  MARKETING_SURFACES,
  MARKETING_TYPOGRAPHY,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

describe("marketing design tokens", () => {
  it("shares operator page shell but uses a wider marketing rail", () => {
    expect(MARKETING_LAYOUT.page).toBe(OPERATOR_LAYOUT.page);
    expect(MARKETING_LAYOUT.main).toContain("max-w-6xl");
    expect(MARKETING_TYPOGRAPHY.body).toBe(OPERATOR_TYPOGRAPHY.body);
  });

  it("uses marketing-scale hero and section typography", () => {
    expect(MARKETING_TYPOGRAPHY.heroTitle).toContain("text-3xl");
    expect(MARKETING_TYPOGRAPHY.heroTitle).toContain("lg:text-5xl");
    expect(MARKETING_TYPOGRAPHY.sectionTitle).toContain("text-2xl");
    expect(MARKETING_TYPOGRAPHY.lead).toContain("text-lg");
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

  it("exposes motion utility class names for marketing surfaces", () => {
    expect(MARKETING_MOTION.revealIn).toBe("marketing-reveal-in");
    expect(MARKETING_MOTION.heroVisual).toBe("marketing-hero-visual");
  });
});
