import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const FAQ_CANONICAL_PATH = "/faq" as const;

export const FAQ_CLAIM_DISCIPLINE =
  "Product FAQ answers are evaluation orientation for architects and sponsors — they are not a sealed-review diligence Sources package. Open Security & assurance, the Trust Center, or Pricing before treating FAQ copy as procurement evidence.";

export const FAQ_SOURCES_INTRO =
  "Use these evaluation links when FAQ answers turn into packaging, assurance, signup, or first-review follow-ups.";


/** Marketing Sources — no self-href to /faq. */
export const FAQ_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Trust Center", href: "/trust" },
  { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Sample showcase", href: CANONICAL_ANONYMOUS_PROOF_HREF },
  { label: "Getting started help", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
