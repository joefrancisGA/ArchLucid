"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  fetchAdminUserInvitations,
  revokeAdminUserInvitation,
  type AdminUserInvitationRow,
} from "@/lib/admin-user-invitations";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SETTINGS_ROLES_PENDING_INVITATIONS_LOAD_FAILED_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  parseSettingsUsersRevokeInviteIdFromSearch,
  settingsUsersInviteRevokeHrefFromSearch,
} from "@/lib/administration/settings-users-invite-revoke-url";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import { showError, showSuccess } from "@/lib/toast";

import { adminUserInvitationStatusKind } from "./admin-user-invitation-status";
import {
  countPendingAdminUserInvitations,
  mergeAdminUserInvitationAcceptSecrets,
  partitionAdminUserInvitations,
  resolveAdminUserInvitationAcceptLink,
} from "./settings-roles-pending-invitations";

const EMPTY_SEEDED_INVITATIONS: readonly AdminUserInvitationRow[] = [];

function PendingInvitationsAuditTrailFootnote() {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="settings-roles-pending-invitations-audit-footnote"
    >
      Workspace membership changes are recorded in the{" "}
      <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.nav}>
        audit trail
      </Link>
      . Member role provenance is not shown in the directory until the API exposes grant metadata.
    </p>
  );
}

type Props = {
  /** Increment to reload the pending-invitations list after a new invite is sent. */
  readonly refreshKey: number;
  /** Create-response rows that still carry accept-link secrets the list API omits. */
  readonly seededInvitations?: readonly AdminUserInvitationRow[];
  readonly onCountChange?: (count: number | null) => void;
  /**
   * When true, an empty invitation list renders nothing (TB-1214 empty composition).
   * Count callbacks and load/error paths still run.
   */
  readonly suppressEmptyPresentation?: boolean;
};

