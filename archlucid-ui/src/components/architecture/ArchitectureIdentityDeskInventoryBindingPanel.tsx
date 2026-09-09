"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { LivelihoodPersistSaveStatus } from "@/components/operator/LivelihoodPersistSaveStatus";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useArchitectureInventoryBindingQuery } from "@/hooks/use-architecture-inventory-binding-query";
import {
  attachArchitectureInventoryBinding,
  detachArchitectureInventoryBinding,
} from "@/lib/api/architecture-inventory-binding-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { architectureIdentityMutationBlockedReason } from "@/lib/architecture/architecture-identity-mutation-blocked-reason";
import {
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_ATTACH_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_BOUND_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_DETACH_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_ERROR_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_HELPER,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_INFRA_LINK_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_INVALID_PASTE_ERROR,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_LOADING_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_LOADING_SNAPSHOTS_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_NO_SNAPSHOTS,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_PASTE_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_PASTE_PLACEHOLDER,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_PICKER_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_RETRY_LABEL,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_SELECT_SNAPSHOT_REASON,
  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_TITLE,
} from "@/lib/architecture/architecture-inventory-binding-copy";
import {
  ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_HELPER,
  formatArchitectureInventoryUnboundEstateGapLine,
} from "@/lib/architecture/architecture-inventory-estate-gap-copy";
import { resolveArchitectureInventoryBindingSnapshotId } from "@/lib/architecture/architecture-inventory-binding-validation";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import {
  formatInfraEvidenceSnapshotCapturedLabel,
  formatInfraEvidenceSnapshotLabel,
} from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

const cnField =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

const SNAPSHOTS_PAGE_SIZE = 50;

type ArchitectureIdentityDeskInventoryBindingPanelProps = {
  readonly architectureId: string;
};

