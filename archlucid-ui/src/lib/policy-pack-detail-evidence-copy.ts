import { GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const POLICY_PACK_DETAIL_CLAIM_DISCIPLINE =
  "Policy pack detail describes published rules and versions for this workspace — not a signed-review diligence Sources trail.";

export const POLICY_PACK_DETAIL_SOURCES_INTRO =
  "Return to the policy pack library to compare packs, or open reviews and findings when applying rules to a review.";


/** Operator Sources — no self-href to pack detail routes. */
export const POLICY_PACK_DETAIL_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Policy pack library", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const POLICY_PACK_DETAIL_PATH_PREFIX = `${GOVERNANCE_POLICY_PACKS_PATH}/` as const;
