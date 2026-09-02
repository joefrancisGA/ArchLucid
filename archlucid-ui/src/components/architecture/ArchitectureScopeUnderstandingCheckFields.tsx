"use client";

import type { MouseEvent } from "react";

import { ArchitectureScopeUnderstandingRow } from "@/components/architecture/ArchitectureScopeUnderstandingRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import {
  scopeBulletBehavior,
  SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL,
  SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL,
  SCOPE_UNDERSTANDING_ADD_EFFECT_HINT,
  SCOPE_UNDERSTANDING_ADD_LABEL,
  SCOPE_UNDERSTANDING_ADD_PLACEHOLDER,
  SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT,
  SCOPE_UNDERSTANDING_CONFIRM_LABEL,
  SCOPE_UNDERSTANDING_CONFIRMED_STATUS_LABEL,
  SCOPE_UNDERSTANDING_EDIT_SCOPE_LABEL,
  SCOPE_UNDERSTANDING_SAVE_ERROR_HINT,
  SCOPE_UNDERSTANDING_SAVING_HINT,
  SCOPE_UNDERSTANDING_STALE_HINT,
  scopeConfirmedSummaryMessage,
  SCOPE_UNDERSTANDING_READY_HINT,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import {
  DESIGN_TOKENS,
  OPERATOR_FORM_FIELD_STACK_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureScopeUnderstandingCheckFieldsProps = {
  readonly bullets: readonly ScopeUnderstandingBullet[];
  readonly disabled?: boolean;
  readonly contextSourceLabel?: string;
  readonly readyHint?: string;
  readonly showReadyHint?: boolean;
  readonly draftSaveState?: ArchitectureDraftSaveState;
  readonly confirmed: boolean;
  readonly scopeStale: boolean;
  readonly scopePersistFailed: boolean;
  readonly editingAllowed: boolean;
  readonly canConfirmScope: boolean;
  readonly confirmedBriefLineCount: number;
  readonly scopePersistenceInFlight: boolean;
  readonly newBulletText: string;
  readonly canAddBullet: boolean;
  readonly addErrorMessage: string | null;
  readonly nextStepAnchorId?: string;
  readonly nextStepAnchorLabel?: string;
  readonly onNewBulletTextChange: (value: string) => void;
  readonly onAddBullet: () => void;
  readonly onRowValueChange: (bulletId: string, value: string) => void;
  readonly onRowRemove: (bulletId: string) => void;
  readonly onConfirm: () => void;
  readonly onEditScope: () => void;
  readonly onNextStepJump: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/** Field groups for the scope-understanding check (bullet rows, add row, confirm affordances). */
export function ArchitectureScopeUnderstandingCheckFields(
  props: ArchitectureScopeUnderstandingCheckFieldsProps,
): React.JSX.Element {
  const addFieldDescribedBy = (): string | undefined => {
    if (props.addErrorMessage !== null) {
      return "architecture-scope-understanding-add-error";
    }

    return "architecture-scope-understanding-add-effect";
  };

  return (
    <>
      <ul
        className={cn("m-0 list-none space-y-4 p-0", OPERATOR_TYPOGRAPHY.body)}
        data-testid="architecture-scope-understanding-bullets"
      >
        {props.bullets.map((bullet) => (
          <ArchitectureScopeUnderstandingRow
            key={bullet.id}
            bullet={bullet}
            disabled={!props.editingAllowed}
            contextSourceLabel={props.contextSourceLabel ?? SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL}
            onValueChange={props.onRowValueChange}
            onRemove={props.onRowRemove}
          />
        ))}
      </ul>

      <div className={OPERATOR_FORM_FIELD_STACK_CLASS} data-testid="architecture-scope-understanding-add">
        <Label htmlFor="architecture-scope-understanding-new">{SCOPE_UNDERSTANDING_ADD_LABEL}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[12rem] flex-1">
            <Input
              id="architecture-scope-understanding-new"
              value={props.newBulletText}
              disabled={props.disabled === true || props.confirmed}
              placeholder={SCOPE_UNDERSTANDING_ADD_PLACEHOLDER}
              aria-invalid={props.addErrorMessage !== null}
              aria-describedby={addFieldDescribedBy()}
              onChange={(event) => {
                props.onNewBulletTextChange(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }

                event.preventDefault();

                if (!props.canAddBullet) {
                  return;
                }

                props.onAddBullet();
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!props.canAddBullet}
            data-testid="architecture-scope-understanding-add-button"
            onClick={() => {
              props.onAddBullet();
            }}
          >
            {SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL}
          </Button>
        </div>
        {props.addErrorMessage !== null ? (
          <p
            id="architecture-scope-understanding-add-error"
            role="alert"
            className={cn("m-0 text-red-800 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="architecture-scope-understanding-add-error"
          >
            {props.addErrorMessage}
          </p>
        ) : null}
        <p
          id="architecture-scope-understanding-add-effect"
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-scope-understanding-add-effect"
        >
          {SCOPE_UNDERSTANDING_ADD_EFFECT_HINT}
        </p>
      </div>

      <div className="space-y-3 border-t border-al-border-subtle pt-4">
        {!props.confirmed && !props.canConfirmScope ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            role="status"
            data-testid="architecture-scope-understanding-confirm-readiness"
          >
            {SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT}
          </p>
        ) : null}

        {!props.confirmed && props.scopeStale ? (
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

        {props.confirmed ? (
          props.draftSaveState === "error" || props.scopePersistFailed ? (
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
                disabled={props.disabled === true}
                data-testid="architecture-scope-understanding-edit-scope"
                onClick={props.onEditScope}
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
                {props.scopePersistenceInFlight ? <StatusTag kind="in-progress" label="Saving" /> : null}
              </div>
              <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {scopeConfirmedSummaryMessage(props.confirmedBriefLineCount)}
              </p>
              {props.scopePersistenceInFlight ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="architecture-scope-understanding-saving"
                >
                  {SCOPE_UNDERSTANDING_SAVING_HINT}
                </p>
              ) : props.showReadyHint !== false ? (
                <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                  {props.readyHint ?? SCOPE_UNDERSTANDING_READY_HINT}
                </p>
              ) : null}
              {props.nextStepAnchorId !== undefined && props.nextStepAnchorId.trim().length > 0 ? (
                <a
                  href={`#${props.nextStepAnchorId}`}
                  className={OPERATOR_LINK.nav}
                  data-testid="architecture-scope-understanding-next-step"
                  onClick={props.onNextStepJump}
                >
                  {props.nextStepAnchorLabel ?? "Continue"}
                </a>
              ) : null}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={props.disabled === true}
                  data-testid="architecture-scope-understanding-edit-scope"
                  onClick={props.onEditScope}
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
              disabled={props.disabled === true || !props.canConfirmScope}
              data-testid="architecture-scope-understanding-confirm"
              onClick={props.onConfirm}
            >
              {SCOPE_UNDERSTANDING_CONFIRM_LABEL}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
