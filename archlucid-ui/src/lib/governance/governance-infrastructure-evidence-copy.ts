import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
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

export const GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES_INTRO =
  "Use these surfaces when buyers ask for inventory context, connector readiness, or assurance posture beyond Ask answers.";

/** Operator Sources for infrastructure Ask (GOS). */
export const GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    when: "Open Ask from a resource hub when you need scoped citations",
  },
  {
    label: "Infrastructure overview",
    href: GOVERNANCE_INFRASTRUCTURE_PATH,
    when: "Return to the workbench directory for drift, diagrams, or remediation",
  },
  {
    label: "Audit trail",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow workspace activity when procurement asks for governance context",
  },
  {
    label: "Cloud connections help",
    href: inAppHelpHref("cloud-connections"),
    when: "Confirm inventory connectors before trusting Ask citations",
  },
] as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES_INTRO =
  "Use these surfaces when buyers need inventory context, diagram exports, or remediation follow-up beyond correspondence rows.";

/** Operator Sources for diagram reconciliation (GDI). */
export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES_INTRO =
  "Use these surfaces when buyers need reconciliation, grounded Ask, or resource context beyond diagram exports.";

/** Operator Sources for inventory diagrams (OIN). */
export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Diagram reconciliation",
    href: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    when: "Upload Mermaid and reconcile diagram nodes against inventory snapshots",
  },
  {
    label: "Resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    when: "Open a resource hub to scope diagrams to one cloud resource",
  },
  {
    label: "Ask",
    href: GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
    when: "Ask grounded questions about the same snapshot or resource scope",
  },
  {
    label: "Infrastructure overview",
    href: GOVERNANCE_INFRASTRUCTURE_PATH,
    when: "Return to the workbench directory for drift or remediation",
  },
] as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Inventory diagrams",
    href: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
    when: "Export or inspect diagram views before uploading Mermaid for reconciliation",
  },
  {
    label: "Resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    when: "Open a resource hub to scope reconciliation to one cloud resource",
  },
  {
    label: "Infrastructure overview",
    href: GOVERNANCE_INFRASTRUCTURE_PATH,
    when: "Return to the workbench directory for drift, Ask, or remediation",
  },
  {
    label: "Remediation instances",
    href: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
    when: "Open the factory after creating operational findings from conflict rows",
  },
] as const;

