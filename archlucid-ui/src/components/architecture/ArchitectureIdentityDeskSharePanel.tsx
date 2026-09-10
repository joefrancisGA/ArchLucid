"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { LivelihoodPersistSaveStatus } from "@/components/operator/LivelihoodPersistSaveStatus";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";
import { useArchitectureSharesQuery } from "@/hooks/use-architecture-shares-query";
import {
  deleteArchitectureShare,
  setArchitectureRestrictToShares,
  upsertArchitectureShare,
} from "@/lib/api/architecture-share-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { parseAdminUsersDirectoryPayload } from "@/lib/admin-tenant-directory-parse";
import { architectureIdentityMutationBlockedReason } from "@/lib/architecture/architecture-identity-mutation-blocked-reason";
import {
  ARCHITECTURE_SHARE_RESTRICT_HELP_CANONICAL_PATH,
  ARCHITECTURE_SHARE_RESTRICT_HELP_LEARN_MORE_LABEL,
} from "@/lib/architecture/architecture-share-restrict-help-evidence-copy";
import {
  ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_OPT_IN_REASON,
  ARCHITECTURE_IDENTITY_DESK_SHARE_EMPTY_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_ERROR_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_GRANT_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_HELPER,
  ARCHITECTURE_IDENTITY_DESK_SHARE_LOADING_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_LOADING_USERS_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_NO_USERS_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_PANEL_TITLE,
  ARCHITECTURE_IDENTITY_DESK_SHARE_REMOVE_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_RETRY_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_RESTRICT_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_ROLE_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_SAVE_RESTRICT_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_SAVE_ROLES_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_SELECT_USER_REASON,
  ARCHITECTURE_IDENTITY_DESK_SHARE_USER_PICKER_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_USERS_ONLY_HELPER,
} from "@/lib/architecture/architecture-share-copy";
import {
  ARCHITECTURE_SHARE_ROLES,
  normalizeArchitectureShareRole,
  resolveArchitectureShareGrantUserId,
  type ArchitectureShareRole,
} from "@/lib/architecture/architecture-share-validation";
import { SETTINGS_ROLES_USERS_PATH } from "@/app/(operator)/administration/users/_sections/settings-roles-page-constants";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

const cnField =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

type ArchitectureIdentityDeskSharePanelProps = {
  readonly architectureId: string;
};

