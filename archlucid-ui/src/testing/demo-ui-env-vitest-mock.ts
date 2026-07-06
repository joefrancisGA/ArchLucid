/** Extends partial `@/lib/demo-ui-env` vitest mocks with the full module surface. */
export async function extendDemoUiEnvVitestMock(
  importOriginal: () => Promise<typeof import("@/lib/demo-ui-env")>,
  overrides: Partial<typeof import("@/lib/demo-ui-env")> = {},
): Promise<typeof import("@/lib/demo-ui-env")> {
  const actual = await importOriginal();

  return {
    ...actual,
    ...overrides,
  };
}
