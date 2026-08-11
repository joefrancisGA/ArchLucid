/**
 * TB-2092 — the evaluation "Sources for follow-up" heading and the surfaces cleared to render it.
 *
 * Operator hub chrome must not carry this heading: on a workspace surface a mid-page Sources list
 * reads as product navigation rather than as follow-up reading. Evaluation surfaces are different —
 * a visitor there has no workspace to navigate, so pointing at further reading is the useful act.
 *
 * This module is the only place the string is spelled out. Adding a surface means adding a row here,
 * which `tb2092-sources-followup-guard.test.ts` enforces in both directions: an unregistered surface
 * fails, and a registered surface that no longer renders the heading fails as a stale row.
 */

export const EVALUATION_SOURCES_TITLE = "Sources for follow-up" as const;

/** Why a surface is cleared to show the evaluation Sources heading. */
export type EvaluationSourcesSurfaceKind =
  /** Public pre-signup pages, where follow-up reading is the only onward action. */
  | "marketing"
  /** Create-home tabs before a package is finalized, where findings are not yet a review record. */
  | "pre-finalize-architecture"
  /** Help topics documenting an outbound integration, whose sources are vendor docs. */
  | "help-topic";

export type EvaluationSourcesSurface = {
  /** Strip slug, or a stable surface id where the heading is rendered without a strip component. */
  readonly slug: string;
  readonly kind: EvaluationSourcesSurfaceKind;
  /** Module that renders or defines the heading for this surface, relative to `src/`, posix-separated. */
  readonly module: string;
};

export const EVALUATION_SOURCES_TITLE_SURFACES: readonly EvaluationSourcesSurface[] = [
  { slug: "accessibility", kind: "marketing", module: "components/marketing/AccessibilityEvidenceOrientationStrip.tsx" },
  {
    slug: "compliance-journey",
    kind: "marketing",
    module: "components/marketing/ComplianceJourneyEvidenceOrientationStrip.tsx",
  },
  { slug: "demo-preview", kind: "marketing", module: "components/marketing/DemoPreviewEvidenceOrientationStrip.tsx" },
  {
    slug: "example-roi-bulletin",
    kind: "marketing",
    module: "components/marketing/ExampleRoiBulletinEvidenceOrientationStrip.tsx",
  },
  { slug: "faq", kind: "marketing", module: "components/marketing/FaqEvidenceOrientationStrip.tsx" },
  { slug: "get-started", kind: "marketing", module: "components/marketing/GetStartedEvidenceOrientationStrip.tsx" },
  { slug: "live-demo", kind: "marketing", module: "components/marketing/LiveDemoEvidenceOrientationStrip.tsx" },
  { slug: "pricing", kind: "marketing", module: "components/marketing/PricingEvidenceOrientationStrip.tsx" },
  { slug: "privacy", kind: "marketing", module: "components/marketing/PrivacyEvidenceOrientationStrip.tsx" },
  { slug: "quick-scan", kind: "marketing", module: "components/marketing/QuickScanEvidenceOrientationStrip.tsx" },
  {
    slug: "security-trust",
    kind: "marketing",
    module: "components/marketing/SecurityTrustEvidenceOrientationStrip.tsx",
  },
  { slug: "see-it", kind: "marketing", module: "components/marketing/SeeItEvidenceOrientationStrip.tsx" },
  { slug: "showcase", kind: "marketing", module: "components/marketing/ShowcaseEvidenceOrientationStrip.tsx" },
  {
    slug: "signup-verify",
    kind: "marketing",
    module: "components/marketing/SignupVerifyEvidenceOrientationStrip.tsx",
  },
  { slug: "trust-center", kind: "marketing", module: "components/marketing/TrustCenterEvidenceOrientationStrip.tsx" },
  { slug: "try", kind: "marketing", module: "components/marketing/TryEvidenceOrientationStrip.tsx" },
  { slug: "welcome", kind: "marketing", module: "components/marketing/WelcomeEvidenceOrientationStrip.tsx" },
  { slug: "why", kind: "marketing", module: "components/marketing/WhyEvidenceOrientationStrip.tsx" },
  {
    slug: "architecture-overview",
    kind: "pre-finalize-architecture",
    module: "components/architecture/ArchitectureCreatedOverviewEvidenceOrientationStrip.tsx",
  },
  {
    slug: "architecture-findings",
    kind: "pre-finalize-architecture",
    module: "components/architecture/ArchitectureCreatedFindingsEvidenceOrientationStrip.tsx",
  },
  {
    slug: "architecture-clarifications",
    kind: "pre-finalize-architecture",
    module: "components/architecture/ArchitectureCreatedClarificationsEvidenceOrientationStrip.tsx",
  },
  { slug: "azure-boards-help", kind: "help-topic", module: "lib/azure-boards-help-evidence-copy.ts" },
];

/** Slugs cleared to render the evaluation Sources heading. */
export const EVALUATION_SOURCES_TITLE_SLUGS: readonly string[] = EVALUATION_SOURCES_TITLE_SURFACES.map(
  (surface) => surface.slug,
);
