import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_CLAIM_DISCIPLINE =
  "These workbenches surface inventory evidence and advisory outputs — not sealed review records or official assurance materials. Confirm cloud connections and snapshot capture before trusting exports.";

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SOURCES_INTRO =
  "Use these surfaces when procurement asks for activity context, connector readiness, or assurance posture beyond inventory evidence.";

/** Operator Sources for infrastructure overview hub (GOI). */
export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    when: "Start from a cloud resource when you need assessment-linked audit evidence",
  },
  {
    label: "Ask",
    href: GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
    when: "Open grounded inventory Q&A after snapshots exist for your scope",
  },
  {
    label: "Audit trail",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow workspace activity when buyers ask for governance context",
  },
  {
    label: "Cloud connections help",
    href: inAppHelpHref("cloud-connections"),
    when: "Confirm inventory connectors before trusting snapshot exports",
  },
  {
    label: "Assurance status",
    href: "/assurance-status",
    when: "Read published assurance posture — not a substitute for inventory evidence",
  },
] as const;
