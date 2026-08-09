import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const WHY_ARCHLUCID_CANONICAL_PATH = "/why-archlucid" as const;

export const WHY_ARCHLUCID_CLAIM_DISCIPLINE =
  "This Why ArchLucid page is an operator demo/proof surface over seeded telemetry and sample review outputs — it is not a signed-review diligence Sources package from your production tenant. Open the public /why comparison, Assurance status, or a finalized architecture review when you need diligence-grade trails.";

export const WHY_ARCHLUCID_SOURCES_INTRO =
  "Use these follow-ups when demo proof turns into marketing comparison, sponsor packaging, or assurance orientation.";

export type WhyArchLucidSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/why-archlucid`. */
export const WHY_ARCHLUCID_SOURCES: readonly WhyArchLucidSourceLink[] = [
  { label: "Why ArchLucid (marketing)", href: "/why" },
  { label: "See a sample review", href: "/see-it" },
  { label: "Pilot outcomes", href: "/insights/pilot-outcomes" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
