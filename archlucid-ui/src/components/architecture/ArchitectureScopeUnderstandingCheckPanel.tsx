"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type MouseEvent, type SetStateAction } from "react";

import { ArchitectureScopeUnderstandingRow } from "@/components/architecture/ArchitectureScopeUnderstandingRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import {
  deriveScopeUnderstandingBullets,
  isScopeBulletRemovable,
  normalizeScopeUnderstandingBullets,
  reconcileScopeUnderstandingBullets,
  scopeBulletBehavior,
  validateScopeUnderstandingItem,
  SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL,
  SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL,
  SCOPE_UNDERSTANDING_ADD_EFFECT_HINT,
  SCOPE_UNDERSTANDING_ADD_LABEL,
  SCOPE_UNDERSTANDING_ADD_PLACEHOLDER,
  canConfirmScopeUnderstanding,
  scopeBriefLines,
  scopeBulletsFingerprint,
  scopeConfirmedSummaryMessage,
  SCOPE_UNDERSTANDING_CONFIRM_BLOCKED_HINT,
  SCOPE_UNDERSTANDING_CONFIRM_LABEL,
  SCOPE_UNDERSTANDING_CONFIRMED_STATUS_LABEL,
  SCOPE_UNDERSTANDING_EDIT_SCOPE_LABEL,
  SCOPE_UNDERSTANDING_HEADING,
  SCOPE_UNDERSTANDING_HELPER,
  SCOPE_UNDERSTANDING_READY_HINT,
  SCOPE_UNDERSTANDING_SAVE_ERROR_HINT,
  SCOPE_UNDERSTANDING_SAVING_HINT,
  SCOPE_UNDERSTANDING_STALE_HINT,
  type DeriveScopeUnderstandingBulletsInput,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { scheduleScrollDeepLinkTargetIntoView } from "@/lib/scroll-deep-link-target-into-view";
import { cn } from "@/lib/utils";

