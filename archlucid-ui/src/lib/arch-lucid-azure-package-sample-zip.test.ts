import { describe, expect, it } from "vitest";

import { buildWizardPrefillFromArchLucidAzureManifest } from "@/lib/apply-arch-lucid-azure-package-manifest-to-wizard";
import {
  BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_MANIFEST,
  getBundledArchLucidAzurePackageSampleZipBytes,
} from "@/lib/arch-lucid-azure-package-sample-zip";
import { readArchLucidAzurePackageZipFromBytes } from "@/lib/read-arch-lucid-azure-package-zip";

describe("arch-lucid-azure-package-sample-zip", () => {
  it("ships a valid packager ZIP that prefills SampleRg", () => {
    const result = readArchLucidAzurePackageZipFromBytes(getBundledArchLucidAzurePackageSampleZipBytes());

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.manifest).toEqual(BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_MANIFEST);

    const prefill = buildWizardPrefillFromArchLucidAzureManifest(result.manifest);
    expect(prefill.systemName).toBe("SampleRg");
  });
});
