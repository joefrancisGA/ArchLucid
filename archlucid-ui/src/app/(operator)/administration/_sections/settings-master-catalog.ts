import type { SettingsMasterSection } from "./settings-master-types";
import { SETTINGS_MASTER_SECTIONS_INTEGRATIONS } from "./settings-master-catalog-integrations";
import { SETTINGS_MASTER_SECTIONS_SECURITY } from "./settings-master-catalog-security";
import { SETTINGS_MASTER_SECTIONS_WORKSPACE } from "./settings-master-catalog-workspace";

/** Searchable master settings index — hub links; detail pages own editable controls. */
export const SETTINGS_MASTER_SECTIONS: readonly SettingsMasterSection[] = [
  ...SETTINGS_MASTER_SECTIONS_WORKSPACE,
  ...SETTINGS_MASTER_SECTIONS_SECURITY,
  ...SETTINGS_MASTER_SECTIONS_INTEGRATIONS,
] as const;

export function settingsMasterSectionDomId(sectionId: string): string {
  return `settings-section-${sectionId}`;
}
