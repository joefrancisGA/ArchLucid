import type { NavLinkItem } from "@/lib/nav-config";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import {
  isBuyerPolishedOperatorShellEnv,
  isNextPublicDemoMode,
  isOperatorExperienceFullShellEnv,
} from "@/lib/demo-ui-env";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { isCtoDemoNavExpandedEnv } from "@/lib/cto-demo-presenter-pack";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

/**
 * TB-2233 — Explicit packaging presets for operator shell nav omissions.
 * Visibility composition is **authority + lifecycle** only in {@link filterNavLinksForOperatorShell};
 * demo/buyer omissions are applied here via a named preset (not ad-hoc env checks in the filter chain).
 */
export type NavShellPresetId = "full" | "public-demo-thin" | "buyer-polished";

/** Buyer-polished shell: omit unfinished operator tooling from the default nav catalog. */
export const BUYER_POLISHED_SHELL_OMIT_NAV_HREFS = new Set<string>(["/administration/api-keys"]);

/**
 * Public demo / static-operator builds: thin nav spine — omit advanced operator destinations.
 * Buyer-polished shells use {@link BUYER_POLISHED_SHELL_OMIT_NAV_HREFS} instead (full catalog, fewer omissions).
 */
export const PUBLIC_DEMO_THIN_SHELL_OMIT_NAV_HREFS = new Set<string>([
  "/insights/improvement-planning",
  "/internal/product-learning",
  "/internal/recommendation-learning",
  IMPACT_PREVIEW_PATH,
  "/internal/validate-route",
  "/insights/search-review-evidence",
  COMPARE_TWO_REVIEWS_PATH,
  "/governance/advisory-scans",
  "/demo/explain",
  "/internal/health",
  "/internal/configuration",
  "/administration/support",
  "/administration/users",
  "/administration/security-trust",
  "/governance/alerts",
  "/governance/alert-rules",
  "/governance/policy-packs",
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  "/governance/audit",
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  "/governance/setup",
  "/administration/connection-status",
  "/integrations/cloud-connections",
  "/integrations/webhooks",
  DIGESTS_HUB_PATH,
  "/administration",
  "/administration/workspace-settings",
  "/administration/workspace-settings/recycle-bin",
  "/administration/baseline",
  "/administration/api-keys",
  "/administration/ai-usage",
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  "/insights/roi-summary",
]);

function isPublicDemoThinNavSurface(): boolean {
  if (isNextPublicDemoMode()) {
    return true;
  }

  return (
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true" ||
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "1"
  );
}

/** Resolve the active nav shell packaging preset from public build flags. */
export function resolveNavShellPresetId(): NavShellPresetId {
  if (isBuyerPolishedOperatorShellEnv()) {
    return "buyer-polished";
  }

  if (isPublicDemoThinNavSurface()) {
    return "public-demo-thin";
  }

  return "full";
}

function omitHrefSetForPreset(presetId: NavShellPresetId): Set<string> | null {
  if (presetId === "buyer-polished") {
    return BUYER_POLISHED_SHELL_OMIT_NAV_HREFS;
  }

  if (presetId === "public-demo-thin") {
    return PUBLIC_DEMO_THIN_SHELL_OMIT_NAV_HREFS;
  }

  return null;
}

/**
 * Apply demo/buyer packaging omissions for the resolved preset.
 * No-op for {@link NavShellPresetId} `"full"`.
 */
export function applyNavShellPresetPackagingFilter(
  links: ReadonlyArray<NavLinkItem>,
  presetId: NavShellPresetId = resolveNavShellPresetId(),
): NavLinkItem[] {
  const omitSet = omitHrefSetForPreset(presetId);

  if (omitSet === null) {
    return [...links];
  }

  if (presetId === "public-demo-thin") {
    const keepExpandedDemoSpine = isCtoDemoNavExpandedEnv();

    return links.filter((link) => {
      if (
        keepExpandedDemoSpine
        && (link.href === "/insights/evidence-graph"
          || link.href === GOVERNANCE_APPROVAL_QUEUE_PATH
          || link.href === GOVERNANCE_AUDIT_PATH)
      ) {
        return true;
      }

      return !omitSet.has(link.href);
    });
  }

  return links.filter((link) => !omitSet.has(link.href));
}

/** Whether the System Administration nav group should render for the active preset. */
export function isSystemAdministrationNavGroupVisible(
  presetId: NavShellPresetId = resolveNavShellPresetId(),
  showVendorInternalNav = false,
): boolean {
  if (!showVendorInternalNav) {
    return false;
  }

  if (!isArchLucidInternalOperatorShellEnv()) {
    return false;
  }

  if (isNextPublicDemoMode()) {
    return false;
  }

  return true;
}
