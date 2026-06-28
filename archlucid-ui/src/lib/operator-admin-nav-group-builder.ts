import {
  ArchiveRestore,
  Building2,
  CalendarClock,
  CreditCard,
  LifeBuoy,
  UserCog,
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
          href: "/admin/users",
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
          href: "/settings/tenant/recycle-bin",
          label: "Projects recycle bin",
          title: "Projects recycle bin — restore soft-deleted architecture projects",
          icon: ArchiveRestore,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/admin/support",
          label: "Support",
          title: "Download diagnostics and get help",
          icon: LifeBuoy,
          tier: "extended",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/governance/recurrence-schedules",
          label: OPERATOR_NAV_LINK_LABELS.recurrenceSchedules,
          title: "Recurrence schedules — automated follow-up architecture reviews after commit",
          icon: CalendarClock,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
