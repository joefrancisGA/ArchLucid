import { productLineDisplayName } from "@/lib/product-line/product-line-display-name";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const PREFERENCES_SETTINGS_PRIMARY_CONTENT_ID = "preferences-settings-primary-content" as const;

export const PREFERENCES_SETTINGS_FIRST_VIEWPORT_ID = "preferences-settings-first-viewport" as const;

export const PREFERENCES_SETTINGS_FIRST_VIEWPORT_TEST_ID = PREFERENCES_SETTINGS_FIRST_VIEWPORT_ID;

export const PREFERENCES_SETTINGS_SKIP_TARGET_ID = PREFERENCES_SETTINGS_FIRST_VIEWPORT_ID;

export const PREFERENCES_SETTINGS_SKIP_LINK_LABEL = "Skip to preferences" as const;

export const PREFERENCES_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Set theme, time zone, and other personal defaults for your account." as const;

export function preferencesAppearanceThemeLead(productLineId: ProductLineId): string {
  return `Choose how ${productLineDisplayName(productLineId)} appears.`;
}

export function preferencesSettingsPageSubtitle(buyerPolishedShell: boolean): string | undefined {
  return buyerPolishedShell ? PREFERENCES_SETTINGS_PAGE_SUBTITLE_BUYER : undefined;
}
