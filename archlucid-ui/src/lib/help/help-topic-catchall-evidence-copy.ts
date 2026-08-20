import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Workbook path pattern for HE. catch-all dispatcher. */
export const HELP_TOPIC_CATCHALL_CANONICAL_PATH = "/help/[...topic]" as const;

export const HELP_TOPIC_CATCHALL_CLAIM_DISCIPLINE =
  "Residual help topics render curated product markdown — orientation only, not a full audit export from your workspace. Specialty guides (alerts, governance approval, review guide, and siblings) have richer pages of their own.";

export const HELP_TOPIC_CATCHALL_SOURCES_INTRO =
  "Use these follow-ups when a residual markdown topic turns into first-run orientation, troubleshooting, or the help hub.";


/** Operator Sources — no self-href to the catch-all path pattern. */
export const HELP_TOPIC_CATCHALL_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Help center", href: "/help" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
