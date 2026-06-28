import {
  ArchiveRestore,
  Building2,
  Cpu,
  CreditCard,
  LifeBuoy,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  SETTINGS_SECURITY_TRUST_PATH,
  SETTINGS_SUPPORT_PATH,
  SETTINGS_USERS_PATH,
} from "@/lib/settings-admin-route-paths";

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
          href: SETTINGS_USERS_PATH,
          label: "Users & roles",
          title: "Users & roles — directory and authority rank",
          icon: Users,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: "/settings/roles",
          label: "Role management",
          title: "Role management — assign Admin, Operator, Reader, and Auditor",
          icon: UserCog,
          tier: "extended",
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
          href: "/settings/cost-reporting",
          label: OPERATOR_NAV_LINK_LABELS.aiUsage,
          title: "AI usage — estimated workspace AI spend, monthly cap utilization, and daily trends",
          icon: Cpu,
          tier: "extended",
          requiredAuthority: "AdminAuthority",
        },
        {
          href: SETTINGS_SECURITY_TRUST_PATH,
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
          href: SETTINGS_SUPPORT_PATH,
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
