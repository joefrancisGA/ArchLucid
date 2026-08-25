import { describe, expect, it } from "vitest";

import {
  resolveExtractUploadPackageEmphasizedStepId,
  resolveExtractUploadPackageSteps,
} from "@/lib/extract-upload-package-checklist";

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
