import type { NavGroupConfig, NavLinkItem, NavShellSurface } from "@/lib/nav-config";
import { NAV_GROUPS } from "@/lib/nav-config";
import { filterNavLinksByAuthority } from "@/lib/nav-authority";
import { filterNavLinksByCommittedArchitectureReviewGate } from "@/lib/nav-committed-architecture-review-gate";
import { applyCommittedArchitectureReviewNavPromotions } from "@/lib/nav-committed-architecture-review-promotion";
import { filterNavLinksByTier } from "@/lib/nav-tier";
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
  LEGACY_GOVERNANCE_RESOLUTION_PATH,
} from "@/lib/governance-route-paths";

/**
 * Buyer-polished shell nav omissions. Empty: Compare (and other advanced destinations) stay reachable
 * inside their collapsed groups so buyers keep full product depth (route-level demo gating is separate).
 */
const BUYER_POLISHED_SHELL_OMIT_NAV_HREFS = new Set<string>(["/administration/settings/api-keys"]);

/** In buyer-polished operator builds, omit routes that read as unfinished operator tooling or leak internal surfaces. */
const DEMO_MODE_OMIT_OPERATOR_HREFS = new Set<string>([
  "/insights/planning",
  "/internal/product-learning",
  "/internal-operations/recommendation-learning",
  IMPACT_PREVIEW_PATH,
  "/replay",
  "/insights/search-review-evidence",
  COMPARE_TWO_REVIEWS_PATH,
  "/governance/advisory-scans",
  "/demo/explain",
  "/admin/health",
  "/admin/configuration",
  "/admin/support",
  "/admin/users",
  "/administration/settings/support",
  "/administration/settings/users",
  "/administration/settings/security-trust",
  "/workspace/security-trust",
  "/governance/alerts",
  "/governance/alert-rules",
  "/governance/policy-packs",
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  "/governance/audit",
  "/alerts",
  "/alert-rules",
  "/policy-packs",
  LEGACY_GOVERNANCE_RESOLUTION_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  "/governance/setup",
  "/audit",
  "/administration/connection-status",
  "/integrations/cloud-connections",
  "/integrations/webhooks",
  "/digests",
  "/settings/cloud-connections",
  // The Settings hub is the nav target for Administration (IA-016). Omitted here so buyer-polished shells keep
  // the pre-hub-first behaviour of showing no Settings entry, rather than surfacing an index of omitted routes.
  "/administration/settings",
  "/administration/settings/tenant",
  "/administration/settings/tenant/recycle-bin",
  "/administration/settings/baseline",
  "/settings/webhooks",
  "/integrations/webhooks",
  "/administration/settings/api-keys",
  "/administration/settings/ai-usage",
  "/sponsor-report/executive-summary",
  "/sponsor-report/pilot-outcomes",
  "/sponsor-report/roi-summary",
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

  return links.filter((l) => l.href !== "/administration/settings/api-keys");
}

/** One nav group after **tier → authority** filtering, only emitted when at least one link remains. */
export type NavGroupWithVisibleLinks = {
  group: NavGroupConfig;
  visibleLinks: NavLinkItem[];
};

/**
 * ## Role
 *
 * Single composition point for operator shell navigation (sidebar, mobile drawer, command palette).
 * **Out of scope:** **`useOperateCapability()`** and other page-level POST soft-disables — this module only
 * applies **tier** then **`filterNavLinksByAuthority`**; see **docs/PRODUCT_PACKAGING.md** §3 *Four UI shaping surfaces*.
 *
 * ## Composition order (do not reorder)
 *
 * Within each **`NAV_GROUPS`** block from **`nav-config.ts`**: **Authority** (`filterNavLinksByAuthority`) is the
 * visibility gate (owner 2026-08-03 — progressive **tier** / operate-unlock / pre-commit spine retired for sidebar
 * shaping). Demo/buyer packaging omissions and system-admin feature flags still apply. **Packaging map:**
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
 * @see `authority-seam-regression.test.ts` — tier + authority composition vs caller rank (Core Pilot invariants; ordering;
 *   rank **0** vs **`ReadAuthority`**; **`/alerts`** **`advanced`** (+ progressive disclosure toggle); Enterprise href **monotonicity**; Advanced default **`/insights/ask-review-questions`**-only;
 *   **`/governance`** gated on **`showAdvanced`** at Execute rank; **`LAYER_PAGE_GUIDANCE`** Enterprise vs Advanced **`enterpriseFootnote`**).
 * @see `authority-execute-floor-regression.test.ts` — **Execute floor** parity (nav **`ExecuteAuthority`** row vs mutation boolean) + **`operate-governance`** config invariants under **`filterNavLinksByAuthority`** alone (complements tier∩rank tests above).
 * @see `authority-shaped-ui-regression.test.ts` — catalog **`ExecuteAuthority`** links vs Read/Execute rank (this module composes those links after **tier**).
 * @see `nav-shell-visibility.test.ts` — empty-group omission after tier then authority; default Reader Enterprise strip;
 *   Execute rank does not bypass extended tier without disclosure toggles; **Core Pilot** **`/replay`** (extended **Execute**)
 *   stays hidden until **Show more** even at Admin rank.
 * @see `OperatorNavAuthorityProvider.test.tsx` — conservative rank during JWT `/me` refetch (feeds this module indirectly).
 * @see `enterprise-authority-ui-shaping.test.tsx` — **`useOperateCapability`** → **`disabled`** / **`readOnly`** on representative Enterprise pages (incl. governance submit fields).
 * @see `authority-shaped-layout-regression.test.tsx` — read-tier **layout** (inspect-first columns, triage deemphasis); complements this module’s **link set** only.
 */
export function filterNavLinksForOperatorShell(
  links: ReadonlyArray<NavLinkItem>,
  showExtended: boolean,
  showAdvanced: boolean,
  callerAuthorityRank: number,
  /** @deprecated Collapsed-pilot link filtering retired — argument ignored (owner 2026-08-03). */
  _applyCollapsedSidebarPilotFilter = false,
  hasCommittedArchitectureReview = true,
): NavLinkItem[] {
  void _applyCollapsedSidebarPilotFilter;

  // Tier / pre-commit / collapsed-pilot disclosure retired: role (authority) is the visibility gate.
  const promoted = applyCommittedArchitectureReviewNavPromotions(links, hasCommittedArchitectureReview);
  const gated = filterNavLinksByCommittedArchitectureReviewGate(promoted, hasCommittedArchitectureReview);

  let visible: NavLinkItem[] = filterNavLinksByAuthority(
    filterNavLinksByTier(gated, showExtended, showAdvanced),
    callerAuthorityRank,
  );

  visible = omitThinRoutesInPublicDemoMode(visible);
  visible = omitBuyerPolishedShellNonGoldenNavLinks(visible);
  visible = omitApiKeysSettingsWhenSurfaceDisabled(visible);

  return visible;
}

/**
 * Applies **`filterNavLinksForOperatorShell`** to every configured group and **omits groups with no visible links**.
 * Sidebar, mobile drawer, and command palette should iterate this result so tier + authority + empty-group rules stay aligned.
 */
export function listNavGroupsVisibleInOperatorShell(
  groups: ReadonlyArray<NavGroupConfig>,
  showExtended: boolean,
  showAdvanced: boolean,
  callerAuthorityRank: number,
  applyCollapsedSidebarPilotFilter = false,
  surfaceFilter: "all" | NavShellSurface = "all",
  hasCommittedArchitectureReview = true,
): NavGroupWithVisibleLinks[] {
  const out: NavGroupWithVisibleLinks[] = [];

  for (const group of groups) {
    // Operate unlock phase no longer hides whole groups — authority filters per link below.

    if (group.surface === "system-admin") {
      if (!isShowSystemAdministrationNavEnabled()) {
        continue;
      }

      if (isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv()) {
        continue;
      }
    }

    if (surfaceFilter !== "all" && group.surface !== surfaceFilter) {
      continue;
    }

    const shellLinks = filterNavLinksByPublishReadiness(
      filterNavLinksForOperatorShell(
        group.links,
        showExtended,
        showAdvanced,
        callerAuthorityRank,
        applyCollapsedSidebarPilotFilter,
        hasCommittedArchitectureReview,
      ),
    );

    const visibleLinks = shellLinks;

    if (visibleLinks.length === 0) {
      continue;
    }

    out.push({ group, visibleLinks });
  }

  return out;
}

/**
 * Hrefs the operator shell currently exposes (tier ∩ authority ∩ publish gates, all nav groups).
 * Used to filter curated command-palette tasks so Ctrl+K never lists destinations the sidebar would hide.
 */
export function visibleOperatorShellHrefSet(
  showExtended: boolean,
  showAdvanced: boolean,
  callerAuthorityRank: number,
  hasCommittedArchitectureReview: boolean,
): Set<string> {
  const rows = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    showExtended,
    showAdvanced,
    callerAuthorityRank,
    false,
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

/**
 * Sidebar “N more” badge when collapsed: links that appear after “Show all features”
 * (expands collapsed pilot filter only).
 */
export function countSidebarLinksRevealedByShowAllFeatures(
  groups: ReadonlyArray<NavGroupConfig>,
  showExtended: boolean,
  showAdvanced: boolean,
  callerAuthorityRank: number,
  hasCommittedArchitectureReview: boolean,
): number {
  return countSidebarLinksHiddenByCollapsedPilot(
    groups,
    showExtended,
    showAdvanced,
    callerAuthorityRank,
    hasCommittedArchitectureReview,
  );
}

/**
 * Sidebar “N more features” badge: full operator link count vs collapsed-pilot link count (same tier ∩ authority ∩ publish gates).
 */
export function countSidebarLinksHiddenByCollapsedPilot(
  groups: ReadonlyArray<NavGroupConfig>,
  showExtended: boolean,
  showAdvanced: boolean,
  callerAuthorityRank: number,
  hasCommittedArchitectureReview = true,
): number {
  let full = 0;
  let collapsed = 0;

  for (const group of groups) {
    if (group.surface === "platform-admin" || group.surface === "system-admin") {
      continue;
    }

    const fullLinks = filterNavLinksByPublishReadiness(
      filterNavLinksForOperatorShell(
        group.links,
        showExtended,
        showAdvanced,
        callerAuthorityRank,
        false,
        hasCommittedArchitectureReview,
      ),
    );
    const collapsedLinks = filterNavLinksByPublishReadiness(
      filterNavLinksForOperatorShell(
        group.links,
        showExtended,
        showAdvanced,
        callerAuthorityRank,
        true,
        hasCommittedArchitectureReview,
      ),
    );

    full += fullLinks.length;
    collapsed += collapsedLinks.length;
  }

  return Math.max(0, full - collapsed);
}

/**
 * How many hrefs in a group are hidden by the current extended/advanced flags (vs. full disclosure at the same
 * authority rank). Used to surface a “N more” affordance in the sidebar.
 */
export function countLinksHiddenByProgressiveDisclosure(
  group: NavGroupConfig,
  showExtended: boolean,
  showAdvanced: boolean,
  callerAuthorityRank: number,
  hasCommittedArchitectureReview = true,
): number {
  const current = filterNavLinksForOperatorShell(
    group.links,
    showExtended,
    showAdvanced,
    callerAuthorityRank,
    false,
    hasCommittedArchitectureReview,
  );
  const full = filterNavLinksForOperatorShell(
    group.links,
    true,
    true,
    callerAuthorityRank,
    false,
    hasCommittedArchitectureReview,
  );
  const currentHrefs = new Set(current.map((l) => l.href));

  return full.filter((l) => !currentHrefs.has(l.href)).length;
}
