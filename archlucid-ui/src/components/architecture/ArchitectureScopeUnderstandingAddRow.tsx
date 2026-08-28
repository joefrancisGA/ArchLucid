"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL,
  SCOPE_UNDERSTANDING_ADD_EFFECT_HINT,
  SCOPE_UNDERSTANDING_ADD_LABEL,
  SCOPE_UNDERSTANDING_ADD_PLACEHOLDER,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { OPERATOR_FORM_FIELD_STACK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { UseArchitectureScopeUnderstandingCheckResult } from "./use-architecture-scope-understanding-check";

export type ArchitectureScopeUnderstandingAddRowProps = {
  readonly viewModel: UseArchitectureScopeUnderstandingCheckResult;
};

export function ArchitectureScopeUnderstandingAddRow({ viewModel }: ArchitectureScopeUnderstandingAddRowProps) {
  const {
    newBulletText,
    setNewBulletText,
    confirmed,
    disabled,
    canAddBullet,
    addErrorMessage,
    addFieldDescribedBy,
    addBulletFromDraft,
  } = viewModel;

  return (
    <div
      className={cn(
        OPERATOR_FORM_FIELD_STACK_CLASS,
        "border-t border-al-border-subtle pt-4",
      )}
      data-testid="architecture-scope-understanding-add"
    >
      <Label htmlFor="architecture-scope-understanding-new">
        {SCOPE_UNDERSTANDING_ADD_LABEL}
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[12rem] flex-1">
          <Input
            id="architecture-scope-understanding-new"
            value={newBulletText}
            disabled={disabled === true || confirmed}
            placeholder={SCOPE_UNDERSTANDING_ADD_PLACEHOLDER}
            aria-invalid={addErrorMessage !== null}
            aria-describedby={addFieldDescribedBy()}
            onChange={(event) => {
              setNewBulletText(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              event.preventDefault();

              if (!canAddBullet) {
                return;
              }

              addBulletFromDraft();
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canAddBullet}
          data-testid="architecture-scope-understanding-add-button"
          onClick={() => {
            addBulletFromDraft();
          }}
        >
          {SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL}
        </Button>
      </div>
      {addErrorMessage !== null ? (
        <p
          id="architecture-scope-understanding-add-error"
          role="alert"
          className={cn("m-0 text-red-800 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-scope-understanding-add-error"
        >
          {addErrorMessage}
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
  );
}
