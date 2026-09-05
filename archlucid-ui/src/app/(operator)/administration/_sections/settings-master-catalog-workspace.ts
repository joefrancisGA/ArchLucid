import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";

import type { SettingsMasterSection } from "./settings-master-types";

/** Workspace defaults, notifications, directory, billing, and support hub sections. */
export const SETTINGS_MASTER_SECTIONS_WORKSPACE: readonly SettingsMasterSection[] = [
  {
    id: "workspace",
    // Personal settings (appearance, sign-in methods) belong to SELF_SETTINGS_DESTINATIONS and are published
    // from the top-bar account menu. Adding a `scope: "user"` destination here would hide it behind this hub's
    // authority filter — `settings-master-audience.ts` drops personal audiences so that mistake cannot ship.
    navLabel: "Workspace",
    title: "Workspace",
    description: "Defaults and operational preferences for this workspace.",
    keywords: ["workspace", "tenant", "digest", "timezone", "trial"],
    tier: "common",
    destinations: [
      {
        id: "workspace-settings",
        title: OPERATOR_NAV_LINK_LABELS.workspaceSettings,
        description: "Trial posture, cost settings, request scope, and workspace defaults.",
        href: "/administration/workspace-settings",
        cta: "Open workspace settings",
        keywords: ["workspace", "tenant", "defaults", "cost"],
        requiredAuthority: "AdminAuthority",
        tier: "common",
        scope: "workspace",
        source: "overridden",
        editability: "admin-only",
        saveBehavior: "Save on destination page",
      },
      {
        id: "workspace-branding",
        title: "Branding",
        description: "Upload logos, set colors, preview operator surfaces, and activate tenant branding.",
        href: "/administration/branding",
        cta: "Open branding settings",
        keywords: ["branding", "logo", "white-label", "colors", "tenant"],
        requiredAuthority: "AdminAuthority",
        tier: "common",
        scope: "workspace",
        source: "overridden",
        editability: "admin-only",
        saveBehavior: "Save draft and activate on destination page",
        highImpact: true,
      },
    ],
  },
  {
    id: "notifications",
    navLabel: "Notifications",
    title: "Notifications",
    description: "Digests, policy alerts, Teams, and Slack - what can ping this workspace.",
    keywords: ["notification", "digest", "alert", "teams", "slack", "email", "ping"],
    tier: "common",
    destinations: [
      {
        id: "notification-preference-center",
        title: OPERATOR_NAV_LINK_LABELS.notifications,
        description:
          "Open the notification preference hub for digests, alerts inbox and rules, Teams, and Slack. Each channel is configured on its own page.",
        href: SETTINGS_NOTIFICATIONS_PATH,
        cta: "Open notifications",
        keywords: ["notification", "digest", "alert", "teams", "slack"],
        requiredAuthority: "ReadAuthority",
        tier: "common",
        scope: "workspace",
        source: "default",
        editability: "read-only",
      },
    ],
  },
  {
    id: "users-roles",
    navLabel: OPERATOR_NAV_LINK_LABELS.usersAndRoles,
    title: OPERATOR_NAV_LINK_LABELS.usersAndRoles,
    description: "Directory, role assignments, and access control.",
    keywords: ["users", "roles", "directory", "admin", "access"],
    tier: "common",
    destinations: [
      {
        id: "users-directory",
        title: OPERATOR_NAV_LINK_LABELS.usersAndRoles,
        description: "Manage workspace members, role assignments, and invitations.",
        href: "/administration/users",
        cta: "Manage users",
        keywords: ["users", "roles", "directory", "invite"],
        requiredAuthority: "AdminAuthority",
        tier: "common",
        scope: "tenant",
        source: "overridden",
        editability: "admin-only",
        saveBehavior: "Save on destination page",
        highImpact: true,
      },
    ],
  },
  {
    id: "billing",
    navLabel: "Billing",
    title: "Billing",
    description: "Plans, wallet balance, and payment settings.",
    keywords: ["billing", "plan", "wallet", "payment", "invoice"],
    tier: "common",
    destinations: [
      {
        id: "billing-wallet",
        title: "Billing & plans",
        description: "View plan tier, wallet balance, and credit settings.",
        href: "/administration/billing",
        cta: "Open billing",
        keywords: ["billing", "wallet", "plan"],
        requiredAuthority: "ReadAuthority",
        tier: "common",
        scope: "tenant",
        source: "inherited",
        editability: "read-only",
        saveBehavior: "Credit changes require admin confirmation on destination page",
        highImpact: true,
      },
    ],
  },
  {
    id: "support",
    navLabel: "Support",
    title: "Support",
    description: "Diagnostics bundles and support workflows.",
    keywords: ["support", "bundle", "diagnostics", "ticket"],
    tier: "common",
    destinations: [],
  },
] as const;
