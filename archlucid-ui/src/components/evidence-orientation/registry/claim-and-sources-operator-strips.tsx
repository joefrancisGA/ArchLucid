/** Claim-then-sources evidence strips for operator console and internal admin surfaces. */
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_PROPOSALS_FOLLOW_UPS_TITLE,
  EVIDENCE_PROPOSALS_SOURCES,
  EVIDENCE_PROPOSALS_SOURCES_INTRO,
} from "@/lib/evidence-proposals-evidence-copy";
import {
  CONNECTION_STATUS_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_SOURCES,
  CONNECTION_STATUS_SOURCES_INTRO,
} from "@/lib/connection-status-evidence-copy";
import {
  ADMIN_CONFIGURATION_FOLLOW_UPS_TITLE,
  ADMIN_CONFIGURATION_SOURCES,
  ADMIN_CONFIGURATION_SOURCES_INTRO,
} from "@/lib/admin-configuration-evidence-copy";
import {
  ADMIN_HEALTH_FOLLOW_UPS_TITLE,
  ADMIN_HEALTH_SOURCES,
  ADMIN_HEALTH_SOURCES_INTRO,
} from "@/lib/admin-health-evidence-copy";
import {
  ADMIN_ITSM_CONNECTORS_FOLLOW_UPS_TITLE,
  ADMIN_ITSM_CONNECTORS_SOURCES,
  ADMIN_ITSM_CONNECTORS_SOURCES_INTRO,
} from "@/lib/admin-itsm-connectors-evidence-copy";
import {
  AGENT_MODEL_CATALOG_FOLLOW_UPS_TITLE,
  AGENT_MODEL_CATALOG_SOURCES,
  AGENT_MODEL_CATALOG_SOURCES_INTRO,
} from "@/lib/agent-model-catalog-evidence-copy";
import {
  ADMIN_TENANTS_FOLLOW_UPS_TITLE,
  ADMIN_TENANTS_SOURCES,
  ADMIN_TENANTS_SOURCES_INTRO,
} from "@/lib/admin-tenants-evidence-copy";
import {
  DEMO_READINESS_FOLLOW_UPS_TITLE,
  DEMO_READINESS_SOURCES,
  DEMO_READINESS_SOURCES_INTRO,
} from "@/lib/demo-readiness-evidence-copy";
import {
  DEPLOYMENT_STATUS_FOLLOW_UPS_TITLE,
  DEPLOYMENT_STATUS_SOURCES,
  DEPLOYMENT_STATUS_SOURCES_INTRO,
} from "@/lib/deployment-status-evidence-copy";
import {
  FLEET_LLM_COGS_FOLLOW_UPS_TITLE,
  FLEET_LLM_COGS_SOURCES,
  FLEET_LLM_COGS_SOURCES_INTRO,
} from "@/lib/fleet-llm-cogs-evidence-copy";
import {
  INTEGRATION_EVENTS_DLQ_FOLLOW_UPS_TITLE,
  INTEGRATION_EVENTS_DLQ_SOURCES,
  INTEGRATION_EVENTS_DLQ_SOURCES_INTRO,
} from "@/lib/integration-events-dlq-evidence-copy";
import {
  PRICING_QUOTE_AGING_FOLLOW_UPS_TITLE,
  PRICING_QUOTE_AGING_SOURCES,
  PRICING_QUOTE_AGING_SOURCES_INTRO,
} from "@/lib/pricing-quote-aging-evidence-copy";
import {
  PLATFORM_BUNDLED_POLICY_PACKS_FOLLOW_UPS_TITLE,
  PLATFORM_BUNDLED_POLICY_PACKS_SOURCES,
  PLATFORM_BUNDLED_POLICY_PACKS_SOURCES_INTRO,
} from "@/lib/platform-bundled-policy-packs-evidence-copy";
import {
  PRODUCT_LEARNING_FOLLOW_UPS_TITLE,
  PRODUCT_LEARNING_SOURCES,
  PRODUCT_LEARNING_SOURCES_INTRO,
} from "@/lib/product-learning-evidence-copy";
import {
  RAG_HEALTH_FOLLOW_UPS_TITLE,
  RAG_HEALTH_SOURCES,
  RAG_HEALTH_SOURCES_INTRO,
} from "@/lib/rag-health-evidence-copy";
import {
  RECOMMENDATION_LEARNING_FOLLOW_UPS_TITLE,
  RECOMMENDATION_LEARNING_SOURCES,
  RECOMMENDATION_LEARNING_SOURCES_INTRO,
} from "@/lib/recommendation-learning-evidence-copy";
import {
  REPLAY_FOLLOW_UPS_TITLE,
  REPLAY_SOURCES,
  REPLAY_SOURCES_INTRO,
} from "@/lib/replay-evidence-copy";
import {
  TRIAL_FUNNEL_FOLLOW_UPS_TITLE,
  TRIAL_FUNNEL_SOURCES,
  TRIAL_FUNNEL_SOURCES_INTRO,
} from "@/lib/trial-funnel-evidence-copy";
import {
  TENANT_HEALTH_FOLLOW_UPS_TITLE,
  TENANT_HEALTH_SOURCES,
  TENANT_HEALTH_SOURCES_INTRO,
} from "@/lib/tenant-health-evidence-copy";
import {
  OPERATOR_HOME_FOLLOW_UPS_TITLE,
  OPERATOR_HOME_SOURCES,
  OPERATOR_HOME_SOURCES_INTRO,
} from "@/lib/operator/operator-home-evidence-copy";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";

