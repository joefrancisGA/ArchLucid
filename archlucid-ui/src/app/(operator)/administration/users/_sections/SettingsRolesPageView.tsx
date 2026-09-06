"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageHeading } from "@/components/PageHeading";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { ApiKeysUsersVocabularyRail } from "@/components/ApiKeysUsersVocabularyRail";
import { CustomRolesUsersVocabularyRail } from "@/components/CustomRolesUsersVocabularyRail";
import { ScimUsersVocabularyRail } from "@/components/ScimUsersVocabularyRail";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { SettingsRolesSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isApiKeysSettingsSurfaceEnabled } from "@/lib/api-keys-settings-access";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { usersDirectorySourceStatusTag } from "@/lib/vocabulary/scim-users-vocabulary";
import {
  settingsUsersNavigationPathname,
  settingsUsersTabFromLocation,
  SETTINGS_USERS_USERS_TAB_PATH,
  type SettingsUsersTabId,
} from "@/lib/settings-admin-route-paths";
import {
  parseSettingsRolesMemberRoleFromSearch,
  parseSettingsRolesMemberStatusFromSearch,
} from "@/lib/administration/settings-roles-member-filters-url";
import {
  parseSettingsUsersInviteOpenFromSearch,
  settingsUsersInviteHrefFromSearch,
} from "@/lib/administration/settings-users-invite-url";

import type { AdminUserInvitationRow } from "@/lib/admin-user-invitations";

import {
  SETTINGS_ROLES_API_KEYS_EMPTY_COMPACT,
  settingsRolesEmptyStateDescription,
  settingsRolesEmptyStateTitle,
} from "./settings-roles-page-empty-copy";
import {
  SETTINGS_ROLES_KEYS_TAB_CARD_TITLE,
  SETTINGS_ROLES_KEYS_TAB_LEAD,
  SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF,
  SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_LINK_LABEL,
  SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL,
} from "./settings-roles-page-keys-tab-copy";
import { SettingsRolesMatrixSection } from "./SettingsRolesMatrixSection";
import { SettingsRolesPrincipalTable } from "./SettingsRolesPrincipalTable";
import { assignmentCountsByRoleName } from "./roles-matrix-assignment-counts";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";
import {
  resolveContinueLastSettingsPrincipal,
  writeSettingsPrincipalLastViewedId,
} from "@/lib/resolve-continue-last-settings-principal";
import {
  directoryNoteReliableForAssignmentCounts,
  isKeysDirectoryCollectionEmpty,
  isKeysNoteLoadFailure,
  isUsersNoteLoadFailure,
  visibleTabs,
} from "./settings-roles-page-helpers";
import { SettingsRolesUsersTab } from "./SettingsRolesUsersTab";
import {
  SETTINGS_ROLES_PAGE_SUBTITLE_OPERATOR,
  SETTINGS_ROLES_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  SETTINGS_ROLES_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SETTINGS_ROLES_SETTINGS_PRIMARY_CONTENT_ID,
  SETTINGS_ROLES_SETTINGS_SKIP_LINK_LABEL,
  SETTINGS_ROLES_SETTINGS_SKIP_TARGET_ID,
  SETTINGS_ROLES_START_HERE_CARD_TITLE,
  SETTINGS_ROLES_START_HERE_LEAD,
  SETTINGS_ROLES_ROLES_TAB_LEAD,
  SETTINGS_ROLES_ROLES_TAB_START_HERE_HELPER,
  SETTINGS_ROLES_USERS_TAB_LEAD,
  SETTINGS_ROLES_USERS_TAB_START_HERE_HELPER,
  settingsRolesPageSubtitle,
} from "./settings-roles-settings-page-copy";
import { SETTINGS_ROLES_SETTINGS_CLAIM_DISCIPLINE } from "@/lib/settings-roles-settings-evidence-copy";

type Props = {
  readonly model: SettingsRolesPageViewModel;
};

