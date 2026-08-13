import { AI_USAGE_COST_REPORTING_PATH, AI_USAGE_LEGACY_ADMIN_PATH, AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import {
  ARCHITECTURES_LIST_PATH,
  CTO_DEMO_TOUR_ENTRY_HREF,
  LEGACY_DEMO_ENTRY_PATH,
  LEGACY_REVIEWS_LIST_PATH,
  LEGACY_RUNS_LIST_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import { DIGESTS_HUB_PATH, LEGACY_DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_EXCEPTIONS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  LEGACY_ALERTS_PATH,
  LEGACY_AUDIT_PATH,
  LEGACY_GOVERNANCE_RISK_EXCEPTIONS_PATH,
  LEGACY_POLICY_PACKS_PATH,
  pathMatchesRoutePrefix,
} from "@/lib/governance/governance-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import {
  CANONICAL_GRAPH_PATH,
  LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH,
} from "@/lib/legacy-architecture-graph-route";
import {
  CANONICAL_AUTH_SIGNIN_PATH,
  LEGACY_LOGIN_PATH,
} from "@/lib/legacy-login-route";
import {
  CANONICAL_ONBOARDING_PATH as CANONICAL_ONBOARD_PATH,
  LEGACY_ONBOARD_PATH,
} from "@/lib/legacy-onboard-route";
import {
  CANONICAL_ONBOARDING_PATH,
  LEGACY_ONBOARDING_START_PATH,
} from "@/lib/legacy-onboarding-start-route";
import {
  CANONICAL_GET_STARTED_PATH,
  LEGACY_QUICK_START_PATH,
} from "@/lib/legacy-quick-start-route";
import {
  LEGACY_INSIGHTS_PLANNING_PATH,
  LEGACY_INSIGHTS_PLANNING_PLAN_DETAIL_PATH_PREFIX,
  LEGACY_PLANNING_PATH,
  LEGACY_PLANNING_PLAN_DETAIL_PATH_PREFIX,
  PLANNING_PATH,
  PLANNING_PLAN_DETAIL_PATH_PREFIX,
} from "@/lib/planning-route";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  LEGACY_SPONSOR_REPORT_ROOT_PATH,
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import {
  LEGACY_SETTINGS_TENANT_PATH,
  SETTINGS_WORKSPACE_SETTINGS_PATH,
} from "@/lib/settings-admin-route-paths";
import {
  INTERNAL_CONFIGURATION_PATH,
  INTERNAL_DEMO_READINESS_PATH,
  INTERNAL_DEPLOYMENT_STATUS_PATH,
  INTERNAL_EVIDENCE_PROPOSALS_PATH,
  INTERNAL_FLEET_LLM_COGS_PATH,
  INTERNAL_HEALTH_PATH,
  INTERNAL_INTEGRATION_EVENTS_DLQ_PATH,
  INTERNAL_PRICING_QUOTE_AGING_PATH,
  INTERNAL_RAG_HEALTH_PATH,
  INTERNAL_RECOMMENDATION_LEARNING_PATH,
  INTERNAL_REPLAY_PATH,
  INTERNAL_TENANT_HEALTH_PATH,
  INTERNAL_TENANTS_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";

const LEGACY_ALERT_RULES_PATH = "/alert-rules";
const LEGACY_CLOUD_CONNECTIONS_PATH = "/settings/cloud-connections";
const LEGACY_IDENTITY_PROVIDERS_PATH = "/settings/identity-providers";
const LEGACY_IDENTITY_SSO_WIZARD_PATH = "/settings/identity/sso-wizard";
const ADMINISTRATION_IDENTITY_PROVIDERS_PATH = "/administration/identity-providers";
const ADMINISTRATION_IDENTITY_SSO_WIZARD_PATH = "/administration/identity/sso-wizard";
const LEGACY_DIGEST_SUBSCRIPTIONS_PATH = "/digest-subscriptions";
const LEGACY_MANIFESTS_PATH = "/manifests";
const LEGACY_SETTINGS_ROLES_PATH = "/settings/roles";
const LEGACY_SETTINGS_AI_USAGE_PATH = "/settings/ai-usage";
const LEGACY_ADMIN_ROOT_PATH = "/admin";
const LEGACY_INTERNAL_OPERATIONS_ROOT_PATH = "/internal-operations";
const LEGACY_OPERATE_INTEGRATION_EVENTS_DLQ_PATH = "/operate/integration-events/dlq";
const LEGACY_REPLAY_PATH = "/replay";
const LEGACY_INSIGHTS_EXECUTIVE_SUMMARY_PATH = "/insights/executive-summary";
const LEGACY_ARCHITECTURE_EXECUTIVE_DASHBOARD_PATH = "/architecture/executive-dashboard";
const LEGACY_EXECUTIVE_DASHBOARD_PATH = "/executive/dashboard";
const LEGACY_DASHBOARD_PATH = "/dashboard";
const LEGACY_PORTFOLIO_PATH = "/portfolio";
const LEGACY_SPONSOR_REPORT_BOOKMARK_PATH = "/sponsor-report";
const LEGACY_SPONSOR_REPORT_NESTED_PATH = "/sponsor-report/sponsor-report";
const LEGACY_SPONSOR_REPORT_PILOT_OUTCOMES_PATH = "/sponsor-report/pilot-outcomes";
const LEGACY_SPONSOR_REPORT_ROI_SUMMARY_PATH = "/sponsor-report/roi-summary";
const ADMINISTRATION_USERS_PATH = "/administration/users";

const LEGACY_ADMIN_PATH_MAP: Readonly<Record<string, string>> = {
  "/admin/pricing-quote-aging": INTERNAL_PRICING_QUOTE_AGING_PATH,
  "/admin/trial-funnel": INTERNAL_TRIAL_FUNNEL_PATH,
  "/admin/fleet-llm-cogs": INTERNAL_FLEET_LLM_COGS_PATH,
  "/admin/tenant-health": INTERNAL_TENANT_HEALTH_PATH,
  "/admin/tenants": INTERNAL_TENANTS_PATH,
  "/admin/health": INTERNAL_HEALTH_PATH,
  "/admin/deployment-status": INTERNAL_DEPLOYMENT_STATUS_PATH,
  "/admin/rag-health": INTERNAL_RAG_HEALTH_PATH,
  "/admin/configuration": INTERNAL_CONFIGURATION_PATH,
  "/admin/evidence-proposals": INTERNAL_EVIDENCE_PROPOSALS_PATH,
  "/admin/demo-readiness": INTERNAL_DEMO_READINESS_PATH,
  "/admin/integrations/itsm": "/internal/integrations/itsm",
};

/**
 * Maps legacy bookmark paths to canonical operator routes for readiness, help, and orientation lookups.
 * Hard-retired paths (`/governance/dashboard`, `/sponsor/scorecard`) are not mapped — host-gate 404s them.
 */
export function canonicalizeLegacyOperatorRoutePath(pathname: string): string {
  const normalized = pathname.trim().length === 0 ? "/" : pathname;

  if (pathMatchesRoutePrefix(normalized, LEGACY_AUDIT_PATH)) {
    return normalized.replace(LEGACY_AUDIT_PATH, GOVERNANCE_AUDIT_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_POLICY_PACKS_PATH)) {
    return normalized.replace(LEGACY_POLICY_PACKS_PATH, GOVERNANCE_POLICY_PACKS_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_ALERTS_PATH)) {
    return normalized.replace(LEGACY_ALERTS_PATH, GOVERNANCE_ALERTS_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_ALERT_RULES_PATH)) {
    return normalized.replace(LEGACY_ALERT_RULES_PATH, GOVERNANCE_ALERT_RULES_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_RUNS_LIST_PATH)) {
    return normalized.replace(LEGACY_RUNS_LIST_PATH, REVIEWS_LIST_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_REVIEWS_LIST_PATH)) {
    return normalized.replace(LEGACY_REVIEWS_LIST_PATH, REVIEWS_LIST_PATH);
  }

  if (normalized === LEGACY_DEMO_ENTRY_PATH) {
    return CTO_DEMO_TOUR_ENTRY_HREF;
  }

  // Exact `/architectures` prefix only — must not rewrite `/architecture/architectures`.
  if (pathMatchesRoutePrefix(normalized, "/architectures")) {
    return normalized.replace("/architectures", ARCHITECTURES_LIST_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_CLOUD_CONNECTIONS_PATH)) {
    return normalized.replace(LEGACY_CLOUD_CONNECTIONS_PATH, CLOUD_CONNECTIONS_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_IDENTITY_SSO_WIZARD_PATH)) {
    return normalized.replace(LEGACY_IDENTITY_SSO_WIZARD_PATH, ADMINISTRATION_IDENTITY_SSO_WIZARD_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_IDENTITY_PROVIDERS_PATH)) {
    return normalized.replace(LEGACY_IDENTITY_PROVIDERS_PATH, ADMINISTRATION_IDENTITY_PROVIDERS_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_DIGESTS_HUB_PATH)) {
    return normalized.replace(LEGACY_DIGESTS_HUB_PATH, DIGESTS_HUB_PATH);
  }

  if (normalized === LEGACY_DIGEST_SUBSCRIPTIONS_PATH) {
    return `${DIGESTS_HUB_PATH}?tab=subscriptions`;
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_GOVERNANCE_RISK_EXCEPTIONS_PATH)) {
    return normalized.replace(LEGACY_GOVERNANCE_RISK_EXCEPTIONS_PATH, GOVERNANCE_EXCEPTIONS_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_MANIFESTS_PATH)) {
    return normalized.replace(LEGACY_MANIFESTS_PATH, SIGNED_RECORDS_LIST_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_INSIGHTS_PLANNING_PLAN_DETAIL_PATH_PREFIX)) {
    return normalized.replace(LEGACY_INSIGHTS_PLANNING_PLAN_DETAIL_PATH_PREFIX, PLANNING_PLAN_DETAIL_PATH_PREFIX);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_INSIGHTS_PLANNING_PATH)) {
    return normalized.replace(LEGACY_INSIGHTS_PLANNING_PATH, PLANNING_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_PLANNING_PLAN_DETAIL_PATH_PREFIX)) {
    return normalized.replace(LEGACY_PLANNING_PLAN_DETAIL_PATH_PREFIX, PLANNING_PLAN_DETAIL_PATH_PREFIX);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_PLANNING_PATH)) {
    return normalized.replace(LEGACY_PLANNING_PATH, PLANNING_PATH);
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_SIGNED_RECORDS_LIST_PATH)) {
    return normalized.replace(LEGACY_SIGNED_RECORDS_LIST_PATH, SIGNED_RECORDS_LIST_PATH);
  }

  if (normalized === LEGACY_SETTINGS_ROLES_PATH) {
    return ADMINISTRATION_USERS_PATH;
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_SETTINGS_TENANT_PATH)) {
    return normalized.replace(LEGACY_SETTINGS_TENANT_PATH, SETTINGS_WORKSPACE_SETTINGS_PATH);
  }

  if (normalized === AI_USAGE_LEGACY_ADMIN_PATH) {
    return AI_USAGE_SETTINGS_PATH;
  }

  if (normalized === AI_USAGE_COST_REPORTING_PATH || normalized === LEGACY_SETTINGS_AI_USAGE_PATH) {
    return AI_USAGE_SETTINGS_PATH;
  }

  if (normalized === LEGACY_ONBOARDING_START_PATH) {
    return CANONICAL_ONBOARDING_PATH;
  }

  if (normalized === LEGACY_ONBOARD_PATH) {
    return CANONICAL_ONBOARD_PATH;
  }

  if (normalized === LEGACY_QUICK_START_PATH) {
    return CANONICAL_GET_STARTED_PATH;
  }

  if (normalized === LEGACY_LOGIN_PATH) {
    return CANONICAL_AUTH_SIGNIN_PATH;
  }

  if (normalized === LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH) {
    return CANONICAL_GRAPH_PATH;
  }

  if (normalized === LEGACY_INSIGHTS_EXECUTIVE_SUMMARY_PATH || normalized === SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH) {
    return SPONSOR_REPORT_PATH;
  }

  if (
    normalized === LEGACY_SPONSOR_REPORT_NESTED_PATH
    || normalized === LEGACY_SPONSOR_REPORT_BOOKMARK_PATH
    || normalized === LEGACY_SPONSOR_REPORT_ROOT_PATH
  ) {
    return SPONSOR_REPORT_PATH;
  }

  // The standalone pilot outcomes page merged into the sponsor report, so this pre-existing bookmark
  // alias now resolves there rather than at the retired `/insights/pilot-outcomes`.
  if (normalized === LEGACY_SPONSOR_REPORT_PILOT_OUTCOMES_PATH) {
    return SPONSOR_REPORT_PATH;
  }

  if (
    normalized === LEGACY_ARCHITECTURE_EXECUTIVE_DASHBOARD_PATH
    || normalized === LEGACY_EXECUTIVE_DASHBOARD_PATH
    || normalized === LEGACY_DASHBOARD_PATH
    || normalized === LEGACY_PORTFOLIO_PATH
  ) {
    return SPONSOR_DASHBOARD_HREF;
  }

  if (normalized === LEGACY_SPONSOR_REPORT_ROI_SUMMARY_PATH) {
    return SPONSOR_REPORT_ROI_SUMMARY_PATH;
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_SPONSOR_REPORT_ROOT_PATH)) {
    return normalized.replace(LEGACY_SPONSOR_REPORT_ROOT_PATH, "/insights");
  }

  if (normalized === LEGACY_REPLAY_PATH || normalized.startsWith(`${LEGACY_REPLAY_PATH}/`)) {
    return normalized.replace(LEGACY_REPLAY_PATH, INTERNAL_REPLAY_PATH);
  }

  if (normalized === LEGACY_OPERATE_INTEGRATION_EVENTS_DLQ_PATH) {
    return INTERNAL_INTEGRATION_EVENTS_DLQ_PATH;
  }

  if (normalized === `${LEGACY_INTERNAL_OPERATIONS_ROOT_PATH}/recommendation-learning`) {
    return INTERNAL_RECOMMENDATION_LEARNING_PATH;
  }

  const legacyAdminTarget = LEGACY_ADMIN_PATH_MAP[normalized];

  if (legacyAdminTarget !== undefined) {
    return legacyAdminTarget;
  }

  if (pathMatchesRoutePrefix(normalized, LEGACY_ADMIN_ROOT_PATH)) {
    return normalized.replace(LEGACY_ADMIN_ROOT_PATH, "/internal");
  }

  return normalized;
}
