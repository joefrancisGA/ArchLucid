import { DEV_SCOPE_PROJECT_ID } from "@/lib/scope";
import {
  CUSTOMER_INTAKE_LATER_COMPARE_RUN_ID,
  CUSTOMER_INTAKE_MANIFEST_ID,
  CUSTOMER_INTAKE_PRIOR_COMPARE_RUN_ID,
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
  CUSTOMER_INTAKE_PRIMARY_FINDING_ID,
} from "@/lib/samples/customer-intake-modernization/definition";

/** Stable IDs for deterministic Playwright payloads (57R). */
export const FIXTURE_RUN_ID = "e2e-fixture-run-001";

/**
 * Finding slug aligned with `breadcrumb-map` for {@link FIXTURE_RUN_ID} on mock/local fixtures.
 * Live API + SQL E2E should prefer {@link SHOWCASE_DEMO_RUN_ID} + {@link SCREENSHOT_FINDING_ID} (see `smoke.spec.ts`).
 */
export const FIXTURE_FINDING_ID = "e2e-finding-001";
/** Matches {@link getScopeHeaders} / mock E2E SSR scope so run detail passes {@link runProjectMatchesEffectiveScope}. */
export const FIXTURE_PROJECT_ID = DEV_SCOPE_PROJECT_ID;
export const FIXTURE_MANIFEST_ID = "f0000001-0000-4000-8000-000000000001";
/** Manifest with valid summary and intentionally empty artifact descriptor list (57R E2E). */
export const FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID = "f0000002-0000-4000-8000-000000000002";
export const FIXTURE_LEFT_RUN_ID = "e2e-fixture-left-run";
export const FIXTURE_RIGHT_RUN_ID = "e2e-fixture-right-run";

/** Extra run id for compare stale-input Playwright: selectable alternate left after a successful compare. */
export const FIXTURE_COMPARE_STALE_ALT_LEFT_RUN_ID = "e2e-fixture-compare-stale-alt-left";

/** Human slug for screenshot + marketing URLs — avoids `e2e-fixture-*` in showcase PNG filenames. */
export const SHOWCASE_DEMO_RUN_ID = CUSTOMER_INTAKE_SAMPLE_RUN_ID;

/** Canonical manifest UUID aligned with `showcase-static-demo` and operator mock. */
export const SHOWCASE_STATIC_DEMO_MANIFEST_ID = CUSTOMER_INTAKE_MANIFEST_ID;

/**
 * Mock API route keys for `capture-all-screenshots` only (`e2e/capture-all-screenshots.spec.ts`).
 * Keeps deterministic Playwright functional specs on {@link FIXTURE_RUN_ID}.
 */
export const SCREENSHOT_RUN_ID = "customer-intake-modernization-run";

/** Non-fixture path segments for screenshot captures (human-readable slugs). */
export const SCREENSHOT_FINDING_ID = CUSTOMER_INTAKE_PRIMARY_FINDING_ID;
/** Human slug for planning plan detail URLs; used by live axe (`live-api-accessibility.spec.ts`) when learning plans are seeded. */
export const SCREENSHOT_PLAN_ID = "customer-intake-modernization-plan";
export const SCREENSHOT_APPROVAL_ID = "customer-intake-approval-001";
/** Human slug for governance policy pack detail screenshots; aligns with `breadcrumb-map` demo segment titles. */
export const SCREENSHOT_POLICY_PACK_ID = "healthcare-claims-v3-pack";
/** Screenshot manifest detail uses the canonical showcase UUID so mock API aligns with operator/showcase. */
export const SCREENSHOT_MANIFEST_ID = SHOWCASE_STATIC_DEMO_MANIFEST_ID;
export const SCREENSHOT_LEFT_RUN_ID = CUSTOMER_INTAKE_PRIOR_COMPARE_RUN_ID;
export const SCREENSHOT_RIGHT_RUN_ID = CUSTOMER_INTAKE_LATER_COMPARE_RUN_ID;

/** Seeded welcome run for mocked trial-funnel Playwright + Node mock `trial-status` / `pilot-run-deltas` fallbacks. */
export const MOCK_TRIAL_WELCOME_RUN_ID = "44444444-4444-4444-4444-444444444444";
