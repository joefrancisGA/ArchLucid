"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type MouseEvent, type SetStateAction } from "react";

import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import {
  deriveScopeUnderstandingBullets,
  isScopeBulletRemovable,
  normalizeScopeUnderstandingBullets,
  reconcileScopeUnderstandingBullets,
  scopeBulletBehavior,
  validateScopeUnderstandingItem,
  SCOPE_UNDERSTANDING_BRIEF_REGION_LABEL,
  SCOPE_UNDERSTANDING_HEADING,
  SCOPE_UNDERSTANDING_HELPER,
  canConfirmScopeUnderstanding,
  scopeBriefLines,
  scopeBulletsFingerprint,
  type DeriveScopeUnderstandingBulletsInput,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import {
  DESIGN_TOKENS,
  OPERATOR_FORM_FIELD_LABEL_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { scheduleScrollDeepLinkTargetIntoView } from "@/lib/scroll-deep-link-target-into-view";
import { cn } from "@/lib/utils";

import { ArchitectureScopeUnderstandingCheckFields } from "./ArchitectureScopeUnderstandingCheckFields";

export type ArchitectureScopeUnderstandingCheckPanelProps = {
  readonly input: DeriveScopeUnderstandingBulletsInput;
  readonly disabled?: boolean;
  /** When true, omit the outer callout shell — use inside an existing card. */
  readonly embedded?: boolean;
  /** Names the field that owns the architecture context text on this surface, for the read-only row hint. */
  readonly contextSourceLabel?: string;
  /** What confirmation unblocks on this surface — starting the review, or continuing the wizard. */
  readonly readyHint?: string;
  /** When false, omit the ready line — use when a primary CTA below already signals the next step. */
  readonly showReadyHint?: boolean;
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
      className={cn(
        props.embedded === true
          ? OPERATOR_LAYOUT.sectionStack
          : cn(DESIGN_TOKENS.callout.neutral, OPERATOR_LAYOUT.cardPadding, OPERATOR_LAYOUT.sectionStack),
      )}
      data-testid="architecture-scope-understanding-check"
      aria-labelledby={
        props.embedded === true
          ? "architecture-scope-understanding-heading"
          : "architecture-scope-understanding-brief-label architecture-scope-understanding-heading"
      }
    >
      {props.embedded !== true ? (
      <p
        id="architecture-scope-understanding-brief-label"
        className={cn("m-0", OPERATOR_FORM_FIELD_LABEL_CLASS)}
        data-testid="architecture-scope-understanding-brief-label"
      >
        {SCOPE_UNDERSTANDING_BRIEF_REGION_LABEL}
      </p>
      ) : null}
      <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
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

      <ArchitectureScopeUnderstandingCheckFields
        bullets={bullets}
        disabled={props.disabled}
        contextSourceLabel={props.contextSourceLabel}
        readyHint={props.readyHint}
        showReadyHint={props.showReadyHint}
        draftSaveState={props.draftSaveState}
        confirmed={confirmed}
        scopeStale={scopeStale}
        scopePersistFailed={scopePersistFailed}
        editingAllowed={editingAllowed}
        canConfirmScope={canConfirmScope}
        confirmedBriefLineCount={confirmedBriefLineCount}
        scopePersistenceInFlight={scopePersistenceInFlight}
        newBulletText={newBulletText}
        canAddBullet={canAddBullet}
        addErrorMessage={addErrorMessage}
        nextStepAnchorId={props.nextStepAnchorId}
        nextStepAnchorLabel={props.nextStepAnchorLabel}
        onNewBulletTextChange={setNewBulletText}
        onAddBullet={addBulletFromDraft}
        onRowValueChange={handleRowValueChange}
        onRowRemove={handleRowRemove}
        onConfirm={handleConfirm}
        onEditScope={handleEditScope}
        onNextStepJump={handleNextStepJump}
      />
    </section>
  );
}
