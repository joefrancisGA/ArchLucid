import { describe, expect, it } from "vitest";

import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { buildSecureNowAcceleratorIndexRows } from "@/lib/product-line/build-securenow-accelerator-index-rows";
import { filterSecureNowAcceleratorRowsByCatalogTag } from "@/lib/product-line/securenow-accelerator-catalog-filters";
import { computeSecureNowAcceleratorFamilyProgress } from "@/lib/product-line/securenow-accelerator-family-progress";
import { SECURENOW_SPECIALTY_TEMPLATES_HREF } from "@/lib/product-line/securenow-accelerator-template-links";

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

  it("keeps the recommended snapshot drift link in Collection after capture", () => {
    const rows = buildSecureNowAcceleratorIndexRows({ latestSnapshotId: "snap-7" });
    const href = `${SECURENOW_INFRASTRUCTURE_DRIFT_PATH}?snapshotId=snap-7`;

    expect(filterSecureNowAcceleratorRowsByCatalogTag(rows, "collection")).toContainEqual(
      expect.objectContaining({ href, recommendedFirst: true }),
    );
    expect(filterSecureNowAcceleratorRowsByCatalogTag(rows, "walks").map((row) => row.href)).not.toContain(href);
  });

  it("puts the linked specialty review templates in Templates rather than Fixture walks", () => {
    const rows = buildSecureNowAcceleratorIndexRows({ latestSnapshotId: null });

    expect(filterSecureNowAcceleratorRowsByCatalogTag(rows, "templates").map((row) => row.href)).toContain(
      SECURENOW_SPECIALTY_TEMPLATES_HREF,
    );
    expect(filterSecureNowAcceleratorRowsByCatalogTag(rows, "walks").map((row) => row.href)).not.toContain(
      SECURENOW_SPECIALTY_TEMPLATES_HREF,
    );
  });

  it("uses the same template family on the progress strip", () => {
    expect(computeSecureNowAcceleratorFamilyProgress([SECURENOW_SPECIALTY_TEMPLATES_HREF])).toContainEqual({
      family: "templates",
      total: 1,
      visited: 1,
    });
  });
});
