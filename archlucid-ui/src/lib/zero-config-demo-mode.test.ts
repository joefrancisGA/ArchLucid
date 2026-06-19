import { describe, expect, it, vi } from "vitest";

import { buildDefaultWizardValues } from "@/lib/wizard-schema";
import {
  BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_ZIP_FILENAME,
  createBundledArchLucidAzurePackageSampleZipFile,
} from "@/lib/arch-lucid-azure-package-sample-zip";
import {
  applyBundledSamplePackageToWizard,
  isZeroConfigDemoQuery,
  ZERO_CONFIG_DEMO_WIZARD_HREF,
} from "@/lib/zero-config-demo-mode";

describe("zero-config-demo-mode", () => {
  it("detects zeroConfig query variants", () => {
    expect(isZeroConfigDemoQuery(new URLSearchParams("zeroConfig=1"))).toBe(true);
    expect(isZeroConfigDemoQuery(new URLSearchParams("zeroConfig=true"))).toBe(true);
    expect(isZeroConfigDemoQuery(new URLSearchParams("zeroConfig=0"))).toBe(false);
    expect(isZeroConfigDemoQuery(null)).toBe(false);
  });

  it("exposes wizard href for home CTA", () => {
    expect(ZERO_CONFIG_DEMO_WIZARD_HREF).toBe("/reviews/new?zeroConfig=1");
  });

  it("applies bundled sample package to wizard fields and pending file", () => {
    const setValue = vi.fn();
    const onPendingFileChange = vi.fn();

    const result = applyBundledSamplePackageToWizard(setValue, onPendingFileChange);

    expect(result.ok).toBe(true);
    expect(setValue).toHaveBeenCalledWith("cloudProvider", "Azure", expect.any(Object));
    expect(onPendingFileChange).toHaveBeenCalledTimes(1);

    const file = onPendingFileChange.mock.calls[0]?.[0] as File;
    expect(file.name).toBe(BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_ZIP_FILENAME);
  });

  it("creates a non-empty sample zip file", () => {
    const file = createBundledArchLucidAzurePackageSampleZipFile();

    expect(file.size).toBeGreaterThan(0);
    expect(file.type).toBe("application/zip");
  });
});

describe("zero-config-demo-mode wizard defaults", () => {
  it("leaves default wizard values untouched until apply runs", () => {
    expect(buildDefaultWizardValues().cloudProvider).toBe("None");
  });
});
