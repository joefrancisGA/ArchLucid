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
  canConfirmScopeUnderstanding,
  scopeBriefLines,
  scopeBulletsFingerprint,
  type DeriveScopeUnderstandingBulletsInput,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { scheduleScrollDeepLinkTargetIntoView } from "@/lib/scroll-deep-link-target-into-view";

export type UseArchitectureScopeUnderstandingCheckOptions = {
  readonly input: DeriveScopeUnderstandingBulletsInput;
  readonly disabled?: boolean;
  readonly persistedScopeFingerprint?: string | null;
  readonly onConfirm?: (bullets: ScopeUnderstandingBullet[]) => void | Promise<boolean>;
  readonly nextStepAnchorId?: string;
  readonly nextStepAnchorLabel?: string;
  readonly readyHint?: string;
  readonly showReadyHint?: boolean;
  readonly draftSaveState?: ArchitectureDraftSaveState;
  readonly onBulletsChange?: Dispatch<SetStateAction<ScopeUnderstandingBullet[]>>;
  readonly onGateChange?: (gateOpen: boolean) => void;
};

export function useArchitectureScopeUnderstandingCheck(
  options: UseArchitectureScopeUnderstandingCheckOptions,
) {
  const inferredBullets = useMemo(
    () => deriveScopeUnderstandingBullets(options.input),
    [options.input],
  );
  const [bullets, setBullets] = useState<ScopeUnderstandingBullet[]>(inferredBullets);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [newBulletText, setNewBulletText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [scopeStale, setScopeStale] = useState(false);
  const [scopePersistFailed, setScopePersistFailed] = useState(false);
  const confirmedFingerprintRef = useRef<string | null>(null);
  const operatorRowCounterRef = useRef(0);
  const reconciledInferredRef = useRef(inferredBullets);
  const onGateChange = options.onGateChange;

  useEffect(() => {
    const persistedFingerprint = options.persistedScopeFingerprint?.trim() ?? "";

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
    options.onBulletsChange?.(bullets);
    onGateChange?.(true);
  }, [bullets, confirmed, onGateChange, options.onBulletsChange, options.persistedScopeFingerprint]);

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
    options.onBulletsChange?.(nextBullets);
    options.onGateChange?.(false);
  };

  const handleRowValueChange = (bulletId: string, nextValue: string) => {
    applyBullets(
      bullets.map((entry) =>
        entry.id === bulletId ? { ...entry, value: nextValue, source: "user" } : entry,
      ),
    );
  };

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

    if (!canConfirmScopeUnderstanding(normalized, options.input)) {
      return;
    }

    const fingerprint = scopeBulletsFingerprint(normalized);
    const applyConfirmedState = () => {
      setBullets(normalized);
      setConfirmed(true);
      setScopeStale(false);
      setScopePersistFailed(false);
      confirmedFingerprintRef.current = fingerprint;
      options.onBulletsChange?.(normalized);
      options.onGateChange?.(true);
    };

    if (options.onConfirm === undefined) {
      applyConfirmedState();

      return;
    }

    void Promise.resolve(options.onConfirm(normalized)).then((persisted) => {
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
    options.onGateChange?.(false);
  };

  const addValidation = useMemo(
    () => validateScopeUnderstandingItem(newBulletText, bullets),
    [newBulletText, bullets],
  );

  const editingAllowed = options.disabled !== true && !confirmed;
  const canConfirmScope = useMemo(
    () => canConfirmScopeUnderstanding(bullets, options.input),
    [bullets, options.input],
  );
  const confirmedBriefLineCount = useMemo(() => scopeBriefLines(bullets).length, [bullets]);
  const scopePersistenceInFlight =
    options.draftSaveState === "saving" || options.draftSaveState === "unsaved";
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
    const anchorId = options.nextStepAnchorId?.trim() ?? "";

    if (anchorId.length === 0) {
      return;
    }

    event.preventDefault();
    scheduleScrollDeepLinkTargetIntoView(anchorId);
    document.getElementById(anchorId)?.focus({ preventScroll: true });
  };

  return {
    bullets,
    newBulletText,
    setNewBulletText,
    confirmed,
    scopeStale,
    scopePersistFailed,
    handleRowValueChange,
    handleRowRemove,
    handleConfirm,
    handleEditScope,
    canAddBullet,
    addErrorMessage,
    addFieldDescribedBy,
    addBulletFromDraft,
    canConfirmScope,
    confirmedBriefLineCount,
    scopePersistenceInFlight,
    editingAllowed,
    handleNextStepJump,
    disabled: options.disabled,
    draftSaveState: options.draftSaveState,
    readyHint: options.readyHint,
    showReadyHint: options.showReadyHint,
    nextStepAnchorId: options.nextStepAnchorId,
    nextStepAnchorLabel: options.nextStepAnchorLabel,
  };
}

export type UseArchitectureScopeUnderstandingCheckResult = ReturnType<
  typeof useArchitectureScopeUnderstandingCheck
>;
