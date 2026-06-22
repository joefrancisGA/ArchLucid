import { useEffect, useState } from "react";

import { resolveItsmNativeCreateEnabled } from "@/lib/itsm-native-integration";

/** Client hook for TB-387 native ITSM create gate (defaults false until health resolves). */
export function useItsmNativeCreateEnabled(): boolean {
  const [nativeCreateEnabled, setNativeCreateEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const enabled = await resolveItsmNativeCreateEnabled();

      if (!cancelled) {
        setNativeCreateEnabled(enabled);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return nativeCreateEnabled;
}