/** AS-092: Working desk panel for restrict-to-shares and per-user grants. */
export function ArchitectureIdentityDeskSharePanel(
  props: ArchitectureIdentityDeskSharePanelProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const queryClient = useQueryClient();
  const architectureId = props.architectureId.trim();
  const enabled = isWorkingMode && architectureId.length > 0;
  const sharesQuery = useArchitectureSharesQuery(architectureId, enabled);

  const [draftRestrictToShares, setDraftRestrictToShares] = useState<boolean | null>(null);
  const [confirmOptIn, setConfirmOptIn] = useState(false);
  const [pickerUserId, setPickerUserId] = useState("");
  const [grantRole, setGrantRole] = useState<ArchitectureShareRole>("View");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, ArchitectureShareRole>>({});
  const [showGrantAttempt, setShowGrantAttempt] = useState(false);
  const [showRestrictAttempt, setShowRestrictAttempt] = useState(false);
  const [lastSavedUtc, setLastSavedUtc] = useState<string | null>(null);
  const [inlineSaveError, setInlineSaveError] = useState<string | null>(null);

  const savedRestrictToShares = sharesQuery.data?.restrictToShares === true;
  const effectiveRestrictToShares = draftRestrictToShares ?? savedRestrictToShares;
  const confirmationCopy =
    sharesQuery.data?.confirmationCopy?.trim()
    || "Only people on the share list can see this architecture. You will be added as Admin so you do not lock yourself out.";

  const savedShares = sharesQuery.data?.shares ?? [];

  useEffect(() => {
    if (sharesQuery.data === undefined) {
      return;
    }

    setDraftRestrictToShares(null);
    setConfirmOptIn(false);
    setRoleDrafts({});
  }, [sharesQuery.data]);

  const usersQuery = useQuery({
    queryKey: operatorQueryKeys.adminUsersDirectory,
    queryFn: async () => {
      const response = await fetch(SETTINGS_ROLES_USERS_PATH, { credentials: "include" });

      if (!response.ok) {
        throw new Error(`Could not load workspace users (${response.status}).`);
      }

      const json: unknown = await response.json();

      return parseAdminUsersDirectoryPayload(json);
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  });

  const directoryUsers = usersQuery.data ?? [];
  const grantSelection = useMemo(
    () => resolveArchitectureShareGrantUserId({ pickerUserId }),
    [pickerUserId],
  );

  const restrictDirty = draftRestrictToShares !== null && draftRestrictToShares !== savedRestrictToShares;
  const grantDirty = pickerUserId.trim().length > 0;
  const roleEditsDirty = useMemo(
    () =>
      Object.entries(roleDrafts).some(([userId, role]) => {
        const savedRole = savedShares.find((share) => share.userId === userId)?.role;

        return normalizeArchitectureShareRole(savedRole ?? "") !== role;
      }),
    [roleDrafts, savedShares],
  );
  const isDirty = restrictDirty || grantDirty || roleEditsDirty;
  const documentGuards = useLivelihoodDocumentGuards({ when: isDirty });

  const invalidateShares = async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: operatorQueryKeys.architectureShares(architectureId),
    });
  };

  const restrictMutation = useMutation({
    mutationFn: () =>
      setArchitectureRestrictToShares(architectureId, {
        restrictToShares: effectiveRestrictToShares,
        confirmOptIn: effectiveRestrictToShares ? confirmOptIn : false,
      }),
    onSuccess: async () => {
      setInlineSaveError(null);
      setShowRestrictAttempt(false);
      setDraftRestrictToShares(null);
      setConfirmOptIn(false);
      setLastSavedUtc(new Date().toISOString());
      await invalidateShares();
    },
    onError: (error) => {
      const failure = toApiLoadFailure(error);
      setInlineSaveError(
        architectureIdentityMutationBlockedReason(failure)
          ?? formatVerboseApiFailureMessage(error, "Could not update restrict-to-shares."),
      );
    },
  });

  const grantMutation = useMutation({
    mutationFn: (args: { userId: string; role: ArchitectureShareRole }) =>
      upsertArchitectureShare(architectureId, args.userId, { role: args.role }),
    onSuccess: async () => {
      setInlineSaveError(null);
      setShowGrantAttempt(false);
      setPickerUserId("");
      setGrantRole("View");
      setLastSavedUtc(new Date().toISOString());
      await invalidateShares();
    },
    onError: (error) => {
      const failure = toApiLoadFailure(error);
      setInlineSaveError(
        architectureIdentityMutationBlockedReason(failure)
          ?? formatVerboseApiFailureMessage(error, "Could not grant this share."),
      );
    },
  });

  const roleSaveMutation = useMutation({
    mutationFn: async (entries: ReadonlyArray<{ userId: string; role: ArchitectureShareRole }>) => {
      for (const entry of entries) {
        await upsertArchitectureShare(architectureId, entry.userId, { role: entry.role });
      }
    },
    onSuccess: async () => {
      setInlineSaveError(null);
      setRoleDrafts({});
      setLastSavedUtc(new Date().toISOString());
      await invalidateShares();
    },
    onError: (error) => {
      const failure = toApiLoadFailure(error);
      setInlineSaveError(
        architectureIdentityMutationBlockedReason(failure)
          ?? formatVerboseApiFailureMessage(error, "Could not save share role changes."),
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => deleteArchitectureShare(architectureId, userId),
    onSuccess: async () => {
      setInlineSaveError(null);
      setLastSavedUtc(new Date().toISOString());
      await invalidateShares();
    },
    onError: (error) => {
      const failure = toApiLoadFailure(error);
      setInlineSaveError(
        architectureIdentityMutationBlockedReason(failure)
          ?? formatVerboseApiFailureMessage(error, "Could not remove this share."),
      );
    },
  });

  const enablingRestrict = effectiveRestrictToShares && !savedRestrictToShares;
  const canSaveRestrict =
    restrictDirty
    && !restrictMutation.isPending
    && !grantMutation.isPending
    && !roleSaveMutation.isPending
    && !removeMutation.isPending
    && (!enablingRestrict || confirmOptIn);
  const restrictDisabledReason =
    canSaveRestrict || !restrictDirty || restrictMutation.isPending
      ? null
      : enablingRestrict && !confirmOptIn
        ? whyDisabledIncompleteInput(ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_OPT_IN_REASON)
        : null;

  const canGrant =
    grantSelection.isValid
    && !grantMutation.isPending
    && !restrictMutation.isPending
    && !roleSaveMutation.isPending
    && !removeMutation.isPending;
  const grantDisabledReason =
    canGrant || grantMutation.isPending
      ? null
      : whyDisabledIncompleteInput(ARCHITECTURE_IDENTITY_DESK_SHARE_SELECT_USER_REASON);

  const pendingRoleEntries = useMemo(
    () =>
      Object.entries(roleDrafts)
        .map(([userId, role]) => ({ userId, role }))
        .filter((entry) => {
          const savedRole = savedShares.find((share) => share.userId === entry.userId)?.role;

          return normalizeArchitectureShareRole(savedRole ?? "") !== entry.role;
        }),
    [roleDrafts, savedShares],
  );

  const canSaveRoles =
    pendingRoleEntries.length > 0
    && !roleSaveMutation.isPending
    && !grantMutation.isPending
    && !restrictMutation.isPending
    && !removeMutation.isPending;

  if (!enabled) {
    return null;
  }

  if (sharesQuery.isLoading) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
        aria-labelledby="architecture-identity-share-heading"
        data-testid="architecture-identity-desk-share-loading"
      >
        <h2 id="architecture-identity-share-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_SHARE_PANEL_TITLE}
        </h2>
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_IDENTITY_DESK_SHARE_LOADING_LABEL}
        </p>
      </section>
    );
  }

  if (sharesQuery.isError || sharesQuery.data === undefined) {
    const blockedReason = sharesQuery.blockedReason;

    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
        aria-labelledby="architecture-identity-share-heading"
        data-testid="architecture-identity-desk-share-error"
      >
        <h2 id="architecture-identity-share-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_SHARE_PANEL_TITLE}
        </h2>
        <p
          className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}
          role={blockedReason !== null ? "alert" : undefined}
        >
          {blockedReason ?? ARCHITECTURE_IDENTITY_DESK_SHARE_ERROR_LABEL}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => void sharesQuery.refetch()}
        >
          {ARCHITECTURE_IDENTITY_DESK_SHARE_RETRY_LABEL}
        </Button>
      </section>
    );
  }

  return (
    <section
      className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      aria-labelledby="architecture-identity-share-heading"
      data-testid="architecture-identity-desk-share"
    >
      <h2 id="architecture-identity-share-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
        {ARCHITECTURE_IDENTITY_DESK_SHARE_PANEL_TITLE}
      </h2>
      <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {ARCHITECTURE_IDENTITY_DESK_SHARE_HELPER}{" "}
        <Link
          href={ARCHITECTURE_SHARE_RESTRICT_HELP_CANONICAL_PATH}
          className="underline"
          data-testid="architecture-identity-desk-share-learn-more"
        >
          {ARCHITECTURE_SHARE_RESTRICT_HELP_LEARN_MORE_LABEL}
        </Link>
      </p>

      <div className="mt-3 space-y-2" data-testid="architecture-identity-desk-share-restrict">
        <div className="flex items-start gap-2">
          <Checkbox
            id="architecture-identity-share-restrict"
            checked={effectiveRestrictToShares}
            disabled={
              restrictMutation.isPending
              || grantMutation.isPending
              || roleSaveMutation.isPending
              || removeMutation.isPending
            }
            data-testid="architecture-identity-desk-share-restrict-toggle"
            onCheckedChange={(checked) => {
              setDraftRestrictToShares(checked === true);
              setShowRestrictAttempt(false);
              setInlineSaveError(null);

              if (checked !== true) {
                setConfirmOptIn(false);
              }
            }}
          />
          <Label htmlFor="architecture-identity-share-restrict" className="font-normal leading-snug">
            {ARCHITECTURE_IDENTITY_DESK_SHARE_RESTRICT_LABEL}
          </Label>
        </div>

        {enablingRestrict ? (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-950/30">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{confirmationCopy}</p>
            <div className="flex items-start gap-2">
              <Checkbox
                id="architecture-identity-share-confirm-opt-in"
                checked={confirmOptIn}
                disabled={restrictMutation.isPending}
                data-testid="architecture-identity-desk-share-confirm-opt-in"
                onCheckedChange={(checked) => {
                  setConfirmOptIn(checked === true);
                  setShowRestrictAttempt(false);
                }}
              />
              <Label htmlFor="architecture-identity-share-confirm-opt-in" className="font-normal leading-snug">
                {ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_LABEL}
              </Label>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={!canSaveRestrict}
            data-testid="architecture-identity-desk-share-save-restrict"
            onClick={() => {
              if (!canSaveRestrict) {
                setShowRestrictAttempt(true);
                return;
              }

              void restrictMutation.mutate();
            }}
          >
            {ARCHITECTURE_IDENTITY_DESK_SHARE_SAVE_RESTRICT_LABEL}
          </Button>
          {showRestrictAttempt && !canSaveRestrict ? (
            <WhyDisabledCtaHint
              reason={restrictDisabledReason}
              testId="architecture-identity-desk-share-save-restrict-hint"
            />
          ) : (
            <WhyDisabledCtaHint
              reason={restrictDirty ? restrictDisabledReason : null}
              testId="architecture-identity-desk-share-save-restrict-hint"
            />
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2" data-testid="architecture-identity-desk-share-list">
        {savedShares.length === 0 ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_IDENTITY_DESK_SHARE_EMPTY_LABEL}</p>
        ) : (
          <ul className="space-y-2">
            {savedShares.map((share) => {
              const draftRole = roleDrafts[share.userId] ?? normalizeArchitectureShareRole(share.role);
              const directoryLabel =
                directoryUsers.find((user) => user.userId === share.userId)?.displayName
                ?? share.userId;

              return (
                <li
                  key={share.userId}
                  className="flex flex-wrap items-end gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                  data-testid={`architecture-identity-desk-share-row-${share.userId}`}
                >
                  <div className="min-w-[10rem] flex-1">
                    <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>{directoryLabel}</p>
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{share.userId}</p>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`architecture-identity-share-role-${share.userId}`}>
                      {ARCHITECTURE_IDENTITY_DESK_SHARE_ROLE_LABEL}
                    </Label>
                    <select
                      id={`architecture-identity-share-role-${share.userId}`}
                      className={cnField}
                      value={draftRole}
                      disabled={
                        roleSaveMutation.isPending
                        || removeMutation.isPending
                        || grantMutation.isPending
                        || restrictMutation.isPending
                      }
                      data-testid={`architecture-identity-desk-share-role-${share.userId}`}
                      onChange={(event) => {
                        const nextRole = normalizeArchitectureShareRole(event.target.value);
                        setRoleDrafts((current) => ({
                          ...current,
                          [share.userId]: nextRole,
                        }));
                        setInlineSaveError(null);
                      }}
                    >
                      {ARCHITECTURE_SHARE_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={
                      removeMutation.isPending
                      || roleSaveMutation.isPending
                      || grantMutation.isPending
                      || restrictMutation.isPending
                    }
                    data-testid={`architecture-identity-desk-share-remove-${share.userId}`}
                    onClick={() => void removeMutation.mutate(share.userId)}
                  >
                    {ARCHITECTURE_IDENTITY_DESK_SHARE_REMOVE_LABEL}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {canSaveRoles ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={!canSaveRoles}
            data-testid="architecture-identity-desk-share-save-roles"
            onClick={() => void roleSaveMutation.mutate(pendingRoleEntries)}
          >
            {ARCHITECTURE_IDENTITY_DESK_SHARE_SAVE_ROLES_LABEL}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3" data-testid="architecture-identity-desk-share-grant-form">
        <div className="grid gap-2">
          <Label htmlFor="architecture-identity-share-user-picker">
            {ARCHITECTURE_IDENTITY_DESK_SHARE_USER_PICKER_LABEL}
          </Label>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            {ARCHITECTURE_IDENTITY_DESK_SHARE_USERS_ONLY_HELPER}
          </p>
          <select
            id="architecture-identity-share-user-picker"
            className={cnField}
            value={pickerUserId}
            disabled={
              usersQuery.isLoading
              || grantMutation.isPending
              || restrictMutation.isPending
              || roleSaveMutation.isPending
              || removeMutation.isPending
            }
            data-testid="architecture-identity-desk-share-user-picker"
            onChange={(event) => {
              setPickerUserId(event.target.value);
              setShowGrantAttempt(false);
              setInlineSaveError(null);
            }}
          >
            {usersQuery.isLoading ? (
              <option value="">{ARCHITECTURE_IDENTITY_DESK_SHARE_LOADING_USERS_LABEL}</option>
            ) : null}
            {!usersQuery.isLoading && directoryUsers.length === 0 ? (
              <option value="">{ARCHITECTURE_IDENTITY_DESK_SHARE_NO_USERS_LABEL}</option>
            ) : null}
            {!usersQuery.isLoading
              ? directoryUsers.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.displayName} ({user.email})
                  </option>
                ))
              : null}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="architecture-identity-share-grant-role">{ARCHITECTURE_IDENTITY_DESK_SHARE_ROLE_LABEL}</Label>
          <select
            id="architecture-identity-share-grant-role"
            className={cnField}
            value={grantRole}
            disabled={
              grantMutation.isPending
              || restrictMutation.isPending
              || roleSaveMutation.isPending
              || removeMutation.isPending
            }
            data-testid="architecture-identity-desk-share-grant-role"
            onChange={(event) => {
              setGrantRole(normalizeArchitectureShareRole(event.target.value));
              setInlineSaveError(null);
            }}
          >
            {ARCHITECTURE_SHARE_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={!canGrant}
            data-testid="architecture-identity-desk-share-grant"
            onClick={() => {
              if (!grantSelection.isValid || grantSelection.userId === null) {
                setShowGrantAttempt(true);
                return;
              }

              void grantMutation.mutate({ userId: grantSelection.userId, role: grantRole });
            }}
          >
            {ARCHITECTURE_IDENTITY_DESK_SHARE_GRANT_LABEL}
          </Button>
          {showGrantAttempt && !grantSelection.isValid ? (
            <WhyDisabledCtaHint
              reason={whyDisabledIncompleteInput(ARCHITECTURE_IDENTITY_DESK_SHARE_SELECT_USER_REASON)}
              testId="architecture-identity-desk-share-grant-hint"
            />
          ) : (
            <WhyDisabledCtaHint reason={grantDisabledReason} testId="architecture-identity-desk-share-grant-hint" />
          )}
        </div>
      </div>

      {inlineSaveError !== null ? (
        <OperatorMutationInlineError
          message={inlineSaveError}
          testId="architecture-identity-desk-share-inline-error"
          recoveryScenario="api-problem"
        />
      ) : null}

      <LivelihoodPersistSaveStatus
        lastSavedUtc={lastSavedUtc}
        inlineSaveError={null}
        testId="architecture-identity-desk-share-save-status"
      />

      <LivelihoodDocumentGuardDialog
        open={documentGuards.dialogOpen}
        message={documentGuards.dialogMessage}
        onConfirmLeave={documentGuards.confirmLeave}
        onCancelLeave={documentGuards.cancelLeave}
      />
    </section>
  );
}
