import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const COMPLIANCE_JOURNEY_CANONICAL_PATH = "/compliance-journey" as const;

export const COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE =
  "This compliance journey page summarizes honest posture and diligence pointers - it is marketing orientation, not a sealed-review diligence Sources package from your tenant. Use Trust Center downloads and NDA channels for materials that actually exist.";

export const COMPLIANCE_JOURNEY_SOURCES_INTRO =
  "Use these evaluation links when compliance questions turn into Trust Center downloads, assurance status, FAQ, or procurement follow-ups.";


/** Marketing Sources - no self-href to `/compliance-journey`. */
export const COMPLIANCE_JOURNEY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Trust Center", href: "/trust" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Product FAQ", href: "/faq" },
] as const;
