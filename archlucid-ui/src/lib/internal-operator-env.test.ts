import { afterEach, describe, expect, it, vi } from "vitest";

import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";

describe("isArchLucidInternalOperatorShellEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "");

    expect(isArchLucidInternalOperatorShellEnv()).toBe(false);
  });

  it("returns true for true/1", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");
    expect(isArchLucidInternalOperatorShellEnv()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "1");
    expect(isArchLucidInternalOperatorShellEnv()).toBe(true);
  });
});
