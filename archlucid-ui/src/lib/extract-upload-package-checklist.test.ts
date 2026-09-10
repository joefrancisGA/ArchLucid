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
  it("emphasizes provider before upload", () => {
    expect(
      resolveExtractUploadPackageEmphasizedStepId({
        providerSelected: false,
        packageAccepted: false,
        inventoryParsed: false,
      }),
    ).toBe("provider");
  });

  it("marks upload complete only after acceptance", () => {
    const steps = resolveExtractUploadPackageSteps({
      providerSelected: true,
      packageAccepted: true,
      inventoryParsed: false,
    });

    expect(steps.find((step) => step.id === "upload")?.complete).toBe(true);
    expect(steps.find((step) => step.id === "parse")?.complete).toBe(false);
  });
});
