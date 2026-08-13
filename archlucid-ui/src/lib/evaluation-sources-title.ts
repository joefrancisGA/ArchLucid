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

/**
 * Every per-surface strip now lives in one registry module; the old
 * `components/marketing/*EvidenceOrientationStrip.tsx` paths are re-export shims that no longer
 * render the heading themselves.
 */
const SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE =
  "components/evidence-orientation/registry/sources-and-claim-strips.tsx";

export const EVALUATION_SOURCES_TITLE_SURFACES: readonly EvaluationSourcesSurface[] = [
  { slug: "accessibility", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "compliance-journey", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "demo-preview", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "example-roi-bulletin", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "faq", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "get-started", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "live-demo", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "pricing", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "privacy", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "quick-scan", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "security-trust", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "see-it", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "showcase", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "signup-verify", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "trust-center", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "try", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "welcome", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  { slug: "why", kind: "marketing", module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE },
  {
    slug: "architecture-overview",
    kind: "pre-finalize-architecture",
    module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE,
  },
  {
    slug: "architecture-findings",
    kind: "pre-finalize-architecture",
    module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE,
  },
  {
    slug: "architecture-clarifications",
    kind: "pre-finalize-architecture",
    module: SOURCES_AND_CLAIM_STRIP_REGISTRY_MODULE,
  },
  { slug: "azure-boards-help", kind: "help-topic", module: "lib/azure-boards-help-evidence-copy.ts" },
];

/** Slugs cleared to render the evaluation Sources heading. */
export const EVALUATION_SOURCES_TITLE_SLUGS: readonly string[] = EVALUATION_SOURCES_TITLE_SURFACES.map(
  (surface) => surface.slug,
);
