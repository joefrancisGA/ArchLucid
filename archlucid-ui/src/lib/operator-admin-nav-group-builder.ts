import {
  BarChart3,
  Building2,
  CreditCard,
  HeartPulse,
  LifeBuoy,
  Settings2,
  Users,
  Wallet,
  Webhook,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Tenant admin surfaces — settings, support bundle, directory. */
export class OperatorAdminNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operator-admin",
      label: "Admin",
      surface: "platform-admin",
      caption: "Tenant cost, settings, support bundles, and user administration.",
      links: [
        {
          href: "/admin/health",
          label: "System health",
          title: "System health — readiness, circuit breakers, onboarding funnel metrics",
          icon: HeartPulse,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/configuration",
          label: "Configuration",
          title: "Configuration — catalog-aligned effective settings (read-only; secrets masked)",
          icon: Settings2,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/settings/tenant-cost",
          label: "Tenant cost",
          title: "Tenant cost — estimated monthly spend band (Standard+)",
          icon: Wallet,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/settings/billing",
          label: "Billing & plans",
          title: "Billing & plans — Team, Professional, and Enterprise packaging",
          icon: CreditCard,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/settings/baseline",
          label: "Baseline settings",
          title: "Baseline settings — ROI measurement inputs",
          icon: BarChart3,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/settings/webhooks",
          label: "Webhooks",
          title: "Webhooks — outbound HTTPS subscriptions, secrets, and connectivity tests",
          icon: Webhook,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/settings/tenant",
          label: "Tenant settings",
          title: "Tenant settings — trial, digest email, and request scope",
          icon: Building2,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/admin/support",
          label: "Support",
          title: "Support — download a redacted support bundle for tickets",
          icon: LifeBuoy,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/admin/users",
          label: "Users & roles",
          title: "Users & roles — directory and authority rank (administration UI; API policies still enforce writes)",
          icon: Users,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
      ],
    };
  }
}
