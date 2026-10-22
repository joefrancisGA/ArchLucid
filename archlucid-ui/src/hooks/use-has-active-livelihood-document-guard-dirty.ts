"use client";

import { useEffect, useState } from "react";

import {
  hasActiveLivelihoodDocumentGuardDirty,
  subscribeLivelihoodDocumentGuardDirty,
} from "@/lib/operator/livelihood-document-guard-dirty-registry";

/** True when any mounted `useInAppNavigationGuard` has `when=true` (dirty livelihood form). */
export function useHasActiveLivelihoodDocumentGuardDirty(): boolean {
  const [isDirty, setIsDirty] = useState(() => hasActiveLivelihoodDocumentGuardDirty());

  useEffect(() => {
    return subscribeLivelihoodDocumentGuardDirty(() => {
      setIsDirty(hasActiveLivelihoodDocumentGuardDirty());
    });
  }, []);

  return isDirty;
}
