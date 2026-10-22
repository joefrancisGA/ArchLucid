import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const WHY_ARCHLUCID_CANONICAL_PATH = "/why-archlucid" as const;

/** Learning-twin allowlist label — not the operator page title (`WHY_ARCHLUCID_PAGE_TITLE`). */
export const WHY_ARCHLUCID_HELP_TOPIC_LABEL = "Why ArchLucid" as const;

export const WHY_ARCHLUCID_CLAIM_DISCIPLINE =
  "This Why ArchLucid page is a demo over sample data and seeded outputs — not production audit records. Open the public /why comparison, Assurance status, or a finalized review record when you need real evidence.";

export const WHY_ARCHLUCID_CLAIM_HEADING = "Pilot proof only" as const;

export const WHY_ARCHLUCID_SOURCES_INTRO =
  "Use these follow-ups when demo proof turns into marketing comparison, sponsor packaging, or assurance orientation.";


/** Operator Sources — no self-href to `/why-archlucid`. */
export const WHY_ARCHLUCID_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Why ArchLucid (marketing)", href: "/why" },
  { label: "See a sample review", href: "/see-it" },
  { label: "Sponsor report", href: "/insights/sponsor-report" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
