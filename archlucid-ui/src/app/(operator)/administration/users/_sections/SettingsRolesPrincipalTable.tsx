"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import type { ArchLucidAppRole } from "@/lib/current-principal";
import {
  parseSettingsUsersRoleConfirmNextRoleFromSearch,
  parseSettingsUsersRoleConfirmPrincipalIdFromSearch,
  settingsUsersRoleConfirmHrefFromSearch,
} from "@/lib/administration/settings-users-role-confirm-url";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import { roleDisplayLabel } from "@/lib/role-display-labels";
import { writeSettingsPrincipalLastViewedId } from "@/lib/resolve-continue-last-settings-principal";

import { isSettingsRolesPrincipalSelfRow } from "./settings-roles-principal-self-match";
import { settingsRolesRoleChangeRequiresConfirmation } from "./settings-roles-privileged-role-change";
import { SETTINGS_ROLES_KEYS_TABLE_KEY_HINT_HEADER } from "./settings-roles-page-keys-tab-copy";
import { SETTINGS_ROLES_ASSIGNABLE } from "./settings-roles-page-constants";
import type { SettingsRolesAssignablePrincipalRow } from "./settings-roles-page-types";

type RowSaveState = "idle" | "saving" | "saved" | "error";

type PendingRoleChange = {
  readonly row: SettingsRolesAssignablePrincipalRow;
  readonly previousRole: ArchLucidAppRole;
  readonly nextRole: ArchLucidAppRole;
};

type Props = {
  readonly rows: readonly SettingsRolesAssignablePrincipalRow[];
  /** Keys tab uses automation-key column labels (TB-1934). */
  readonly tableContext?: "users" | "api_keys";
  readonly readOnly?: boolean;
  readonly onRoleChange: (
    row: SettingsRolesAssignablePrincipalRow,
    nextRole: ArchLucidAppRole,
  ) => Promise<"saved" | "rejected">;
};

