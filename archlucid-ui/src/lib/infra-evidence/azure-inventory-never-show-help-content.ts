import {
  AZURE_INVENTORY_NEVER_SHOW_CATALOG_ARM_TYPES,
  AZURE_INVENTORY_NEVER_SHOW_RESOURCE_TYPE_LAST_SEGMENTS,
  AZURE_INVENTORY_NEVER_SHOW_SQL_DATABASE_ARM_TYPE_PREFIXES,
  AZURE_INVENTORY_NEVER_SHOW_SQL_DATABASE_NAMES,
} from "@/lib/infra-evidence/azure-inventory-never-show-arm-types";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

export const AZURE_INVENTORY_NEVER_SHOW_HELP_SECTION_ID = "inventory-resources-excluded-from-views" as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_SECTION_TITLE = "Resources excluded from inventory views" as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_INTRO =
  "ArchLucid still collects many Azure resource types during inventory capture, but omits the types below from resource lists, attested counts, drift comparison, and default inventory diagrams. That keeps topology views readable and avoids arguing portal totals against Azure Resource Graph when monitoring, DNS, and companion child records would inflate the denominator." as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_CATALOG_HEADING = "Catalog ARM resource types" as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_LAST_SEGMENT_HEADING = "Additional types matched by final path segment" as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_LAST_SEGMENT_BODY =
  "Any resource whose ARM type or resource id ends with one of these path segments is also omitted, even when the full provider/type string is not listed in the catalog table." as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_SQL_HEADING = "SQL database names" as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_SQL_BODY =
  `On ${AZURE_INVENTORY_NEVER_SHOW_SQL_DATABASE_ARM_TYPE_PREFIXES.join(" and ")}, these database names are omitted:` as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_CONDITIONAL_HEADING = "Conditional omissions" as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_CONDITIONAL_ITEMS = [
  "Network interfaces used only for private link endpoints may be omitted when ArchLucid classifies them as private-link-only.",
  "Identity diagram mode may retain managed identities that are otherwise omitted from default inventory diagrams.",
] as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_DIAGRAMS_TOGGLE =
  `On the inventory diagrams workbench, turn on Include always-excluded resources to render omitted types for the current snapshot, or review the Always excluded from diagrams panel when the toggle is off.` as const;

export const AZURE_INVENTORY_NEVER_SHOW_HELP_DIAGRAMS_PATH = GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH;

/** Sorted catalog types for stable help rendering and tests. */
export function listAzureInventoryNeverShowCatalogArmTypesForHelp(): readonly string[] {
  return [...AZURE_INVENTORY_NEVER_SHOW_CATALOG_ARM_TYPES].sort((left, right) => left.localeCompare(right));
}

export function listAzureInventoryNeverShowLastSegmentsForHelp(): readonly string[] {
  return [...AZURE_INVENTORY_NEVER_SHOW_RESOURCE_TYPE_LAST_SEGMENTS].sort((left, right) => left.localeCompare(right));
}

export function listAzureInventoryNeverShowSqlDatabaseNamesForHelp(): readonly string[] {
  return [...AZURE_INVENTORY_NEVER_SHOW_SQL_DATABASE_NAMES];
}
