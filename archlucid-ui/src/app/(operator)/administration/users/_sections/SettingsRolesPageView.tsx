"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeading } from "@/components/PageHeading";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { ApiKeysVsUsersReconciler } from "@/components/ApiKeysVsUsersReconciler";
import { CustomRolesUsersVocabularyRail } from "@/components/CustomRolesUsersVocabularyRail";
import { ScimVsUsersReconciler } from "@/components/ScimVsUsersReconciler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isApiKeysSettingsSurfaceEnabled } from "@/lib/api-keys-settings-access";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE } from "@/lib/buyer-polish-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  settingsUsersNavigationPathname,
  settingsUsersTabFromLocation,
  SETTINGS_USERS_USERS_TAB_PATH,
  type SettingsUsersTabId,
} from "@/lib/settings-admin-route-paths";

import type { AdminUserInvitationRow } from "@/lib/admin-user-invitations";

import { SettingsRolesInvitePanel } from "./SettingsRolesInvitePanel";
import { PendingInvitationsPanel } from "./PendingInvitationsPanel";
import { SettingsRolesPrincipalTable } from "./SettingsRolesPrincipalTable";
import { settingsRolesEmptyStateDescription, settingsRolesEmptyStateTitle } from "./settings-roles-page-empty-copy";
import {
  SETTINGS_ROLES_KEYS_TAB_CARD_TITLE,
  SETTINGS_ROLES_KEYS_TAB_LABEL,
  SETTINGS_ROLES_KEYS_TAB_LEAD,
  SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF,
  SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_LINK_LABEL,
  SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL,
} from "./settings-roles-page-keys-tab-copy";
import { SettingsRolesMatrixSection } from "./SettingsRolesMatrixSection";
import { assignmentCountsByRoleName } from "./roles-matrix-assignment-counts";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

const ALL_TABS: readonly { id: SettingsUsersTabId; label: string }[] = [
  { id: "users", label: "Users and invitations" },
  { id: "roles", label: "Roles and permissions" },
  { id: "keys", label: SETTINGS_ROLES_KEYS_TAB_LABEL },
] as const;

const MEMBERS_HEADING_ID = "settings-roles-members-heading";
const PENDING_INVITATIONS_HEADING_ID = "settings-roles-pending-invitations-heading";
const INVITE_SECTION_SUMMARY_ID = "settings-roles-invite-section-summary";

function visibleTabs(canManageApiKeys: boolean): readonly { id: SettingsUsersTabId; label: string }[] {
  if (canManageApiKeys) {
    return ALL_TABS;
  }

  return ALL_TABS.filter((tab) => tab.id !== "keys");
}

