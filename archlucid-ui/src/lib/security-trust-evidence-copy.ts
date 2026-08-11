import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SECURITY_TRUST_CANONICAL_PATH = "/security-trust" as const;

export const SECURITY_TRUST_CLAIM_DISCIPLINE =
  "This page summarizes public and diligence-oriented assurance engagement metadata — it is not itself a signed-review diligence Sources package, a CPA-issued SOC 2 report, or a published third-party pen-test report. Use Trust Center downloads and NDA channels for the materials that actually exist; do not treat marketing status labels as attestation.";

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