/** AS-049: Working desk control to bind an existing Azure inventory snapshot. */
export function ArchitectureIdentityDeskInventoryBindingPanel(
  props: ArchitectureIdentityDeskInventoryBindingPanelProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const queryClient = useQueryClient();
  const architectureId = props.architectureId.trim();
  const enabled = isWorkingMode && architectureId.length > 0;
  const bindingQuery = useArchitectureInventoryBindingQuery(architectureId, enabled);
  const [pickerSnapshotId, setPickerSnapshotId] = useState("");
  const [pastedSnapshotId, setPastedSnapshotId] = useState("");
  const [showAttachAttempt, setShowAttachAttempt] = useState(false);
  const [lastSavedUtc, setLastSavedUtc] = useState<string | null>(null);
  const [inlineSaveError, setInlineSaveError] = useState<string | null>(null);

  const snapshotsQuery = useQuery({
    queryKey: operatorQueryKeys.infraEvidenceSnapshotsList(1, SNAPSHOTS_PAGE_SIZE),
    queryFn: () => fetchInfraEvidenceSnapshots(1, SNAPSHOTS_PAGE_SIZE),
    enabled,
    staleTime: 60_000,
    retry: false,
  });

  const snapshots = snapshotsQuery.data?.items ?? [];
  const selection = useMemo(
    () =>
      resolveArchitectureInventoryBindingSnapshotId({
        pickerSnapshotId,
        pastedSnapshotId,
      }),
    [pickerSnapshotId, pastedSnapshotId],
  );

  const attachMutation = useMutation({
    mutationFn: (snapshotId: string) =>
      attachArchitectureInventoryBinding(architectureId, { snapshotId }),
    onSuccess: async () => {
      setInlineSaveError(null);
      setShowAttachAttempt(false);
      setPastedSnapshotId("");
      setLastSavedUtc(new Date().toISOString());
      await queryClient.invalidateQueries({
        queryKey: operatorQueryKeys.architectureInventoryBinding(architectureId),
      });
    },
    onError: (error) => {
      const failure = toApiLoadFailure(error);
      setInlineSaveError(
        architectureIdentityMutationBlockedReason(failure)
          ?? formatVerboseApiFailureMessage(error, "Could not bind this inventory snapshot."),
      );
    },
  });

  const detachMutation = useMutation({
    mutationFn: () => detachArchitectureInventoryBinding(architectureId),
    onSuccess: async () => {
      setInlineSaveError(null);
      setPickerSnapshotId("");
      setPastedSnapshotId("");
      setLastSavedUtc(new Date().toISOString());
      await queryClient.invalidateQueries({
        queryKey: operatorQueryKeys.architectureInventoryBinding(architectureId),
      });
    },
    onError: (error) => {
      const failure = toApiLoadFailure(error);
      setInlineSaveError(
        architectureIdentityMutationBlockedReason(failure)
          ?? formatVerboseApiFailureMessage(error, "Could not detach this inventory snapshot."),
      );
    },
  });

  if (!enabled) {
    return null;
  }

  if (bindingQuery.isLoading) {
    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
        aria-labelledby="architecture-identity-inventory-binding-heading"
        data-testid="architecture-identity-desk-inventory-binding-loading"
      >
        <h2 id="architecture-identity-inventory-binding-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_TITLE}
        </h2>
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_LOADING_LABEL}
        </p>
      </section>
    );
  }

  if (bindingQuery.isError || bindingQuery.data === undefined) {
    const blockedReason = bindingQuery.blockedReason;

    return (
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
        aria-labelledby="architecture-identity-inventory-binding-heading"
        data-testid="architecture-identity-desk-inventory-binding-error"
      >
        <h2 id="architecture-identity-inventory-binding-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_TITLE}
        </h2>
        <p
          className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}
          role={blockedReason !== null ? "alert" : undefined}
        >
          {blockedReason ?? ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_ERROR_LABEL}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => void bindingQuery.refetch()}
        >
          {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_RETRY_LABEL}
        </Button>
      </section>
    );
  }

  const binding = bindingQuery.data;
  const isBound = binding.isBound === true;
  const unboundEstateGapLine = formatArchitectureInventoryUnboundEstateGapLine(binding);
  const canAttach =
    selection.isValid
    && !attachMutation.isPending
    && !detachMutation.isPending
    && !isBound;
  const attachDisabledReason =
    canAttach || attachMutation.isPending
      ? null
      : whyDisabledIncompleteInput(ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_SELECT_SNAPSHOT_REASON);

  return (
    <section
      className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      aria-labelledby="architecture-identity-inventory-binding-heading"
      data-testid="architecture-identity-desk-inventory-binding"
    >
      <h2 id="architecture-identity-inventory-binding-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
        {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_TITLE}
      </h2>
      <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_HELPER}
      </p>

      {isBound ? (
        <div className="mt-3 space-y-2" data-testid="architecture-identity-desk-inventory-binding-bound">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            <span className="font-medium">{ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_BOUND_LABEL}:</span>
            {" "}
            {binding.snapshotSubscriptionName?.trim().length
              ? binding.snapshotSubscriptionName
              : binding.snapshotId}
            {binding.snapshotCapturedUtc != null && binding.snapshotCapturedUtc.trim().length > 0
              ? ` · captured ${formatInfraEvidenceSnapshotCapturedLabel(binding.snapshotCapturedUtc)}`
              : null}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={detachMutation.isPending || attachMutation.isPending}
            data-testid="architecture-identity-desk-inventory-binding-detach"
            onClick={() => void detachMutation.mutate()}
          >
            {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_DETACH_LABEL}
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3" data-testid="architecture-identity-desk-inventory-binding-unbound">
          {unboundEstateGapLine !== null ? (
            <div
              className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-950/30"
              data-testid="architecture-identity-desk-inventory-binding-estate-gap"
            >
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {unboundEstateGapLine}
              </p>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                {ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_HELPER}
              </p>
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="architecture-identity-inventory-binding-picker">
              {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_PICKER_LABEL}
            </Label>
            <select
              id="architecture-identity-inventory-binding-picker"
              className={cnField}
              data-testid="architecture-identity-desk-inventory-binding-picker"
              disabled={snapshotsQuery.isLoading || attachMutation.isPending || detachMutation.isPending}
              value={pickerSnapshotId}
              onChange={(event) => {
                setPickerSnapshotId(event.target.value);
                setShowAttachAttempt(false);
                setInlineSaveError(null);
              }}
            >
              {snapshotsQuery.isLoading ? (
                <option value="">{ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_LOADING_SNAPSHOTS_LABEL}</option>
              ) : null}
              {!snapshotsQuery.isLoading && snapshots.length === 0 ? (
                <option value="">{ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_NO_SNAPSHOTS}</option>
              ) : null}
              {!snapshotsQuery.isLoading
                ? snapshots.map((snapshot) => (
                    <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                      {formatInfraEvidenceSnapshotLabel(snapshot)}
                    </option>
                  ))
                : null}
            </select>
            {!snapshotsQuery.isLoading && snapshots.length === 0 ? (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-identity-desk-inventory-binding-no-snapshots">
                <Link href="/governance/infrastructure/drift" className={OPERATOR_LINK.nav}>
                  {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_INFRA_LINK_LABEL}
                </Link>
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="architecture-identity-inventory-binding-paste">
              {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_PASTE_LABEL}
            </Label>
            <Input
              id="architecture-identity-inventory-binding-paste"
              value={pastedSnapshotId}
              placeholder={ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_PASTE_PLACEHOLDER}
              aria-invalid={selection.showInvalidPasteError}
              aria-describedby={
                selection.showInvalidPasteError
                  ? "architecture-identity-inventory-binding-paste-error"
                  : undefined
              }
              disabled={attachMutation.isPending || detachMutation.isPending}
              data-testid="architecture-identity-desk-inventory-binding-paste"
              onChange={(event) => {
                setPastedSnapshotId(event.target.value);
                setShowAttachAttempt(false);
                setInlineSaveError(null);
              }}
            />
            {selection.showInvalidPasteError ? (
              <p
                id="architecture-identity-inventory-binding-paste-error"
                className={cn("m-0 text-al-text-danger", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="architecture-identity-desk-inventory-binding-paste-error"
              >
                {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_INVALID_PASTE_ERROR}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={!canAttach}
              data-testid="architecture-identity-desk-inventory-binding-attach"
              onClick={() => {
                if (!selection.isValid || selection.snapshotId === null) {
                  setShowAttachAttempt(true);
                  return;
                }

                void attachMutation.mutate(selection.snapshotId);
              }}
            >
              {ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_ATTACH_LABEL}
            </Button>
            {showAttachAttempt && !selection.isValid ? (
              <WhyDisabledCtaHint
                reason={whyDisabledIncompleteInput(
                  ARCHITECTURE_IDENTITY_DESK_INVENTORY_BINDING_SELECT_SNAPSHOT_REASON,
                )}
                testId="architecture-identity-desk-inventory-binding-attach-hint"
              />
            ) : (
              <WhyDisabledCtaHint
                reason={attachDisabledReason}
                testId="architecture-identity-desk-inventory-binding-attach-hint"
              />
            )}
          </div>
        </div>
      )}

      {inlineSaveError !== null ? (
        <OperatorMutationInlineError
          message={inlineSaveError}
          testId="architecture-identity-desk-inventory-binding-inline-error"
          recoveryScenario="api-problem"
        />
      ) : null}

      <LivelihoodPersistSaveStatus
        lastSavedUtc={lastSavedUtc}
        inlineSaveError={null}
        testId="architecture-identity-desk-inventory-binding-save-status"
      />
    </section>
  );
}
