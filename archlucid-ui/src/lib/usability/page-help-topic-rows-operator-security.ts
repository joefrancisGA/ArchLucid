/** SecureNow Security shell learn-more overrides — longer prefixes win over architecture defaults. */

import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE } from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL } from "@/lib/governance/governance-approval-help-evidence-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { FINDINGS_HELP_TOPIC_LABEL } from "@/lib/findings/findings-help-evidence-copy";
import { EXTRACT_UPLOAD_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/extract-upload-settings-evidence-copy";

import type { PageHelpTopic, PageHelpTopicRow } from "./page-help-topic-rows-operator";

export type { PageHelpTopicRow };

export const PAGE_HELP_TOPIC_ROWS_OPERATOR_SECURITY: readonly PageHelpTopicRow[] = [
  {
    prefix: "/",
    topic: { slug: "getting-started", label: OPERATOR_NAV_LINK_LABELS.home },
  },
  {
    prefix: SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
    topic: { slug: "findings", label: OPERATOR_NAV_LINK_LABELS.assignedToMeFindings, hashFragment: "assigned-to-me" },
  },
  {
    prefix: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
    topic: { slug: "findings", label: OPERATOR_NAV_LINK_LABELS.assignedToMeFindings, hashFragment: "assigned-to-me" },
  },
  {
    prefix: "/governance/remediation-factory",
    topic: { slug: "remediation-factory", label: OPERATOR_NAV_LINK_LABELS.remediationFactory },
  },
  {
    prefix: "/governance/remediation-patterns",
    topic: { slug: "remediation-patterns", label: OPERATOR_NAV_LINK_LABELS.remediationPatterns },
  },
  {
    prefix: AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
    topic: { slug: "audit-evidence-lineage", label: OPERATOR_NAV_LINK_LABELS.auditEvidenceLineage },
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
    topic: { slug: "governance-infrastructure-drift", label: GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE },
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
    topic: { label: OPERATOR_NAV_LINK_LABELS.infrastructureTerraform },
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
    topic: { label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams },
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    topic: { label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagramReconcile },
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    topic: { label: OPERATOR_NAV_LINK_LABELS.infrastructureResources },
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
    topic: { label: OPERATOR_NAV_LINK_LABELS.infrastructureAsk },
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
    topic: { label: OPERATOR_NAV_LINK_LABELS.infrastructureRemediation },
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    topic: { slug: "cloud-connections-azure", label: EXTRACT_UPLOAD_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_PATH,
    exactMatchOnly: true,
    topic: {
      slug: "governance-infrastructure-overview",
      label: OPERATOR_NAV_LINK_LABELS.infrastructureOverview,
    },
  },
  {
    prefix: GOVERNANCE_FINDINGS_PATH,
    topic: { slug: "findings", label: FINDINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance",
    topic: { label: GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL },
  },
];