export function SettingsRolesPageView(props: Props) {
  const m = props.model;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
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
  const activeMemberRole = parseSettingsRolesMemberRoleFromSearch(searchParams.get("role"));
  const activeMemberStatus = parseSettingsRolesMemberStatusFromSearch(searchParams.get("status"));
  const urlInviteOpen = parseSettingsUsersInviteOpenFromSearch(searchParams.get("invite"));
  const currentSearch = searchParams.toString();
  const [activeTab, setActiveTab] = useState<SettingsUsersTabId>(urlTab);
  const [invitationsRefreshKey, setInvitationsRefreshKey] = useState(0);
  const [seededInvitations, setSeededInvitations] = useState<AdminUserInvitationRow[]>([]);
  const [pendingInvitationCount, setPendingInvitationCount] = useState<number | null>(null);
  const [pendingInvitationsResolved, setPendingInvitationsResolved] = useState(false);
  const [inviteSectionOpen, setInviteSectionOpenState] = useState(urlInviteOpen);
  const rolesTabBuyerPolished = buyerPolishedShell && activeTab === "roles";
  const usersTabBuyerPolished = buyerPolishedShell && activeTab === "users";
  const buyerPolishedMutationTab = rolesTabBuyerPolished || usersTabBuyerPolished;

  const syncInviteSectionToUrl = useCallback(
    (open: boolean) => {
      router.replace(settingsUsersInviteHrefFromSearch(currentSearch, open, hubPathname), { scroll: false });
    },
    [currentSearch, hubPathname, router],
  );

  const setInviteSectionOpen = useCallback(
    (open: boolean) => {
      setInviteSectionOpenState(open);
      syncInviteSectionToUrl(open);
    },
    [syncInviteSectionToUrl],
  );
  const roleAssignmentCounts = useMemo(() => assignmentCountsByRoleName(m.sortedRows), [m.sortedRows]);
  const assignmentCountsReliable =
    !m.loading
    && directoryNoteReliableForAssignmentCounts(m.usersNote)
    && (canManageApiKeys ? directoryNoteReliableForAssignmentCounts(m.keysNote) : true);
  const userRows = useMemo(() => m.sortedRows.filter((r) => r.kind === "user"), [m.sortedRows]);
  const filteredUserRows = useMemo(() => {
    return userRows.filter((row) => {
      if (activeMemberRole !== null && row.role !== activeMemberRole) {
        return false;
      }

      if (activeMemberStatus !== null && row.kind !== activeMemberStatus) {
        return false;
      }

      return true;
    });
  }, [activeMemberRole, activeMemberStatus, userRows]);
  const apiKeyRows = useMemo(() => m.sortedRows.filter((r) => r.kind === "api_key"), [m.sortedRows]);
  const continueLastPrincipal = useMemo(
    () => resolveContinueLastSettingsPrincipal(userRows),
    [userRows],
  );
  // Empty workspace: invite is the only job — do not stack members/pending empty theater (TB-1214).
  const usersDirectoryEmpty =
    m.surface === "admin"
    && !m.loading
    && directoryNoteReliableForAssignmentCounts(m.usersNote)
    && userRows.length === 0;
  const usersTabEmptyWorkspace = usersDirectoryEmpty && pendingInvitationCount === 0;
  const usersTabInviteFirstLayout =
    usersDirectoryEmpty
    && (pendingInvitationCount === 0
      || (pendingInvitationCount === null && !pendingInvitationsResolved));

  const onPendingInvitationCountChange = useCallback((count: number | null) => {
    if (count !== null) {
      setPendingInvitationsResolved(true);
    }

    setPendingInvitationCount(count);
  }, []);

  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  useEffect(() => {
    setInviteSectionOpenState(parseSettingsUsersInviteOpenFromSearch(searchParams.get("invite")));
  }, [searchParams]);

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
    if (usersTabInviteFirstLayout && activeTab === "users" && !usersTabBuyerPolished) {
      setInviteSectionOpen(true);
    }
  }, [usersTabInviteFirstLayout, activeTab, usersTabBuyerPolished]);

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

    window.setTimeout(() => {
      inviteEmailInputRef.current?.focus();
    }, 0);
  }, [setInviteSectionOpen]);

  const onInviteSent = useCallback((invitation: AdminUserInvitationRow) => {
    setSeededInvitations((current) => {
      const without = current.filter((row) => row.id !== invitation.id);

      return [invitation, ...without];
    });
    setInvitationsRefreshKey((key) => key + 1);
  }, []);

  function openPrincipal(principalId: string): void {
    writeSettingsPrincipalLastViewedId("user", principalId);
    setActiveTab("users");
    router.replace(SETTINGS_USERS_USERS_TAB_PATH);
    window.setTimeout(() => {
      document
        .querySelector(`[data-principal-id="${CSS.escape(principalId)}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

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
      <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="settings-roles-page">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      </OperatorPageContainer>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="settings-roles-page">
        <p
          className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)}
          role="alert"
          data-testid="settings-roles-forbidden"
        >
          {FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE}
        </p>
      </OperatorPageContainer>
    );
  }

  const usersSectionTitle = (() => {
    if (m.loading) {
      return "Members";
    }

    if (directoryNoteReliableForAssignmentCounts(m.usersNote) && userRows.length === 0) {
      return "Members (0)";
    }

    if (isUsersNoteLoadFailure(m.usersNote)) {
      return "Members";
    }

    return `Members (${userRows.length})`;
  })();
  const membersDirectorySourceTag =
    m.usersDirectorySource !== null ? (
      <StatusTag
        {...usersDirectorySourceStatusTag(m.usersDirectorySource)}
        data-testid="settings-roles-members-directory-source"
      />
    ) : null;
  const pendingSectionTitle =
    pendingInvitationCount === null ? "Pending invitations" : `Pending invitations (${pendingInvitationCount})`;

  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="settings-roles-page">
      <a
        href={`#${SETTINGS_ROLES_SETTINGS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {SETTINGS_ROLES_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={SETTINGS_ROLES_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid={SETTINGS_ROLES_SETTINGS_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        {buyerPolishedShell ? (
          <OperatorPageHeader
            navHref="/administration/users"
            title={OPERATOR_NAV_LINK_LABELS.usersAndRoles}
            titleTestId="settings-roles-page-title"
            subtitle={settingsRolesPageSubtitle(buyerPolishedShell, activeTab)}
            claimDiscipline={SETTINGS_ROLES_SETTINGS_CLAIM_DISCIPLINE}
            claimDisciplineTestId={SETTINGS_ROLES_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            actions={
              buyerPolishedMutationTab ? null : (
                <Button
                  type="button"
                  size="sm"
                  data-testid="settings-roles-invite-primary-action"
                  onClick={openInviteSection}
                >
                  Invite user
                </Button>
              )
            }
          />
        ) : (
          <PageHeading
            navHref="/administration/users"
            title={OPERATOR_NAV_LINK_LABELS.usersAndRoles}
            description={SETTINGS_ROLES_PAGE_SUBTITLE_OPERATOR}
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
        )}

        <div
          id={SETTINGS_ROLES_SETTINGS_SKIP_TARGET_ID}
          data-testid={SETTINGS_ROLES_SETTINGS_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          {buyerPolishedShell ? (
            <section
              className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid={
                rolesTabBuyerPolished
                  ? "settings-roles-roles-tab-start-here-panel"
                  : usersTabBuyerPolished
                    ? "settings-roles-users-tab-start-here-panel"
                    : "settings-roles-action-panel"
              }
              aria-labelledby={
                rolesTabBuyerPolished
                  ? "settings-roles-roles-tab-start-here-heading"
                  : usersTabBuyerPolished
                    ? "settings-roles-users-tab-start-here-heading"
                    : "settings-roles-action-panel-heading"
              }
            >
              <h2
                id={
                  rolesTabBuyerPolished
                    ? "settings-roles-roles-tab-start-here-heading"
                    : usersTabBuyerPolished
                      ? "settings-roles-users-tab-start-here-heading"
                      : "settings-roles-action-panel-heading"
                }
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                {SETTINGS_ROLES_START_HERE_CARD_TITLE}
              </h2>
              {rolesTabBuyerPolished ? (
                <>
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                    data-testid="settings-roles-roles-tab-intro"
                  >
                    {SETTINGS_ROLES_ROLES_TAB_LEAD}
                  </p>
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="settings-roles-roles-tab-start-here-helper"
                  >
                    {SETTINGS_ROLES_ROLES_TAB_START_HERE_HELPER}
                  </p>
                </>
              ) : usersTabBuyerPolished ? (
                <>
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                    data-testid="settings-roles-users-tab-intro"
                  >
                    {SETTINGS_ROLES_USERS_TAB_LEAD}
                  </p>
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="settings-roles-users-tab-start-here-helper"
                  >
                    {SETTINGS_ROLES_USERS_TAB_START_HERE_HELPER}
                  </p>
                </>
              ) : (
                <>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    {SETTINGS_ROLES_START_HERE_LEAD}
                  </p>
                  <Button type="button" size="sm" data-testid="settings-roles-start-here-invite" onClick={openInviteSection}>
                    Invite user
                  </Button>
                </>
              )}
            </section>
          ) : null}

          {!buyerPolishedShell && isApiKeysSettingsSurfaceEnabled() ? (
            <ApiKeysUsersVocabularyRail currentSurfaceId="users" />
          ) : null}
          {!buyerPolishedShell ? <ScimUsersVocabularyRail currentSurfaceId="users" /> : null}
          {!buyerPolishedShell && (activeTab === "roles" || activeTab === "users") ? (
            <CustomRolesUsersVocabularyRail
              currentSurfaceId={activeTab === "roles" ? "custom-roles" : "users"}
            />
          ) : null}
          <Tabs value={activeTab} onValueChange={onSelectTab} className={OPERATOR_LAYOUT.sectionStack}>
        <TabsList aria-label={`${OPERATOR_NAV_LINK_LABELS.usersAndRoles} sections`} data-testid="settings-roles-tablist">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} data-testid={`settings-roles-tab-${tab.id}`}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <SettingsRolesUsersTab
          model={m}
          userRows={filteredUserRows}
          memberRoleFilter={activeMemberRole}
          memberStatusFilter={activeMemberStatus}
          membersFilterSearch={currentSearch}
          membersFilterPathname={hubPathname}
          usersTabInviteFirstLayout={usersTabInviteFirstLayout}
          usersTabEmptyWorkspace={usersTabEmptyWorkspace}
          usersTabBuyerPolished={usersTabBuyerPolished}
          usersSectionTitle={usersSectionTitle}
          membersDirectorySourceTag={membersDirectorySourceTag}
          pendingSectionTitle={pendingSectionTitle}
          continueLastPrincipal={continueLastPrincipal}
          inviteEmailInputRef={inviteEmailInputRef}
          inviteSectionOpen={inviteSectionOpen}
          onInviteSectionOpenChange={setInviteSectionOpen}
          invitationsRefreshKey={invitationsRefreshKey}
          seededInvitations={seededInvitations}
          onInviteSent={onInviteSent}
          onPendingInvitationCountChange={onPendingInvitationCountChange}
          onOpenPrincipal={openPrincipal}
        />

        <TabsContent value="roles" data-testid="settings-roles-tabpanel-roles">
          <Card>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Roles and permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsRolesMatrixSection readOnly={rolesTabBuyerPolished} />
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
                {!m.loading && m.keysNote !== null && isKeysNoteLoadFailure(m.keysNote) ? (
                  <div data-testid="settings-roles-api-keys-note" className="space-y-4">
                    <EnterpriseCompactEmptyState
                      testId="settings-roles-api-keys-load-failed"
                      title={settingsRolesEmptyStateTitle(m.keysNote, "api_keys")}
                      description={settingsRolesEmptyStateDescription(m.keysNote, "api_keys")}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="primary" size="sm" data-testid="settings-roles-keys-open-api-keys">
                        <Link href={SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF}>{SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL}</Link>
                      </Button>
                      <RefreshButton busy={m.loading} onClick={() => void m.load()} />
                    </div>
                  </div>
                ) : null}
                {!m.loading && apiKeyRows.length > 0 ? (
                  <SettingsRolesPrincipalTable
                    rows={apiKeyRows}
                    tableContext="api_keys"
                    onRoleChange={m.onRoleChange}
                  />
                ) : null}
                {!m.loading && isKeysDirectoryCollectionEmpty(m.keysNote, apiKeyRows.length) ? (
                  <div className="space-y-4" data-testid="settings-roles-keys-empty">
                    <EnterpriseCompactEmptyState {...SETTINGS_ROLES_API_KEYS_EMPTY_COMPACT} />
                    <Button asChild variant="primary" size="sm" data-testid="settings-roles-keys-open-api-keys">
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

        {buyerPolishedShell ? (
          <div data-testid="settings-roles-orientation-bottom">
            <SettingsRolesSettingsEvidenceOrientationStrip />
          </div>
        ) : null}
      </div>
    </OperatorPageContainer>
  );
}
