import {

  BarChart3,

  BookOpen,

  Building2,

  ClipboardList,

  FilePlus,

  Gauge,

  Inbox,

  Layers,

  LineChart,

  MessageSquareText,

  PackageCheck,

  ServerCog,

  Settings2,

  Sparkles,

  Wallet,

} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";

import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { INTERNAL_DEMO_READINESS_PAGE_TITLE } from "@/lib/demo-readiness-evidence-copy";

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

import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Internal cross-tenant, diagnostic, and employee-only surfaces — gated by `features.showSystemAdministrationNav`. */

export class OperatorSystemAdminNavGroupBuilder extends NavGroupBuilderBase {

  build(): NavGroupConfig {

    const links: NavGroupConfig["links"] = [

        {

          href: INTERNAL_PRICING_QUOTE_AGING_PATH,

          label: "Pricing quote follow-up",

          title: "Pricing quote follow-up — open quote requests and SLA posture",

          icon: ClipboardList,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_TRIAL_FUNNEL_PATH,

          label: "Trial funnel",

          title: "Trial funnel — trial activation, review completion, conversion, and estimated first-review AI cost",

          icon: LineChart,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_FLEET_LLM_COGS_PATH,

          label: "Fleet LLM COGS",

          title: "Fleet LLM COGS — per-tenant estimated LLM budget pressure and margin risk",

          icon: Wallet,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_TENANT_HEALTH_PATH,

          label: "Tenant health",

          title: "Tenant health — engagement, governance, and pilot funnel stage per scope",

          icon: BarChart3,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_TENANTS_PATH,

          label: "Tenants",

          title: "Tenants — provision net-new tenants and shut off or resume tenant surfaces",

          icon: Building2,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_HEALTH_PATH,

          label: "Diagnostics dashboard",

          title: "Diagnostics dashboard — readiness, circuit breakers, onboarding funnel metrics",

          icon: Gauge,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_DEPLOYMENT_STATUS_PATH,

          label: "Deployment status",

          title: "Deployment status — BUILD_ID agreement, health, migration version (internal)",

          icon: ServerCog,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_RAG_HEALTH_PATH,

          label: OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth,

          title: `${OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth} — per-corpus index freshness and embedding dimension`,

          icon: BookOpen,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_CONFIGURATION_PATH,

          label: "Configuration",

          title: "Configuration — catalog summary and environment health config-lint dashboard",

          icon: Settings2,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          // String literal required: scripts/ci/assert_route_tier_policy_nav.py parses href:"..." only.

          href: INTERNAL_INTEGRATION_EVENTS_DLQ_PATH as typeof INTERNAL_INTEGRATION_EVENTS_DLQ_PATH & "/internal/integration-events/dlq",

          label: OPERATOR_NAV_LINK_LABELS.failedIntegrationMessages,

          title: "Failed integration messages — inspect and retry failed outbound integration events",

          icon: Inbox,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_EVIDENCE_PROPOSALS_PATH,

          label: "Evidence proposals",

          title: "Evidence proposals — review and promote agent-curated catalog entries",

          icon: FilePlus,

          tier: "extended",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: INTERNAL_REPLAY_PATH,

          label: OPERATOR_NAV_LINK_LABELS.replayReview,

          title: this.shortcutTitle("Validate review — check stored review output integrity", "alt+p"),

          keyShortcut: "alt+p",

          icon: PackageCheck,

          tier: "extended",

          requiredAuthority: "ExecuteAuthority",

        },

        {

          href: INTERNAL_RECOMMENDATION_LEARNING_PATH,

          label: OPERATOR_NAV_LINK_LABELS.recommendationTuning,

          title: "Recommendation learning — inspect eligibility, preview rebuilds, and profile history",

          icon: Sparkles,

          tier: "advanced",

          requiredAuthority: "ReadAuthority",

        },

        {

          // Literal href required by assert_route_tier_policy_nav (string scan of nav-group builders).

          href: PRODUCT_LEARNING_PATH,

          label: OPERATOR_NAV_LINK_LABELS.pilotFeedback,

          title: `${BUYER_TERMINOLOGY.evaluationFeedback} — recurring issues and improvement opportunities`,

          icon: MessageSquareText,

          tier: "advanced",

          requiredAuthority: "ReadAuthority",

        },

        {

          // Employee Internal Ops only — no separate CTO demo tooling env gate.

          href: INTERNAL_DEMO_READINESS_PATH,

          label: INTERNAL_DEMO_READINESS_PAGE_TITLE,

          title: "Demo readiness — showcase seed, authentication, and execution-budget diagnostics",

          icon: Layers,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

      ];

    return {

      id: "operator-system-admin",

      label: "Internal",

      surface: "system-admin",

      links,

    };

  }

}

