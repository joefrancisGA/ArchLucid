"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isScopeBulletEditable,
  isScopeBulletRemovable,
  scopeReadOnlyHint,
  SCOPE_ITEM_MAX_LENGTH,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureScopeUnderstandingRowProps = {
  readonly bullet: ScopeUnderstandingBullet;
  readonly disabled: boolean;
  /** Names the field that owns the architecture context text on this surface. */
  readonly contextSourceLabel: string;
  readonly onValueChange: (bulletId: string, nextValue: string) => void;
  readonly onRemove: (bulletId: string) => void;
};

const LABEL_COLUMN_CLASS = "min-w-[11rem] text-al-text-secondary";

/**
 * Operator-added rows all share one label, so they are named by their value to keep every Remove
 * button distinguishable to a screen reader.
 */
function removeButtonLabel(bullet: ScopeUnderstandingBullet): string {
  const named = bullet.kind === "custom" && bullet.value.trim().length > 0 ? bullet.value.trim() : bullet.label;

  return `Remove ${named} from scope`;
}

/**
 * One typed in-scope row: a static label naming the intake field it came from, plus either an editable
 * value or a read-only preview when the value is owned by another field on the page.
 */
export function ArchitectureScopeUnderstandingRow(
  props: ArchitectureScopeUnderstandingRowProps,
): React.JSX.Element {
  const bullet = props.bullet;
  const editable = isScopeBulletEditable(bullet.kind);
  const removable = isScopeBulletRemovable(bullet.kind);
  const inputId = `architecture-scope-bullet-${bullet.id}`;
  const showSourcePointer = bullet.kind === "context";

  return (
    <li className="flex flex-wrap items-start gap-2" data-testid={`architecture-scope-row-${bullet.id}`}>
      {bullet.label.length === 0 ? null : editable ? (
        <Label
          htmlFor={inputId}
          className={cn(LABEL_COLUMN_CLASS, "pt-2", OPERATOR_TYPOGRAPHY.label)}
        >
          {bullet.label}
        </Label>
      ) : (
        <span className={cn(LABEL_COLUMN_CLASS, OPERATOR_TYPOGRAPHY.label)}>{bullet.label}</span>
      )}

      <div className="min-w-[12rem] flex-1 space-y-1">
        {editable ? (
          <Input
            id={inputId}
            value={bullet.value}
            disabled={props.disabled}
            maxLength={SCOPE_ITEM_MAX_LENGTH}
            onChange={(event) => {
              props.onValueChange(bullet.id, event.target.value);
            }}
          />
        ) : (
          <p
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid={`architecture-scope-readonly-${bullet.id}`}
          >
            {bullet.value}
          </p>
        )}
        {showSourcePointer ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid={`architecture-scope-readonly-hint-${bullet.id}`}
          >
            {scopeReadOnlyHint(props.contextSourceLabel)}
          </p>
        ) : null}
      </div>

      {editable && removable ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.disabled}
          aria-label={removeButtonLabel(bullet)}
          onClick={() => {
            props.onRemove(bullet.id);
          }}
        >
          Remove
        </Button>
      ) : null}
    </li>
  );
}
