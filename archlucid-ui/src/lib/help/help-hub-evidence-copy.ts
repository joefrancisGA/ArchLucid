import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const HELP_HUB_CANONICAL_PATH = "/help" as const;

export const HELP_HUB_HELP_TOPIC_LABEL = "Help" as const;

/** Breadcrumb ancestor label for `/help/*` topic pages. */
export const HELP_TOPIC_BREADCRUMB_HUB_LABEL = "Help & Support" as const;

export const HELP_HUB_CLAIM_DISCIPLINE_HEADING = "What Help Center is not";

export const HELP_HUB_FOLLOW_UPS_TITLE = "Where to go next";

export const HELP_HUB_CLAIM_DISCIPLINE =
 "Help Center orients you to guides and documentation — not a full audit export. Open a specialty guide, Audit, or Assurance status when you need official records.";

export const HELP_HUB_SOURCES_INTRO =
 "Use these follow-ups when browsing Help turns into workflow orientation, assurance, or activity trails.";


/** Operator Sources — no self-href to the Help hub. */
export const HELP_HUB_SOURCES: readonly EvidenceSourceLink[] = [
 { label: "Getting started", href: inAppHelpHref("getting-started") },
 { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
 { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
 { label: "Product FAQ", href: "/faq" },
 { label: "Assurance status", href: "/assurance-status" },
 { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
] as const;
