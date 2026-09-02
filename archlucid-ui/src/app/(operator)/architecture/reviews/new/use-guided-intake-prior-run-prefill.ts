"use client";

import { useEffect, useRef } from "react";

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
  readonly actorSet: ActorSet;
};

type Options = GuidedIntakePriorRunPrefillTarget & {
  readonly priorRunId: string | null;
  readonly enabled?: boolean;
};

function applyPriorPackagePrefill(
  target: GuidedIntakePriorRunPrefillTarget,
  prefill: PriorPackageGuidedIntakePrefill,
): void {
  if (target.systemName.trim().length === 0 && prefill.systemName.length > 0) {
    target.setSystemName(prefill.systemName);
  }

  if (target.freeTextIntent.trim().length === 0 && prefill.freeTextIntent.length > 0) {
    target.setFreeTextIntent(prefill.freeTextIntent);
  }

  if (target.businessOutcome.trim().length === 0 && prefill.businessOutcome.length > 0) {
    target.setBusinessOutcome(prefill.businessOutcome);
  }

  if (target.actorSet.actors.length === 0 && prefill.actorSet.actors.length > 0) {
    target.setActorSet(prefill.actorSet);
  }

  if (prefill.scopeBullets.length > 0) {
    target.setScopeBullets([...prefill.scopeBullets]);
    target.setScopeGateOpen(prefill.scopeGateOpen);
  }

  if (prefill.priorAttachedFileNames.length > 0) {
    target.setPriorAttachedFileNames([...prefill.priorAttachedFileNames]);
  }
}

/** Prefills guided-intake step 0 from the prior run's architecture request when `rerun=` is present. */
export function useGuidedIntakePriorRunPrefill(options: Options): void {
  const {
    actorSet,
    businessOutcome,
    enabled = true,
    freeTextIntent,
    priorRunId,
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
      if (cancelled || prefill === null || appliedRef.current) {
        return;
      }

      appliedRef.current = true;
      applyPriorPackagePrefill(targetRef.current, prefill);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, priorRunId]);
}
