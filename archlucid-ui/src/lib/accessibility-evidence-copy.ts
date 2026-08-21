import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ACCESSIBILITY_CANONICAL_PATH = "/accessibility" as const;

export const ACCESSIBILITY_CLAIM_DISCIPLINE =
  "This accessibility statement describes our public WCAG target, testing posture, and how to report barriers — not a full audit export or completed VPAT download. Open Assurance status or Trust Center for official materials.";

export const ACCESSIBILITY_SOURCES_INTRO =
  "Use these evaluation links when accessibility questions turn into assurance, trust, or pilot-scope follow-ups.";


/** Marketing Sources — no self-href to /accessibility. */
export const ACCESSIBILITY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Trust Center", href: "/trust" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Data handling", href: inAppHelpHref("data-handling") },
  { label: "Start evaluation", href: "/signup" },
] as const;
