import { useItsmNativeCreateReadinessContext } from "@/components/itsm/ItsmNativeCreateReadinessProvider";
import {
  INITIAL_ITSM_NATIVE_CREATE_READINESS,
  type ItsmNativeCreateReadiness,
} from "@/lib/itsm/itsm-native-integration";

/** Client hook for TB-387 native ITSM create gate + Tier 2 #6 default-path readiness. */
export function useItsmNativeCreateReadiness(): ItsmNativeCreateReadiness {
  return useItsmNativeCreateReadinessContext();
}

/** True when tenant settings + health probes validate native one-click create as the default path. */
export function useItsmNativeCreateEnabled(): boolean {
  const { defaultPathReady } = useItsmNativeCreateReadiness();

  return defaultPathReady;
}

/** Test helper when a provider is not mounted. */
export function useItsmNativeCreateReadinessWithoutProvider(): ItsmNativeCreateReadiness {
  return INITIAL_ITSM_NATIVE_CREATE_READINESS;
}
