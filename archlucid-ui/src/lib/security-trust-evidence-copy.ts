import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SECURITY_TRUST_CANONICAL_PATH = "/assurance-status" as const;

export const SECURITY_TRUST_CLAIM_DISCIPLINE =
  "This page summarizes public security review progress — not a full audit export, a CPA-issued SOC 2 report, or a published third-party pen-test report. Use Trust Center downloads and NDA channels for materials that actually exist; do not treat marketing status labels as formal certification.";

export const SECURITY_TRUST_SOURCES_INTRO =
  "Use these evaluation links when assurance questions turn into public downloads, privacy, FAQ, or procurement follow-ups.";


/** Marketing Sources — no self-href to `/security-trust`. */
export const SECURITY_TRUST_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Trust Center", href: "/trust" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
