import { vi } from "vitest";

type NextNavigation = typeof import("next/navigation");
type UseSearchParamsReturn = ReturnType<NextNavigation["useSearchParams"]>;

/** Read-only search params shape from installed `next/navigation` (not mutable `URLSearchParams`). */
function createMockSearchParams(): UseSearchParamsReturn {
  return new URLSearchParams() as unknown as UseSearchParamsReturn;
}

/** Default `next/navigation` stubs for unit tests (includes server `redirect`). */
export const nextNavigationVitestStubs = {
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => createMockSearchParams(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
} satisfies Partial<NextNavigation>;

/** Extends partial `next/navigation` vitest mocks with redirect and router stubs. */
export async function extendNextNavigationVitestMock(
  importOriginal: () => Promise<NextNavigation>,
  overrides: Record<string, unknown> = {},
): Promise<NextNavigation> {
  const actual = await importOriginal();

  return {
    ...actual,
    ...nextNavigationVitestStubs,
    ...overrides,
  } as NextNavigation;
}
