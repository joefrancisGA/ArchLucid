import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useBuyerCtoDemoTourKeyboard } from "@/hooks/useBuyerCtoDemoTourKeyboard";
import {
  ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT,
  readBuyerCtoDemoSpotlight,
} from "@/lib/buyer/buyer-cto-demo-tour";
import {
  ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT,
  readOperatorDemoPanicOffline,
} from "@/lib/operator/operator-static-demo";

const push = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push, refresh: vi.fn() }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

describe("useBuyerCtoDemoTourKeyboard", () => {
  it("dispatches spotlight changed on S when tour is active", () => {
    const handler = vi.fn();

    window.addEventListener(ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT, handler);

    renderHook(() => {
      useBuyerCtoDemoTourKeyboard(true);
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));

    expect(handler).toHaveBeenCalled();
    expect(readBuyerCtoDemoSpotlight()).toBe(true);

    window.removeEventListener(ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT, handler);
  });

  it("dispatches panic changed on 0 when tour is active", () => {
    const handler = vi.fn();

    window.addEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, handler);

    renderHook(() => {
      useBuyerCtoDemoTourKeyboard(true);
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "0" }));

    expect(handler).toHaveBeenCalled();
    expect(readOperatorDemoPanicOffline()).toBe(true);

    window.removeEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, handler);
  });

  it("does not dispatch spotlight when tour is inactive", () => {
    const handler = vi.fn();

    window.addEventListener(ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT, handler);

    renderHook(() => {
      useBuyerCtoDemoTourKeyboard(false);
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));

    expect(handler).not.toHaveBeenCalled();

    window.removeEventListener(ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT, handler);
  });
});
