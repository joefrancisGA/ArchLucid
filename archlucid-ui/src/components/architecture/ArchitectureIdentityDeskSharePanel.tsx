"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { LivelihoodPersistSaveStatus } from "@/components/operator/LivelihoodPersistSaveStatus";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useArchitectureSharesQuery } from "@/hooks/use-architecture-shares-query";
import {
  patchArchitectureRestrictToShares,
  putArchitectureShare,
  revokeArchitectureShare,
} from "@/lib/api/architecture-share-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { architectureIdentityMutationBlockedReason } from "@/lib/architecture/architecture-identity-mutation-blocked-reason";
import {
  ARCHITECTURE_IDENTITY_DESK_SHARE_ACTOR_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_ACTOR_PLACEHOLDER,
  ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_RESTRICT_REASON,
  ARCHITECTURE_IDENTITY_DESK_SHARE_EMPTY_ACTOR_REASON,
  ARCHITECTURE_IDENTITY_DESK_SHARE_ERROR_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_GRANT_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_HELPER,
  ARCHITECTURE_IDENTITY_DESK_SHARE_LOADING_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_REMOVE_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_RESTRICT_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_RETRY_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_ROLE_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_SAVE_RESTRICT_LABEL,
  ARCHITECTURE_IDENTITY_DESK_SHARE_TITLE,
  ARCHITECTURE_SHARE_ROLES,
  type ArchitectureShareRole,
} from "@/lib/architecture/architecture-share-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useLivelihoodDocumentGuards } from "@/hooks/use-livelihood-document-guards";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

const cnField =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

type ArchitectureIdentityDeskSharePanelProps = {
  readonly architectureId: string;
};

