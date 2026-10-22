import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  enableCtoDemoOfflineAutoFallback,
  shouldListenForCtoDemoOfflineAutoFallback,
} from "@/lib/cto-demo-offline-auto-fallback";
import { BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY } from "@/lib/buyer/buyer-cto-demo-tour";
import { OPERATOR_DEMO_STATIC_PANIC_STORAGE_KEY } from "@/lib/operator/operator-static-demo";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: () => true,
};
});

describe("cto-demo-offline-auto-fallback", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY, "1");
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("enables panic offline when tour is active and panic is not already on", () => {
    expect(shouldListenForCtoDemoOfflineAutoFallback()).toBe(true);
    expect(enableCtoDemoOfflineAutoFallback("browser-offline")).toBe(true);
    expect(localStorage.getItem(OPERATOR_DEMO_STATIC_PANIC_STORAGE_KEY)).toBe("1");
    expect(shouldListenForCtoDemoOfflineAutoFallback()).toBe(false);
  });

  it("does not re-enable panic offline when already active", () => {
    localStorage.setItem(OPERATOR_DEMO_STATIC_PANIC_STORAGE_KEY, "1");

    expect(enableCtoDemoOfflineAutoFallback("browser-offline")).toBe(false);
  });
});
