"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { patchArchitectureIdentity } from "@/lib/api/architecture-identity-api";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_IDENTITY_ARCHIVE_ACTION_LABEL,
  ARCHITECTURE_IDENTITY_ARCHIVE_CONFIRM_ACTION_LABEL,
  ARCHITECTURE_IDENTITY_ARCHIVE_CONFIRM_CANCEL_LABEL,
  ARCHITECTURE_IDENTITY_ARCHIVE_CONFIRM_TITLE,
  ARCHITECTURE_IDENTITY_ARCHIVE_FAILURE_MESSAGE,
  ARCHITECTURE_IDENTITY_ARCHIVE_SUCCESS_TOAST,
  ARCHITECTURE_IDENTITY_RESTORE_ACTION_LABEL,
  ARCHITECTURE_IDENTITY_RESTORE_CONFIRM_ACTION_LABEL,
  ARCHITECTURE_IDENTITY_RESTORE_CONFIRM_TITLE,
  ARCHITECTURE_IDENTITY_RESTORE_SUCCESS_TOAST,
  architectureIdentityArchiveConfirmDescription,
  architectureIdentityRestoreConfirmDescription,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

export type ArchitectureIdentityArchiveControlProps = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly archivedUtc?: string | null;
  readonly redirectAfterArchive?: boolean;
  readonly onArchiveStateChanged?: () => void;
};

/** Soft-archives or restores a customer architecture identity without deleting child rows (CA-49). */
export function ArchitectureIdentityArchiveControl(
  props: ArchitectureIdentityArchiveControlProps,
): React.JSX.Element | null {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scopeKey = useOperatorScopeQueryKey();
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const canExecute = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const isArchived = (props.archivedUtc?.trim().length ?? 0) > 0;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      patchArchitectureIdentity(props.architectureId, { archived: !isArchived }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: operatorQueryKeys.architectureIdentity(props.architectureId),
      });
      await queryClient.invalidateQueries({
        queryKey: ["operator", "architecture", "identity-list", scopeKey],
      });

      toast.success(isArchived ? ARCHITECTURE_IDENTITY_RESTORE_SUCCESS_TOAST : ARCHITECTURE_IDENTITY_ARCHIVE_SUCCESS_TOAST);
      props.onArchiveStateChanged?.();
      setConfirmOpen(false);

      if (!isArchived && props.redirectAfterArchive === true) {
        router.push(ARCHITECTURES_LIST_PATH);
      }

      router.refresh();
    },
    onError: (error) => {
      toast.error(
        ARCHITECTURE_IDENTITY_ARCHIVE_FAILURE_MESSAGE,
        { description: formatVerboseApiFailureMessage(error, ARCHITECTURE_IDENTITY_ARCHIVE_FAILURE_MESSAGE) },
      );
    },
  });

  const handleConfirm = useCallback(() => {
    void mutation.mutate();
  }, [mutation]);

  if (!canExecute) {
    return null;
  }

  const actionLabel = isArchived
    ? ARCHITECTURE_IDENTITY_RESTORE_ACTION_LABEL
    : ARCHITECTURE_IDENTITY_ARCHIVE_ACTION_LABEL;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid={
          isArchived ? "architecture-identity-restore" : "architecture-identity-archive"
        }
        disabled={mutation.isPending}
        onClick={() => setConfirmOpen(true)}
      >
        {actionLabel}
      </Button>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!mutation.isPending) {
            setConfirmOpen(open);
          }
        }}
        title={isArchived ? ARCHITECTURE_IDENTITY_RESTORE_CONFIRM_TITLE : ARCHITECTURE_IDENTITY_ARCHIVE_CONFIRM_TITLE}
        description={
          isArchived
            ? architectureIdentityRestoreConfirmDescription(props.displayName)
            : architectureIdentityArchiveConfirmDescription(props.displayName)
        }
        confirmLabel={
          isArchived
            ? ARCHITECTURE_IDENTITY_RESTORE_CONFIRM_ACTION_LABEL
            : ARCHITECTURE_IDENTITY_ARCHIVE_CONFIRM_ACTION_LABEL
        }
        cancelLabel={ARCHITECTURE_IDENTITY_ARCHIVE_CONFIRM_CANCEL_LABEL}
        variant={isArchived ? "default" : "destructive"}
        busy={mutation.isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
