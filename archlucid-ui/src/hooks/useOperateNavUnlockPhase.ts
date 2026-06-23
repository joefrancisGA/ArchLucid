"use client";

import { useCallback, useEffect, useState } from "react";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import {
  OPERATE_NAV_UNLOCK_CHANGED_EVENT,
  advanceOperateNavUnlockToAnalysis,
  readOperateNavUnlockPhase,
  type OperateNavUnlockPhase,
} from "@/lib/usability/operate-nav-progressive-unlock";

/** Reads persisted Operate nav unlock phase and auto-advances to analysis after the first committed review. */
export function useOperateNavUnlockPhase(): {
  effectiveOperateUnlockPhase: OperateNavUnlockPhase;
  unlockOperateFeatures: () => void;
  mounted: boolean;
} {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<OperateNavUnlockPhase>(0);

  const refreshPhase = useCallback(() => {
    setPhase(readOperateNavUnlockPhase());
  }, []);

  useEffect(() => {
    refreshPhase();
    setMounted(true);
  }, [refreshPhase]);

  useEffect(() => {
    if (!mounted || !hasCommittedArchitectureReview) {
      return;
    }

    if (readOperateNavUnlockPhase() === 0) {
      advanceOperateNavUnlockToAnalysis();
      refreshPhase();
    }
  }, [hasCommittedArchitectureReview, mounted, refreshPhase]);

  useEffect(() => {
    function onChanged(): void {
      refreshPhase();
    }

    window.addEventListener(OPERATE_NAV_UNLOCK_CHANGED_EVENT, onChanged);
    window.addEventListener("storage", onChanged);

    return () => {
      window.removeEventListener(OPERATE_NAV_UNLOCK_CHANGED_EVENT, onChanged);
      window.removeEventListener("storage", onChanged);
    };
  }, [refreshPhase]);

  const unlockOperateFeatures = useCallback(() => {
    advanceOperateNavUnlockToAnalysis();
    refreshPhase();
  }, [refreshPhase]);

  return {
    effectiveOperateUnlockPhase: mounted ? phase : 0,
    unlockOperateFeatures,
    mounted,
  };
}
