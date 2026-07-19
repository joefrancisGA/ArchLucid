import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FilePlus,
  Gauge,
  Inbox,
  Layers,
  LineChart,
  PackageCheck,
  ServerCog,
  Settings2,
  Wallet,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { isCtoDemoOperatorToolingEnv } from "@/lib/cto-demo-presenter-pack";
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
