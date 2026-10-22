import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PRICING_CANONICAL_PATH = "/pricing" as const;

export const PRICING_SOURCES_INTRO =
  "Use these evaluation links when pricing questions turn into security, packaging, or pilot-scope follow-ups.";


/** Marketing Sources — no self-href to /pricing. */
export const PRICING_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Product FAQ", href: "/faq" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Trust Center", href: "/trust" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
