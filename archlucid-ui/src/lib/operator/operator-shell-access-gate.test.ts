import { describe, expect, it, vi } from "vitest";

const { signedInState } = vi.hoisted(() => ({
  signedInState: { value: true },
}));

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "entra-jwt",
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => true,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => signedInState.value,
}));

import {
  operatorHomeGateAllowsInitialPaint,
  operatorHomeGateBlocksInitialPaint,
  pathnameExemptFromOperatorAccessGate,
  shouldDeferOperatorShellChrome,
  unsignedJwtSessionBlocksOperatorShell,
} from "@/lib/operator/operator-shell-access-gate";

describe("operator-shell-access-gate", () => {
  it("exempts auth and access-denied routes from deferral", () => {
    expect(pathnameExemptFromOperatorAccessGate("/403")).toBe(true);
    expect(pathnameExemptFromOperatorAccessGate("/auth/callback")).toBe(true);
    expect(pathnameExemptFromOperatorAccessGate("/architecture/reviews")).toBe(false);
  });

  it("defers chrome while authority is loading on operator routes", () => {
    signedInState.value = true;

    expect(shouldDeferOperatorShellChrome("/architecture/reviews", true)).toBe(true);
    expect(shouldDeferOperatorShellChrome("/architecture/reviews", false)).toBe(false);
  });

  it("defers chrome on deep-linked operator routes when JWT session is absent", () => {
    signedInState.value = false;

    expect(unsignedJwtSessionBlocksOperatorShell("/architecture/reviews")).toBe(true);
    expect(shouldDeferOperatorShellChrome("/architecture/reviews", false)).toBe(true);
    expect(shouldDeferOperatorShellChrome("/403", false)).toBe(false);
  });

  it("does not defer chrome on exempt routes even while authority loads", () => {
    signedInState.value = true;

    expect(shouldDeferOperatorShellChrome("/403", true)).toBe(false);
  });

  it("blocks operator home initial paint when JWT session is absent", () => {
    signedInState.value = false;

    expect(operatorHomeGateBlocksInitialPaint("/")).toBe(!operatorHomeGateAllowsInitialPaint());
    expect(operatorHomeGateBlocksInitialPaint("/architecture/reviews")).toBe(false);
  });
});
