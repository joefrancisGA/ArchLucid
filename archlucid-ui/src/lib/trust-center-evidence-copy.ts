import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const TRUST_CENTER_CANONICAL_PATH = "/trust" as const;

export const TRUST_CENTER_CLAIM_DISCIPLINE =
  "Trust Center pages and public downloads summarize assurance posture and published artifacts — they are not a CPA-issued SOC 2 report or a published third-party pen-test report unless a linked artifact explicitly says so. Use Assurance status engagement metadata and NDA channels for diligence materials that are not public.";

export const TRUST_CENTER_SOURCES_INTRO =
  "Use these evaluation links when Trust Center downloads turn into engagement metadata, privacy, FAQ, or procurement follow-ups.";


/** Marketing Sources — no self-href to `/trust`. */
export const TRUST_CENTER_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Assurance status", href: "/security-trust" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
