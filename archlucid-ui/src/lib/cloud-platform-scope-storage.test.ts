import { describe, expect, it } from "vitest";

import {
  readCloudPlatformScopeFromStorage,
  visibleCloudProviders,
  visibleLandingPlatformCards,
} from "@/lib/cloud-platform-scope-storage";

describe("cloud-platform-scope-storage", () => {
  it("defaults to all platforms visible", () => {
    const scope = readCloudPlatformScopeFromStorage();

    expect(scope["evidence-only"]).toBe(true);
    expect(scope.azure).toBe(true);
    expect(scope.aws).toBe(true);
    expect(scope.gcp).toBe(true);
  });

  it("orders provider cards neutrally with evidence-only first", () => {
    const cards = visibleLandingPlatformCards({
      "evidence-only": true,
      azure: true,
      aws: true,
      gcp: true,
    });

    expect(cards).toEqual(["evidence-only", "aws", "azure", "gcp"]);
  });

  it("hides deselected providers from landing cards", () => {
    const scope = {
      "evidence-only": true,
      azure: false,
      aws: true,
      gcp: false,
    } as const;

    expect(visibleCloudProviders(scope)).toEqual(["aws"]);
    expect(visibleLandingPlatformCards(scope)).toEqual(["evidence-only", "aws"]);
  });
});
