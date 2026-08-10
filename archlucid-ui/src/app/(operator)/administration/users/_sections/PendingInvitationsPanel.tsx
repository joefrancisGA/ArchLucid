"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { OperatorEmptyState } from "@/components/OperatorShellMessage";
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
import { StatusTag } from "@/components/ui/status-tag";
import {
  fetchAdminUserInvitations,
  revokeAdminUserInvitation,
  type AdminUserInvitationRow,
} from "@/lib/admin-user-invitations";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { formatRelativeTime } from "@/lib/relative-time";
import { showError, showSuccess } from "@/lib/toast";

import { adminUserInvitationStatusKind } from "./admin-user-invitation-status";

type Props = {
  /** Increment to reload the pending-invitations list after a new invite is sent. */
  readonly refreshKey: number;
  readonly onCountChange?: (count: number) => void;
};

export function PendingInvitationsPanel({ refreshKey, onCountChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminUserInvitationRow[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);

    const invitations = await fetchAdminUserInvitations();

    if (invitations === null) {
      setRows([]);
      setLoadFailed(true);
      setLoading(false);
      onCountChange?.(0);

      return;
    }

    setRows(invitations);
    setLoading(false);
    onCountChange?.(invitations.length);
  }, [onCountChange]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function handleRevoke(invitation: AdminUserInvitationRow) {
    if (invitation.status !== "Pending") {
      return;
    }

    setRevokingId(invitation.id);

    const revoked = await revokeAdminUserInvitation(invitation.id);

    setRevokingId(null);

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
      setCopiedId(invitation.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showError("Could not copy reference", "Your browser blocked clipboard access. Copy the reference manually.");
    }
  }

  if (loading) {
    return <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading invitations…</p>;
  }

  if (loadFailed) {
    return (
      <div data-testid="settings-roles-pending-invitations-unavailable">
        <OperatorEmptyState
          title="Pending invitations unavailable"
          description="ArchLucid could not load pending invitations for this workspace. Try again or check system health."
        />
        <div className="mt-4">
          <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="settings-roles-pending-invitations-empty">
        No pending invitations.
      </p>
    );
  }

  return (
    <div data-testid="settings-roles-pending-invitations-table">
      <EnterpriseTable ariaLabel="Pending user invitations">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Email</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Role</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Expires</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {rows.map((invitation) => (
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
                      onClick={() => void handleRevoke(invitation)}
                    >
                      {revokingId === invitation.id ? "Revoking…" : "Revoke"}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid={`settings-roles-copy-invitation-reference-${invitation.id}`}
                    aria-label={`Copy invitation reference for ${invitation.email}`}
                    onClick={() => void handleCopyReference(invitation)}
                  >
                    {copiedId === invitation.id ? "Copied" : "Copy reference"}
                  </Button>
                </div>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
