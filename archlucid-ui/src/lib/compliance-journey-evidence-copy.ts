import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const COMPLIANCE_JOURNEY_CANONICAL_PATH = "/compliance-journey" as const;

export const COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE_HEADING = "What this page is not";

export const COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE = "Where to go next";

/** Claim discipline for the top orientation strip — aligns with the demoted scope disclosure. */
export const COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE =
  "This page orients procurement reviewers — not a downloadable evidence pack or full audit export. Use Trust Center downloads and Assurance status for artifacts that exist today.";

/** Demoted disclosure copy — replaces the amber evaluation claim callout on the page body. */
export const COMPLIANCE_JOURNEY_SCOPE_DISCLOSURE_BODY =
  "This page orients procurement reviewers to honest posture and diligence pointers. It is not a downloadable evidence pack — use Trust Center downloads and NDA channels for artifacts that exist today.";

export const COMPLIANCE_JOURNEY_SOURCES_INTRO =
  "Related evaluation links when you need Trust Center downloads, assurance status, FAQ, or procurement follow-ups.";


/** Marketing Sources - no self-href to `/compliance-journey`. */
export const COMPLIANCE_JOURNEY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Trust Center", href: "/trust" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Product FAQ", href: "/faq" },
] as const;
