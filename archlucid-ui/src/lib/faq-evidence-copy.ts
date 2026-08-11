import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const FAQ_CANONICAL_PATH = "/faq" as const;

export const FAQ_CLAIM_DISCIPLINE =
  "Product FAQ answers are evaluation orientation for architects and sponsors — they are not a signed-review diligence Sources package. Open Assurance status or Pricing before treating FAQ copy as procurement evidence.";

export const FAQ_SOURCES_INTRO =
  "Use these evaluation links when FAQ answers turn into packaging, assurance, signup, or first-review follow-ups.";


/** Marketing Sources — no self-href to /faq. */
export const FAQ_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
