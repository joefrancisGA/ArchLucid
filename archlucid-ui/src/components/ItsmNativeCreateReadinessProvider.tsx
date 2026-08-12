"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
  INITIAL_ITSM_NATIVE_CREATE_READINESS,
  resolveItsmNativeCreateReadiness,
  type ItsmNativeCreateReadiness,
} from "@/lib/itsm-native-integration";

const ItsmNativeCreateReadinessContext = createContext<ItsmNativeCreateReadiness>(
  INITIAL_ITSM_NATIVE_CREATE_READINESS,
);

/** Loads ITSM native-create readiness once per operator shell session. */
export function ItsmNativeCreateReadinessProvider(props: { readonly children: ReactNode }) {
  const [readiness, setReadiness] = useState<ItsmNativeCreateReadiness>(INITIAL_ITSM_NATIVE_CREATE_READINESS);

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

  return (
    <ItsmNativeCreateReadinessContext.Provider value={readiness}>
      {props.children}
    </ItsmNativeCreateReadinessContext.Provider>
  );
}

export function useItsmNativeCreateReadinessContext(): ItsmNativeCreateReadiness {
  return useContext(ItsmNativeCreateReadinessContext);
}
