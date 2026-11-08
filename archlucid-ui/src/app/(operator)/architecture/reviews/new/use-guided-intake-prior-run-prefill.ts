"use client";

import { useEffect, useRef, useState } from "react";

export const GUIDED_INTAKE_PRIOR_RUN_PREFILL_LOAD_FAILED_LINE =
  "Prior package could not be loaded; fields on this step were not copied." as const;

export const GUIDED_INTAKE_PRIOR_RUN_PREFILL_COPIED_FROM_LINE =
  "Fields on this step were copied from the prior package, not retyped here." as const;

export const GUIDED_INTAKE_PRIOR_RUN_PREFILL_NOT_COPIED_LINE =
  "Prior package fields were not copied onto this step." as const;

export const GUIDED_INTAKE_PRIOR_RUN_PREFILL_NO_FIELDS_COPIED =
  "No non-empty field was copied." as const;

import { tryLoadPriorPackageGuidedIntakePrefill } from "@/lib/try-load-prior-package-guided-intake-prefill";
import type { PriorPackageGuidedIntakePrefill } from "@/lib/prior-package-guided-intake-prefill";
import type { ScopeUnderstandingBullet } from "@/lib/architecture/architecture-scope-understanding-check";
import type { ActorSet } from "@/types/draft-intake";

type GuidedIntakePriorRunPrefillTarget = {
  readonly setFreeTextIntent: (value: string) => void;
  readonly setBusinessOutcome: (value: string) => void;
  readonly setSystemName: (value: string) => void;
  readonly setActorSet: (value: ActorSet) => void;
  readonly setScopeBullets: (value: ScopeUnderstandingBullet[]) => void;
  readonly setScopeGateOpen: (value: boolean) => void;
  readonly setPriorAttachedFileNames: (value: readonly string[]) => void;
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  readonly scopeBullets: readonly ScopeUnderstandingBullet[];
  readonly actorSet: ActorSet;
};

type Options = GuidedIntakePriorRunPrefillTarget & {
  readonly priorRunId: string | null;
  readonly enabled?: boolean;
};

function applyPriorPackagePrefill(
  target: GuidedIntakePriorRunPrefillTarget,
  prefill: PriorPackageGuidedIntakePrefill,
): boolean {
  let copiedAny = false;

  if (target.systemName.trim().length === 0 && prefill.systemName.length > 0) {
    target.setSystemName(prefill.systemName);
    copiedAny = true;
  }

  if (target.freeTextIntent.trim().length === 0 && prefill.freeTextIntent.length > 0) {
    target.setFreeTextIntent(prefill.freeTextIntent);
    copiedAny = true;
  }

  if (target.businessOutcome.trim().length === 0 && prefill.businessOutcome.length > 0) {
    target.setBusinessOutcome(prefill.businessOutcome);
    copiedAny = true;
  }

  if (target.actorSet.actors.length === 0 && prefill.actorSet.actors.length > 0) {
    target.setActorSet(prefill.actorSet);
    copiedAny = true;
  }

  if (target.scopeBullets.length === 0 && prefill.scopeBullets.length > 0) {
    target.setScopeBullets([...prefill.scopeBullets]);
    target.setScopeGateOpen(prefill.scopeGateOpen);
    copiedAny = true;
  }

  if (prefill.priorAttachedFileNames.length > 0) {
    target.setPriorAttachedFileNames([...prefill.priorAttachedFileNames]);
    copiedAny = true;
  }

  return copiedAny;
}

export type GuidedIntakePriorRunPrefillState = {
  readonly priorRunPrefillCopiedFromLine: string | null;
};

/** Prefills guided-intake step 0 from the prior run's architecture request when `rerun=` is present. */
export function useGuidedIntakePriorRunPrefill(options: Options): GuidedIntakePriorRunPrefillState {
  const [priorRunPrefillCopiedFromLine, setPriorRunPrefillCopiedFromLine] = useState<string | null>(null);
  const {
    actorSet,
    businessOutcome,
    enabled = true,
    freeTextIntent,
    priorRunId,
    scopeBullets,
    setActorSet,
    setBusinessOutcome,
    setFreeTextIntent,
    setScopeBullets,
    setScopeGateOpen,
    setPriorAttachedFileNames,
    setSystemName,
    systemName,
  } = options;
  const appliedRef = useRef(false);
  const targetRef = useRef<GuidedIntakePriorRunPrefillTarget>({
    actorSet,
    businessOutcome,
    freeTextIntent,
    scopeBullets,
    setActorSet,
    setBusinessOutcome,
    setFreeTextIntent,
    setScopeBullets,
    setScopeGateOpen,
    setPriorAttachedFileNames,
    setSystemName,
    systemName,
  });

  targetRef.current = {
    actorSet,
    businessOutcome,
    freeTextIntent,
    scopeBullets,
    setActorSet,
    setBusinessOutcome,
    setFreeTextIntent,
    setScopeBullets,
    setScopeGateOpen,
    setPriorAttachedFileNames,
    setSystemName,
    systemName,
  };

  useEffect(() => {
    if (!enabled || priorRunId === null || appliedRef.current) {
      return;
    }

    let cancelled = false;

    void tryLoadPriorPackageGuidedIntakePrefill(priorRunId).then((prefill) => {
      if (cancelled || appliedRef.current) {
        return;
      }

      appliedRef.current = true;

      if (prefill === null) {
        setPriorRunPrefillCopiedFromLine(GUIDED_INTAKE_PRIOR_RUN_PREFILL_NOT_COPIED_LINE);
        return;
      }

      const copiedAny = applyPriorPackagePrefill(targetRef.current, prefill);
      setPriorRunPrefillCopiedFromLine(
        copiedAny
          ? GUIDED_INTAKE_PRIOR_RUN_PREFILL_COPIED_FROM_LINE
          : GUIDED_INTAKE_PRIOR_RUN_PREFILL_NO_FIELDS_COPIED,
      );
    }).catch(() => {
      if (cancelled || !appliedRef.current) {
        return;
      }

      appliedRef.current = true;
      setPriorRunPrefillCopiedFromLine(GUIDED_INTAKE_PRIOR_RUN_PREFILL_LOAD_FAILED_LINE);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, priorRunId]);

  return { priorRunPrefillCopiedFromLine };
}