function directoryNoteReliableForAssignmentCounts(note: SettingsRolesPageViewModel["usersNote"]): boolean {
  return note === null || note === "empty_response";
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
  const inviteEmailInputRef = useRef<HTMLInputElement | null>(null);
  const canManageApiKeys =
    isApiKeysSettingsSurfaceEnabled() && callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const tabs = visibleTabs(canManageApiKeys);
  const hubPathname = settingsUsersNavigationPathname(pathname);
  const urlTab = settingsUsersTabFromLocation(pathname, searchParams.get("tab"), canManageApiKeys);
  const [activeTab, setActiveTab] = useState<SettingsUsersTabId>(urlTab);
  const [invitationsRefreshKey, setInvitationsRefreshKey] = useState(0);
  const [seededInvitations, setSeededInvitations] = useState<AdminUserInvitationRow[]>([]);
  const [pendingInvitationCount, setPendingInvitationCount] = useState<number | null>(null);
  const [inviteSectionOpen, setInviteSectionOpen] = useState(false);
  const roleAssignmentCounts = useMemo(() => assignmentCountsByRoleName(m.sortedRows), [m.sortedRows]);
  const assignmentCountsReliable =
    !m.loading
    && directoryNoteReliableForAssignmentCounts(m.usersNote)
    && (canManageApiKeys ? directoryNoteReliableForAssignmentCounts(m.keysNote) : true);
  const userRows = useMemo(() => m.sortedRows.filter((r) => r.kind === "user"), [m.sortedRows]);
  const apiKeyRows = useMemo(() => m.sortedRows.filter((r) => r.kind === "api_key"), [m.sortedRows]);
  // Empty workspace: invite is the only job — do not stack members/pending empty theater (TB-1214).
  const usersDirectoryEmpty =
    m.surface === "admin" && !m.loading && m.usersNote === null && userRows.length === 0;
  const usersTabEmptyWorkspace = usersDirectoryEmpty && pendingInvitationCount === 0;
  const usersTabInviteFirstLayout =
    usersDirectoryEmpty && (pendingInvitationCount === null || pendingInvitationCount === 0);

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

  useEffect(() => {
    if (!inviteSectionOpen) {
      return;
    }

    window.setTimeout(() => {
      inviteEmailInputRef.current?.focus();
    }, 0);
  }, [inviteSectionOpen]);

  useEffect(() => {
    if (usersTabInviteFirstLayout && activeTab === "users") {
      setInviteSectionOpen(true);
    }
  }, [usersTabInviteFirstLayout, activeTab]);

  const onSelectTab = useCallback(
    (id: string) => {
      const tabId = settingsUsersTabFromLocation(hubPathname, id, canManageApiKeys);
      setActiveTab(tabId);

      if (tabId === "users") {
        router.replace(SETTINGS_USERS_USERS_TAB_PATH);

        return;
      }

      router.replace(`${hubPathname}?tab=${encodeURIComponent(tabId)}`);
    },
    [canManageApiKeys, hubPathname, router],
  );

  const openInviteSection = useCallback(() => {
    setInviteSectionOpen(true);
  }, []);

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
        <p
          className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)}
          role="alert"
          data-testid="settings-roles-forbidden"
        >
          {FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE}
        </p>
      </div>
    );
  }

  const usersSectionTitle =
    m.loading || m.usersNote !== null ? "Members" : `Members (${userRows.length})`;
  const pendingSectionTitle =
    pendingInvitationCount === null ? "Pending invitations" : `Pending invitations (${pendingInvitationCount})`;

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="settings-roles-page">
      <PageHeading
        navHref="/administration/users"
        title={OPERATOR_NAV_LINK_LABELS.usersAndRoles}
        description="Invite users, assign roles, and manage workspace access."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="settings-roles-invite-primary-action"
              onClick={openInviteSection}
            >
              Invite user
            </Button>
            <PageContextualHelpButton />
          </div>
        }
      />
      <ApiKeysVsUsersReconciler currentSurfaceId="users" />
      <ScimVsUsersReconciler currentSurfaceId="users" />
      {activeTab === "roles" || activeTab === "users" ? (
        <CustomRolesUsersVocabularyRail
          currentSurfaceId={activeTab === "roles" ? "custom-roles" : "users"}
        />
      ) : null}
      <Tabs value={activeTab} onValueChange={onSelectTab} className="space-y-6">
        <TabsList aria-label={`${OPERATOR_NAV_LINK_LABELS.usersAndRoles} sections`} data-testid="settings-roles-tablist">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} data-testid={`settings-roles-tab-${tab.id}`}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="users" data-testid="settings-roles-tabpanel-users">
          <div className="space-y-6">
            {usersTabInviteFirstLayout ? (
              <div className="space-y-3" data-testid="settings-roles-users-empty-composition">
                {usersTabEmptyWorkspace ? (
                  <StatusTag
                    kind="draft"
                    label="No users yet — send an invite below."
                    data-testid="settings-roles-users-empty-status"
                  />
                ) : null}
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Members and pending invitations appear here after someone accepts an invite.
                </p>
                <PendingInvitationsPanel
                  refreshKey={invitationsRefreshKey}
                  seededInvitations={seededInvitations}
                  onCountChange={setPendingInvitationCount}
                  suppressEmptyPresentation
                />
              </div>
            ) : (
              <>
                <Card aria-labelledby={MEMBERS_HEADING_ID}>
                  <CardHeader>
                    <CardTitle id={MEMBERS_HEADING_ID} as="h2" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                      {usersSectionTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {m.loading ? (
                      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
                    ) : null}
                    {!m.loading && m.usersNote !== null ? (
                      <div data-testid="settings-roles-api-note">
                        <OperatorEmptyState
                          title={settingsRolesEmptyStateTitle(m.usersNote, "users")}
                          description={settingsRolesEmptyStateDescription(m.usersNote, "users")}
                        />
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => void m.load()}>
                            Refresh
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    {!m.loading && userRows.length > 0 ? (
                      <SettingsRolesPrincipalTable rows={userRows} onRoleChange={m.onRoleChange} />
                    ) : null}
                    {!m.loading && m.usersNote === null && userRows.length === 0 ? (
                      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                        No members yet. People appear here after they accept an invitation.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>

                <Card aria-labelledby={PENDING_INVITATIONS_HEADING_ID}>
                  <CardHeader>
                    <CardTitle id={PENDING_INVITATIONS_HEADING_ID} as="h2" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                      {pendingSectionTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PendingInvitationsPanel
                      refreshKey={invitationsRefreshKey}
                      seededInvitations={seededInvitations}
                      onCountChange={setPendingInvitationCount}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            <CollapsibleSection
              title="Invite user"
              headingLevel={2}
              summaryLine="Send a workspace invitation by email."
              summaryId={INVITE_SECTION_SUMMARY_ID}
              defaultOpen={false}
              open={inviteSectionOpen}
              onToggle={setInviteSectionOpen}
              sectionTestId="settings-roles-invite-section"
            >
              <SettingsRolesInvitePanel
                emailInputRef={inviteEmailInputRef}
                onInviteSent={(invitation) => {
                  setSeededInvitations((current) => {
                    const without = current.filter((row) => row.id !== invitation.id);

                    return [invitation, ...without];
                  });
                  setInvitationsRefreshKey((key) => key + 1);
                }}
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
              <SettingsRolesMatrixSection
                assignmentCountsByRole={roleAssignmentCounts}
                assignmentCountsReliable={assignmentCountsReliable}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {canManageApiKeys ? (
          <TabsContent value="keys" data-testid="settings-roles-tabpanel-keys">
            <Card>
              <CardHeader>
                <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SETTINGS_ROLES_KEYS_TAB_CARD_TITLE}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {SETTINGS_ROLES_KEYS_TAB_LEAD}{" "}
                  <Link href={SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF} className={OPERATOR_LINK.nav}>
                    {SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_LINK_LABEL}
                  </Link>
                  .
                </p>
                {m.loading ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p> : null}
                {!m.loading && m.keysNote !== null ? (
                  <div data-testid="settings-roles-api-keys-note" className="space-y-4">
                    <OperatorEmptyState
                      title={settingsRolesEmptyStateTitle(m.keysNote, "api_keys")}
                      description={settingsRolesEmptyStateDescription(m.keysNote, "api_keys")}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" data-testid="settings-roles-keys-open-api-keys">
                        <Link href={SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF}>{SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL}</Link>
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => void m.load()}>
                        Refresh
                      </Button>
                    </div>
                  </div>
                ) : null}
                {!m.loading && apiKeyRows.length > 0 ? (
                  <SettingsRolesPrincipalTable rows={apiKeyRows} onRoleChange={m.onRoleChange} />
                ) : null}
                {!m.loading && m.keysNote === null && apiKeyRows.length === 0 ? (
                  <div className="space-y-4" data-testid="settings-roles-keys-empty">
                    <OperatorEmptyState
                      title={settingsRolesEmptyStateTitle("empty_response", "api_keys")}
                      description={settingsRolesEmptyStateDescription("empty_response", "api_keys")}
                    />
                    <Button asChild size="sm" data-testid="settings-roles-keys-open-api-keys">
                      <Link href={SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF}>{SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL}</Link>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
