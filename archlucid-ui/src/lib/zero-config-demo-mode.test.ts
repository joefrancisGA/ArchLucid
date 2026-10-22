import { describe, expect, it, vi } from "vitest";

import { buildDefaultWizardValues } from "@/lib/wizard-schema";
import {
  applyBundledDemoPackageToWizard,
  applyBundledSamplePackageToWizard,
  isZeroConfigDemoQuery,
  resolveZeroConfigDemoSelection,
  ZERO_CONFIG_DEMO_WIZARD_HREF,
} from "@/lib/zero-config-demo-mode";

describe("zero-config-demo-mode", () => {
  it("detects zeroConfig query variants", () => {
    expect(isZeroConfigDemoQuery(new URLSearchParams("zeroConfig=1"))).toBe(true);
    expect(isZeroConfigDemoQuery(new URLSearchParams("zeroConfig=true"))).toBe(true);
    expect(isZeroConfigDemoQuery(new URLSearchParams("zeroConfig=finops-optimization-snapshot"))).toBe(true);
    expect(isZeroConfigDemoQuery(new URLSearchParams("zeroConfig=aws"))).toBe(true);
    expect(isZeroConfigDemoQuery(new URLSearchParams("zeroConfig=gcp"))).toBe(true);
    expect(isZeroConfigDemoQuery(new URLSearchParams("zeroConfig=0"))).toBe(false);
    expect(isZeroConfigDemoQuery(null)).toBe(false);
  });

  it("resolves platform and scenario from zeroConfig query", () => {
    expect(resolveZeroConfigDemoSelection(new URLSearchParams("zeroConfig=1"))).toEqual({
      platform: "azure",
      scenarioId: "claims-intake-modernization",
    });
    expect(resolveZeroConfigDemoSelection(new URLSearchParams("zeroConfig=aws"))).toEqual({
      platform: "aws",
      scenarioId: "claims-intake-modernization",
    });
    expect(resolveZeroConfigDemoSelection(new URLSearchParams("zeroConfig=gcp:finops-optimization-snapshot"))).toEqual({
      platform: "gcp",
      scenarioId: "finops-optimization-snapshot",
    });
    expect(resolveZeroConfigDemoSelection(new URLSearchParams("zeroConfig=multi-region-saas-platform"))).toEqual({
      platform: "azure",
      scenarioId: "multi-region-saas-platform",
    });
  });

  it("exposes wizard href for home CTA", () => {
    expect(ZERO_CONFIG_DEMO_WIZARD_HREF).toBe("/architecture/reviews/new?zeroConfig=1");
  });

  it("applies bundled Azure demo package to wizard fields and pending file", () => {
    const setValue = vi.fn();
    const onPendingFileChange = vi.fn();

    const result = applyBundledSamplePackageToWizard(setValue, onPendingFileChange);

    expect(result.ok).toBe(true);
    expect(setValue).toHaveBeenCalledWith("cloudProvider", "Azure", expect.any(Object));
    expect(onPendingFileChange).toHaveBeenCalledTimes(1);
  });

  it("applies bundled Aws demo package without forcing Azure", () => {
    const setValue = vi.fn();
    const onPendingFileChange = vi.fn();

    const result = applyBundledDemoPackageToWizard(
      { platform: "aws", scenarioId: "claims-intake-modernization" },
      setValue,
      onPendingFileChange,
    );

    expect(result.ok).toBe(true);
    expect(setValue).toHaveBeenCalledWith("cloudProvider", "Aws", expect.any(Object));
    expect(onPendingFileChange).toHaveBeenCalledTimes(1);
  });

  it("applies selected Azure scenario packages", () => {
    const setValue = vi.fn();
    const onPendingFileChange = vi.fn();

    const result = applyBundledDemoPackageToWizard(
      { platform: "azure", scenarioId: "finops-optimization-snapshot" },
      setValue,
      onPendingFileChange,
    );

    expect(result.ok).toBe(true);
    expect(setValue).toHaveBeenCalledWith("systemName", "FinOpsSnapshotRg", expect.any(Object));
  });
});

describe("zero-config-demo-mode wizard defaults", () => {
  it("leaves default wizard values untouched until apply runs", () => {
    expect(buildDefaultWizardValues().cloudProvider).toBe("None");
  });
});
