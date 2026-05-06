/**
 * Back-compat re-export: live ArchLucid.API + tenant SQL flows use the default Playwright entry (`npm exec playwright test`).
 * Local parity bundle: repo-root `release-smoke.ps1 -Profile LiveUiSql` (starts the smoke API then this suite against LIVE_API_URL).
 */
export { default } from "./playwright.config";
