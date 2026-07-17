"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import {
  fetchAdminUserInvitations,
  revokeAdminUserInvitation,
  type AdminUserInvitationRow,
} from "@/lib/admin-user-invitations";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { showError, showSuccess } from "@/lib/toast";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  /** Increment to reload the pending-invitations list after a new invite is sent. */
  readonly refreshKey: number;
};

export function PendingInvitationsPanel({ refreshKey }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminUserInvitationRow[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);

    const invitations = await fetchAdminUserInvitations();

    if (invitations === null) {
      setRows([]);
      setLoadFailed(true);
      setLoading(false);

      return;
    }

    setRows(invitations);
    setLoading(false);
  }, []);

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

    showSuccess(`Invitation ${invitation.id} revoked.`);
    await load();
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
    <div className="overflow-x-auto" data-testid="settings-roles-pending-invitations-table">
      <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
        <thead>
          <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.helper)}>
            <th className="py-2 pr-3">Reference</th>
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Role</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Expires</th>
            <th className="py-2 pr-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((invitation) => (
            <tr
              key={invitation.id}
              className="border-b border-neutral-100 dark:border-neutral-800"
              data-testid={`settings-roles-pending-invitation-${invitation.id}`}
            >
              <td className={cn("py-2 pr-3 font-mono text-xs text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {invitation.id}
              </td>
              <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{invitation.email}</td>
              <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{invitation.appRole}</td>
              <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{invitation.status}</td>
              <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {formatInstantForLocale(invitation.expiresUtc)}
              </td>
              <td className="py-2 pr-3">
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
                ) : (
                  <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
