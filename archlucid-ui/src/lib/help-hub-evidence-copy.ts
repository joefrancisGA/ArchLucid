import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";

export const HELP_HUB_CANONICAL_PATH = "/help" as const;

export const HELP_HUB_CLAIM_DISCIPLINE =
 "Help Center is an orientation launcher for guides and documentation — it is not a signed-review diligence Sources package. Open a specialty guide, Audit, or Assurance status when you need live or evaluation trails.";

export const HELP_HUB_SOURCES_INTRO =
 "Use these follow-ups when browsing Help turns into workflow orientation, assurance, or activity trails.";


/** Operator Sources — no self-href to the Help hub. */
export const HELP_HUB_SOURCES: readonly EvidenceSourceLink[] = [
 { label: "Getting started", href: inAppHelpHref("getting-started") },
 { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
 { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
 { label: "Product FAQ", href: "/faq" },
 { label: "Assurance status", href: "/security-trust" },
 { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
] as const;
