import { describe, expect, it } from "vitest";

import {
  AZURE_LAB_LANDING_ZONE_DRIFT_RESOURCE_COUNT,
  AZURE_LAB_LANDING_ZONE_RESOURCE_COUNT,
  AZURE_LAB_MESSY_ESTATE_RESOURCE_COUNT,
  buildAzureLabLandingZoneDriftResources,
  buildAzureLabLandingZoneResources,
  buildAzureLabMessyEstateResources,
} from "@/lib/azure-lab-inventory-generator";

describe("azure lab inventory generator", () => {
  it("builds deterministic scale and drift packs", () => {
    const landingZone = buildAzureLabLandingZoneResources();
    const later = buildAzureLabLandingZoneDriftResources();
    const landingZoneIds = new Set(landingZone.map((resource) => resource.id));
    const laterIds = new Set(later.map((resource) => resource.id));

    expect(landingZone).toHaveLength(AZURE_LAB_LANDING_ZONE_RESOURCE_COUNT);
    expect(later).toHaveLength(AZURE_LAB_LANDING_ZONE_DRIFT_RESOURCE_COUNT);
    expect(buildAzureLabLandingZoneResources()).toEqual(landingZone);
    expect([...landingZoneIds].filter((id) => laterIds.has(id))).toHaveLength(485);
    expect(landingZone.filter((resource) => !laterIds.has(resource.id))).toHaveLength(15);
    expect(later.filter((resource) => !landingZoneIds.has(resource.id)).map((resource) => resource.name)).toEqual(
      Array.from({ length: 15 }, (_, index) => `added-app-lz-app-new-${index + 1}`),
    );
  });

  it("builds the deliberately irregular estate", () => {
    const resources = buildAzureLabMessyEstateResources();
    const duplicateNames = resources.filter((resource) => resource.name === "duplicate-name");

    expect(resources).toHaveLength(AZURE_LAB_MESSY_ESTATE_RESOURCE_COUNT);
    expect(duplicateNames).toHaveLength(2);
    expect(resources.some((resource) => resource.location === "")).toBe(true);
    expect(resources.some((resource) => resource.type === "Microsoft.Contoso/widgets" && resource.isUnknownType === true)).toBe(true);
    expect(resources.some((resource) => resource.name.length === 180)).toBe(true);
    expect(resources.some((resource) => resource.name === "Nätverk-テスト")).toBe(true);
    expect(resources.some((resource) => resource.name === "pe-missing-target-1")).toBe(true);
    expect(new Set(resources.map((resource) => resource.id)).size).toBe(resources.length);
    expect(resources.every((resource) => !resource.name.includes("/"))).toBe(true);
  });
});
