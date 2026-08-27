"use client";

import { cn } from "@/lib/utils";
import type { RefObject } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { TabsContent } from "@/components/ui/tabs";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AdminUserInvitationRow } from "@/lib/admin-user-invitations";
import type { SettingsRolesContinueLastTarget } from "@/lib/resolve-continue-last-settings-principal";

import { SettingsRolesInvitePanel } from "./SettingsRolesInvitePanel";
import { PendingInvitationsPanel } from "./PendingInvitationsPanel";
import { SettingsRolesPrincipalTable } from "./SettingsRolesPrincipalTable";
import {
  SETTINGS_ROLES_USERS_EMPTY_COMPACT,
  settingsRolesEmptyStateDescription,
  settingsRolesEmptyStateTitle,
} from "./settings-roles-page-empty-copy";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";
import type { SettingsRolesAssignablePrincipalRow } from "./settings-roles-page-types";
import { SettingsRolesContinueLastViewedRow } from "./SettingsRolesContinueLastViewedRow";
import {
  INVITE_PRIMARY_HEADING_ID,
  INVITE_SECTION_SUMMARY_ID,
  isUsersNoteLoadFailure,
  MEMBERS_HEADING_ID,
  PENDING_INVITATIONS_HEADING_ID,
} from "./settings-roles-page-helpers";

export type SettingsRolesUsersTabProps = {
  readonly model: SettingsRolesPageViewModel;
  readonly userRows: readonly SettingsRolesAssignablePrincipalRow[];
  readonly usersTabInviteFirstLayout: boolean;
  readonly usersTabEmptyWorkspace: boolean;
  readonly usersSectionTitle: string;
  readonly membersDirectorySourceTag: React.ReactNode;
  readonly pendingSectionTitle: string;
  readonly continueLastPrincipal: SettingsRolesContinueLastTarget | null;
  readonly inviteEmailInputRef: RefObject<HTMLInputElement | null>;
  readonly inviteSectionOpen: boolean;
  readonly onInviteSectionOpenChange: (open: boolean) => void;
  readonly invitationsRefreshKey: number;
  readonly seededInvitations: readonly AdminUserInvitationRow[];
  readonly onInviteSent: (invitation: AdminUserInvitationRow) => void;
  readonly onPendingInvitationCountChange: (count: number | null) => void;
  readonly onOpenPrincipal: (principalId: string) => void;
};

export function SettingsRolesUsersTab(props: SettingsRolesUsersTabProps) {
  const m = props.model;

  return (
    <TabsContent value="users" data-testid="settings-roles-tabpanel-users">
      <div className={OPERATOR_LAYOUT.sectionStack}>
        {props.usersTabInviteFirstLayout ? (
          <>
            <Card
              aria-labelledby={INVITE_PRIMARY_HEADING_ID}
              data-testid="settings-roles-invite-primary-region"
            >
              <CardHeader>
                <CardTitle id={INVITE_PRIMARY_HEADING_ID} as="h2" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                  Invite user
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SettingsRolesInvitePanel
                  emailInputRef={props.inviteEmailInputRef}
                  onInviteSent={props.onInviteSent}
                />
              </CardContent>
            </Card>
            <div className="space-y-2" data-testid="settings-roles-users-empty-composition">
              <div className="flex flex-wrap items-center gap-2">
                {props.membersDirectorySourceTag}
                {props.usersTabEmptyWorkspace ? (
                  <StatusTag
                    kind="draft"
                    label="No users yet — members appear after the first invite is accepted."
                    data-testid="settings-roles-users-empty-status"
                  />
                ) : null}
              </div>
              <PendingInvitationsPanel
                refreshKey={props.invitationsRefreshKey}
                seededInvitations={props.seededInvitations}
                onCountChange={props.onPendingInvitationCountChange}
                suppressEmptyPresentation
              />
            </div>
          </>
        ) : (
          <>
            <Card aria-labelledby={MEMBERS_HEADING_ID}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle id={MEMBERS_HEADING_ID} as="h2" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                    {props.usersSectionTitle}
                  </CardTitle>
                  {props.membersDirectorySourceTag}
                </div>
              </CardHeader>
              <CardContent>
                {m.loading ? (
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
                ) : null}
                {!m.loading && isUsersNoteLoadFailure(m.usersNote) ? (
                  <div data-testid="settings-roles-api-note">
                    <EnterpriseCompactEmptyState
                      testId="settings-roles-users-load-failed"
                      title={settingsRolesEmptyStateTitle(m.usersNote, "users")}
                      description={settingsRolesEmptyStateDescription(m.usersNote, "users")}
                      footer={
                        <div className="flex flex-wrap gap-2">
                          <RefreshButton busy={m.loading} onClick={() => void m.load()} />
                        </div>
                      }
                    />
                  </div>
                ) : null}
                {!m.loading && m.usersNote === "empty_response" && props.userRows.length === 0 ? (
                  <EnterpriseCompactEmptyState {...SETTINGS_ROLES_USERS_EMPTY_COMPACT} />
                ) : null}
                {!m.loading && props.userRows.length > 0 ? (
                  <>
                    {props.continueLastPrincipal !== null ? (
                      <SettingsRolesContinueLastViewedRow
                        target={props.continueLastPrincipal}
                        onOpen={props.onOpenPrincipal}
                      />
                    ) : null}
                    <SettingsRolesPrincipalTable rows={props.userRows} onRoleChange={m.onRoleChange} />
                  </>
                ) : null}
                {!m.loading && m.usersNote === null && props.userRows.length === 0 ? (
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    No members yet. People appear here after they accept an invitation.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card aria-labelledby={PENDING_INVITATIONS_HEADING_ID}>
              <CardHeader>
                <CardTitle id={PENDING_INVITATIONS_HEADING_ID} as="h2" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                  {props.pendingSectionTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PendingInvitationsPanel
                  refreshKey={props.invitationsRefreshKey}
                  seededInvitations={props.seededInvitations}
                  onCountChange={props.onPendingInvitationCountChange}
                />
              </CardContent>
            </Card>
          </>
        )}

        {!props.usersTabInviteFirstLayout ? (
          <CollapsibleSection
            title="Invite user"
            headingLevel={2}
            summaryLine="Send a workspace invitation by email."
            summaryId={INVITE_SECTION_SUMMARY_ID}
            defaultOpen={false}
            open={props.inviteSectionOpen}
            onToggle={props.onInviteSectionOpenChange}
            sectionTestId="settings-roles-invite-section"
          >
            <SettingsRolesInvitePanel
              emailInputRef={props.inviteEmailInputRef}
              onInviteSent={props.onInviteSent}
            />
          </CollapsibleSection>
        ) : null}
      </div>
    </TabsContent>
  );
}
