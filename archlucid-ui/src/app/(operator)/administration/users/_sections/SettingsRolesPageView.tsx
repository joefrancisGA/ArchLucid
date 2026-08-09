"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeading } from "@/components/PageHeading";
import { CollapsibleSection } from "@/components/CollapsibleSection";
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
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { ArchLucidAppRole } from "@/lib/current-principal";
import { isApiKeysSettingsSurfaceEnabled } from "@/lib/api-keys-settings-access";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE } from "@/lib/buyer-polish-copy";
import {
  settingsUsersNavigationPathname,
  settingsUsersTabFromLocation,
  type SettingsUsersTabId,
} from "@/lib/settings-admin-route-paths";

import { SettingsRolesInvitePanel } from "./SettingsRolesInvitePanel";
import { PendingInvitationsPanel } from "./PendingInvitationsPanel";
import { SETTINGS_ROLES_ASSIGNABLE } from "./settings-roles-page-constants";
import { settingsRolesEmptyStateDescription, settingsRolesEmptyStateTitle } from "./settings-roles-page-empty-copy";
import { SettingsRolesMatrixSection } from "./SettingsRolesMatrixSection";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

const ALL_TABS: readonly { id: SettingsUsersTabId; label: string }[] = [
  { id: "users", label: "Users and invitations" },
  { id: "roles", label: "Roles and permissions" },
  { id: "keys", label: "API keys" },
] as const;

function visibleTabs(canManageApiKeys: boolean): readonly { id: SettingsUsersTabId; label: string }[] {
  if (canManageApiKeys)
    return ALL_TABS;

  return ALL_TABS.filter((tab) => tab.id !== "keys");
}

type Props = {
  readonly model: SettingsRolesPageViewModel;
};

export function SettingsRolesPageView(props: Props) {
  const m = props.model;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  // Keys tab stays hidden while API key UI is parked (product maturity).
  const canManageApiKeys =
    isApiKeysSettingsSurfaceEnabled() && callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const tabs = visibleTabs(canManageApiKeys);
  const hubPathname = settingsUsersNavigationPathname(pathname);
  const urlTab = settingsUsersTabFromLocation(pathname, searchParams.get("tab"), canManageApiKeys);
  const [activeTab, setActiveTab] = useState<SettingsUsersTabId>(urlTab);
  const [invitationsRefreshKey, setInvitationsRefreshKey] = useState(0);
  const [pendingInvitationCount, setPendingInvitationCount] = useState<number | null>(null);

  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  useEffect(() => {
    const onPop = () => {
      const sp = new URLSearchParams(window.location.search);
      setActiveTab(settingsUsersTabFromLocation(window.location.pathname, sp.get("tab"), canManageApiKeys));
    };

    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, [canManageApiKeys]);

  const onSelectTab = useCallback(
    (id: string) => {
      const tabId = settingsUsersTabFromLocation(hubPathname, id, canManageApiKeys);
      setActiveTab(tabId);

      if (tabId === "users") {
        router.replace(hubPathname);

        return;
      }

      router.replace(`${hubPathname}?tab=${encodeURIComponent(tabId)}`);
    },
    [canManageApiKeys, hubPathname, router],
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
  const usersSectionTitle =
    m.loading || m.note !== null ? "Members" : `Members (${userRows.length})`;
  const pendingSectionTitle =
    pendingInvitationCount === null ? "Pending invitations" : `Pending invitations (${pendingInvitationCount})`;

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="settings-roles-page">
      <PageHeading
        navHref="/administration/users"
        title="Users and roles"
        description="Invite users, assign roles, and manage workspace access."
        actions={<PageContextualHelpButton />}
      />
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
            {!directoryUnavailable ? (
              <Card>
                <CardHeader>
                  <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{usersSectionTitle}</CardTitle>
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
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                      No members yet. People appear here after they accept an invitation.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{pendingSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingInvitationsPanel
                  refreshKey={invitationsRefreshKey}
                  onCountChange={setPendingInvitationCount}
                />
              </CardContent>
            </Card>

            <CollapsibleSection
              title="Invite user"
              summaryLine="Send a workspace invitation by email."
              defaultOpen={false}
              sectionTestId="settings-roles-invite-section"
            >
              <SettingsRolesInvitePanel
                directoryUnavailable={directoryUnavailable}
                onRetry={() => void m.load()}
                onInviteSent={() => setInvitationsRefreshKey((key) => key + 1)}
              />
            </CollapsibleSection>
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
                  <a href="/administration/api-keys" className="text-teal-700 underline underline-offset-2 dark:text-teal-300">
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
    <EnterpriseTable ariaLabel="Workspace members">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Email / hint</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Role</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {rows.map((r) => (
          <EnterpriseTableRow key={`${r.kind}:${r.id}`}>
            <EnterpriseTableCell>
              <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{r.name}</span>
            </EnterpriseTableCell>
            <EnterpriseTableCell>{r.detail}</EnterpriseTableCell>
            <EnterpriseTableCell>
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
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
