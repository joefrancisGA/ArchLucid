import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const POLICY_PACK_DETAIL_CLAIM_DISCIPLINE =
  "Policy pack detail describes published rules and versions for this workspace — not a full audit export.";

export const POLICY_PACK_DETAIL_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.policyPacksHub;

export const POLICY_PACK_DETAIL_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "pack detail questions turn into library comparison, review scoping, or findings follow-up",
);


/** Operator Sources — no self-href to pack detail routes. */
export const POLICY_PACK_DETAIL_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Policy pack library", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const POLICY_PACK_DETAIL_PATH_PREFIX = `${GOVERNANCE_POLICY_PACKS_PATH}/` as const;

/** Operator orientation Sources — excludes self-href to `/governance/policy-packs/[id]` (GPI). */
export const POLICY_PACK_DETAIL_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = POLICY_PACK_DETAIL_SOURCES.filter(
  (source) => !source.href.startsWith(POLICY_PACK_DETAIL_PATH_PREFIX),
);
