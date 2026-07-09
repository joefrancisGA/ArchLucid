import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isBuyerPolishedOperatorShellEnv,
  isBuyerVocabularyPassActive,
  isCompareRouteBlockedUnderDemoStrictShell,
  isOperatorExperienceFullShellEnv,
} from "@/lib/demo-ui-env";

describe("demo-ui-env — TB-643 buyer-default shell", () => {
  const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
  const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
  const originalOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
  const originalE2eBypass = process.env.NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES;

  afterEach(() => {
    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    } else {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    } else {
      delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    }

    if (originalOperatorExperience !== undefined) {
      process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = originalOperatorExperience;
    } else {
      delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    }

    if (originalE2eBypass !== undefined) {
      process.env.NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES = originalE2eBypass;
    } else {
      delete process.env.NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES;
    }
  });

  it("defaults buyer-polished shell when operator experience is unset", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    expect(isBuyerPolishedOperatorShellEnv()).toBe(true);
    expect(isOperatorExperienceFullShellEnv()).toBe(false);
  });

  it("keeps buyer-polished shell when operator experience is explicitly operator", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";

    expect(isBuyerPolishedOperatorShellEnv()).toBe(true);
    expect(isOperatorExperienceFullShellEnv()).toBe(true);
  });

  it("keeps buyer vocabulary pass active for default and full-operator shells", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    expect(isBuyerVocabularyPassActive()).toBe(true);

    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";

    expect(isBuyerVocabularyPassActive()).toBe(true);
  });

  it("does not block compare solely because buyer-polished is the default shell", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    delete process.env.NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES;

    expect(isCompareRouteBlockedUnderDemoStrictShell()).toBe(false);
  });

  it("honors dev shell override cookie over build env in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    document.cookie = "archlucid_dev_shell_experience_v1=buyer-polished; Path=/";

    expect(isOperatorExperienceFullShellEnv()).toBe(false);

    document.cookie = "archlucid_dev_shell_experience_v1=full-operator; Path=/";

    expect(isOperatorExperienceFullShellEnv()).toBe(true);

    document.cookie = "archlucid_dev_shell_experience_v1=; Max-Age=0; Path=/";
  });
});
