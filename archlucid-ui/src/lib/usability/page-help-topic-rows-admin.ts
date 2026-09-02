/**
 * Administration route prefixes and inbound labels for contextual help.
 * Domain slices live in `page-help-topic-rows-admin-*.ts`.
 */

import { AI_USAGE_HELP_TOPIC_LABEL } from "@/lib/ai-usage-settings-evidence-copy";
import { ADMIN_HEALTH_HELP_TOPIC_LABEL } from "@/lib/admin-health-evidence-copy";
import { AUDIT_TRAIL_HELP_TOPIC_LABEL } from "@/lib/audit-trail-help-evidence-copy";
import { BASELINE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/baseline-settings-evidence-copy";
import { DEMO_READINESS_HELP_TOPIC_LABEL } from "@/lib/demo-readiness-evidence-copy";
import { DEPLOYMENT_STATUS_HELP_TOPIC_LABEL } from "@/lib/deployment-status-evidence-copy";
import { EVIDENCE_INTAKE_HELP_TOPIC_LABEL } from "@/lib/evidence-intake-help-evidence-copy";
import { EVIDENCE_TRAIL_HELP_TOPIC_LABEL } from "@/lib/evidence-trail-help-evidence-copy";
import { FLEET_LLM_COGS_HELP_TOPIC_LABEL } from "@/lib/fleet-llm-cogs-evidence-copy";
import { HELP_HUB_HELP_TOPIC_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { IMPACT_PREVIEW_HELP_TOPIC_LABEL } from "@/lib/impact-preview-help-evidence-copy";
import {
  INTERNAL_DEMO_READINESS_PATH,
  INTERNAL_DEPLOYMENT_STATUS_PATH,
  INTERNAL_PRICING_QUOTE_AGING_PATH,
  INTERNAL_TENANT_HEALTH_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";
import { MODEL_GOVERNANCE_HELP_TOPIC_LABEL } from "@/lib/model-governance-settings-evidence-copy";
import { PATH_CHOOSER_HELP_TOPIC_LABEL } from "@/lib/path-chooser-help-evidence-copy";
import { PILOT_FEEDBACK_HELP_TOPIC_LABEL } from "@/lib/pilot-feedback-help-evidence-copy";
import { POLICY_PACKS_HELP_TOPIC_LABEL } from "@/lib/policy/policy-packs-help-evidence-copy";
import { PRICING_QUOTE_AGING_HELP_TOPIC_LABEL } from "@/lib/pricing-quote-aging-evidence-copy";
import { RAG_HEALTH_HELP_TOPIC_LABEL } from "@/lib/rag-health-evidence-copy";
import { RECOMMENDATION_LEARNING_HELP_TOPIC_LABEL } from "@/lib/recommendation-learning-evidence-copy";
import { REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL } from "@/lib/repeat-review-loop-help-title-honesty-surfaces";
import { SPONSOR_REPORT_HELP_TOPIC_LABEL } from "@/lib/sponsor/sponsor-report-help-evidence-copy";
import { SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import { TENANT_HEALTH_HELP_TOPIC_LABEL } from "@/lib/tenant-health-evidence-copy";
import { TRIAL_FUNNEL_HELP_TOPIC_LABEL } from "@/lib/trial-funnel-evidence-copy";

import type { PageHelpTopic } from "./page-help-topic-rows-operator";
import { PAGE_HELP_TOPIC_ROWS_ADMIN_INTEGRATIONS } from "./page-help-topic-rows-admin-integrations";
import { PAGE_HELP_TOPIC_ROWS_ADMIN_SECURITY } from "./page-help-topic-rows-admin-security";

const PAGE_HELP_TOPIC_ROWS_ADMIN_CORE: readonly { prefix: string; topic: PageHelpTopic }[] = [
  {
    prefix: "/administration/ai-usage",
    topic: { slug: "ai-usage", label: AI_USAGE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/settings/ai-usage",
    topic: { slug: "ai-usage", label: AI_USAGE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/repeat-review-loop",
    topic: { slug: "repeat-review-loop", label: REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL },
  },
  { prefix: "/help/audit-trail", topic: { slug: "audit-trail", label: AUDIT_TRAIL_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/evidence-trail",
    topic: { slug: "evidence-trail", label: EVIDENCE_TRAIL_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/evidence-intake",
    topic: { slug: "evidence-intake", label: EVIDENCE_INTAKE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/choose-your-next-step",
    topic: { slug: "choose-your-next-step", label: PATH_CHOOSER_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/pilot-feedback",
    topic: { slug: "pilot-feedback", label: PILOT_FEEDBACK_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/sponsor-report",
    topic: { slug: "sponsor-report", label: SPONSOR_REPORT_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/policy-packs",
    topic: { slug: "policy-packs", label: POLICY_PACKS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/impact-preview",
    topic: { slug: "impact-preview", label: IMPACT_PREVIEW_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/rag-health",
    topic: { slug: "troubleshooting", label: RAG_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/rag-health",
    topic: { slug: "troubleshooting", label: RAG_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/recommendation-learning",
    topic: { slug: "pilot-feedback", label: RECOMMENDATION_LEARNING_HELP_TOPIC_LABEL },
  },
  { prefix: "/administration/system-health", topic: { slug: "system-health", label: SYSTEM_HEALTH_HELP_TOPIC_LABEL } },
  {
    prefix: "/internal/fleet-llm-cogs",
    topic: { slug: "ai-usage", label: FLEET_LLM_COGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/fleet-llm-cogs",
    topic: { slug: "ai-usage", label: FLEET_LLM_COGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_TENANT_HEALTH_PATH,
    topic: { slug: "troubleshooting", label: TENANT_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/tenant-health",
    topic: { slug: "troubleshooting", label: TENANT_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_TRIAL_FUNNEL_PATH,
    topic: { slug: "billing-and-plans", label: TRIAL_FUNNEL_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/trial-funnel",
    topic: { slug: "billing-and-plans", label: TRIAL_FUNNEL_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_DEMO_READINESS_PATH,
    topic: { slug: "choose-your-next-step", label: DEMO_READINESS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/demo-readiness",
    topic: { slug: "choose-your-next-step", label: DEMO_READINESS_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_DEPLOYMENT_STATUS_PATH,
    topic: { slug: "troubleshooting", label: DEPLOYMENT_STATUS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/deployment-status",
    topic: { slug: "troubleshooting", label: DEPLOYMENT_STATUS_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_PRICING_QUOTE_AGING_PATH,
    topic: { slug: "billing-and-plans", label: PRICING_QUOTE_AGING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/model-governance",
    topic: { slug: "model-governance", label: MODEL_GOVERNANCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/baseline",
    topic: { slug: "baseline-settings", label: BASELINE_SETTINGS_HELP_TOPIC_LABEL },
  },
  { prefix: "/help", topic: { slug: "getting-started", label: HELP_HUB_HELP_TOPIC_LABEL } },
];

export const PAGE_HELP_TOPIC_ROWS_ADMIN: readonly { prefix: string; topic: PageHelpTopic }[] = [
  ...PAGE_HELP_TOPIC_ROWS_ADMIN_CORE,
  ...PAGE_HELP_TOPIC_ROWS_ADMIN_SECURITY,
  ...PAGE_HELP_TOPIC_ROWS_ADMIN_INTEGRATIONS,
];
