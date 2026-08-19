/**
 * Canonical ArchLucid brand colors for the "Option A" mark (2026 refresh).
 *
 * These are intentionally separate from the operator design tokens in
 * `design-tokens.ts`: the logo is a fixed brand asset and must not shift with
 * surface/accent theme changes. Keep flat (no gradients) per the brand brief.
 */
export const ARCHLUCID_BRAND = {
  /** Primary architectural shape (the triangular "A"). */
  navy: "#0B1D3A",
  /** Restrained accent: single facet + the right evidence node. */
  teal: "#00A0B2",
  /** Mark accent on white/light raised surfaces — WCAG 2.2 3:1 vs #fff (axe color-contrast). */
  tealOnLightSurface: "#0f766e",
} as const;

export type ArchLucidBrandColor =
  (typeof ARCHLUCID_BRAND)[keyof typeof ARCHLUCID_BRAND];
