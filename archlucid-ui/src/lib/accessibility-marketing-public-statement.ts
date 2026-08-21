/**
 * Buyer-facing accessibility statement copy for `/accessibility`.
 * Engineering implementation detail lives in repo-root `ACCESSIBILITY.md` (internal).
 */

export const ACCESSIBILITY_PUBLIC_INTRO =
  "ArchLucid is designed to support accessible use by architecture, governance, security, and compliance teams. We target WCAG 2.1 Level AA for public pages and core product workflows.";

export const ACCESSIBILITY_PUBLIC_STANDARD =
  "ArchLucid targets WCAG 2.1 Level AA. Automated testing supports our accessibility program but does not replace manual review or assistive-technology testing.";

export const ACCESSIBILITY_PUBLIC_CURRENT_STATUS =
  "We use automated checks and manual review to identify accessibility issues across public pages and core workflows. Known issues are tracked and prioritized with other product quality work. Automated checks help identify common issues such as missing labels, color contrast problems, keyboard navigation defects, and invalid ARIA usage.";

export const ACCESSIBILITY_PUBLIC_WHAT_WE_TEST_SUMMARY =
  "Automated accessibility checks are run against representative public pages and core product workflows, including navigation, review intake, evidence review, governance, policy, and reporting workflows.";

export const ACCESSIBILITY_PUBLIC_WHAT_WE_TEST_AREAS: readonly string[] = [
  "Public marketing pages",
  "Sign-in and navigation flows",
  "Review intake and review pages",
  "Evidence and approval workflows",
  "Reporting and trust pages",
];

export const ACCESSIBILITY_PUBLIC_BASICS: readonly string[] = [
  "Keyboard navigation for primary workflows",
  "Visible focus indicators on interactive controls",
  "Semantic headings and landmarks",
  "Form labels associated with inputs",
  "Error messages exposed to assistive technology where applicable",
  "Color contrast targets aligned with WCAG 2.1 Level AA",
  "Reduced-motion preferences respected where implemented",
  "Screen-reader-friendly page structure on public and core workflow surfaces",
];

export const ACCESSIBILITY_PUBLIC_KNOWN_LIMITATIONS =
  "We are not currently publishing any known accessibility exceptions. If temporary limitations are identified, we will document the affected area, impact, workaround when available, and planned resolution.";

export const ACCESSIBILITY_PUBLIC_VPAT =
  "ArchLucid does not currently publish a formal VPAT. We can discuss accessibility requirements with customers during procurement and may provide additional accessibility documentation as the product matures.";

export const ACCESSIBILITY_PUBLIC_REVIEW_CADENCE =
  "We review this statement annually and after material product or policy changes.";

export const ACCESSIBILITY_PUBLIC_STATUS_CARD = {
  target: "WCAG 2.1 Level AA",
  status: "Self-attested accessibility program",
  vpat: "Not currently published",
  reviewCadence: "Annual or material-change review",
} as const;
