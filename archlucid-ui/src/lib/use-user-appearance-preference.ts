import { useColorModePreferenceContext } from "@/components/ColorModePreferenceProvider";
import type { ColorModePreference } from "@/lib/color-mode-preference";

export function useUserAppearancePreference(): {
  readonly preference: ColorModePreference;
  readonly systemPrefersDark: boolean;
  readonly mounted: boolean;
  readonly setAndPersist: (next: ColorModePreference) => void;
} {
  const { preference, systemPrefersDark, mounted, setAndPersist } = useColorModePreferenceContext();

  return {
    preference,
    systemPrefersDark,
    mounted,
    setAndPersist,
  };
}

/** @deprecated Server sync runs inside ColorModePreferenceProvider. */
export function useUserAppearancePreferenceServerSync(): void {
  // Intentionally empty — retained for import stability.
}
