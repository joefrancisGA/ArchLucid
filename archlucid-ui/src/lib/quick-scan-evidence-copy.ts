import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const QUICK_SCAN_CANONICAL_PATH = "/quick-scan" as const;

export const QUICK_SCAN_CLAIM_DISCIPLINE =
  "Quick Scan is a limited marketing demonstration — results are not saved as workspace reviews, not a sealed-review diligence Sources package. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const QUICK_SCAN_SOURCES_INTRO =
  "Use these evaluation links when a demonstration result turns into signup, assurance, or product orientation.";


/** Marketing Sources — no self-href to `/quick-scan`. */
export const QUICK_SCAN_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Data handling help", href: inAppHelpHref("data-handling") },
] as const;
