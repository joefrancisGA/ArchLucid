import { describe, expect, it } from "vitest";

import { inventoryStatusPresentation } from "./ExtractUploadSettingsPageHeader";

describe("inventoryStatusPresentation", () => {
  it("labels a missing inventory status without changing stored boolean states", () => {
    expect(inventoryStatusPresentation(false, false, null)).toEqual({
      kind: "neutral",
      label: "Inventory status was not stored",
    });
    expect(inventoryStatusPresentation(false, false, false)?.label).toBe("No inventory on file");
    expect(inventoryStatusPresentation(false, false, true)?.label).toBe("Inventory on file");
  });
});
