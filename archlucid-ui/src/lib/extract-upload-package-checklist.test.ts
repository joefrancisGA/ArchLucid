import { describe, expect, it } from "vitest";

import {
  resolveExtractUploadHasInventoryOnFile,
  resolveExtractUploadPackageEmphasizedStepId,
  resolveExtractUploadPackageSteps,
} from "@/lib/extract-upload-package-checklist";

describe("resolveExtractUploadHasInventoryOnFile", () => {
  it("returns true when baseline artifacts exist", () => {
    expect(
      resolveExtractUploadHasInventoryOnFile({
        hasBaselineArtifacts: true,
        packageId: null,
      }),
    ).toBe(true);
  });

  it("returns true when a package was accepted on this page session", () => {
    expect(
      resolveExtractUploadHasInventoryOnFile({
        hasBaselineArtifacts: false,
        packageId: "pkg-123",
      }),
    ).toBe(true);
  });

  it("returns false when baseline is empty and no upload succeeded", () => {
    expect(
      resolveExtractUploadHasInventoryOnFile({
        hasBaselineArtifacts: false,
        packageId: null,
      }),
    ).toBe(false);
  });

  it("returns null when baseline status is unknown and no upload succeeded", () => {
    expect(
      resolveExtractUploadHasInventoryOnFile({
        hasBaselineArtifacts: null,
        packageId: null,
      }),
    ).toBeNull();
  });
});

describe("resolveExtractUploadPackageSteps", () => {
  it("emphasizes scenario before upload", () => {
    expect(
      resolveExtractUploadPackageEmphasizedStepId({
        scenarioSelected: false,
        packageUploaded: false,
        inventoryParsed: false,
      }),
    ).toBe("scenario");
  });
});
