/**
 * **Next.js:** `process.env.NEXT_PUBLIC_*` is inlined at build time — safe to read from client bundles.
 *
 * **Full operator shell** — set `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` to opt into the dense operator nav, shortcuts,
 * and unpolished labels. **Unset or any other value** uses the buyer-oriented shell (new-tenant default — see
 * `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md`). Demos (`NEXT_PUBLIC_DEMO_MODE` / `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`)
 * stay buyer-polished regardless.
 */
export function isOperatorExperienceFullShellEnv(): boolean {
  const raw = (process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE ?? "").trim().toLowerCase();

  return raw === "operator";
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
 * **Default:** buyer-polished when this is not a full-operator build. Demos always use this path.
 */
export function isBuyerPolishedOperatorShellEnv(): boolean {
  if (isNextPublicDemoMode()) {
    return true;
  }

  if (process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true" || process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "1") {
    return true;
  }

  if (isOperatorExperienceFullShellEnv()) {
    return false;
  }

  return true;
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
 * Mock / Playwright screenshot crawls intentionally visit operator routes blocked in packaged demo navigation gates.
 * **Build-time:** set only in harness env (see `playwright.mock.config.ts`); never enable in sponsor-facing demo builds.
 */
export function isDemoStrictNavigationRedirectsBypassedForE2E(): boolean {
  const raw = (process.env.NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES ?? "").trim().toLowerCase();

  return raw === "1" || raw === "true";
}

/**
 * Packaged demos (public demo mode or static-operator) hide `/compare` for buyer-safe navigation unless explicitly allowed.
 * **`NEXT_PUBLIC_DEMO_ALLOW_COMPARE_ROUTE`:** set `"true"` or `"1"` to keep Compare reachable in strict demo redirects.
 *
 * Bypassed when {@link isDemoStrictNavigationRedirectsBypassedForE2E} is true so Playwright can reach advanced routes.
 */
export function isCompareRouteBlockedUnderDemoStrictShell(): boolean {
  if (!isDemoStrictNavigationRedirectsActive()) {
    return false;
  }

  if (isDemoStrictNavigationRedirectsBypassedForE2E()) {
    return false;
  }

  const allowCompare = (process.env.NEXT_PUBLIC_DEMO_ALLOW_COMPARE_ROUTE ?? "").trim().toLowerCase();

  if (allowCompare === "1" || allowCompare === "true") {
    return false;
  }

  return true;
}
