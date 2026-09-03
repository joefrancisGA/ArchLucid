import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isExplicitStaticDemoMarketingBuild,
  shouldMergeDemoRunsIntoProjectPicker,
  shouldShowOperatorDemoMarketingChrome,
  shouldShowRunDetailStandaloneSampleBadge,
  shouldUseGovernanceCuratedDemoSpine,
} from "@/lib/buyer/buyer-demo-content-gating";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("buyer-demo-content-gating (TB-273 / BDA-024)", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    vi.resetModules();
  });

  it("treats default buyer-polished shell without demo flags as non-demo marketing", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    expect(isExplicitStaticDemoMarketingBuild()).toBe(false);
    expect(shouldShowOperatorDemoMarketingChrome(true, true)).toBe(false);
    expect(shouldUseGovernanceCuratedDemoSpine()).toBe(false);
    expect(shouldMergeDemoRunsIntoProjectPicker()).toBe(false);
  });

  it("allows demo marketing chrome when static-operator flag is set", () => {
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = "true";

    expect(isExplicitStaticDemoMarketingBuild()).toBe(true);
    expect(shouldShowOperatorDemoMarketingChrome(true, true)).toBe(true);
    expect(shouldUseGovernanceCuratedDemoSpine()).toBe(true);
    expect(shouldMergeDemoRunsIntoProjectPicker()).toBe(true);
  });

  it("honors mergeDemoOnEmpty=false for tenant sponsor exports", () => {
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = "true";

    expect(shouldMergeDemoRunsIntoProjectPicker({ mergeDemoOnEmpty: false })).toBe(false);
  });

  it("suppresses standalone sample badge when curated showcase banner owns the chip", () => {
    expect(
      shouldShowRunDetailStandaloneSampleBadge(true, false, SHOWCASE_STATIC_DEMO_RUN_ID),
    ).toBe(false);
    expect(
      shouldShowRunDetailStandaloneSampleBadge(true, false, "customer-intake-modernization-run"),
    ).toBe(false);
    expect(shouldShowRunDetailStandaloneSampleBadge(true, false, "other-static-demo-run")).toBe(true);
    expect(shouldShowRunDetailStandaloneSampleBadge(true, true, "other-static-demo-run")).toBe(false);
    expect(shouldShowRunDetailStandaloneSampleBadge(false, false, SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(false);
  });
});
