"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { patchArchitectureIdentity } from "@/lib/api/architecture-identity-api";
import {
  ARCHITECTURE_IDENTITY_DESK_RENAME_EMPTY_ERROR,
  ARCHITECTURE_IDENTITY_DESK_RENAME_HELPER,
  ARCHITECTURE_IDENTITY_DESK_RENAME_LABEL,
  ARCHITECTURE_IDENTITY_DESK_RENAME_SAVE_LABEL,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { formatVerboseApiFailureMessage } from "@/lib/resolve-api-error-message";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { cn } from "@/lib/utils";

type ArchitectureIdentityRenameFormProps = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly onRenamed?: (displayName: string) => void;
};

export function ArchitectureIdentityRenameForm(
  props: ArchitectureIdentityRenameFormProps,
): React.JSX.Element {
  const queryClient = useQueryClient();
  const [draftName, setDraftName] = useState(props.displayName);
  const [showEmptyError, setShowEmptyError] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    setDraftName(props.displayName);
  }, [props.displayName]);

  const trimmedDraftName = draftName.trim();
  const trimmedSavedName = props.displayName.trim();
  const isDirty = trimmedDraftName !== trimmedSavedName;
  const canSave = isDirty && trimmedDraftName.length > 0;

  const saveMutation = useMutation({
    mutationFn: () =>
      patchArchitectureIdentity(props.architectureId, { displayName: trimmedDraftName }),
    onSuccess: async (updated) => {
      setInlineError(null);
      setShowEmptyError(false);
      setDraftName(updated.displayName);
      props.onRenamed?.(updated.displayName);
      await queryClient.invalidateQueries({
        queryKey: operatorQueryKeys.architectureIdentity(props.architectureId),
      });
    },
    onError: (error) => {
      setInlineError(formatVerboseApiFailureMessage(error, "Could not rename this architecture."));
    },
  });

  const emptyFieldError = useMemo(() => {
    if (!showEmptyError || trimmedDraftName.length > 0) {
      return null;
    }

    return ARCHITECTURE_IDENTITY_DESK_RENAME_EMPTY_ERROR;
  }, [showEmptyError, trimmedDraftName.length]);

  return (
    <section
      className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      aria-labelledby="architecture-identity-rename-heading"
      data-testid="architecture-identity-rename-form"
    >
      <h2 id="architecture-identity-rename-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
        {ARCHITECTURE_IDENTITY_DESK_RENAME_LABEL}
      </h2>
      <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {ARCHITECTURE_IDENTITY_DESK_RENAME_HELPER}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-1">
          <Input
            value={draftName}
            aria-label={ARCHITECTURE_IDENTITY_DESK_RENAME_LABEL}
            aria-invalid={emptyFieldError !== null}
            aria-describedby={
              emptyFieldError !== null ? "architecture-identity-rename-field-error" : undefined
            }
            disabled={saveMutation.isPending}
            data-testid="architecture-identity-rename-input"
            onChange={(event) => {
              setDraftName(event.target.value);
              setShowEmptyError(false);
              setInlineError(null);
            }}
          />
          {emptyFieldError !== null ? (
            <p
              id="architecture-identity-rename-field-error"
              className={cn("text-al-text-danger", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="architecture-identity-rename-field-error"
            >
              {emptyFieldError}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit shrink-0"
          disabled={!canSave || saveMutation.isPending}
          data-testid="architecture-identity-rename-save"
          onClick={() => {
            if (trimmedDraftName.length === 0) {
              setShowEmptyError(true);
              return;
            }

            void saveMutation.mutate();
          }}
        >
          {ARCHITECTURE_IDENTITY_DESK_RENAME_SAVE_LABEL}
        </Button>
      </div>
      {inlineError !== null ? (
        <OperatorMutationInlineError
          message={inlineError}
          testId="architecture-identity-rename-inline-error"
          recoveryScenario="api-problem"
        />
      ) : null}
    </section>
  );
}