export function PendingInvitationsPanel({
  refreshKey,
  seededInvitations = EMPTY_SEEDED_INVITATIONS,
  onCountChange,
  suppressEmptyPresentation = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? SETTINGS_USERS_PATH;
  const searchParams = useSearchParams();
  const revokeInviteIdParam = searchParams.get("revokeInviteId");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminUserInvitationRow[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedReferenceId, setCopiedReferenceId] = useState<string | null>(null);
  const [copiedAcceptLinkId, setCopiedAcceptLinkId] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevokeState] = useState<AdminUserInvitationRow | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  const syncRevokeInviteToUrl = useCallback(
    (invitationId: string | null) => {
      router.replace(
        settingsUsersInviteRevokeHrefFromSearch(searchParams.toString(), invitationId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingRevoke = useCallback(
    (value: SetStateAction<AdminUserInvitationRow | null>) => {
      setPendingRevokeState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncRevokeInviteToUrl(next?.id ?? null);

        return next;
      });
    },
    [syncRevokeInviteToUrl],
  );

  useEffect(() => {
    const revokeInviteId = parseSettingsUsersRevokeInviteIdFromSearch(revokeInviteIdParam);

    if (revokeInviteId.length === 0) {
      setPendingRevokeState(null);

      return;
    }

    if (rows.length === 0) {
      return;
    }

    const invitation = rows.find((row) => row.id === revokeInviteId);

    if (invitation === undefined) {
      return;
    }

    if (pendingRevoke?.id === revokeInviteId) {
      return;
    }

    setPendingRevokeState(invitation);
  }, [pendingRevoke?.id, revokeInviteIdParam, rows]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);

    const invitations = await fetchAdminUserInvitations();

    if (invitations === null) {
      setRows(mergeAdminUserInvitationAcceptSecrets([], seededInvitations));
      setLoadFailed(true);
      setLoading(false);
      onCountChange?.(null);

      return;
    }

    const merged = mergeAdminUserInvitationAcceptSecrets(invitations, seededInvitations);
    setRows(merged);
    setLoading(false);
    onCountChange?.(countPendingAdminUserInvitations(merged));
  }, [onCountChange, seededInvitations]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const { pending, resolved } = useMemo(() => partitionAdminUserInvitations(rows), [rows]);
  const visibleRows = showResolved ? [...pending, ...resolved] : pending;

  async function handleConfirmRevoke(): Promise<void> {
    if (pendingRevoke === null) {
      return;
    }

    const invitation = pendingRevoke;

    setRevokeBusy(true);
    setRevokingId(invitation.id);

    const revoked = await revokeAdminUserInvitation(invitation.id);

    setRevokingId(null);
    setRevokeBusy(false);
    setPendingRevoke(null);

    if (!revoked) {
      showError("Could not revoke invitation", "The server rejected the revoke request. Refresh and try again.");

      return;
    }

    showSuccess(`Invitation for ${invitation.email} revoked.`);
    await load();
  }

  async function handleCopyReference(invitation: AdminUserInvitationRow) {
    try {
      await navigator.clipboard.writeText(invitation.id);
      setCopiedReferenceId(invitation.id);
      window.setTimeout(() => setCopiedReferenceId(null), 2000);
    } catch {
      showError("Could not copy support reference ID", "Your browser blocked clipboard access. Copy the reference manually.");
    }
  }

  async function handleCopyAcceptLink(invitation: AdminUserInvitationRow) {
    const acceptLink = resolveAdminUserInvitationAcceptLink(invitation);

    if (acceptLink === null) {
      return;
    }

    try {
      await navigator.clipboard.writeText(acceptLink);
      setCopiedAcceptLinkId(invitation.id);
      window.setTimeout(() => setCopiedAcceptLinkId(null), 2000);
    } catch {
      showError("Could not copy accept link", "Your browser blocked clipboard access. Copy the link manually.");
    }
  }

  if (loading) {
    return <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading invitations…</p>;
  }

  if (loadFailed) {
    return (
      <EnterpriseCompactEmptyState
        {...SETTINGS_ROLES_PENDING_INVITATIONS_LOAD_FAILED_COMPACT}
        footer={
          <div className="space-y-4">
            <RefreshButton variant="secondary" label="Retry" onClick={() => void load()} />
            <PendingInvitationsAuditTrailFootnote />
          </div>
        }
      />
    );
  }

  if (pending.length === 0 && resolved.length === 0) {
    if (suppressEmptyPresentation) {
      return <PendingInvitationsAuditTrailFootnote />;
    }

    return (
      <div className="space-y-4">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="settings-roles-pending-invitations-empty">
          No pending invitations.
        </p>
        <PendingInvitationsAuditTrailFootnote />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="settings-roles-pending-invitations-table">
      {resolved.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="settings-roles-toggle-resolved-invitations"
            onClick={() => setShowResolved((current) => !current)}
          >
            {showResolved ? "Hide resolved invitations" : "Show resolved invitations"}
          </Button>
          {!showResolved ? (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {resolved.length} accepted, revoked, or expired invitation{resolved.length === 1 ? "" : "s"} hidden.
            </span>
          ) : null}
        </div>
      ) : null}

      {visibleRows.length === 0 ? (
        <div className="space-y-4">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="settings-roles-pending-invitations-empty">
            No pending invitations.
          </p>
          <PendingInvitationsAuditTrailFootnote />
        </div>
      ) : (
        <EnterpriseTable ariaLabel="Pending user invitations">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Email</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Role</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Invited by</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Sent</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Expires</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {visibleRows.map((invitation) => {
              const acceptLink = resolveAdminUserInvitationAcceptLink(invitation);

              return (
                <EnterpriseTableRow
                  key={invitation.id}
                  data-testid={`settings-roles-pending-invitation-${invitation.id}`}
                >
                  <EnterpriseTableCell>
                    <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{invitation.email}</span>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>{invitation.appRole}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <StatusTag kind={adminUserInvitationStatusKind(invitation.status)} label={invitation.status} />
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <TechnicalIdDisclosure label="Actor" value={invitation.invitedByActorId} />
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <span className="block text-al-text-primary">{formatInstantForLocale(invitation.createdUtc)}</span>
                    <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {formatRelativeTime(invitation.createdUtc)}
                    </span>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <span className="block text-al-text-primary">{formatInstantForLocale(invitation.expiresUtc)}</span>
                    <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {formatRelativeTime(invitation.expiresUtc)}
                    </span>
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <div className="flex flex-wrap gap-2">
                      {invitation.status === "Pending" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={revokingId === invitation.id}
                          data-testid={`settings-roles-revoke-invitation-${invitation.id}`}
                          onClick={() => setPendingRevoke(invitation)}
                        >
                          {revokingId === invitation.id ? "Revoking…" : "Revoke"}
                        </Button>
                      ) : null}
                      {acceptLink !== null ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid={`settings-roles-copy-accept-link-${invitation.id}`}
                          aria-label={`Copy accept link for ${invitation.email}`}
                          onClick={() => void handleCopyAcceptLink(invitation)}
                        >
                          {copiedAcceptLinkId === invitation.id ? "Copied" : "Copy accept link"}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid={`settings-roles-copy-invitation-reference-${invitation.id}`}
                        aria-label={`Copy support reference ID for ${invitation.email}`}
                        onClick={() => void handleCopyReference(invitation)}
                      >
                        {copiedReferenceId === invitation.id ? "Copied" : "Copy support reference ID"}
                      </Button>
                      <Link
                        href={GOVERNANCE_AUDIT_PATH}
                        className={cn("inline-flex items-center self-center", OPERATOR_LINK.nav)}
                        data-testid={`settings-roles-view-audit-trail-${invitation.id}`}
                      >
                        View in audit trail
                      </Link>
                    </div>
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              );
            })}
          </EnterpriseTableBody>
        </EnterpriseTable>
      )}

      {visibleRows.length > 0 ? <PendingInvitationsAuditTrailFootnote /> : null}

      <ConfirmationDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRevoke(null);
          }
        }}
        title="Revoke invitation"
        description={
          pendingRevoke === null
            ? ""
            : `Revoke the pending invitation for ${pendingRevoke.email}? They will no longer be able to accept it.`
        }
        confirmLabel="Revoke invitation"
        busy={revokeBusy}
        onConfirm={() => {
          void handleConfirmRevoke();
        }}
      />
    </div>
  );
}
