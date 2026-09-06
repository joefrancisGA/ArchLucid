"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { roleClaimCaption, roleDisplayLabel } from "@/lib/role-display-labels";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CUSTOM_ROLE_PERMISSION_GROUPS } from "./custom-role-permission-groups";
import { isRoleDirty, roleMatrixKey, type DraftRole, type RolePermissionBaseline } from "./custom-role-draft-state";

const ROLE_COLUMN_WIDTH = "7.5rem";
const PERMISSION_COLUMN_WIDTH = "14rem";

function PermissionValue({
  allowed,
  roleName,
  permissionLabel,
  editable,
  checked,
  onToggle,
}: {
  allowed: boolean;
  roleName: string;
  permissionLabel: string;
  editable: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  if (editable) {
    return (
      <div className="flex h-10 items-center justify-center px-2">
        <input
          type="checkbox"
          checked={checked}
          aria-label={`${permissionLabel} for ${roleName}`}
          className="h-4 w-4"
          onChange={onToggle}
        />
      </div>
    );
  }

  return (
    <div className="flex h-10 items-center justify-center px-2">
      <span
        className={cn(
          "inline-flex min-w-[2rem] items-center justify-center rounded-sm px-1 text-base font-semibold leading-none",
          allowed ? "text-al-text-secondary dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-500",
        )}
        aria-label={`${permissionLabel} for ${roleName}: ${allowed ? "Allowed" : "Not allowed"}`}
      >
        <span aria-hidden="true">{allowed ? "✓" : "—"}</span>
        <span className="sr-only">{allowed ? "Allowed" : "Not allowed"}</span>
      </span>
    </div>
  );
}

export type SettingsRolesMatrixTableProps = {
  readonly columns: readonly DraftRole[];
  readonly baseline: RolePermissionBaseline;
  readonly collapsedGroups: ReadonlySet<string>;
  readonly savingRoleId: string | null;
  readonly readOnly?: boolean;
  readonly onToggleGroupCollapsed: (area: string) => void;
  readonly onTogglePermission: (roleKey: string, permissionId: string) => void;
  readonly onRequestSaveRole: (role: DraftRole) => void;
  readonly onDiscardRoleEdits: (roleKey: string) => void;
  readonly onPrefillCloneOfRole: (role: DraftRole) => void;
};

export function SettingsRolesMatrixTable({
  columns,
  baseline,
  collapsedGroups,
  savingRoleId,
  readOnly = false,
  onToggleGroupCollapsed,
  onTogglePermission,
  onRequestSaveRole,
  onDiscardRoleEdits,
  onPrefillCloneOfRole,
}: SettingsRolesMatrixTableProps) {
  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-800">
      <div className="max-h-[70vh] overflow-auto">
        <table className={cn("w-full min-w-[48rem] table-fixed border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
          <colgroup>
            <col style={{ width: PERMISSION_COLUMN_WIDTH }} />
            {columns.map((role) => (
              <col key={roleMatrixKey(role)} style={{ width: ROLE_COLUMN_WIDTH }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-30 bg-neutral-50 shadow-sm dark:bg-neutral-900/95">
            <tr>
              <th
                scope="col"
                className={cn(
                  "sticky left-0 z-40 border-b border-neutral-200 bg-neutral-50 px-3 py-3 text-left font-semibold text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900/95",
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                Permission
              </th>
              {columns.map((role) => {
                const roleKey = roleMatrixKey(role);
                const displayName = roleDisplayLabel(role.name);
                const claimCaption = roleClaimCaption(role.name);
                const isDirty = isRoleDirty(role, baseline);

                return (
                  <th
                    key={roleKey}
                    scope="col"
                    className={cn(
                      "border-b border-neutral-200 px-2 py-3 text-center align-top font-semibold text-al-text-primary dark:border-neutral-800",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                  >
                    <div className="flex min-h-[4.5rem] flex-col items-center justify-start gap-1">
                      <span className="line-clamp-2 text-center" title={displayName}>
                        {displayName}
                      </span>
                      <span className={cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                        {role.isSystem ? "Built-in role" : "Custom role"}
                      </span>
                      {claimCaption !== null ? (
                        <span className={cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                          {claimCaption}
                        </span>
                      ) : null}
                      {readOnly ? null : isDirty ? (
                        <span
                          data-testid={`settings-roles-unsaved-badge-${roleKey}`}
                          className={cn("font-medium text-amber-700 dark:text-amber-300", OPERATOR_TYPOGRAPHY.micro)}
                        >
                          Unsaved
                        </span>
                      ) : null}
                      {readOnly ? null : role.isSystem ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => onPrefillCloneOfRole(role)}
                          aria-label={`Clone ${displayName} role into the create form`}
                        >
                          Clone
                        </Button>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                            disabled={savingRoleId === role.id || !isDirty}
                            aria-label={`Save ${displayName} role`}
                            onClick={() => onRequestSaveRole(role)}
                          >
                            {savingRoleId === role.id ? "Saving…" : "Save"}
                          </Button>
                          {isDirty ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              aria-label={`Discard unsaved changes to ${displayName}`}
                              onClick={() => onDiscardRoleEdits(roleKey)}
                            >
                              Discard
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {CUSTOM_ROLE_PERMISSION_GROUPS.map((group) => {
              const isCollapsed = collapsedGroups.has(group.area);

              return [
                <tr key={`group-${group.area}`} className="bg-neutral-100/90 dark:bg-neutral-900/60">
                  <td
                    colSpan={columns.length + 1}
                    className="sticky left-0 z-10 border-y border-neutral-200 bg-neutral-100/95 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/80"
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-2 text-left font-semibold uppercase tracking-wide text-al-text-primary",
                        OPERATOR_NAV_GROUP_LABEL,
                      )}
                      aria-expanded={!isCollapsed}
                      aria-label={`${group.area} permissions`}
                      onClick={() => onToggleGroupCollapsed(group.area)}
                    >
                      <span>{group.area}</span>
                      {isCollapsed ? (
                        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-al-text-secondary" />
                      ) : (
                        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-al-text-secondary" />
                      )}
                    </button>
                  </td>
                </tr>,
                ...(!isCollapsed
                  ? group.permissions.map((permission) => (
                      <tr key={permission.id} className="border-b border-neutral-100 dark:border-neutral-800">
                        <th
                          scope="row"
                          className={cn(
                            "sticky left-0 z-10 border-r border-neutral-100 bg-white px-3 py-0 text-left font-normal text-al-text-primary dark:border-neutral-800 dark:bg-neutral-950",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                        >
                          <div className="py-2 pr-2">{permission.label}</div>
                        </th>
                        {columns.map((role) => (
                          <td key={`${roleMatrixKey(role)}:${permission.id}`} className="p-0 text-center align-middle">
                            <PermissionValue
                              allowed={role.permissions.has(permission.id)}
                              roleName={roleDisplayLabel(role.name)}
                              permissionLabel={permission.label}
                              editable={!readOnly && !role.isSystem}
                              checked={role.permissions.has(permission.id)}
                              onToggle={() => onTogglePermission(roleMatrixKey(role), permission.id)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  : []),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}