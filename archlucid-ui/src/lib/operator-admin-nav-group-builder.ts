import {
  ArchiveRestore,
  BarChart3,
  Building2,
  CreditCard,
  Fingerprint,
  KeyRound,
  HeartPulse,
  LifeBuoy,
  LineChart,
  Settings2,
  BookOpen,
  Shield,
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
          title: "Configuration — catalog summary (masked secrets) plus environment health config-lint dashboard",
          icon: Settings2,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/settings/identity-providers",
          label: "Identity providers",
          title: "Identity providers — OIDC authority and audience (read-only catalog row)",
          icon: Fingerprint,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/settings/identity/sso-wizard",
          label: "SSO wizard",
          title: "SSO wizard — guided OIDC / SAML 2.0 tenant configuration",
          icon: Fingerprint,
          tier: "advanced",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/settings/api-keys",
          label: "API keys",
          title: "API keys — host Authentication:ApiKey status and rotation material",
          icon: KeyRound,
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
          href: "/settings/tenant/recycle-bin",
          label: "Projects recycle bin",
          title:
            "Projects recycle bin — list soft-deleted architecture projects by workspace and restore when names do not collide",
          icon: ArchiveRestore,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
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
          href: "/admin/evidence-proposals",
          label: "Evidence proposals",
          title: "Evidence proposals — review and promote agent-curated catalog entries",
          icon: BookOpen,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/settings/cost-reporting",
          label: "Cost reporting",
          title: "Cost reporting — estimated LLM token usage and spend by day, workspace, and project",
          icon: LineChart,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/admin/users",
          label: "Users & roles",
          title: "Users & roles — directory and authority rank (administration UI; API policies still enforce writes)",
          icon: Users,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/settings/roles",
          label: "Role management",
          title: "Role management — assign Admin, Operator, Reader, and Auditor to users and API keys",
          icon: Shield,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
      ],
    };
  }
}
