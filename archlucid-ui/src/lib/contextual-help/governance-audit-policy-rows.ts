/** Governance audit, policy packs surfaces, and matching help topics. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  AUDIT_TRAIL_HELP_CANONICAL_PATH,
  AUDIT_TRAIL_HELP_TOPIC_LABEL,
} from "@/lib/audit-trail-help-evidence-copy";
import { AUDIT_TRAIL_CANONICAL_PATH } from "@/lib/audit-trail-evidence-copy";
import {
  POLICY_PACKS_HELP_CANONICAL_PATH,
  POLICY_PACKS_HELP_TOPIC_LABEL,
} from "@/lib/policy/policy-packs-help-evidence-copy";
import { POLICY_PACKS_HUB_CANONICAL_PATH } from "@/lib/policy/policy-packs-hub-evidence-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

const GOVERNANCE_POLICY_PACKS_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Review policy pack rules, versions, and how packs apply to architecture reviews in this workspace.",
  whatToDoNext:
    "Open a pack to inspect rules, return to the library to compare packs, or apply a pack when starting a review.",
  whyEmpty: "Packs appear after the library is populated for this workspace.",
  whereToConfigurePrerequisite:
    "Policy packs respect the workspace and project selected in the header switcher.",
} as const;

const GOVERNANCE_AUDIT_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Search and export workspace audit events for reviews, approval actions, and integrity checks in this workspace.",
  whatToDoNext:
    "Filter by review or action, refresh the trail, then export or open the related architecture review when needed.",
  whyEmpty: "Events appear after architects take actions that the audit coverage matrix records.",
  whereToConfigurePrerequisite:
    "Audit retention and export privileges follow workspace role and enterprise controls.",
} as const;

export const GOVERNANCE_AUDIT_POLICY_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: POLICY_PACKS_HUB_CANONICAL_PATH,
    entry: GOVERNANCE_POLICY_PACKS_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: AUDIT_TRAIL_CANONICAL_PATH,
    entry: GOVERNANCE_AUDIT_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: AUDIT_TRAIL_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Audit trail help — ${AUDIT_TRAIL_HELP_TOPIC_LABEL.toLowerCase()} for immutable events, correlation identifiers, and export posture.`,
      whatToDoNext:
        "Open Audit for live activity, Findings when a concern needs triage, or Assurance status for assurance surfaces.",
      whyEmpty: "This guide is always available; live audit rows appear after workspace actions are recorded.",
      whereToConfigurePrerequisite:
        "Audit visibility follows workspace roles; confirm the header workspace before exporting trails.",
      whatToDoNextAction: {
        label: "Open Audit",
        href: GOVERNANCE_AUDIT_PATH,
      },
    },
  },
  {
    prefix: POLICY_PACKS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Policy packs help — ${POLICY_PACKS_HELP_TOPIC_LABEL.toLowerCase()} for pack assignment and conflict resolution.`,
      whatToDoNext:
        "Open Policy packs for live assignments, Standards and rules for applied rules, or Findings when violations need triage.",
      whyEmpty: "This guide is always available; live pack rows appear after packs are assigned in this workspace.",
      whereToConfigurePrerequisite:
        "Pack assignment needs a role that can manage governance policy for this workspace.",
      whatToDoNextAction: {
        label: "Open Policy packs",
        href: GOVERNANCE_POLICY_PACKS_PATH,
      },
    },
  },
];
