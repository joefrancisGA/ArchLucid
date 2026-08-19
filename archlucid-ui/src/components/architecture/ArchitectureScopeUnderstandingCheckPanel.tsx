"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { ArchitectureScopeUnderstandingRow } from "@/components/architecture/ArchitectureScopeUnderstandingRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deriveScopeUnderstandingBullets,
  normalizeScopeUnderstandingBullets,
  reconcileScopeUnderstandingBullets,
  scopeBulletBehavior,
  validateScopeUnderstandingItem,
  SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL,
  SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL,
  SCOPE_UNDERSTANDING_ADD_EFFECT_HINT,
  SCOPE_UNDERSTANDING_ADD_HINT,
  SCOPE_UNDERSTANDING_ADD_LABEL,
  SCOPE_UNDERSTANDING_ADD_PLACEHOLDER,
  SCOPE_UNDERSTANDING_CONFIRM_LABEL,
  SCOPE_UNDERSTANDING_HEADING,
  SCOPE_UNDERSTANDING_HELPER,
  SCOPE_UNDERSTANDING_READY_HINT,
  type DeriveScopeUnderstandingBulletsInput,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureScopeUnderstandingCheckPanelProps = {
  readonly input: DeriveScopeUnderstandingBulletsInput;
  readonly disabled?: boolean;
  /** Names the field that owns the architecture context text on this surface, for the read-only row hint. */
  readonly contextSourceLabel?: string;
  /** What confirmation unblocks on this surface — starting the review, or continuing the wizard. */
  readonly readyHint?: string;
  readonly onBulletsChange?: Dispatch<SetStateAction<ScopeUnderstandingBullet[]>>;
  readonly onGateChange?: (gateOpen: boolean) => void;
};

/** TB-2176: typed in-scope rows with an explicit operator confirmation before execute. */
export function ArchitectureScopeUnderstandingCheckPanel(
  props: ArchitectureScopeUnderstandingCheckPanelProps,
): React.JSX.Element {
  const inferredBullets = useMemo(
    () => deriveScopeUnderstandingBullets(props.input),
    [props.input],
  );
  const [bullets, setBullets] = useState<ScopeUnderstandingBullet[]>(inferredBullets);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [newBulletText, setNewBulletText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  // Monotonic so a remove-then-add cycle cannot reuse an id that is still on screen.
  const operatorRowCounterRef = useRef(0);
  const reconciledInferredRef = useRef(inferredBullets);
  const onGateChange = props.onGateChange;

  useEffect(() => {
    if (reconciledInferredRef.current === inferredBullets) {
      return;
    }

    reconciledInferredRef.current = inferredBullets;

    setBullets((previous) =>
      reconcileScopeUnderstandingBullets({
        inferred: inferredBullets,
        previous,
        dismissedIds,
      }),
    );

    // Scope confirmed against older form values is stale, so the operator re-confirms what changed.
    if (confirmed) {
      setConfirmed(false);
      onGateChange?.(false);
    }
  }, [inferredBullets, confirmed, dismissedIds, onGateChange]);

  const applyBullets = (nextBullets: ScopeUnderstandingBullet[]) => {
    setBullets(nextBullets);
    setConfirmed(false);
    props.onBulletsChange?.(nextBullets);
    props.onGateChange?.(false);
  };

  // Raw text is kept as typed; trimming here would stop the operator typing a space between words.
  const handleRowValueChange = (bulletId: string, nextValue: string) => {
    applyBullets(
      bullets.map((entry) =>
        entry.id === bulletId ? { ...entry, value: nextValue, source: "user" } : entry,
      ),
    );
  };

  // Dismissal is remembered so re-deriving after a form edit above cannot resurrect the row.
  const handleRowRemove = (bulletId: string) => {
    setDismissedIds((previous) => [...previous, bulletId]);
    applyBullets(bullets.filter((entry) => entry.id !== bulletId));
  };

  const handleConfirm = () => {
    const normalized = normalizeScopeUnderstandingBullets(bullets);

    setBullets(normalized);
    setConfirmed(true);
    props.onBulletsChange?.(normalized);
    props.onGateChange?.(true);
  };

  const addValidation = useMemo(
    () => validateScopeUnderstandingItem(newBulletText, bullets),
    [newBulletText, bullets],
  );

  const editingAllowed = props.disabled !== true && !confirmed;
  const canAddBullet = editingAllowed && addValidation.status === "valid";
  const showAddHint = editingAllowed && addValidation.status === "empty";
  const addErrorMessage =
    editingAllowed && addValidation.status === "invalid" ? addValidation.message : null;

  const addBulletFromDraft = () => {
    if (addValidation.status !== "valid") {
      return;
    }

    operatorRowCounterRef.current += 1;

    applyBullets([
      ...bullets,
      {
        id: `custom-${operatorRowCounterRef.current}`,
        kind: "custom",
        label: scopeBulletBehavior("custom").label,
        value: newBulletText.trim(),
        source: "user",
      },
    ]);
    setNewBulletText("");
  };

  const addFieldDescribedBy = (): string | undefined => {
    if (addErrorMessage !== null) {
      return "architecture-scope-understanding-add-error";
    }

    if (showAddHint) {
      return "architecture-scope-understanding-add-hint";
    }

    return "architecture-scope-understanding-add-effect";
  };

  return (
    <section
      className={cn(DESIGN_TOKENS.callout.neutral, "space-y-3 p-4")}
      data-testid="architecture-scope-understanding-check"
      aria-labelledby="architecture-scope-understanding-heading"
    >
      <div className="space-y-1">
        <h2
          id="architecture-scope-understanding-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {SCOPE_UNDERSTANDING_HEADING}
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SCOPE_UNDERSTANDING_HELPER}
        </p>
      </div>

      <ul
        className={cn("m-0 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}
        data-testid="architecture-scope-understanding-bullets"
      >
        {bullets.map((bullet) => (
          <ArchitectureScopeUnderstandingRow
            key={bullet.id}
            bullet={bullet}
            disabled={!editingAllowed}
            contextSourceLabel={props.contextSourceLabel ?? SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL}
            onValueChange={handleRowValueChange}
            onRemove={handleRowRemove}
          />
        ))}
      </ul>

      <div
        className="space-y-2 border-t border-al-border-subtle pt-3"
        data-testid="architecture-scope-understanding-add"
      >
        <Label
          htmlFor="architecture-scope-understanding-new"
          className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}
        >
          {SCOPE_UNDERSTANDING_ADD_LABEL}
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[12rem] flex-1">
            <Input
              id="architecture-scope-understanding-new"
              value={newBulletText}
              disabled={props.disabled === true || confirmed}
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
        {showAddHint ? (
          <p
            id="architecture-scope-understanding-add-hint"
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="architecture-scope-understanding-add-hint"
          >
            {SCOPE_UNDERSTANDING_ADD_HINT}
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

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={props.disabled === true || confirmed}
          data-testid="architecture-scope-understanding-confirm"
          onClick={handleConfirm}
        >
          {SCOPE_UNDERSTANDING_CONFIRM_LABEL}
        </Button>
      </div>

      {confirmed ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-scope-understanding-ready"
        >
          {props.readyHint ?? SCOPE_UNDERSTANDING_READY_HINT}
        </p>
      ) : null}
    </section>
  );
}
