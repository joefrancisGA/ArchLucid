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
import { isCtoDemoOperatorToolingEnv } from "@/lib/cto-demo-presenter-pack";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { BUYER_CTO_DEMO_READINESS_HEADING } from "@/lib/buyer-polish-copy";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Internal cross-tenant, diagnostic, and employee-only surfaces — gated by `features.showSystemAdministrationNav`. */
export class OperatorSystemAdminNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    const links: NavGroupConfig["links"] = [
        {
          href: "/admin/pricing-quote-aging",
          label: "Pricing quote follow-up",
          title: "Pricing quote follow-up — open quote requests and SLA posture",
          icon: ClipboardList,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/trial-funnel",
          label: "Trial funnel",
          title: "Trial funnel — trial activation, review completion, conversion, and estimated first-review AI cost",
          icon: LineChart,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/fleet-llm-cogs",
          label: "Fleet LLM COGS",
          title: "Fleet LLM COGS — per-tenant estimated LLM budget pressure and margin risk",
          icon: Wallet,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/tenant-health",
          label: "Tenant health",
          title: "Tenant health — engagement, governance, and pilot funnel stage per scope",
          icon: BarChart3,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/tenants",
          label: "Tenants",
          title: "Tenants — provision net-new tenants and shut off or resume tenant surfaces",
          icon: Building2,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/health",
          label: "Diagnostics dashboard",
          title: "Diagnostics dashboard — readiness, circuit breakers, onboarding funnel metrics",
          icon: Gauge,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/deployment-status",
          label: "Deployment status",
          title: "Deployment status — BUILD_ID agreement, health, migration version (internal)",
          icon: ServerCog,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/rag-health",
          label: OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth,
          title: `${OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth} — per-corpus index freshness and embedding dimension`,
          icon: BookOpen,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/configuration",
          label: "Configuration",
          title: "Configuration — catalog summary and environment health config-lint dashboard",
          icon: Settings2,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/operate/integration-events/dlq",
          label: OPERATOR_NAV_LINK_LABELS.failedIntegrationMessages,
          title: "Failed integration messages — inspect and retry failed outbound integration events",
          icon: Inbox,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/evidence-proposals",
          label: "Evidence proposals",
          title: "Evidence proposals — review and promote agent-curated catalog entries",
          icon: FilePlus,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/replay",
          label: OPERATOR_NAV_LINK_LABELS.replayReview,
          title: this.shortcutTitle("Validate review — check stored review output integrity", "alt+p"),
          keyShortcut: "alt+p",
          icon: PackageCheck,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/internal-operations/recommendation-learning",
          label: OPERATOR_NAV_LINK_LABELS.recommendationTuning,
          title: "Recommendation learning — inspect eligibility, preview rebuilds, and profile history",
          icon: Sparkles,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
        {
          // Literal href required by assert_route_tier_policy_nav (string scan of nav-group builders).
          href: "/internal/product-learning",
          label: OPERATOR_NAV_LINK_LABELS.pilotFeedback,
          title: `${BUYER_TERMINOLOGY.evaluationFeedback} — recurring issues and improvement opportunities`,
          icon: MessageSquareText,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
      ];

    if (isCtoDemoOperatorToolingEnv()) {
      links.push({
        href: "/admin/demo-readiness",
        label: BUYER_CTO_DEMO_READINESS_HEADING,
        title: "Demo readiness — showcase seed, authentication, and execution-budget diagnostics",
        icon: Layers,
        tier: "advanced",
        requiredAuthority: "AdminAuthority",
      });
    }

    return {
      id: "operator-system-admin",
      label: "Internal Operations",
      surface: "system-admin",
      links,
    };
  }
}
