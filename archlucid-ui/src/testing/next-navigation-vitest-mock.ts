import { vi } from "vitest";

type NextNavigationModule = typeof import("next/navigation");

/** Default `next/navigation` stubs for unit tests (includes server `redirect`). */
export const nextNavigationVitestStubs: Partial<NextNavigationModule> = {
  useRouter: () =>
    ({
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      bfcacheId: null,
    }) as unknown as ReturnType<NextNavigationModule["useRouter"]>,
  usePathname: () => "/",
  // Match Next readonly params API shape expected by TS
  useSearchParams: () =>
    ({
      get: vi.fn(),
      getAll: vi.fn(),
      has: vi.fn(),
      toString: vi.fn(() => ""),
      entries: vi.fn(),
      forEach: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      [Symbol.iterator]: vi.fn(),
    }) as unknown as ReturnType<NextNavigationModule["useSearchParams"]>,
  redirect: vi.fn() as unknown as NextNavigationModule["redirect"],
  permanentRedirect: vi.fn() as unknown as NextNavigationModule["permanentRedirect"],
  notFound: vi.fn() as unknown as NextNavigationModule["notFound"],
};

/** Extends partial `next/navigation` vitest mocks with redirect and router stubs. */
export async function extendNextNavigationVitestMock(
  importOriginal: () => Promise<NextNavigationModule>,
  overrides: Partial<NextNavigationModule> = {},
): Promise<NextNavigationModule> {
  const actual = await importOriginal();

  return {
    ...actual,
    ...nextNavigationVitestStubs,
    ...overrides,
  } as unknown as NextNavigationModule;
}
