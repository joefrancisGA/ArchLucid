import {
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance-route-paths";
import { POLICY_PACKS_HELP_PATH } from "@/lib/policy-packs-page";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const POLICY_PACKS_HELP_CANONICAL_PATH = POLICY_PACKS_HELP_PATH;

export const POLICY_PACKS_HELP_CLAIM_DISCIPLINE =
  "This Policy packs guide orients architects on pack assignment and conflict resolution — it is help orientation, not a signed-review diligence Sources package from your tenant. Open Policy packs or Standards and rules when you need live pack/rule state.";

export const POLICY_PACKS_HELP_SOURCES_INTRO =
  "Use these follow-ups when pack vocabulary turns into live assignments, conflict resolution, findings triage, or SE demo rehearsal.";


/** Operator Sources — no self-href to `/help/policy-packs`. */
export const POLICY_PACKS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Standards and rules", href: GOVERNANCE_STANDARDS_AND_RULES_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Policy-pack delta demo", href: inAppHelpHref("policy-pack-delta-demo") },
] as const;
