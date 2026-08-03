"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeading } from "@/components/PageHeading";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { ArchLucidAppRole } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE } from "@/lib/buyer-polish-copy";

import { SettingsRolesInvitePanel } from "./SettingsRolesInvitePanel";
import { PendingInvitationsPanel } from "./PendingInvitationsPanel";
import { SETTINGS_ROLES_ASSIGNABLE } from "./settings-roles-page-constants";
import { settingsRolesEmptyStateDescription, settingsRolesEmptyStateTitle } from "./settings-roles-page-empty-copy";
import { SettingsRolesMatrixSection } from "./SettingsRolesMatrixSection";
import { SettingsUsersEvidenceOrientationStrip } from "./SettingsUsersEvidenceOrientationStrip";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

type TabId = "users" | "roles" | "keys";

const ALL_TABS: readonly { id: TabId; label: string }[] = [
  { id: "users", label: "Users and invitations" },
  { id: "roles", label: "Roles and permissions" },
  { id: "keys", label: "API keys" },
] as const;

function visibleTabs(canManageApiKeys: boolean): readonly { id: TabId; label: string }[] {
  if (canManageApiKeys)
    return ALL_TABS;

  return ALL_TABS.filter((tab) => tab.id !== "keys");
}

type Props = {
  readonly model: SettingsRolesPageViewModel;
};

function sanitizeSettingsRolesTab(raw: string | null, canManageApiKeys: boolean): TabId {
  if (raw === "roles") {
    return "roles";
  }

  if (raw === "keys" && canManageApiKeys) {
    return "keys";
  }

  return "users";
}

export function SettingsRolesPageView(props: Props) {
  const m = props.model;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canManageApiKeys = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const tabs = visibleTabs(canManageApiKeys);
  const urlTab = sanitizeSettingsRolesTab(searchParams.get("tab"), canManageApiKeys);
  const [activeTab, setActiveTab] = useState<TabId>(urlTab);
  const [invitationsRefreshKey, setInvitationsRefreshKey] = useState(0);

  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  useEffect(() => {
    const onPop = () => {
      const sp = new URLSearchParams(window.location.search);
      setActiveTab(sanitizeSettingsRolesTab(sp.get("tab"), canManageApiKeys));
    };

    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, [canManageApiKeys]);

  const onSelectTab = useCallback(
    (id: string) => {
      const tabId = sanitizeSettingsRolesTab(id, canManageApiKeys);
      setActiveTab(tabId);

      if (tabId === "users") {
        router.replace(pathname);

        return;
      }

      router.replace(`${pathname}?tab=${encodeURIComponent(tabId)}`);
    },
    [canManageApiKeys, pathname, router],
  );

  if (m.surface === "demo") {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Role management"
        description="In a connected tenant, tenant administrators assign roles and effective authority through the identity provider."
      />
    );
  }

  if (m.surface === "authority_loading") {
    return (
      <div className="w-full max-w-[1200px] space-y-6" data-testid="settings-roles-page">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      </div>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <div className="w-full max-w-[1200px] space-y-6" data-testid="settings-roles-page">
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="settings-roles-forbidden">
          {FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE}
        </p>
      </div>
    );
  }

  const directoryUnavailable = !m.loading && m.note === "api_unavailable";
  const userRows = m.sortedRows.filter((r) => r.kind === "user");
  const apiKeyRows = m.sortedRows.filter((r) => r.kind === "api_key");

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="settings-roles-page">
      <PageHeading
        navHref="/administration/settings/users"
        title="Users and roles"
        description="Invite users, assign roles, and manage workspace access."
        actions={<PageContextualHelpButton />}
      />

      <SettingsUsersEvidenceOrientationStrip />

      <Tabs value={activeTab} onValueChange={onSelectTab} className="space-y-6">
        <TabsList aria-label="Users and roles sections" data-testid="settings-roles-tablist">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} data-testid={`settings-roles-tab-${tab.id}`}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="users" data-testid="settings-roles-tabpanel-users">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Invite user</CardTitle>
              </CardHeader>
              <CardContent>
                <SettingsRolesInvitePanel
                  directoryUnavailable={directoryUnavailable}
                  onRetry={() => void m.load()}
                  onInviteSent={() => setInvitationsRefreshKey((key) => key + 1)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Pending invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingInvitationsPanel refreshKey={invitationsRefreshKey} />
              </CardContent>
            </Card>

            {!directoryUnavailable ? (
              <Card>
                <CardHeader>
                  <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {m.loading ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p> : null}
                  {!m.loading && m.note !== null && m.note !== "api_unavailable" ? (
                    <div data-testid="settings-roles-api-note">
                      <OperatorEmptyState
                        title={settingsRolesEmptyStateTitle(m.note)}
                        description={settingsRolesEmptyStateDescription(m.note)}
                      />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => void m.load()}>
                          Refresh
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {!m.loading && userRows.length > 0 ? (
                    <PrincipalTable rows={userRows} onRoleChange={m.onRoleChange} />
                  ) : null}
                  {!m.loading && m.note === null && userRows.length === 0 ? (
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No users found in this workspace.</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="roles" data-testid="settings-roles-tabpanel-roles">
          <Card>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Roles and permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsRolesMatrixSection />
            </CardContent>
          </Card>
        </TabsContent>

        {canManageApiKeys ? (
          <TabsContent value="keys" data-testid="settings-roles-tabpanel-keys">
            <Card>
              <CardHeader>
                <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>API keys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  Assign built-in roles to approved automation principals. Credential rotation and lifecycle management
                  live under{" "}
                  <a href="/administration/settings/api-keys" className="text-teal-700 underline underline-offset-2 dark:text-teal-300">
                    API keys
                  </a>
                  .
                </p>
                {m.loading ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p> : null}
                {!m.loading && m.note !== null ? (
                  <div data-testid="settings-roles-api-keys-note">
                    <OperatorEmptyState
                      title={settingsRolesEmptyStateTitle(m.note)}
                      description={settingsRolesEmptyStateDescription(m.note)}
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => void m.load()}>
                        Refresh
                      </Button>
                    </div>
                  </div>
                ) : null}
                {!m.loading && apiKeyRows.length > 0 ? (
                  <PrincipalTable rows={apiKeyRows} onRoleChange={m.onRoleChange} />
                ) : null}
                {!m.loading && m.note === null && apiKeyRows.length === 0 ? (
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No API keys found in this workspace.</p>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

type PrincipalTableProps = {
  readonly rows: SettingsRolesPageViewModel["sortedRows"];
  readonly onRoleChange: SettingsRolesPageViewModel["onRoleChange"];
};

function PrincipalTable({ rows, onRoleChange }: PrincipalTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
        <thead>
          <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Email / hint</th>
            <th className="py-2 pr-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.kind}:${r.id}`} className="border-b border-neutral-100 dark:border-neutral-800">
              <td className={cn("py-2 pr-3 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{r.name}</td>
              <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{r.detail}</td>
              <td className="py-2 pr-3">
                <Select
                  value={r.role}
                  onValueChange={(v) => {
                    void onRoleChange(r, v as ArchLucidAppRole);
                  }}
                >
                  <SelectTrigger
                    className="h-9 w-[11rem]"
                    aria-label={`Role for ${r.name}`}
                    data-testid={`settings-roles-select-${r.kind}-${r.id}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SETTINGS_ROLES_ASSIGNABLE.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
