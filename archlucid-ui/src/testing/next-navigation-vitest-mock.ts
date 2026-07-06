import { vi } from "vitest";
import type { ReadonlyURLSearchParams } from "next/navigation";

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
  useSearchParams: () =>
    new URLSearchParams() as unknown as ReadonlyURLSearchParams,
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
};

/** Extends partial `next/navigation` vitest mocks with redirect and router stubs. */
export async function extendNextNavigationVitestMock(
  importOriginal: () => Promise<typeof import("next/navigation")>,
  overrides: Record<string, unknown> = {},
): Promise<typeof import("next/navigation")> {
  const actual = await importOriginal();

  return {
    ...actual,
    ...nextNavigationVitestStubs,
    ...overrides,
  } as unknown as typeof import("next/navigation");
}