export function ConnectionStatusEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connection-status"
      sourcesTitle={CONNECTION_STATUS_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECTION_STATUS_SOURCES_INTRO}
      sources={CONNECTION_STATUS_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function AdminConfigurationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="admin-configuration"
      sourcesTitle={ADMIN_CONFIGURATION_FOLLOW_UPS_TITLE}
      sourcesIntro={ADMIN_CONFIGURATION_SOURCES_INTRO}
      sources={ADMIN_CONFIGURATION_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function AdminHealthEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="admin-health"
      sourcesTitle={ADMIN_HEALTH_FOLLOW_UPS_TITLE}
      sourcesIntro={ADMIN_HEALTH_SOURCES_INTRO}
      sources={ADMIN_HEALTH_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function IntegrationEventsDlqEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="integration-events-dlq"
      sourcesTitle={INTEGRATION_EVENTS_DLQ_FOLLOW_UPS_TITLE}
      sourcesIntro={INTEGRATION_EVENTS_DLQ_SOURCES_INTRO}
      sources={INTEGRATION_EVENTS_DLQ_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function AdminItsmConnectorsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="admin-itsm-connectors"
      sourcesTitle={ADMIN_ITSM_CONNECTORS_FOLLOW_UPS_TITLE}
      sourcesIntro={ADMIN_ITSM_CONNECTORS_SOURCES_INTRO}
      sources={ADMIN_ITSM_CONNECTORS_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function AdminTenantsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="admin-tenants"
      sourcesTitle={ADMIN_TENANTS_FOLLOW_UPS_TITLE}
      sourcesIntro={ADMIN_TENANTS_SOURCES_INTRO}
      sources={ADMIN_TENANTS_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function AgentModelCatalogEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="agent-model-catalog"
      sourcesTitle={AGENT_MODEL_CATALOG_FOLLOW_UPS_TITLE}
      sourcesIntro={AGENT_MODEL_CATALOG_SOURCES_INTRO}
      sources={AGENT_MODEL_CATALOG_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function DemoReadinessEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="demo-readiness"
      sourcesTitle={DEMO_READINESS_FOLLOW_UPS_TITLE}
      sourcesIntro={DEMO_READINESS_SOURCES_INTRO}
      sources={DEMO_READINESS_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function DeploymentStatusEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="deployment-status"
      sourcesTitle={DEPLOYMENT_STATUS_FOLLOW_UPS_TITLE}
      sourcesIntro={DEPLOYMENT_STATUS_SOURCES_INTRO}
      sources={DEPLOYMENT_STATUS_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function EvidenceProposalsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="evidence-proposals"
      sourcesTitle={EVIDENCE_PROPOSALS_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_PROPOSALS_SOURCES_INTRO}
      sources={EVIDENCE_PROPOSALS_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function FleetLlmCogsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="fleet-llm-cogs"
      sourcesTitle={FLEET_LLM_COGS_FOLLOW_UPS_TITLE}
      sourcesIntro={FLEET_LLM_COGS_SOURCES_INTRO}
      sources={FLEET_LLM_COGS_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function PricingQuoteAgingEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="pricing-quote-aging"
      sourcesTitle={PRICING_QUOTE_AGING_FOLLOW_UPS_TITLE}
      sourcesIntro={PRICING_QUOTE_AGING_SOURCES_INTRO}
      sources={PRICING_QUOTE_AGING_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function PlatformBundledPolicyPacksEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="platform-bundled-policy-packs"
      sourcesTitle={PLATFORM_BUNDLED_POLICY_PACKS_FOLLOW_UPS_TITLE}
      sourcesIntro={PLATFORM_BUNDLED_POLICY_PACKS_SOURCES_INTRO}
      sources={PLATFORM_BUNDLED_POLICY_PACKS_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ProductLearningEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="product-learning"
      sourcesTitle={PRODUCT_LEARNING_FOLLOW_UPS_TITLE}
      sourcesIntro={PRODUCT_LEARNING_SOURCES_INTRO}
      sources={PRODUCT_LEARNING_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function RagHealthEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="rag-health"
      sourcesTitle={RAG_HEALTH_FOLLOW_UPS_TITLE}
      sourcesIntro={RAG_HEALTH_SOURCES_INTRO}
      sources={RAG_HEALTH_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function RecommendationLearningEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="recommendation-learning"
      sourcesTitle={RECOMMENDATION_LEARNING_FOLLOW_UPS_TITLE}
      sourcesIntro={RECOMMENDATION_LEARNING_SOURCES_INTRO}
      sources={RECOMMENDATION_LEARNING_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ReplayEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="validate-route"
      sourcesTitle={REPLAY_FOLLOW_UPS_TITLE}
      sourcesIntro={REPLAY_SOURCES_INTRO}
      sources={REPLAY_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function TrialFunnelEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="trial-funnel"
      sourcesTitle={TRIAL_FUNNEL_FOLLOW_UPS_TITLE}
      sourcesIntro={TRIAL_FUNNEL_SOURCES_INTRO}
      sources={TRIAL_FUNNEL_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function TenantHealthEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="tenant-health"
      sourcesTitle={TENANT_HEALTH_FOLLOW_UPS_TITLE}
      sourcesIntro={TENANT_HEALTH_SOURCES_INTRO}
      sources={TENANT_HEALTH_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function OperatorHomeEvidenceOrientationStrip(
  props: { readonly sources?: readonly EvidenceOrientationLink[] } = {},
): React.JSX.Element {
  const sources = props.sources ?? OPERATOR_HOME_SOURCES;

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="operator-home"
      sourcesTestId="operator-home-settings-sources"
      sourcesTitle={OPERATOR_HOME_FOLLOW_UPS_TITLE}
      sourcesIntro={OPERATOR_HOME_SOURCES_INTRO}
      sources={sources}
      sourcesHeadingId="where-to-go-next"
    />
  );
}
