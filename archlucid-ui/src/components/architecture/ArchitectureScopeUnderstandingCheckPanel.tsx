"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deriveScopeUnderstandingBullets,
  isScopeUnderstandingGateOpen,
  normalizeScopeUnderstandingBullets,
  SCOPE_UNDERSTANDING_CONFIRM_LABEL,
  SCOPE_UNDERSTANDING_HEADING,
  SCOPE_UNDERSTANDING_SKIP_LABEL,
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

/** TB-2176: editable in-scope bullets with explicit confirm or accept-inferred skip before execute. */
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
  const [acceptedInferredScope, setAcceptedInferredScope] = useState(false);

  const gateOpen = isScopeUnderstandingGateOpen({ confirmed, acceptedInferredScope });

  useEffect(() => {
    if (!gateOpen) {
      setBullets(inferredBullets);
    }
  }, [inferredBullets, gateOpen]);

  const updateBullets = (nextBullets: ScopeUnderstandingBullet[]) => {
    const normalized = normalizeScopeUnderstandingBullets(nextBullets);

    setBullets(normalized);
    setConfirmed(false);
    setAcceptedInferredScope(false);
    props.onBulletsChange?.(normalized);
    props.onGateChange?.(false);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setAcceptedInferredScope(false);
    props.onBulletsChange?.(bullets);
    props.onGateChange?.(true);
  };

  const handleAcceptInferred = () => {
    setAcceptedInferredScope(true);
    setConfirmed(false);
    props.onBulletsChange?.(bullets);
    props.onGateChange?.(true);
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
          Edit what ArchLucid will treat as in scope before you start. Corrections are saved into the intake brief.
        </p>
      </div>

      <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-scope-understanding-bullets">
        {bullets.map((bullet) => (
          <li key={bullet.id} className="flex flex-wrap items-center gap-2">
            <Input
              value={bullet.text}
              disabled={props.disabled === true || gateOpen}
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
              disabled={props.disabled === true || gateOpen}
              onClick={() => {
                updateBullets(bullets.filter((entry) => entry.id !== bullet.id));
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <Label htmlFor="architecture-scope-understanding-new" className="sr-only">
            Add in-scope bullet
          </Label>
          <Input
            id="architecture-scope-understanding-new"
            value={newBulletText}
            disabled={props.disabled === true || gateOpen}
            placeholder="Add another in-scope item"
            onChange={(event) => {
              setNewBulletText(event.target.value);
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.disabled === true || gateOpen || newBulletText.trim().length === 0}
          onClick={() => {
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
          }}
        >
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={props.disabled === true || gateOpen}
          data-testid="architecture-scope-understanding-confirm"
          onClick={handleConfirm}
        >
          {SCOPE_UNDERSTANDING_CONFIRM_LABEL}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.disabled === true || gateOpen}
          data-testid="architecture-scope-understanding-skip"
          onClick={handleAcceptInferred}
        >
          {SCOPE_UNDERSTANDING_SKIP_LABEL}
        </Button>
      </div>

      {gateOpen ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-scope-understanding-ready">
          Scope {acceptedInferredScope ? "accepted as inferred" : "confirmed"} — you can start the review.
        </p>
      ) : null}
    </section>
  );
}
