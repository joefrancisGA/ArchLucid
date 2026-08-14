import type { NavGroupConfig, NavLinkItem, NavShellSurface } from "@/lib/nav-config";
import { NAV_GROUPS } from "@/lib/nav-config";
import { filterNavLinksByAuthority } from "@/lib/nav-authority";
import { filterNavLinksByCommittedArchitectureReviewGate } from "@/lib/nav-committed-architecture-review-gate";
import { applyCommittedArchitectureReviewNavPromotions } from "@/lib/nav-committed-architecture-review-promotion";
import { filterNavLinksByPublishReadiness } from "@/lib/nav-publish-readiness";
import { isApiKeysSettingsSurfaceEnabled } from "@/lib/api-keys-settings-access";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { isCtoDemoNavExpandedEnv } from "@/lib/cto-demo-presenter-pack";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";

/**
 * Buyer-polished shell nav omissions. Empty: Compare (and other advanced destinations) stay reachable
 * inside their collapsed groups so buyers keep full product depth (route-level demo gating is separate).
 */
const BUYER_POLISHED_SHELL_OMIT_NAV_HREFS = new Set<string>(["/administration/api-keys"]);

/** In buyer-polished operator builds, omit routes that read as unfinished operator tooling or leak internal surfaces. */
const DEMO_MODE_OMIT_OPERATOR_HREFS = new Set<string>([
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
  // The Settings hub is the nav target for Administration (IA-016). Omitted here so buyer-polished shells keep
  // the pre-hub-first behavior of showing no Settings entry, rather than surfacing an index of omitted routes.
  "/administration",
  "/administration/workspace-settings",
  "/administration/workspace-settings/recycle-bin",
  "/administration/baseline",
  "/administration/api-keys",
  "/administration/ai-usage",
  "/insights/executive-summary",
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

function omitThinRoutesInPublicDemoMode(links: NavLinkItem[]): NavLinkItem[] {
  if (isBuyerPolishedOperatorShellEnv()) {
    return links;
  }

  if (!isPublicDemoThinNavSurface()) {
    return links;
  }

  const keepExpandedDemoSpine = isCtoDemoNavExpandedEnv();

  return links.filter((l) => {
    if (
      keepExpandedDemoSpine
      && (l.href === "/insights/evidence-graph" || l.href === GOVERNANCE_APPROVAL_QUEUE_PATH || l.href === GOVERNANCE_AUDIT_PATH)
    ) {
      return true;
    }

    return !DEMO_MODE_OMIT_OPERATOR_HREFS.has(l.href);
  });
}

function omitBuyerPolishedShellNonGoldenNavLinks(links: NavLinkItem[]): NavLinkItem[] {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return links;
  }

  return links.filter((l) => !BUYER_POLISHED_SHELL_OMIT_NAV_HREFS.has(l.href));
}

function omitApiKeysSettingsWhenSurfaceDisabled(links: NavLinkItem[]): NavLinkItem[] {
  if (isApiKeysSettingsSurfaceEnabled()) {
    return links;
  }

  return links.filter((l) => l.href !== "/administration/api-keys");
}

/** One nav group after **authority** filtering, only emitted when at least one link remains. */
export type NavGroupWithVisibleLinks = {
  group: NavGroupConfig;
  visibleLinks: NavLinkItem[];
};

/**
 * ## Role
 *
 * Single composition point for operator shell navigation (sidebar, mobile drawer, command palette).
 * **Out of scope:** **`useOperateCapability()`** and other page-level POST soft-disables — this module only
 * applies **`filterNavLinksByAuthority`** plus packaging omissions; see **docs/PRODUCT_PACKAGING.md** §3 *Four UI shaping surfaces*.
 *
 * ## Composition order (do not reorder)
 *
 * Within each **`NAV_GROUPS`** block from **`nav-config.ts`**: **Pre-commit** (`filterNavLinksByCommittedArchitectureReviewGate`)
 * runs first so Operate/diagnostics stay off the default spine until **`hasCommittedArchitectureReview`**. **Authority**
 * (`filterNavLinksByAuthority`) runs after promotion metadata. Demo/buyer packaging omissions and system-admin feature
 * flags still apply. **Packaging map:**
 * **docs/PRODUCT_PACKAGING.md** §3 *Code seams* table (**`NAV_GROUPS[].id`** → layer).
 *
 * Pass **`useNavCallerAuthorityRank()`** (or **`CurrentPrincipal.authorityRank`**) and **`useNavCommittedArchitectureReview()`**
 * so filtering matches **`OperatorNavAuthorityProvider`**. Call sites must **omit empty groups** when iterating **`listNavGroupsVisibleInOperatorShell`**
 * results — this module already drops groups with zero visible links.
 *
 * ## API vs UI
 *
 * **UI shaping only** — same boundary as **`nav-config.ts`** / **`nav-authority.ts`**: visible links **do not** guarantee
 * successful HTTP calls — **`[Authorize(Policy = …)]`** still returns **401/403**.
 * **Packaging:** **docs/PRODUCT_PACKAGING.md** §3 (*Code seams* + *Contributor drift guard*). **Stage 1 framing:**
 * **docs/COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md** §4.
 *
 * **Canonical docs:** [PRODUCT_PACKAGING.md](../../../docs/PRODUCT_PACKAGING.md) §3 *Code seams* + *Contributor drift guard*;
 * Stage 1 (not entitlements): [COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md](../../../docs/COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md) §4.
 *
 * @see `authority-seam-regression.test.ts` — authority composition vs caller rank (Core Pilot invariants; ordering;
 *   rank **0** vs **`ReadAuthority`**; Enterprise href **monotonicity**; **`LAYER_PAGE_GUIDANCE`** Enterprise vs Advanced **`enterpriseFootnote`**).
 * @see `authority-execute-floor-regression.test.ts` — **Execute floor** parity (nav **`ExecuteAuthority`** row vs mutation boolean) + **`operate-governance`** config invariants under **`filterNavLinksByAuthority`** alone (complements rank tests above).
 * @see `authority-shaped-ui-regression.test.ts` — catalog **`ExecuteAuthority`** links vs Read/Execute rank.
 * @see `nav-shell-visibility.test.ts` — empty-group omission after authority filtering; default Reader Enterprise strip;
 *   pre-commit gate vs committed-review promotions at each rank.
 * @see `OperatorNavAuthorityProvider.test.tsx` — conservative rank during JWT `/me` refetch (feeds this module indirectly).
 * @see `enterprise-authority-ui-shaping.test.tsx` — **`useOperateCapability`** → **`disabled`** / **`readOnly`** on representative Enterprise pages (incl. governance submit fields).
 * @see `authority-shaped-layout-regression.test.tsx` — read-tier **layout** (inspect-first columns, triage deemphasis); complements this module’s **link set** only.
 */
export function filterNavLinksForOperatorShell(
  links: ReadonlyArray<NavLinkItem>,
  callerAuthorityRank: number,
  hasCommittedArchitectureReview = true,
): NavLinkItem[] {
  const gated = filterNavLinksByCommittedArchitectureReviewGate(links, hasCommittedArchitectureReview);
  const promoted = applyCommittedArchitectureReviewNavPromotions(gated, hasCommittedArchitectureReview);

  let visible: NavLinkItem[] = filterNavLinksByAuthority(promoted, callerAuthorityRank);

  visible = omitThinRoutesInPublicDemoMode(visible);
  visible = omitBuyerPolishedShellNonGoldenNavLinks(visible);
  visible = omitApiKeysSettingsWhenSurfaceDisabled(visible);

  return visible;
}

/**
 * Applies **`filterNavLinksForOperatorShell`** to every configured group and **omits groups with no visible links**.
 * Sidebar, mobile drawer, and command palette should iterate this result so authority + empty-group rules stay aligned.
 */
export function listNavGroupsVisibleInOperatorShell(
  groups: ReadonlyArray<NavGroupConfig>,
  callerAuthorityRank: number,
  surfaceFilter: "all" | NavShellSurface = "all",
  hasCommittedArchitectureReview = true,
): NavGroupWithVisibleLinks[] {
  const out: NavGroupWithVisibleLinks[] = [];

  for (const group of groups) {
    if (group.surface === "system-admin") {
      if (!isShowSystemAdministrationNavEnabled()) {
        continue;
      }

      if (isNextPublicDemoMode()) {
        continue;
      }

      if (isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv()) {
        continue;
      }
    }

    if (surfaceFilter !== "all" && group.surface !== surfaceFilter) {
      continue;
    }

    const visibleLinks = filterNavLinksByPublishReadiness(
      filterNavLinksForOperatorShell(group.links, callerAuthorityRank, hasCommittedArchitectureReview),
    );

    if (visibleLinks.length === 0) {
      continue;
    }

    out.push({ group, visibleLinks });
  }

  return out;
}

/**
 * Hrefs the operator shell currently exposes (authority ∩ publish gates, all nav groups).
 * Used to filter curated command-palette tasks so Ctrl+K never lists destinations the sidebar would hide.
 */
export function visibleOperatorShellHrefSet(
  callerAuthorityRank: number,
  hasCommittedArchitectureReview: boolean,
): Set<string> {
  const rows = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    callerAuthorityRank,
    "all",
    hasCommittedArchitectureReview,
  );
  const hrefs = new Set<string>();

  for (const row of rows) {
    for (const link of row.visibleLinks) {
      hrefs.add(link.href);
    }
  }

  return hrefs;
}