export type ArchitectureScopeUnderstandingCheckPanelProps = {
  readonly input: DeriveScopeUnderstandingBulletsInput;
  readonly disabled?: boolean;
  /** Names the field that owns the architecture context text on this surface, for the read-only row hint. */
  readonly contextSourceLabel?: string;
  /** What confirmation unblocks on this surface — starting the review, or continuing the wizard. */
  readonly readyHint?: string;
  /** Draft persistence on architecture draft surfaces — suppresses the ready line while save is in flight. */
  readonly draftSaveState?: ArchitectureDraftSaveState;
  /** Fingerprint of scope lines already saved on the draft — restores confirmation when unchanged. */
  readonly persistedScopeFingerprint?: string | null;
  /** Persists confirmed scope to the draft before opening the gate. */
  readonly onConfirm?: (bullets: ScopeUnderstandingBullet[]) => void | Promise<boolean>;
  /** Same-page anchor for the next workflow step after scope is confirmed (e.g. start review CTA). */
  readonly nextStepAnchorId?: string;
  readonly nextStepAnchorLabel?: string;
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
  const [scopeStale, setScopeStale] = useState(false);
  const [scopePersistFailed, setScopePersistFailed] = useState(false);
  const confirmedFingerprintRef = useRef<string | null>(null);
  // Monotonic so a remove-then-add cycle cannot reuse an id that is still on screen.
  const operatorRowCounterRef = useRef(0);
  const reconciledInferredRef = useRef(inferredBullets);
  const onGateChange = props.onGateChange;

  useEffect(() => {
    const persistedFingerprint = props.persistedScopeFingerprint?.trim() ?? "";

    if (persistedFingerprint.length === 0 || confirmed) {
      return;
    }

    const currentFingerprint = scopeBulletsFingerprint(bullets);

    if (currentFingerprint !== persistedFingerprint) {
      return;
    }

    confirmedFingerprintRef.current = persistedFingerprint;
    setConfirmed(true);
    setScopeStale(false);
    setScopePersistFailed(false);
    props.onBulletsChange?.(bullets);
    onGateChange?.(true);
  }, [bullets, confirmed, onGateChange, props.onBulletsChange, props.persistedScopeFingerprint]);

  useEffect(() => {
    if (reconciledInferredRef.current === inferredBullets) {
      return;
    }

    reconciledInferredRef.current = inferredBullets;

    const reconciled = reconcileScopeUnderstandingBullets({
      inferred: inferredBullets,
      previous: bullets,
      dismissedIds,
    });

    setBullets(reconciled);

    if (!confirmed) {
      return;
    }

    const confirmedFingerprint = confirmedFingerprintRef.current;

    if (confirmedFingerprint === null) {
      return;
    }

    const nextFingerprint = scopeBulletsFingerprint(reconciled);

    if (nextFingerprint === confirmedFingerprint) {
      return;
    }

    setConfirmed(false);
    setScopeStale(true);
    onGateChange?.(false);
  }, [inferredBullets, confirmed, dismissedIds, onGateChange, bullets]);

  const applyBullets = (nextBullets: ScopeUnderstandingBullet[]) => {
    setBullets(nextBullets);
    setConfirmed(false);
    setScopeStale(false);
    setScopePersistFailed(false);
    confirmedFingerprintRef.current = null;
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
    const target = bullets.find((entry) => entry.id === bulletId);

    if (target === undefined || !isScopeBulletRemovable(target.kind)) {
      return;
    }

    setDismissedIds((previous) => [...previous, bulletId]);
    applyBullets(bullets.filter((entry) => entry.id !== bulletId));
  };

  const handleConfirm = () => {
    const normalized = normalizeScopeUnderstandingBullets(bullets);

    if (!canConfirmScopeUnderstanding(normalized, props.input)) {
      return;
    }

    const fingerprint = scopeBulletsFingerprint(normalized);
    const applyConfirmedState = () => {
      setBullets(normalized);
      setConfirmed(true);
      setScopeStale(false);
      setScopePersistFailed(false);
      confirmedFingerprintRef.current = fingerprint;
      props.onBulletsChange?.(normalized);
      props.onGateChange?.(true);
    };

    if (props.onConfirm === undefined) {
      applyConfirmedState();

      return;
    }

    void Promise.resolve(props.onConfirm(normalized)).then((persisted) => {
      if (persisted === false) {
        setScopePersistFailed(true);

        return;
      }

      applyConfirmedState();
    });
  };

  const handleEditScope = () => {
    setConfirmed(false);
    setScopeStale(false);
    setScopePersistFailed(false);
    confirmedFingerprintRef.current = null;
    props.onGateChange?.(false);
  };

  const addValidation = useMemo(
    () => validateScopeUnderstandingItem(newBulletText, bullets),
    [newBulletText, bullets],
  );

  const editingAllowed = props.disabled !== true && !confirmed;
  const canConfirmScope = useMemo(
    () => canConfirmScopeUnderstanding(bullets, props.input),
    [bullets, props.input],
  );
  const confirmedBriefLineCount = useMemo(() => scopeBriefLines(bullets).length, [bullets]);
  const scopePersistenceInFlight =
    props.draftSaveState === "saving" || props.draftSaveState === "unsaved";
  const canAddBullet = editingAllowed && addValidation.status === "valid";
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

    return "architecture-scope-understanding-add-effect";
  };

  const handleNextStepJump = (event: MouseEvent<HTMLAnchorElement>) => {
    const anchorId = props.nextStepAnchorId?.trim() ?? "";

    if (anchorId.length === 0) {
      return;
    }

    event.preventDefault();
    scheduleScrollDeepLinkTargetIntoView(anchorId);
    document.getElementById(anchorId)?.focus({ preventScroll: true });
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
        <Label htmlFor="architecture-scope-understanding-new">
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
        <p
          id="architecture-scope-understanding-add-effect"
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-scope-understanding-add-effect"
        >
          {SCOPE_UNDERSTANDING_ADD_EFFECT_HINT}
        </p>
      </div>

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
        props.draftSaveState === "error" || scopePersistFailed ? (
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
            ) : (
              <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                {props.readyHint ?? SCOPE_UNDERSTANDING_READY_HINT}
              </p>
            )}
            {props.nextStepAnchorId !== undefined && props.nextStepAnchorId.trim().length > 0 ? (
              <a
                href={`#${props.nextStepAnchorId}`}
                className={OPERATOR_LINK.nav}
                data-testid="architecture-scope-understanding-next-step"
                onClick={handleNextStepJump}
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
            disabled={props.disabled === true || !canConfirmScope}
            data-testid="architecture-scope-understanding-confirm"
            onClick={handleConfirm}
          >
            {SCOPE_UNDERSTANDING_CONFIRM_LABEL}
          </Button>
        </div>
      )}
    </section>
  );
}
