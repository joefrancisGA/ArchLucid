import {

  ArchiveRestore,

  Building2,

  Cpu,

  CreditCard,

  Fingerprint,

  HeartPulse,

  KeyRound,

  LifeBuoy,

  Plug,

  ShieldCheck,

  UserCog,

  UserPlus,

  Users,

} from "lucide-react";



import type { NavGroupConfig } from "@/lib/nav-config.types";

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

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

        {

          href: "/administration/settings/tenant",

          label: OPERATOR_NAV_LINK_LABELS.settings,

          title: `${OPERATOR_NAV_LINK_LABELS.workspaceSettings} — trial, digest email, and request scope`,

          icon: Building2,

          tier: "extended",

          requiredAuthority: "ExecuteAuthority",

        },

        {

          href: "/administration/settings/users",

          label: "Users & roles",

          title: "Users & roles — directory, role assignments, and API keys",

          icon: Users,

          tier: "extended",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/settings/identity-providers",

          label: "Identity providers",

          title: "Identity providers — OIDC authority and audience (read-only catalog row)",

          icon: Fingerprint,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/settings/identity/sso-wizard",

          label: "SSO wizard",

          title: "SSO wizard — guided OIDC / SAML 2.0 tenant configuration",

          icon: UserCog,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/settings/api-keys",

          label: "API keys",

          title: "API keys — manage approved automation and integration access",

          icon: KeyRound,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/settings/scim-provisioning",

          label: "SCIM provisioning",

          title: "SCIM provisioning — inbound bearer tokens and connectivity verification",

          icon: UserPlus,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/settings/billing",

          label: "Billing & plans",

          title: "Billing & plans — Team, Professional, and Enterprise packaging",

          icon: CreditCard,

          tier: "extended",

          requiredAuthority: "ReadAuthority",

        },

        {

          href: "/administration/settings/ai-usage",

          label: OPERATOR_NAV_LINK_LABELS.aiUsage,

          title: "AI usage — estimated workspace AI spend, monthly cap utilization, and daily trends",

          icon: Cpu,

          tier: "extended",

          // Tenant LLM cost report — nav gated to AdminAuthority so architects/exec personas do not see vendor cost chrome (TB-648).
          requiredAuthority: "AdminAuthority",

        },

        {

          href: "/administration/settings/security-trust",

          label: OPERATOR_NAV_LINK_LABELS.securityTrust,

          title:

            "Security & trust — share procurement-ready materials, trust-center links, and assessment status",

          icon: ShieldCheck,

          tier: "extended",

          requiredAuthority: "ReadAuthority",

        },

        {

          href: "/administration/settings/tenant/recycle-bin",

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

          href: "/administration/settings/support",

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

