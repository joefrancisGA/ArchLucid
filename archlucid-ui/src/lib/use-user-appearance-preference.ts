import { useColorModePreferenceContext, type ColorModeAccountSyncState } from "@/components/ColorModePreferenceProvider";
import type { ColorModePreference } from "@/lib/color-mode-preference";

export function useUserAppearancePreference(): {
  readonly preference: ColorModePreference;
  readonly systemPrefersDark: boolean;
  readonly mounted: boolean;
  readonly accountSyncState: ColorModeAccountSyncState;
  readonly setAndPersist: (next: ColorModePreference) => void;
} {
  const { preference, systemPrefersDark, mounted, accountSyncState, setAndPersist } =
    useColorModePreferenceContext();

  return {
    preference,
    systemPrefersDark,
    mounted,
    accountSyncState,
    setAndPersist,
  };
}

/** @deprecated Server sync runs inside ColorModePreferenceProvider. */
export function useUserAppearancePreferenceServerSync(): void {
  // Intentionally empty — retained for import stability.
}
