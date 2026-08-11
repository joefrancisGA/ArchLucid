import {

  ArchiveRestore,

  Bell,

  Building2,

  Cpu,

  CreditCard,

  Fingerprint,

  HeartPulse,

  KeyRound,

  LifeBuoy,

  Plug,

  Settings,

  ShieldCheck,

  UserCog,

  UserPlus,

  Users,

} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SETTINGS_NOTIFICATIONS_PATH, SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Tenant admin surfaces — settings, billing, support bundle, directory. */

export class OperatorAdminNavGroupBuilder extends NavGroupBuilderBase {

  build(): NavGroupConfig {

    return {

      id: "operator-admin",

      label: "Administration",

      surface: "platform-admin",

      caption: "Settings, billing, users, connector health, and support.",

      links: [

        // Hub-first (IA-016 / decision D5): the "Settings" slot targets the searchable index, not a leaf page.
        // The hub stays ReadAuthority because it also publishes read-only rows (billing, security & trust).
        {

          href: SETTINGS_ROOT_PATH,

          label: OPERATOR_NAV_LINK_LABELS.settings,

          title: "Settings — searchable index of workspace, governance, integration, billing, and support configuration",

          icon: Settings,

          tier: "extended",

          requiredAuthority: "ReadAuthority",

        },

        {

          href: SETTINGS_NOTIFICATIONS_PATH,

          label: OPERATOR_NAV_LINK_LABELS.notifications,

          title: "Notifications - digests, alerts, Teams, and Slack configure surfaces",

          icon: Bell,

          tier: "extended",

          requiredAuthority: "ReadAuthority",

        },

        {

          href: "/administration/tenant",

          label: OPERATOR_NAV_LINK_LABELS.workspaceSettings,

          title: `${OPERATOR_NAV_LINK_LABELS.workspaceSettings} — trial, cost settings, and request scope`,

          icon: Building2,

          tier: "extended",

          // Tenant-scoped configuration is admin-only; the API enforces the same floor on the writes.
          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/users",

          label: "Users & roles",

          title: "Users & roles — directory and role assignments",

          icon: Users,

          tier: "extended",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/identity-providers",

          label: "Identity providers",

          title: "Identity providers — OIDC authority and audience (read-only catalog row)",

          icon: Fingerprint,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/identity/sso-wizard",

          label: "SSO wizard",

          title: "SSO wizard — guided OIDC / SAML 2.0 tenant configuration",

          icon: UserCog,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/api-keys",

          label: "API keys",

          title: "API keys — manage approved automation and integration access",

          icon: KeyRound,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/scim-provisioning",

          label: "SCIM provisioning",

          title: "SCIM provisioning — inbound bearer tokens and connectivity verification",

          icon: UserPlus,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/billing",

          label: "Billing & plans",

          title: "Billing & plans — Team, Professional, and Enterprise packaging",

          icon: CreditCard,

          tier: "extended",

          requiredAuthority: "ReadAuthority",

        },

        {

          href: "/administration/ai-usage",

          label: OPERATOR_NAV_LINK_LABELS.aiUsage,

          title: "AI usage — estimated workspace AI spend, monthly cap utilization, and daily trends",

          icon: Cpu,

          tier: "extended",

          // Tenant LLM cost report — nav gated to AdminAuthority so architects/exec personas do not see vendor cost chrome (TB-648).
          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/security-trust",

          label: OPERATOR_NAV_LINK_LABELS.securityTrust,

          title:

            "Security & trust — share procurement-ready materials, trust-center links, and assessment status",

          icon: ShieldCheck,

          tier: "extended",

          requiredAuthority: "ReadAuthority",

        },

        {

          href: "/administration/tenant/recycle-bin",

          label: "Projects recycle bin",

          title: "Projects recycle bin — restore soft-deleted architecture projects",

          icon: ArchiveRestore,

          tier: "extended",

          requiredAuthority: "ReadAuthority",

        },

        {

          href: "/administration/connection-status",

          label: OPERATOR_NAV_LINK_LABELS.integrationReadiness,

          title: "Connector health and integration status",

          icon: Plug,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: ADMINISTRATION_SYSTEM_HEALTH_PATH,

          label: OPERATOR_NAV_LINK_LABELS.systemHealth,

          title: "System health — API liveness, readiness, and critical dependencies",

          icon: HeartPulse,

          tier: "extended",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/support",

          label: "Support",

          title: "Download diagnostics and get help",

          icon: LifeBuoy,

          tier: "extended",

          requiredAuthority: "ExecuteAuthority",

        },

      ],

    };

  }

}

