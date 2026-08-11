"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deriveScopeUnderstandingBullets,
  normalizeScopeUnderstandingBullets,
  SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL,
  SCOPE_UNDERSTANDING_ADD_HINT,
  SCOPE_UNDERSTANDING_ADD_LABEL,
  SCOPE_UNDERSTANDING_ADD_PLACEHOLDER,
  SCOPE_UNDERSTANDING_CONFIRM_LABEL,
  SCOPE_UNDERSTANDING_HEADING,
  SCOPE_UNDERSTANDING_HELPER,
  type DeriveScopeUnderstandingBulletsInput,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture-scope-understanding-check";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureScopeUnderstandingCheckPanelProps = {
  readonly input: DeriveScopeUnderstandingBulletsInput;
  readonly disabled?: boolean;
  readonly onBulletsChange?: Dispatch<SetStateAction<ScopeUnderstandingBullet[]>>;
  readonly onGateChange?: (gateOpen: boolean) => void;
};

/** TB-2176: editable in-scope bullets with an explicit operator confirmation before execute. */
export function ArchitectureScopeUnderstandingCheckPanel(
  props: ArchitectureScopeUnderstandingCheckPanelProps,
): React.JSX.Element {
  const inferredBullets = useMemo(
    () => deriveScopeUnderstandingBullets(props.input),
    [props.input],
  );
  const [bullets, setBullets] = useState<ScopeUnderstandingBullet[]>(inferredBullets);
  const [newBulletText, setNewBulletText] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!confirmed) {
      setBullets(inferredBullets);
    }
  }, [inferredBullets, confirmed]);

  const updateBullets = (nextBullets: ScopeUnderstandingBullet[]) => {
    const normalized = normalizeScopeUnderstandingBullets(nextBullets);

    setBullets(normalized);
    setConfirmed(false);
    props.onBulletsChange?.(normalized);
    props.onGateChange?.(false);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    props.onBulletsChange?.(bullets);
    props.onGateChange?.(true);
  };

  const addBulletFromDraft = () => {
    const trimmed = newBulletText.trim();

    if (trimmed.length === 0) {
      return;
    }

    updateBullets([
      ...bullets,
      {
        id: `user-${bullets.length + 1}`,
        text: trimmed,
        source: "user",
      },
    ]);
    setNewBulletText("");
  };

  const canAddBullet =
    props.disabled !== true && !confirmed && newBulletText.trim().length > 0;
  const showAddHint =
    props.disabled !== true && !confirmed && newBulletText.trim().length === 0;

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
        className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}
        data-testid="architecture-scope-understanding-bullets"
      >
        {bullets.map((bullet) => (
          <li key={bullet.id} className="flex flex-wrap items-center gap-2">
            <Input
              value={bullet.text}
              disabled={props.disabled === true || confirmed}
              aria-label="In-scope bullet"
              onChange={(event) => {
                const nextText = event.target.value;

                updateBullets(
                  bullets.map((entry) =>
                    entry.id === bullet.id ? { ...entry, text: nextText, source: "user" } : entry,
                  ),
                );
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={props.disabled === true || confirmed}
              onClick={() => {
                updateBullets(bullets.filter((entry) => entry.id !== bullet.id));
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      <div
        className="space-y-2 border-t border-al-border-subtle pt-3"
        data-testid="architecture-scope-understanding-add"
      >
        <Label
          htmlFor="architecture-scope-understanding-new"
          className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}
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
              aria-describedby={
                showAddHint ? "architecture-scope-understanding-add-hint" : undefined
              }
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
        {showAddHint ? (
          <p
            id="architecture-scope-understanding-add-hint"
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="architecture-scope-understanding-add-hint"
          >
            {SCOPE_UNDERSTANDING_ADD_HINT}
          </p>
        ) : null}
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
          Scope confirmed — you can start the review.
        </p>
      ) : null}
    </section>
  );
}