export function SettingsRolesPrincipalTable({
  rows,
  tableContext = "users",
  readOnly = false,
  onRoleChange,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? SETTINGS_USERS_PATH;
  const searchParams = useSearchParams();
  const roleConfirmPrincipalIdParam = searchParams.get("roleConfirmPrincipalId");
  const roleConfirmNextRoleParam = searchParams.get("roleConfirmNextRole");
  const { currentPrincipal } = useOperatorNavAuthority();
  const [pendingChange, setPendingChangeState] = useState<PendingRoleChange | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [rowSaveState, setRowSaveState] = useState<Record<string, RowSaveState>>({});

  const syncRoleConfirmToUrl = useCallback(
    (change: PendingRoleChange | null) => {
      router.replace(
        settingsUsersRoleConfirmHrefFromSearch(
          searchParams.toString(),
          change === null
            ? { principalId: null, nextRole: null }
            : { principalId: change.row.id, nextRole: change.nextRole },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingChange = useCallback(
    (value: SetStateAction<PendingRoleChange | null>) => {
      setPendingChangeState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncRoleConfirmToUrl(next);

        return next;
      });
    },
    [syncRoleConfirmToUrl],
  );

  useEffect(() => {
    const principalId = parseSettingsUsersRoleConfirmPrincipalIdFromSearch(roleConfirmPrincipalIdParam);
    const nextRoleRaw = parseSettingsUsersRoleConfirmNextRoleFromSearch(roleConfirmNextRoleParam);

    if (principalId.length === 0 || nextRoleRaw.length === 0) {
      setPendingChangeState(null);

      return;
    }

    if (rows.length === 0) {
      return;
    }

    const nextRole = SETTINGS_ROLES_ASSIGNABLE.find((role) => role === nextRoleRaw);

    if (nextRole === undefined) {
      return;
    }

    const row = rows.find((candidate) => candidate.id === principalId);

    if (row === undefined) {
      return;
    }

    if (pendingChange?.row.id === principalId && pendingChange.nextRole === nextRole) {
      return;
    }

    setPendingChangeState({ row, previousRole: row.role, nextRole });
  }, [pendingChange?.nextRole, pendingChange?.row.id, roleConfirmNextRoleParam, roleConfirmPrincipalIdParam, rows]);

  const rowStateKey = useCallback((row: SettingsRolesAssignablePrincipalRow) => `${row.kind}:${row.id}`, []);

  const applyRoleChange = useCallback(
    async (change: PendingRoleChange) => {
      const key = rowStateKey(change.row);

      setRowSaveState((current) => ({ ...current, [key]: "saving" }));

      const outcome = await onRoleChange(change.row, change.nextRole);

      writeSettingsPrincipalLastViewedId(change.row.kind, change.row.id);

      setRowSaveState((current) => ({
        ...current,
        [key]: outcome === "saved" ? "saved" : "error",
      }));
    },
    [onRoleChange, rowStateKey],
  );

  async function handleConfirmRoleChange(): Promise<void> {
    if (pendingChange === null) {
      return;
    }

    setConfirmBusy(true);

    await applyRoleChange(pendingChange);

    setConfirmBusy(false);
    setPendingChange(null);
  }

  function handleRoleSelect(row: SettingsRolesAssignablePrincipalRow, nextRole: ArchLucidAppRole): void {
    if (nextRole === row.role) {
      return;
    }

    if (settingsRolesRoleChangeRequiresConfirmation(nextRole)) {
      setPendingChange({ row, previousRole: row.role, nextRole });

      return;
    }

    void applyRoleChange({ row, previousRole: row.role, nextRole });
  }

  function handleCancelRoleChange(): void {
    setPendingChange(null);
  }

  const confirmDescription =
    pendingChange === null
      ? ""
      : `Assign the ${roleDisplayLabel(pendingChange.nextRole)} role to ${pendingChange.row.name}? Privileged roles can change workspace access and governance settings.`;

  const identityColumnLabel =
    tableContext === "api_keys" ? SETTINGS_ROLES_KEYS_TABLE_KEY_HINT_HEADER : "Email / hint";
  const tableAriaLabel = tableContext === "api_keys" ? "API key role assignments" : "Workspace members";

  return (
    <>
      <EnterpriseTable ariaLabel={tableAriaLabel}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell data-testid="settings-roles-principal-identity-column-header">
              {identityColumnLabel}
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Role</EnterpriseTableHeaderCell>
            {readOnly ? null : <EnterpriseTableHeaderCell>Save status</EnterpriseTableHeaderCell>}
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {rows.map((row) => {
            const key = rowStateKey(row);
            const isSelf = isSettingsRolesPrincipalSelfRow(row, currentPrincipal);
            const saveState = rowSaveState[key] ?? "idle";

            return (
              <EnterpriseTableRow key={key} data-principal-id={row.id}>
                <EnterpriseTableCell>
                  <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.name}</span>
                </EnterpriseTableCell>
                <EnterpriseTableCell>{row.detail}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <div className="space-y-1">
                    {readOnly ? (
                      <span
                        className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
                        data-testid={`settings-roles-role-readonly-${row.kind}-${row.id}`}
                      >
                        {roleDisplayLabel(row.role)}
                      </span>
                    ) : (
                      <Select
                        value={row.role}
                        disabled={isSelf}
                        onValueChange={(value) => {
                          const nextRole = SETTINGS_ROLES_ASSIGNABLE.find((role) => role === value);

                          if (nextRole === undefined) {
                            return;
                          }

                          handleRoleSelect(row, nextRole);
                        }}
                      >
                        <SelectTrigger
                          className="h-9 w-[11rem]"
                          aria-label={`Role for ${row.name}`}
                          data-testid={`settings-roles-select-${row.kind}-${row.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SETTINGS_ROLES_ASSIGNABLE.map((role) => (
                            <SelectItem key={role} value={role}>
                              {roleDisplayLabel(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {isSelf && !readOnly ? (
                      <p
                        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                        data-testid={`settings-roles-self-role-helper-${row.id}`}
                      >
                        {currentPrincipal.name?.trim()
                          ? "You cannot change your own role here. Ask another workspace administrator."
                          : "Sign-in identity is incomplete, so role changes are blocked until your account name is available."}
                      </p>
                    ) : null}
                  </div>
                </EnterpriseTableCell>
                {readOnly ? null : (
                  <EnterpriseTableCell>
                    {saveState === "saving" ? (
                      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={`settings-roles-save-status-${key}`}>
                        Saving…
                      </span>
                    ) : null}
                    {saveState === "saved" ? (
                      <span className={cn("text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)} data-testid={`settings-roles-save-status-${key}`}>
                        Saved
                      </span>
                    ) : null}
                    {saveState === "error" ? (
                      <span className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.helper)} data-testid={`settings-roles-save-status-${key}`}>
                        Not saved
                      </span>
                    ) : null}
                  </EnterpriseTableCell>
                )}
              </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>

      <ConfirmationDialog
        open={!readOnly && pendingChange !== null}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelRoleChange();
          }
        }}
        title="Confirm role assignment"
        description={confirmDescription}
        confirmLabel="Assign role"
        variant="default"
        busy={confirmBusy}
        onConfirm={() => {
          void handleConfirmRoleChange();
        }}
      />
    </>
  );
}
