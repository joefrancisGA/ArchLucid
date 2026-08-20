import { ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY } from "@/lib/advisory-copy";
import { ADVISORY_SCANS_HREF } from "@/lib/advisory-scans-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";

export const ADVISORY_SCANS_CANONICAL_PATH = ADVISORY_SCANS_HREF;

export const ADVISORY_SCANS_CLAIM_DISCIPLINE_HEADING = "What advisory scans are not";

export const ADVISORY_SCANS_CLAIM_DISCIPLINE = ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY;

export const ADVISORY_SCANS_SOURCES_INTRO =
  "Follow-ups for architecture review intake, official activity records, AI spend signals, or product orientation.";

/** Operator Sources — no self-href to the default advisory-scans hub path or tile-covered destinations. */
export const ADVISORY_SCANS_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Architecture review guide",
    href: inAppHelpHref("review-guide"),
    when: "Finalize reviews and understand review lifecycle before generating scans",
  },
  {
    label: "Audit trail help",
    href: inAppHelpHref("audit-trail"),
    when: "Trace resolve events and assurance events tied to recommendations",
  },
  {
    label: "AI usage help",
    href: inAppHelpHref("ai-usage"),
    when: "Monitor estimated AI spend when scan generation adds model activity",
  },
  {
    label: "How ArchLucid works",
    href: inAppHelpHref("getting-started", "how-archlucid-works"),
    when: "Product orientation for architects new to advisory scans",
  },
] as const;
