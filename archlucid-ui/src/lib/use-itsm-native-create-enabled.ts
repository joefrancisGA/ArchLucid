import { useEffect, useState } from "react";

import {
  resolveItsmNativeCreateReadiness,
  type ItsmNativeCreateReadiness,
} from "@/lib/itsm-native-integration";

const INITIAL_READINESS: ItsmNativeCreateReadiness = {
  deploymentEnabled: false,
  defaultPathReady: false,
  health: null,
  azureBoardsReady: false,
};

/** Client hook for TB-387 native ITSM create gate + Tier 2 #6 default-path readiness. */
export function useItsmNativeCreateReadiness(): ItsmNativeCreateReadiness {
  const [readiness, setReadiness] = useState<ItsmNativeCreateReadiness>(INITIAL_READINESS);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const resolved = await resolveItsmNativeCreateReadiness();

      if (!cancelled) {
        setReadiness(resolved);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return readiness;
}

/** True when tenant settings + health probes validate native one-click create as the default path. */
export function useItsmNativeCreateEnabled(): boolean {
  const { defaultPathReady } = useItsmNativeCreateReadiness();

  return defaultPathReady;
}
