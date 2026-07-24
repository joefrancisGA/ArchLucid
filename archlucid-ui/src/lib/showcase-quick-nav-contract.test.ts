import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canShowcaseAnonymousVisitorOpenOperatorDeepLinks,
  SHOWCASE_QUICK_NAV_SIGN_IN_CTA,
} from "@/lib/showcase-quick-nav-contract";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("showcase-quick-nav-contract", () => {
  const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;
  const originalStaticOperator = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
  const originalOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = originalDemoMode;
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStaticOperator;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = originalOperatorExperience;
    process.env.NODE_ENV = originalNodeEnv;
    vi.unstubAllEnvs();
  });

  it("allows deep links in packaged demo mode", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "false");
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "operator");

    expect(canShowcaseAnonymousVisitorOpenOperatorDeepLinks(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(true);
  });

  it("requires sign-in on production-like operator shell without demo static fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "false");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "false");
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "operator");
    vi.stubEnv("NODE_ENV", "production");

    expect(canShowcaseAnonymousVisitorOpenOperatorDeepLinks(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(false);
  });

  it("requires sign-in on buyer-polished default shell without packaged demo flags", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "false");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "false");
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    vi.stubEnv("NODE_ENV", "production");

    expect(canShowcaseAnonymousVisitorOpenOperatorDeepLinks(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(false);
  });

  it("exports stable sign-in CTA copy", () => {
    expect(SHOWCASE_QUICK_NAV_SIGN_IN_CTA).toMatch(/sign in/i);
  });
});
