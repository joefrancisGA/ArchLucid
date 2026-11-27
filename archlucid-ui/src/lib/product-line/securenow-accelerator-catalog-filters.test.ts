import { describe, expect, it } from "vitest";

import { filterSecureNowAcceleratorRowsByCatalogTag } from "@/lib/product-line/securenow-accelerator-catalog-filters";

describe("securenow-accelerator-catalog-filters", () => {
  it("filters collection family rows", () => {
    const rows = [
      { href: "/integrations/cloud-connections", label: "Collection", summary: "s" },
      { href: "/administration/securenow-scenario-walks", label: "Walks", summary: "s" },
    ];

    const filtered = filterSecureNowAcceleratorRowsByCatalogTag(rows, "collection");

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.href).toBe("/integrations/cloud-connections");
  });
});
