import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isExplicitStaticDemoMarketingBuild,
  shouldMergeDemoRunsIntoProjectPicker,
  shouldShowOperatorDemoMarketingChrome,
  shouldUseGovernanceCuratedDemoSpine,
} from "@/lib/buyer/buyer-demo-content-gating";

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
});
