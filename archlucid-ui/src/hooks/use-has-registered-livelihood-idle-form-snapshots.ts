"use client";

import { useEffect, useState } from "react";

import {
  hasRegisteredLivelihoodIdleFormSnapshots,
  subscribeLivelihoodIdleFormSnapshotRegistry,
} from "@/lib/auth/livelihood-idle-form-snapshot";

/** True when any livelihood idle-restore snapshot is registered (dirty operator form). */
export function useHasRegisteredLivelihoodIdleFormSnapshots(): boolean {
  const [hasSnapshots, setHasSnapshots] = useState(() => hasRegisteredLivelihoodIdleFormSnapshots());

  useEffect(() => {
    return subscribeLivelihoodIdleFormSnapshotRegistry(() => {
      setHasSnapshots(hasRegisteredLivelihoodIdleFormSnapshots());
    });
  }, []);

  return hasSnapshots;
}
