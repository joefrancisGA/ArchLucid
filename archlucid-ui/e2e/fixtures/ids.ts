/** Stable IDs for deterministic Playwright payloads (57R). */
export const FIXTURE_RUN_ID = "e2e-fixture-run-001";
export const FIXTURE_PROJECT_ID = "e2e-fixture-project";
export const FIXTURE_MANIFEST_ID = "e2e-fixture-manifest-001";
/** Manifest with valid summary and intentionally empty artifact descriptor list (57R E2E). */
export const FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID = "e2e-fixture-manifest-empty-artifacts";
export const FIXTURE_LEFT_RUN_ID = "e2e-fixture-left-run";
export const FIXTURE_RIGHT_RUN_ID = "e2e-fixture-right-run";

/** Human slug for screenshot + marketing URLs — avoids `e2e-fixture-*` in showcase PNG filenames. */
export const SHOWCASE_DEMO_RUN_ID = "claims-intake-modernization";

/**
 * Mock API route keys for `capture-all-screenshots` only (`e2e/capture-all-screenshots.spec.ts`).
 * Keeps deterministic Playwright functional specs on {@link FIXTURE_RUN_ID}.
 */
export const SCREENSHOT_RUN_ID = "claims-intake-modernization-run";
export const SCREENSHOT_MANIFEST_ID = "claims-intake-manifest";
export const SCREENSHOT_LEFT_RUN_ID = "claims-intake-run-v1";
export const SCREENSHOT_RIGHT_RUN_ID = "claims-intake-run-v2";
