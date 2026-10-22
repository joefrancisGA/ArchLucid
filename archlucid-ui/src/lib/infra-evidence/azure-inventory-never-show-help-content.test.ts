import { describe, expect, it } from "vitest";

import {
  AZURE_INVENTORY_NEVER_SHOW_HELP_SECTION_ID,
  listAzureInventoryNeverShowCatalogArmTypesForHelp,
} from "@/lib/infra-evidence/azure-inventory-never-show-help-content";
import { AZURE_INVENTORY_NEVER_SHOW_CATALOG_ARM_TYPES } from "@/lib/infra-evidence/azure-inventory-never-show-arm-types";

describe("azure-inventory-never-show-help-content", () => {
  it("lists the same catalog ARM types as the never-show filter module", () => {
    expect(listAzureInventoryNeverShowCatalogArmTypesForHelp()).toHaveLength(
      AZURE_INVENTORY_NEVER_SHOW_CATALOG_ARM_TYPES.length,
    );
    expect(new Set(listAzureInventoryNeverShowCatalogArmTypesForHelp())).toEqual(
      new Set(AZURE_INVENTORY_NEVER_SHOW_CATALOG_ARM_TYPES),
    );
  });

  it("uses a stable help anchor id", () => {
    expect(AZURE_INVENTORY_NEVER_SHOW_HELP_SECTION_ID).toBe("inventory-resources-excluded-from-views");
  });
});
