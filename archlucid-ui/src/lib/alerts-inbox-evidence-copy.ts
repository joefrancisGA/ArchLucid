import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERTS_INBOX_CLAIM_HEADING = "What the alert inbox is not";

export const ALERTS_INBOX_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.alertsInbox;

export const ALERTS_INBOX_CLAIM_DISCIPLINE =
  "Alert inbox is where raised alerts land for triage — not a full audit export. Open Findings, Audit, or Alert rules for resolution history or alert setup.";

export const ALERTS_INBOX_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "inbox triage turns into finding resolution, rule configuration, or activity trails",
);


/** Operator Sources — no self-href to the alerts inbox. */
export const ALERTS_INBOX_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alert rules", href: governanceAlertRulesTabHref("rules") },
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Integrations (webhooks)", href: "/integrations/webhooks" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
] as const;
