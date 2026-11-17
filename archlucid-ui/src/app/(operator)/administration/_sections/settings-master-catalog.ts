import type { ProductLineId } from "@/lib/product-line/product-line-id";
import type { SettingsMasterSection } from "./settings-master-types";
import { SETTINGS_MASTER_SECTIONS_INTEGRATIONS } from "./settings-master-catalog-integrations";
import {
  resolveSettingsMasterSectionsSecurity,
  SETTINGS_MASTER_SECTIONS_SECURITY,
} from "./settings-master-catalog-security";
import { SETTINGS_MASTER_SECTIONS_WORKSPACE } from "./settings-master-catalog-workspace";

function assembleSettingsMasterSections(
  securitySections: readonly SettingsMasterSection[],
): readonly SettingsMasterSection[] {
  return [
    ...SETTINGS_MASTER_SECTIONS_WORKSPACE.filter(
      (section) => section.id === "workspace" || section.id === "notifications" || section.id === "users-roles",
    ),
    ...securitySections.filter((section) => section.id === "governance" || section.id === "policy-packs"),
    ...SETTINGS_MASTER_SECTIONS_INTEGRATIONS,
    ...SETTINGS_MASTER_SECTIONS_WORKSPACE.filter(
      (section) => section.id === "billing" || section.id === "support" || section.id === "health-and-access",
    ),
    ...securitySections.filter(
      (section) =>
        section.id === "security-trust" || section.id === "advanced" || section.id === "developer-internal",
    ),
  ];
}

/** Searchable master settings index — hub links; detail pages own editable controls. */
export const SETTINGS_MASTER_SECTIONS: readonly SettingsMasterSection[] = assembleSettingsMasterSections(
  SETTINGS_MASTER_SECTIONS_SECURITY,
);

export function buildSettingsMasterSections(productLine: ProductLineId = "architecture"): readonly SettingsMasterSection[] {
  return assembleSettingsMasterSections(resolveSettingsMasterSectionsSecurity(productLine));
}

export function settingsMasterSectionDomId(sectionId: string): string {
  return `settings-section-${sectionId}`;
}
