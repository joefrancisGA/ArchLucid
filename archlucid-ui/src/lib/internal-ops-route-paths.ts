/** Canonical browser paths for Internal Operations nav surfaces. */
export const INTERNAL_OPS_ROOT_PATH = "/internal" as const;

/** Breadcrumb / hub link when grouping under Internal Operations. */
export const INTERNAL_OPS_NAV_HUB_PATH = "/internal/health" as const;

export const INTERNAL_PRICING_QUOTE_AGING_PATH = "/internal/pricing-quote-aging" as const;
export const INTERNAL_TRIAL_FUNNEL_PATH = "/internal/trial-funnel" as const;
export const INTERNAL_FLEET_LLM_COGS_PATH = "/internal/fleet-llm-cogs" as const;
export const INTERNAL_AGENT_MODEL_CATALOG_PATH = "/internal/agent-model-catalog" as const;
export const INTERNAL_TENANT_HEALTH_PATH = "/internal/tenant-health" as const;
export const INTERNAL_TENANTS_PATH = "/internal/tenants" as const;
export const INTERNAL_HEALTH_PATH = "/internal/health" as const;
export const INTERNAL_DEPLOYMENT_STATUS_PATH = "/internal/deployment-status" as const;
export const INTERNAL_RAG_HEALTH_PATH = "/internal/rag-health" as const;
export const INTERNAL_CONFIGURATION_PATH = "/internal/configuration" as const;
export const INTERNAL_INTEGRATION_EVENTS_DLQ_PATH = "/internal/integration-events/dlq" as const;
export const INTERNAL_EVIDENCE_PROPOSALS_PATH = "/internal/evidence-proposals" as const;
export const INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH = "/internal/platform-bundled-policy-packs" as const;
export const INTERNAL_REPLAY_PATH = "/internal/replay" as const;
export const INTERNAL_RECOMMENDATION_LEARNING_PATH = "/internal/recommendation-learning" as const;
export const INTERNAL_DEMO_READINESS_PATH = "/internal/demo-readiness" as const;
export const INTERNAL_ITSM_CONNECTORS_PATH = "/internal/integrations/itsm" as const;

export function isInternalOpsPath(pathname: string): boolean {
  return pathname === INTERNAL_OPS_ROOT_PATH || pathname.startsWith(`${INTERNAL_OPS_ROOT_PATH}/`);
}
