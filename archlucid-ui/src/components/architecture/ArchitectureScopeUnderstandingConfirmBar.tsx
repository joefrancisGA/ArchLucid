"use client";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT,
  SCOPE_UNDERSTANDING_CONFIRM_LABEL,
  SCOPE_UNDERSTANDING_CONFIRMED_STATUS_LABEL,
  SCOPE_UNDERSTANDING_EDIT_SCOPE_LABEL,
  SCOPE_UNDERSTANDING_READY_HINT,
  SCOPE_UNDERSTANDING_SAVE_ERROR_HINT,
  SCOPE_UNDERSTANDING_SAVING_HINT,
  SCOPE_UNDERSTANDING_STALE_HINT,
  scopeConfirmedSummaryMessage,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { UseArchitectureScopeUnderstandingCheckResult } from "./use-architecture-scope-understanding-check";

export type ArchitectureScopeUnderstandingConfirmBarProps = {
  readonly viewModel: UseArchitectureScopeUnderstandingCheckResult;
};

export function ArchitectureScopeUnderstandingConfirmBar({ viewModel }: ArchitectureScopeUnderstandingConfirmBarProps) {
  const {
    confirmed,
    scopeStale,
    scopePersistFailed,
    handleConfirm,
    handleEditScope,
    canConfirmScope,
    confirmedBriefLineCount,
    scopePersistenceInFlight,
    handleNextStepJump,
    disabled,
    draftSaveState,
    readyHint,
    showReadyHint,
    nextStepAnchorId,
    nextStepAnchorLabel,
  } = viewModel;

  return (
    <div className="space-y-3 border-t border-al-border-subtle pt-4">
      {!confirmed && !canConfirmScope ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
          data-testid="architecture-scope-understanding-confirm-readiness"
        >
          {SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT}
        </p>
      ) : null}

      {!confirmed && scopeStale ? (
        <div
          className={cn(DESIGN_TOKENS.callout.warnShell, "items-start")}
          role="status"
          data-testid="architecture-scope-understanding-stale"
        >
          <StatusTag kind="needs-attention" label="Re-confirm scope" />
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {SCOPE_UNDERSTANDING_STALE_HINT}
          </p>
        </div>
      ) : null}

      {confirmed ? (
        draftSaveState === "error" || scopePersistFailed ? (
          <div
            className={cn(DESIGN_TOKENS.callout.blockedShell, "items-start")}
            role="alert"
            data-testid="architecture-scope-understanding-save-error"
          >
            <StatusTag kind="blocked" label="Save failed" />
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {SCOPE_UNDERSTANDING_SAVE_ERROR_HINT}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled === true}
              data-testid="architecture-scope-understanding-edit-scope"
              onClick={handleEditScope}
            >
              {SCOPE_UNDERSTANDING_EDIT_SCOPE_LABEL}
            </Button>
          </div>
        ) : (
          <div
            className={cn(DESIGN_TOKENS.callout.success, "space-y-2")}
            role="status"
            aria-live="polite"
            data-testid="architecture-scope-understanding-ready"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusTag kind="ready" label={SCOPE_UNDERSTANDING_CONFIRMED_STATUS_LABEL} />
              {scopePersistenceInFlight ? <StatusTag kind="in-progress" label="Saving" /> : null}
            </div>
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {scopeConfirmedSummaryMessage(confirmedBriefLineCount)}
            </p>
            {scopePersistenceInFlight ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="architecture-scope-understanding-saving"
              >
                {SCOPE_UNDERSTANDING_SAVING_HINT}
              </p>
            ) : showReadyHint !== false ? (
              <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                {readyHint ?? SCOPE_UNDERSTANDING_READY_HINT}
              </p>
            ) : null}
            {nextStepAnchorId !== undefined && nextStepAnchorId.trim().length > 0 ? (
              <a
                href={`#${nextStepAnchorId}`}
                className={OPERATOR_LINK.nav}
                data-testid="architecture-scope-understanding-next-step"
                onClick={handleNextStepJump}
              >
                {nextStepAnchorLabel ?? "Continue"}
              </a>
            ) : null}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled === true}
                data-testid="architecture-scope-understanding-edit-scope"
                onClick={handleEditScope}
              >
                {SCOPE_UNDERSTANDING_EDIT_SCOPE_LABEL}
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={disabled === true || !canConfirmScope}
            data-testid="architecture-scope-understanding-confirm"
            onClick={handleConfirm}
          >
            {SCOPE_UNDERSTANDING_CONFIRM_LABEL}
          </Button>
        </div>
      )}
    </div>
  );
}
