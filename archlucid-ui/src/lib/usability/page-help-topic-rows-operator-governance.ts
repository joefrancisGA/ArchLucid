/** Governance, findings, alerts, digests, and policy-pack contextual help rows. */

import {
  ALERTS_CONFIGURATION_PAGE_TITLE,
  ALERTS_HOW_ALERTS_WORK_LABEL,
} from "@/lib/alerts-page-copy";
import { AUDIT_TRAIL_HELP_TOPIC_LABEL } from "@/lib/audit-trail-help-evidence-copy";
import { DIGESTS_HELP_TOPIC_LABEL } from "@/lib/digests-help-evidence-copy";
import { DECISION_REGISTER_HELP_TOPIC_LABEL } from "@/lib/decision-register-help-evidence-copy";
import { APPROVAL_LINEAGE_HELP_TOPIC_LABEL } from "@/lib/approval-lineage-evidence-copy";
import { APPROVAL_QUEUE_HELP_TOPIC_LABEL } from "@/lib/approval-queue-evidence-copy";
import { FINDINGS_HELP_TOPIC_LABEL } from "@/lib/findings/findings-help-evidence-copy";
import { GOVERNANCE_SETUP_HREF, GOVERNANCE_SETUP_PAGE_TITLE } from "@/lib/governance/governance-setup-route";
import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL } from "@/lib/governance/governance-approval-help-evidence-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { POLICY_PACKS_HUB_HELP_TOPIC_LABEL } from "@/lib/policy/policy-packs-hub-evidence-copy";
import { RECURRENCE_SCHEDULES_HELP_TOPIC_LABEL } from "@/lib/recurrence-schedules-help-evidence-copy";
import { RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE } from "@/lib/recurrence-schedules-copy";
import { RISK_EXCEPTIONS_HELP_TOPIC_LABEL } from "@/lib/risk-exceptions-evidence-copy";
import { STANDARDS_RULES_HELP_TOPIC_LABEL } from "@/lib/standards-rules-page";

import type { PageHelpTopic } from "./page-help-topic-rows-operator";

export const PAGE_HELP_TOPIC_ROWS_OPERATOR_GOVERNANCE: readonly { prefix: string; topic: PageHelpTopic }[] = [
  {
    prefix: "/help/alerts",
    topic: { slug: "alerts", label: ALERTS_HOW_ALERTS_WORK_LABEL },
  },
  {
    prefix: "/help/findings",
    topic: { slug: "findings", label: FINDINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/governance-approval",
    topic: { slug: "governance-approval", label: GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL },
  },
  { prefix: "/governance/findings", topic: { slug: "findings", label: OPERATOR_NAV_LINK_LABELS.findings } },
  {
    prefix: GOVERNANCE_SETUP_HREF,
    topic: { slug: "governance-approval", label: GOVERNANCE_SETUP_PAGE_TITLE },
  },
  {
    prefix: "/governance/recurrence-schedules",
    topic: { slug: "recurrence-schedules", label: RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE },
  },
  {
    prefix: GOVERNANCE_EXCEPTIONS_PATH,
    topic: { slug: "governance-approval", label: RISK_EXCEPTIONS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/approval-queue",
    topic: { slug: "governance-approval", label: APPROVAL_QUEUE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/approval-requests",
    topic: { slug: "governance-approval", label: APPROVAL_LINEAGE_HELP_TOPIC_LABEL },
  },
  { prefix: "/governance/audit", topic: { slug: "audit-trail", label: AUDIT_TRAIL_HELP_TOPIC_LABEL } },
  {
    prefix: "/governance/decision-register",
    topic: { slug: "decision-register", label: DECISION_REGISTER_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/alerts",
    topic: { slug: "alerts", label: OPERATOR_NAV_LINK_LABELS.alerts },
  },
  {
    prefix: "/governance/alert-rules",
    topic: { slug: "alerts", label: ALERTS_CONFIGURATION_PAGE_TITLE },
  },
  {
    prefix: "/governance/policy-packs",
    topic: { slug: "policy-packs", label: POLICY_PACKS_HUB_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/standards-and-rules",
    topic: { slug: "standards-and-rules", label: STANDARDS_RULES_HELP_TOPIC_LABEL },
  },
  { prefix: "/governance", topic: { slug: "governance-approval", label: GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL } },
  { prefix: "/architecture/digests", topic: { slug: "digests", label: DIGESTS_HELP_TOPIC_LABEL } },
  { prefix: "/digests", topic: { slug: "digests", label: DIGESTS_HELP_TOPIC_LABEL } },
  { prefix: "/digest-subscriptions", topic: { slug: "digests", label: DIGESTS_HELP_TOPIC_LABEL } },
  { prefix: "/help/digests", topic: { slug: "digests", label: DIGESTS_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/recurrence-schedules",
    topic: { slug: "recurrence-schedules", label: RECURRENCE_SCHEDULES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/standards-and-rules",
    topic: { slug: "standards-and-rules", label: STANDARDS_RULES_HELP_TOPIC_LABEL },
  },
];
