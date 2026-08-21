import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  SYSTEM_HEALTH_CLAIM_DISCIPLINE_HEADING,
  SYSTEM_HEALTH_SOURCES_INTRO,
} from "@/lib/system-health-evidence-copy";

export const SYSTEM_HEALTH_HELP_CANONICAL_PATH = "/help/system-health" as const;

export const SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING = SYSTEM_HEALTH_CLAIM_DISCIPLINE_HEADING;

export const SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace operational readiness (live/ready checks and build identity). It is not a full audit export.";

export const SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SYSTEM_HEALTH_HELP_SOURCES_INTRO = SYSTEM_HEALTH_SOURCES_INTRO;

/** Help Sources — no self-href to `/help/system-health`. */
export const SYSTEM_HEALTH_HELP_SOURCES: readonly EvidenceOrientationLink[] = [
  {
    label: "Connection status",
    href: "/administration/connection-status",
    when: "Open connection status when a connector needs setup or credential repair",
  },
  {
    label: "Connection status guide",
    href: inAppHelpHref("connection-status"),
    when: "Read connection status help when you need row-by-row interpretation",
  },
  {
    label: "Troubleshooting guide",
    href: inAppHelpHref("troubleshooting"),
    when: "Read troubleshooting when runtime failures persist after refresh",
  },
  {
    label: "Governance audit",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Open governance audit when official review records are the follow-up",
  },
] as const;

/** Drift guard: help claim shares operator negation substance without mirroring live-page framing. */
export const SYSTEM_HEALTH_HELP_OPERATOR_CLAIM_NEGATION = "not a full audit export";
