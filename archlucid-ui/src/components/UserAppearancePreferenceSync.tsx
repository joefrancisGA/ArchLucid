"use client";

import { useUserAppearancePreferenceServerSync } from "@/lib/use-user-appearance-preference";

/** Loads authenticated user appearance preference into localStorage after shell mount. */
export function UserAppearancePreferenceSync(): null {
  useUserAppearancePreferenceServerSync();

  return null;
}
