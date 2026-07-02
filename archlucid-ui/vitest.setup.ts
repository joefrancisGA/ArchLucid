import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

process.env.NEXT_PUBLIC_OPERATOR_NAV_SHOW_PRE_RELEASE_ROUTES = "1";

/** Default UI is buyer-polished unless `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`; pin full operator for tests. */
process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";

/** Keep unit tests on the non-demo path unless a test file explicitly stubs demo env (avoids hiding Operate controls). */
delete process.env.NEXT_PUBLIC_DEMO_MODE;
delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
delete process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME;
delete process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME_EVAL;

/** Radix Select uses pointer capture APIs not implemented in jsdom. */
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture = function () {
    return false;
  };
  Element.prototype.releasePointerCapture = function () {
    /* no-op */
  };
  Element.prototype.scrollIntoView = vi.fn();
}

/** jsdom does not implement ResizeObserver; operator shell tours and graph views observe layout. */
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}

afterEach(() => {
  cleanup();
});
