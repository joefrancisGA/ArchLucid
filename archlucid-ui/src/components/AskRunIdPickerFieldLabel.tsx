"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_FORM_FIELD_STACK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Label } from "@/components/ui/label";

export type AskRunIdPickerFieldLabelProps = {
  readonly labelText: string;
  readonly selectControlId: string;
  readonly trimmedValue: string;
  readonly selectedThreadId: string;
};

export function AskRunIdPickerFieldLabel({
  labelText,
  selectControlId,
  trimmedValue,
  selectedThreadId,
}: AskRunIdPickerFieldLabelProps) {
  const optionalHint =
    trimmedValue.length > 0
      ? null
      : selectedThreadId.trim().length > 0
        ? "(optional when a conversation already has review context)"
        : "(optional — default searches all reviews in this workspace)";

  return (
    <Label htmlFor={selectControlId} data-testid="ask-run-id-picker-label">
      {labelText}
      {optionalHint !== null ? (
        <>
          {" "}
          <span className="font-normal text-al-text-secondary">{optionalHint}</span>
        </>
      ) : null}
    </Label>
  );
}

export type AskRunIdPickerFieldHelperProps = {
  readonly hideFieldHelper: boolean;
  readonly children: React.ReactNode;
};

export function AskRunIdPickerFieldHelper({ hideFieldHelper, children }: AskRunIdPickerFieldHelperProps) {
  if (hideFieldHelper) {
    return null;
  }

  return (
    <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
      {children}
    </p>
  );
}

export function AskRunIdPickerFieldStack({
  reviewFieldLabel,
  children,
  helper,
}: {
  readonly reviewFieldLabel: React.ReactNode;
  readonly children: React.ReactNode;
  readonly helper?: React.ReactNode;
}) {
  return (
    <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
      {reviewFieldLabel}
      {children}
      {helper ?? null}
    </div>
  );
}
