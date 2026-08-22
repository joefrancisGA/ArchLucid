/** Internal Operations routes, gated to ArchLucid staff. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  INTERNAL_DEMO_READINESS_PATH,
  INTERNAL_DEPLOYMENT_STATUS_PATH,
  INTERNAL_HEALTH_PATH,
  INTERNAL_RECOMMENDATION_LEARNING_PATH,
  INTERNAL_TENANT_HEALTH_PATH,
  INTERNAL_TENANTS_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";
import { PLANNING_PATH } from "@/lib/planning-route";

export const INTERNAL_OPS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/internal/product-learning",
    entry: {
      whatIsThisPage:
        "Pilot feedback — aggregate review signals, ranked improvement opportunities, and exports for product triage.",
      whatToDoNext:
        "Filter by time range, open Improvement planning for themes and plans, or start a review when the dataset is empty.",
      whyEmpty: "Feedback rows appear after architects capture review outcomes in this workspace.",
      whereToConfigurePrerequisite:
        "Pilot feedback is an Internal Ops surface — System Admin authority is typically required.",
      whatToDoNextAction: {
        label: "Open Improvement planning",
        href: PLANNING_PATH,
      },
      taskSteps: [
        "Filter pilot feedback by time range.",
        "Review ranked improvement opportunities.",
        "Open Improvement planning when themes need plans.",
      ],
    },
  },
  {
    prefix: INTERNAL_HEALTH_PATH,
    entry: {
      whatIsThisPage:
        "Diagnostics dashboard — workspace health, readiness, configuration advisories, and assistant diagnostics for architects.",
      whatToDoNext:
        "Review failing probes, open System health for buyer-safe posture, or Troubleshooting when symptoms need runbooks.",
      whyEmpty: "Health panels appear after diagnostics APIs respond for this deployment.",
      whereToConfigurePrerequisite:
        "This Internal Operations surface typically needs System Admin authority.",
      whatToDoNextAction: {
        label: "Open System health",
        href: "/administration/system-health",
      },
      taskSteps: [
        "Review failing diagnostics probes first.",
        "Open System health for buyer-safe posture.",
        "Follow Troubleshooting when symptoms need runbooks.",
      ],
    },
  },
  {
    prefix: INTERNAL_TENANT_HEALTH_PATH,
    entry: {
      whatIsThisPage:
        "Tenant health — internal customer-success scores for engagement, approval activity, and pilot funnel stage by tenant scope.",
      whatToDoNext:
        "Refresh the table, sort attention to low engagement rows, then open System health or Audit when a tenant needs follow-up.",
      whyEmpty: "Rows appear after tenant scopes have recorded review or approval activity.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see other tenants here.",
      taskSteps: [
        "Refresh tenant health scores for the selected scope.",
        "Sort to low engagement or stalled pilots.",
        "Open System health or Audit for tenant follow-up.",
      ],
    },
  },
  {
    prefix: INTERNAL_RECOMMENDATION_LEARNING_PATH,
    entry: {
      whatIsThisPage:
        "Recommendation learning — inspect and rebuild the recommendation-ranking profile from historical advisory outcomes.",
      whatToDoNext:
        "Refresh eligibility counts, preview a rebuild when enough outcomes exist, then open Advisory scans or Pilot feedback for live trails.",
      whyEmpty: "A profile appears after eligible accepted, deferred, rejected, or implemented outcomes exist in scope.",
      whereToConfigurePrerequisite:
        "Preview and rebuild require ExecuteAuthority; this Internal Ops surface typically needs System Admin access.",
      taskSteps: [
        "Refresh eligibility counts for learning outcomes.",
        "Preview a rebuild when enough outcomes exist.",
        "Open Advisory scans or Pilot feedback for live trails.",
      ],
    },
  },
  {
    prefix: INTERNAL_TENANTS_PATH,
    entry: {
      whatIsThisPage:
        "Tenants — provision new tenant scopes or shut off existing tenants without deleting retained data.",
      whatToDoNext:
        "Create a tenant when onboarding a customer, shut off access when needed, then open Tenant health or Audit for follow-up.",
      whyEmpty: "Rows appear after platform administrators provision tenant registry entries.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see other tenants here.",
      taskSteps: [
        "Create a tenant when onboarding a new customer.",
        "Shut off access when a tenant must be disabled.",
        "Open Tenant health or Audit for follow-up.",
      ],
    },
  },
  {
    prefix: INTERNAL_TRIAL_FUNNEL_PATH,
    entry: {
      whatIsThisPage:
        "Trial funnel — internal conversion KPIs and cohort rows for trial-stage progress across tenants.",
      whatToDoNext:
        "Adjust the date range, refresh, then open Tenant health or Billing when a cohort needs follow-up.",
      whyEmpty: "Cohort rows appear after trial tenants record signup and review activity in the selected period.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see other tenants here.",
      taskSteps: [
        "Adjust the date range for the cohort view.",
        "Refresh conversion KPIs for trial tenants.",
        "Open Tenant health or Billing when follow-up is needed.",
      ],
    },
  },
  {
    prefix: INTERNAL_DEMO_READINESS_PATH,
    entry: {
      whatIsThisPage:
        "Demo readiness - internal employee diagnostic checklist for buyer CTO demo preflight across this workspace.",
      whatToDoNext:
        "Run the readiness checks, open System health when a dependency fails, or Trial funnel when conversion context is needed.",
      whyEmpty: "Checklist rows appear after the internal readiness probe returns for this deployment.",
      whereToConfigurePrerequisite:
        "This page requires tenant administrator access; customer tenants never see this diagnostic.",
      taskSteps: [
        "Run the demo readiness checklist for this workspace.",
        "Open System health when a dependency fails.",
        "Open Trial funnel when conversion context is needed.",
      ],
    },
  },
  {
    prefix: INTERNAL_DEPLOYMENT_STATUS_PATH,
    entry: {
      whatIsThisPage:
        "Deployment status - internal release identity, health, and BUILD_ID agreement across frontend, API, and worker.",
      whatToDoNext:
        "Refresh status, open System health when readiness fails, or Diagnostics dashboard for deeper platform probes.",
      whyEmpty: "Identity fields appear after the admin deployment-status probe returns for this environment.",
      whereToConfigurePrerequisite:
        "This page requires ArchLucid personnel access; customer tenants never see deployment identity here.",
      taskSteps: [
        "Refresh deployment status for this environment.",
        "Confirm BUILD_ID agreement across frontend, API, and worker.",
        "Open Diagnostics dashboard when deeper probes are needed.",
      ],
    },
  },
];