/** AS-092: Working desk control for architecture-scoped shares inside one tenant. */
export function ArchitectureIdentityDeskSharePanel(
  props: ArchitectureIdentityDeskSharePanelProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const queryClient = useQueryClient();
  const architectureId = props.architectureId.trim();
  const enabled = isWorkingMode && architectureId.length > 0;
  const sharesQuery = useArchitectureSharesQuery(architectureId, enabled);

  const [restrictToShares, setRestrictToShares] = useState(false);
  const [confirmRestrict, setConfirmRestrict] = useState(false);
  const [targetActorOid, setTargetActorOid] = useState("");
  const [role, setRole] = useState<ArchitectureShareRole>("View");
  const [savedRestrictToShares, setSavedRestrictToShares] = useState(false);
  const [savedConfirmRestrict, setSavedConfirmRestrict] = useState(false);
  const [showGrantAttempt, setShowGrantAttempt] = useState(false);
  const [showRestrictAttempt, setShowRestrictAttempt] = useState(false);
  const [lastSavedUtc, setLastSavedUtc] = useState<string | null>(null);
  const [inlineSaveError, setInlineSaveError] = useState<string | null>(null);

  const serverRestrictToShares = sharesQuery.data?.restrictToShares === true;

  useEffect(() => {
    if (sharesQuery.data === undefined) {
      return;
    }

    setRestrictToShares(serverRestrictToShares);
    setSavedRestrictToShares(serverRestrictToShares);
    setConfirmRestrict(serverRestrictToShares);
    setSavedConfirmRestrict(serverRestrictToShares);
  }, [serverRestrictToShares, sharesQuery.data]);

  const hasUnsavedEdits = useMemo(
    () =>
      restrictToShares !== savedRestrictToShares
      || confirmRestrict !== savedConfirmRestrict
      || targetActorOid.trim().length > 0,
    [confirmRestrict, restrictToShares, savedConfirmRestrict, savedRestrictToShares, targetActorOid],
  );

  useLivelihoodDocumentGuards({ when: hasUnsavedEdits });

  const invalidateShares = async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: operatorQueryKeys.architectureShares(architectureId),
    });
    await queryClient.invalidateQueries({
      queryKey: operatorQueryKeys.architectureIdentity(architectureId),
    });
  };

  const grantMutation = useMutation({
    mutationFn: () =>
      putArchitectureShare(architectureId, {
        actorOid: targetActorOid.trim(),
        role,
      }),
    onSuccess: async () => {
      setInlineSaveError(null);
      setTargetActorOid("");
      setShowGrantAttempt(false);
      setLastSavedUtc(new Date().toISOString());
      await invalidateShares();
    },
    onError: (error) => {
      const failure = toApiLoadFailure(error);
      setInlineSaveError(
        architectureIdentityMutationBlockedReason(failure)
          ?? formatVerboseApiFailureMessage(error, "Could not update this architecture share."),
      );
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (actorOid: string) => revokeArchitectureShare(architectureId, actorOid),
    onSuccess: async () => {
      setInlineSaveError(null);
      setLastSavedUtc(new Date().toISOString());
      await invalidateShares();
    },
    onError: (error) => {
      const failure = toApiLoadFailure(error);
      setInlineSaveError(
        architectureIdentityMutationBlockedReason(failure)
          ?? formatVerboseApiFailureMessage(error, "Could not remove this architecture share."),
      );
    },
  });

  const restrictMutation = useMutation({
    mutationFn: () =>
      patchArchitectureRestrictToShares(architectureId, {
        restrictToShares,
        confirmRestrict,
      }),
    onSuccess: async (response) => {
      setInlineSaveError(null);
      setShowRestrictAttempt(false);
      setSavedRestrictToShares(response.restrictToShares === true);
      setSavedConfirmRestrict(response.restrictToShares === true);
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
          {ARCHITECTURE_IDENTITY_DESK_SHARE_TITLE}
        </h2>
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_IDENTITY_DESK_SHARE_LOADING_LABEL}
        </p>
      </section>
    );
  }

  if (sharesQuery.isError || sharesQuery.data === undefined) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
        aria-labelledby="architecture-identity-share-heading"
        data-testid="architecture-identity-desk-share-error"
      >
        <h2 id="architecture-identity-share-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_SHARE_TITLE}
        </h2>
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)} role={sharesQuery.blockedReason !== null ? "alert" : undefined}>
          {sharesQuery.blockedReason ?? ARCHITECTURE_IDENTITY_DESK_SHARE_ERROR_LABEL}
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void sharesQuery.refetch()}>
          {ARCHITECTURE_IDENTITY_DESK_SHARE_RETRY_LABEL}
        </Button>
      </section>
    );
  }

  const shares = sharesQuery.data.shares ?? [];
  const canGrant =
    targetActorOid.trim().length > 0
    && !grantMutation.isPending
    && !revokeMutation.isPending
    && !restrictMutation.isPending;
  const canSaveRestrict =
    (!restrictToShares || confirmRestrict)
    && !restrictMutation.isPending
    && !grantMutation.isPending
    && !revokeMutation.isPending
    && (restrictToShares !== savedRestrictToShares || confirmRestrict !== savedConfirmRestrict);

  return (
    <section
      className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      aria-labelledby="architecture-identity-share-heading"
      data-testid="architecture-identity-desk-share"
    >
      <h2 id="architecture-identity-share-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
        {ARCHITECTURE_IDENTITY_DESK_SHARE_TITLE}
      </h2>
      <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {ARCHITECTURE_IDENTITY_DESK_SHARE_HELPER}
      </p>

      <div className="mt-3 space-y-3" data-testid="architecture-identity-desk-share-restrict">
        <div className="flex items-start gap-2">
          <Checkbox
            id="architecture-identity-share-restrict"
            checked={restrictToShares}
            onCheckedChange={(checked) => {
              setRestrictToShares(checked === true);
              setShowRestrictAttempt(false);
              setInlineSaveError(null);
            }}
            data-testid="architecture-identity-desk-share-restrict-toggle"
          />
          <Label htmlFor="architecture-identity-share-restrict" className="leading-snug">
            {ARCHITECTURE_IDENTITY_DESK_SHARE_RESTRICT_LABEL}
          </Label>
        </div>

        {restrictToShares ? (
          <div className="flex items-start gap-2">
            <Checkbox
              id="architecture-identity-share-confirm-restrict"
              checked={confirmRestrict}
              onCheckedChange={(checked) => {
                setConfirmRestrict(checked === true);
                setShowRestrictAttempt(false);
                setInlineSaveError(null);
              }}
              data-testid="architecture-identity-desk-share-confirm-restrict"
            />
            <Label htmlFor="architecture-identity-share-confirm-restrict" className="leading-snug">
              {ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_LABEL}
            </Label>
          </div>
        ) : null}

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={restrictMutation.isPending || grantMutation.isPending || revokeMutation.isPending}
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
              reason={whyDisabledIncompleteInput(ARCHITECTURE_IDENTITY_DESK_SHARE_CONFIRM_RESTRICT_REASON)}
              testId="architecture-identity-desk-share-restrict-hint"
            />
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3" data-testid="architecture-identity-desk-share-grant-form">
        <div className="grid gap-2">
          <Label htmlFor="architecture-identity-share-actor">{ARCHITECTURE_IDENTITY_DESK_SHARE_ACTOR_LABEL}</Label>
          <Input
            id="architecture-identity-share-actor"
            value={targetActorOid}
            placeholder={ARCHITECTURE_IDENTITY_DESK_SHARE_ACTOR_PLACEHOLDER}
            disabled={grantMutation.isPending || revokeMutation.isPending || restrictMutation.isPending}
            data-testid="architecture-identity-desk-share-actor"
            onChange={(event) => {
              setTargetActorOid(event.target.value);
              setShowGrantAttempt(false);
              setInlineSaveError(null);
            }}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="architecture-identity-share-role">{ARCHITECTURE_IDENTITY_DESK_SHARE_ROLE_LABEL}</Label>
          <select
            id="architecture-identity-share-role"
            className={cnField}
            value={role}
            disabled={grantMutation.isPending || revokeMutation.isPending || restrictMutation.isPending}
            data-testid="architecture-identity-desk-share-role"
            onChange={(event) => setRole(event.target.value as ArchitectureShareRole)}
          >
            {ARCHITECTURE_SHARE_ROLES.map((shareRole) => (
              <option key={shareRole} value={shareRole}>
                {shareRole}
              </option>
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
              if (!canGrant) {
                setShowGrantAttempt(true);
                return;
              }

              void grantMutation.mutate();
            }}
          >
            {ARCHITECTURE_IDENTITY_DESK_SHARE_GRANT_LABEL}
          </Button>
          {showGrantAttempt && !canGrant ? (
            <WhyDisabledCtaHint
              reason={whyDisabledIncompleteInput(ARCHITECTURE_IDENTITY_DESK_SHARE_EMPTY_ACTOR_REASON)}
              testId="architecture-identity-desk-share-grant-hint"
            />
          ) : null}
        </div>
      </div>

      {shares.length > 0 ? (
        <ul className="mt-4 space-y-2" data-testid="architecture-identity-desk-share-list">
          {shares.map((share) => (
            <li
              key={share.actorOid}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
            >
              <span className={OPERATOR_TYPOGRAPHY.body}>
                {share.actorOid}
                {" · "}
                {share.role}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={revokeMutation.isPending || grantMutation.isPending || restrictMutation.isPending}
                data-testid={`architecture-identity-desk-share-remove-${share.actorOid}`}
                onClick={() => {
                  const actorOid = share.actorOid?.trim();

                  if (actorOid === undefined || actorOid.length === 0) {
                    return;
                  }

                  void revokeMutation.mutate(actorOid);
                }}
              >
                {ARCHITECTURE_IDENTITY_DESK_SHARE_REMOVE_LABEL}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

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
    </section>
  );
}
