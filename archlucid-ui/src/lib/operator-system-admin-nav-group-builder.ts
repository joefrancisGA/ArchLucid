import { BarChart3, ClipboardList, LineChart, Wallet } from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Internal cross-tenant and sales-ops surfaces — visible only when {@link isArchLucidInternalOperatorShellEnv} is true. */
export class OperatorSystemAdminNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operator-system-admin",
      label: "System admin",
      surface: "system-admin",
      caption: "Cross-tenant operations, sales follow-up, and fleet analytics (ArchLucid staff only).",
      links: [
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
          title: "Trial funnel — signup, first commit, conversion, and estimated first-review COGS",
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
      ],
    };
  }
}
