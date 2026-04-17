/**
 * Back-compat re-export: live API + SQL is the default Playwright config (`playwright.config.ts`).
 * Prefer `npx playwright test` without `-c`.
 */
export { default } from "./playwright.config";
