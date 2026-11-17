/**
 * Opt into buyer-polished / eval chrome in a Vitest file (PDCE hook migration).
 * Place before component imports, alongside legacy `demo-ui-env` mocks when needed.
 */
export const productionEvalChromeVitestMock = {
  useProductionDeskChrome: (): boolean => false,
  useProductionEvalChrome: (): boolean => true,
} as const;
