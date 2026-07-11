import { describe, expect, it } from "vitest";

import {
  operatorHomeGateAllowsInitialPaint,
  operatorHomeGateBlocksInitialPaint,
  pathnameExemptFromOperatorAccessGate,
  shouldDeferOperatorShellChrome,
} from "@/lib/operator-shell-access-gate";

describe("operator-shell-access-gate", () => {
  it("exempts auth and access-denied routes from deferral", () => {
    expect(pathnameExemptFromOperatorAccessGate("/403")).toBe(true);
    expect(pathnameExemptFromOperatorAccessGate("/auth/callback")).toBe(true);
    expect(pathnameExemptFromOperatorAccessGate("/reviews")).toBe(false);
  });

  it("defers chrome while authority is loading on operator routes", () => {
    expect(shouldDeferOperatorShellChrome("/reviews", true)).toBe(true);
    expect(shouldDeferOperatorShellChrome("/reviews", false)).toBe(false);
  });

  it("does not defer chrome on exempt routes even while authority loads", () => {
    expect(shouldDeferOperatorShellChrome("/403", true)).toBe(false);
  });

  it("blocks operator home initial paint when JWT session is absent", () => {
    expect(operatorHomeGateBlocksInitialPaint("/")).toBe(!operatorHomeGateAllowsInitialPaint());
    expect(operatorHomeGateBlocksInitialPaint("/reviews")).toBe(false);
  });
});
