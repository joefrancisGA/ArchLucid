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
  it("emphasizes upload before inventory is confirmed", () => {
    expect(
      resolveExtractUploadPackageEmphasizedStepId({
        packageAccepted: false,
        inventoryParsed: false,
      }),
    ).toBe("upload");
  });

  it("marks upload complete when inventory is already on file", () => {
    const steps = resolveExtractUploadPackageSteps({
      packageAccepted: false,
      inventoryParsed: true,
    });

    expect(steps).toHaveLength(2);
    expect(steps.find((step) => step.id === "upload")?.complete).toBe(true);
    expect(steps.find((step) => step.id === "parse")?.complete).toBe(true);
  });

  it("marks upload complete only after acceptance when inventory is not yet on file", () => {
    const steps = resolveExtractUploadPackageSteps({
      packageAccepted: true,
      inventoryParsed: false,
    });

    expect(steps.find((step) => step.id === "upload")?.complete).toBe(true);
    expect(steps.find((step) => step.id === "parse")?.complete).toBe(false);
    expect(
      resolveExtractUploadPackageEmphasizedStepId({
        packageAccepted: true,
        inventoryParsed: false,
      }),
    ).toBe("parse");
  });

  it("keeps upload pending while replacing inventory even when baseline exists", () => {
    const steps = resolveExtractUploadPackageSteps({
      packageAccepted: false,
      inventoryParsed: true,
      replacingInventory: true,
    });

    expect(steps.find((step) => step.id === "upload")?.complete).toBe(false);
    expect(
      resolveExtractUploadPackageEmphasizedStepId({
        packageAccepted: false,
        inventoryParsed: true,
        replacingInventory: true,
      }),
    ).toBe("upload");
  });
});
