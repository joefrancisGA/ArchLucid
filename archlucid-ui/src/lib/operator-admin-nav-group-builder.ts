import {

  ArchiveRestore,

  Building2,

  Cpu,

  CreditCard,

  Fingerprint,

  KeyRound,

  LifeBuoy,

  ShieldCheck,

  UserCog,

  UserPlus,

  Users,

} from "lucide-react";



import type { NavGroupConfig } from "@/lib/nav-config.types";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";



/** Tenant admin surfaces — settings, billing, support bundle, directory. */

export class OperatorAdminNavGroupBuilder extends NavGroupBuilderBase {

  build(): NavGroupConfig {

    return {

      id: "operator-admin",

      label: "Administration",

      surface: "platform-admin",

      caption: "Settings, billing, users, and support.",

      links: [

        {

          href: "/settings/tenant",

          label: OPERATOR_NAV_LINK_LABELS.settings,

          title: `${OPERATOR_NAV_LINK_LABELS.workspaceSettings} — trial, digest email, and request scope`,

          icon: Building2,

          tier: "extended",

          requiredAuthority: "ExecuteAuthority",

        },

        {

          href: "/settings/users",

          label: "Users & roles",

          title: "Users & roles — directory, role assignments, and API keys",

          icon: Users,

          tier: "extended",

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

          icon: UserCog,

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

          href: "/settings/scim-provisioning",

          label: "SCIM provisioning",

          title: "SCIM provisioning — inbound bearer tokens and connectivity verification",

          icon: UserPlus,

          tier: "advanced",

          requiredAuthority: "AdminAuthority",

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

          href: "/settings/ai-usage",

          label: OPERATOR_NAV_LINK_LABELS.aiUsage,

          title: "AI usage — estimated workspace AI spend, monthly cap utilization, and daily trends",

          icon: Cpu,

          tier: "extended",

          // Read-only report — TenantLlmCostReportingController is ReadAuthority and this page has no mutations,
          // so the nav gate matches the backend instead of the stricter AdminAuthority it previously required.
          requiredAuthority: "ReadAuthority",

        },

        {

          href: "/settings/security-trust",

          label: OPERATOR_NAV_LINK_LABELS.securityTrust,

          title:

            "Security & trust — share procurement-ready materials, trust-center links, and assessment status",

          icon: ShieldCheck,

          tier: "extended",

          requiredAuthority: "ReadAuthority",

        },

        {

          href: "/settings/tenant/recycle-bin",

          label: "Projects recycle bin",

          title: "Projects recycle bin — restore soft-deleted architecture projects",

          icon: ArchiveRestore,

          tier: "extended",

          requiredAuthority: "ReadAuthority",

        },

        {

          href: "/settings/support",

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

