import type { SettingsMasterSection } from "./settings-master-types";
import { SETTINGS_MASTER_SECTIONS_INTEGRATIONS } from "./settings-master-catalog-integrations";
import { SETTINGS_MASTER_SECTIONS_SECURITY } from "./settings-master-catalog-security";
import { SETTINGS_MASTER_SECTIONS_WORKSPACE } from "./settings-master-catalog-workspace";

/** Searchable master settings index — hub links; detail pages own editable controls. */
export const SETTINGS_MASTER_SECTIONS: readonly SettingsMasterSection[] = [
  ...SETTINGS_MASTER_SECTIONS_WORKSPACE.filter(
    (section) => section.id === "workspace" || section.id === "notifications" || section.id === "users-roles",
  ),
  ...SETTINGS_MASTER_SECTIONS_SECURITY.filter(
    (section) => section.id === "governance" || section.id === "policy-packs",
  ),
  ...SETTINGS_MASTER_SECTIONS_INTEGRATIONS,
  ...SETTINGS_MASTER_SECTIONS_WORKSPACE.filter(
    (section) => section.id === "billing" || section.id === "support",
  ),
  ...SETTINGS_MASTER_SECTIONS_SECURITY.filter(
    (section) =>
      section.id === "security-trust" || section.id === "advanced" || section.id === "developer-internal",
  ),
] as const;

export function settingsMasterSectionDomId(sectionId: string): string {
  return `settings-section-${sectionId}`;
}
