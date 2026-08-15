/**
 * **Next.js:** `process.env.NEXT_PUBLIC_*` is inlined at build time — safe to read from client bundles.
 *
 * **Full operator shell** — set `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` to opt into the dense operator nav, shortcuts,
 * and unpolished labels. **Unset or any other value** uses the buyer-oriented shell (new-tenant default — see
 * `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md`). Demos (`NEXT_PUBLIC_DEMO_MODE` / `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`)
 * stay buyer-polished regardless.
 */
import {
  readDevShellExperienceOverrideFromDocument,
  type DevShellExperienceOverride,
} from "@/lib/dev-testing-overrides";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";

function resolveOperatorExperienceFullShellFromBuildEnv(): boolean {
  const raw = (process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE ?? "").trim().toLowerCase();

  return raw === "operator";
}

/**
 * Full operator shell density (nav metadata, shortcut chips, engineering chrome).
 * In local development, a browser cookie override wins over the build-time env — see
 * {@link DevTestingQuickSwitchPanel}.
 */
export function isOperatorExperienceFullShellEnv(override?: DevShellExperienceOverride | null): boolean {
  const cookieOverride =
    override !== undefined ? override : readDevShellExperienceOverrideFromDocument();

  if (cookieOverride === "full-operator") {
    return true;
  }

  if (cookieOverride === "buyer-polished") {
    return false;
  }

  return resolveOperatorExperienceFullShellFromBuildEnv();
}

/**
 * **Next.js:** `process.env.NEXT_PUBLIC_*` is inlined at build time — safe to read from client bundles.
 */
export function isNextPublicDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

/**
 * Marketing/demo pages: suppress raw fixture IDs, generated timestamps, and similar in banners when either public
 * demo mode or static-operator demo build is enabled.
 */
export function isBuyerSafeDemoMarketingChromeEnv(): boolean {
  return (
    isNextPublicDemoMode() ||
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true" ||
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "1"
  );
}

/**
 * Operator shell chrome tuned for buyer walkthroughs: softer Jump control, friendly scope labels, fewer shortcut chips.
 * **Default:** buyer-polished for all authenticated production deploys (TB-643). Full-operator opt-in keeps buyer
 * vocabulary; engineering chrome is gated separately via {@link isOperatorExperienceFullShellEnv}.
 */
export function isBuyerPolishedOperatorShellEnv(): boolean {
  if (isNextPublicDemoMode()) {
    return true;
  }

  if (process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true" || process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "1") {
    return true;
  }

  if (typeof window !== "undefined" && readFrictionlessTrialSessionEnabled()) {
    return true;
  }

  return true;
}

/**
 * Buyer vocabulary replacements (run→review, manifest→signed package) on primary operator surfaces.
 * **Default:** active for all authenticated production deploys (TB-645); independent of full-operator chrome opt-in.
 */
export function isBuyerVocabularyPassActive(): boolean {
  return isBuyerPolishedOperatorShellEnv();
}

/**
 * Next.js client-only redirect gate for packaged demos — active when static-operator or explicit demo mode builds ship.
 */
export function isDemoStrictNavigationRedirectsActive(): boolean {
  return (
    isNextPublicDemoMode() ||
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true" ||
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "1"
  );
}

/**
 * Mock / Playwright screenshot crawls intentionally visit operator routes blocked in packaged demo navigation gates
 * (including `/why-archlucid`, which buyer-polished shells redirect to the sponsor report).
 * **Build-time:** set only in harness env (see `playwright.mock.config.ts` and live E2E CI builds); never enable in sponsor-facing demo builds.
 */
export function isDemoStrictNavigationRedirectsBypassedForE2E(): boolean {
  const raw = (process.env.NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES ?? "").trim().toLowerCase();

  return raw === "1" || raw === "true";
}

/**
 * Packaged demos (public demo mode or static-operator) hide `/insights/compare-two-reviews` for buyer-safe navigation unless explicitly allowed.
 * **`NEXT_PUBLIC_DEMO_ALLOW_COMPARE_ROUTE`:** set `"true"` or `"1"` to keep Compare reachable in strict demo redirects.
 *
 * Also unblocked at runtime when the CTO demo tour is active — the tour overlay shows a compare link on step 3
 * and the presenter needs to reach it without an env var change mid-session.
 *
 * Bypassed when {@link isDemoStrictNavigationRedirectsBypassedForE2E} is true so Playwright can reach advanced routes.
 */
export function isCompareRouteBlockedUnderDemoStrictShell(): boolean {
  if (isDemoStrictNavigationRedirectsBypassedForE2E()) {
    return false;
  }

  const allowCompare = (process.env.NEXT_PUBLIC_DEMO_ALLOW_COMPARE_ROUTE ?? "").trim().toLowerCase();

  if (allowCompare === "1" || allowCompare === "true") {
    return false;
  }

  if (isCtoDemoTourActiveRuntime()) {
    return false;
  }

  if (isDemoStrictNavigationRedirectsActive()) {
    return true;
  }

  return false;
}

/**
 * Client-runtime check: true when the CTO demo tour localStorage flag is set.
 * Safe to call on the server (returns false when `window` is undefined).
 */
function isCtoDemoTourActiveRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem("archlucid.buyerCtoDemoTour.active.v1") === "1";
  } catch {
    return false;
  }
}
