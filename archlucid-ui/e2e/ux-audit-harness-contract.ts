import {
  UX_AUDIT_EXPECTED_PNG_TOTAL,
  UX_AUDIT_MARKETING_ROUTE_COUNT,
  UX_AUDIT_OPERATOR_BUYER_ROUTE_COUNT,
} from "./ux-audit-route-registry";

/** Playwright patterns that must stay on the default mock `chromium` project `testIgnore` list (TB-653). */
export const UX_AUDIT_MOCK_CHROMIUM_TEST_IGNORE_FRAGMENTS = [
  "**/ux-audit-screenshots.spec.ts",
  "**/.next/**",
] as const;

/** Dedicated UX audit Playwright project names — keep npm scripts pointed at these (TB-653). */
export const UX_AUDIT_PLAYWRIGHT_PROJECT_NAMES = {
  buyer: "chromium-ux-audit-buyer",
  operator: "chromium-ux-audit-operator",
  marketing: "chromium-ux-audit-marketing",
} as const;

/** Merge-blocking operator-shell CI must not run the full UX audit spec (TB-653). */
export const UX_AUDIT_OPERATOR_SHELL_CI_PROJECT = "chromium-operator-shell";

export const UX_AUDIT_OPERATOR_SHELL_CI_TEST_MATCH = "pilot-nav-profile.spec.ts";

/** npm scripts wired to `run-ux-audit.ps1` and per-mode capture (TB-653). */
export const UX_AUDIT_NPM_SCRIPTS = {
  all: "ux-audit",
  buyer: "ux-audit:screenshots:buyer",
  operator: "ux-audit:screenshots:operator",
  marketing: "ux-audit:screenshots:marketing",
} as const;

export const UX_AUDIT_RUNNER_SCRIPT_RELATIVE_PATH = "archlucid-ui/scripts/run-ux-audit.ps1";

export const UX_AUDIT_SKILL_RELATIVE_PATH = ".cursor/skills/lucid-ui-audit/SKILL.md";

export const UX_AUDIT_EXPECTED_PNG_COUNTS = {
  buyer: UX_AUDIT_OPERATOR_BUYER_ROUTE_COUNT,
  operator: UX_AUDIT_OPERATOR_BUYER_ROUTE_COUNT,
  marketing: UX_AUDIT_MARKETING_ROUTE_COUNT,
  total: UX_AUDIT_EXPECTED_PNG_TOTAL,
} as const;
