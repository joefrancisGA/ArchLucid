import type { NavGroupConfig, NavLinkItem, NavShellSurface } from "@/lib/nav-config";
import { NAV_GROUPS } from "@/lib/nav-config";
import { filterNavLinksByAuthority } from "@/lib/nav-authority";
import { filterNavLinksByCommittedArchitectureReviewGate } from "@/lib/nav-committed-architecture-review-gate";
import { applyCommittedArchitectureReviewNavPromotions } from "@/lib/nav-committed-architecture-review-promotion";
import { filterNavLinksByWorkspaceMode } from "@/lib/nav-workspace-mode-gate";
import { filterNavLinksByPublishReadiness } from "@/lib/nav-publish-readiness";
import { isApiKeysSettingsSurfaceEnabled } from "@/lib/api-keys-settings-access";
import {
  applyNavShellPresetPackagingFilter,
  isSystemAdministrationNavGroupVisible,
  resolveNavShellPresetId,
} from "@/lib/nav-shell-preset";
import { buildOperatorSystemAdminNavLinks } from "@/lib/operator/operator-system-admin-nav-group-builder";
import { DEFAULT_PRODUCT_LINE_ID, type ProductLineId } from "@/lib/product-line/product-line-id";
import type { ProductLineAssignment } from "@/lib/product-line/product-line-assignment";
import {
  filterNavGroupsForProductLine,
  productLineSkipsReviewLifecycleNavShaping,
} from "@/lib/product-line/filter-nav-groups-for-product-line";

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
 * (`filterNavLinksByAuthority`) runs after promotion metadata. Demo/buyer packaging omissions use an explicit shell preset
 * ({@link resolveNavShellPresetId} / {@link applyNavShellPresetPackagingFilter} — TB-2233). **Product line**
 * (`filterNavGroupsForProductLine`) runs last so Architecture vs Security shells share one catalog.
 * **Packaging map:** **docs/PRODUCT_PACKAGING.md** §3 *Code seams* table (**`NAV_GROUPS[].id`** → layer).
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
  hideGettingStartedFromMainNav = false,
): NavLinkItem[] {
  const gated = filterNavLinksByCommittedArchitectureReviewGate(links, hasCommittedArchitectureReview);
  const promoted = applyCommittedArchitectureReviewNavPromotions(gated, hasCommittedArchitectureReview);
  const workspaceFiltered = filterNavLinksByWorkspaceMode(promoted, hideGettingStartedFromMainNav);

  let visible: NavLinkItem[] = filterNavLinksByAuthority(workspaceFiltered, callerAuthorityRank);

  visible = applyNavShellPresetPackagingFilter(visible, resolveNavShellPresetId());
  visible = omitApiKeysSettingsWhenSurfaceDisabled(visible);

  return visible;
}

/**
 * Applies **`filterNavLinksForOperatorShell`** to every configured group and **omits groups with no visible links**.
 * Sidebar, mobile drawer, and command palette should iterate this result so authority + empty-group rules stay aligned.
 */
export type ListNavGroupsVisibleInOperatorShellOptions = {
  readonly surfaceFilter?: "all" | NavShellSurface;
  readonly hasCommittedArchitectureReview?: boolean;
  readonly hideGettingStartedFromMainNav?: boolean;
  /** Vendor-staff principal — gates `staffInternalOnly` / system-admin clusters (not workspace mode). */
  readonly showVendorInternalNav?: boolean;
  /** Architecture (default) vs Security operator shell. */
  readonly productLine?: ProductLineId;
  /** Playground overlays on the product-line catalog. */
  readonly productLineAssignmentOverrides?: Readonly<Record<string, ProductLineAssignment>>;
};

export function listNavGroupsVisibleInOperatorShell(
  groups: ReadonlyArray<NavGroupConfig>,
  callerAuthorityRank: number,
  surfaceFilter: "all" | NavShellSurface = "all",
  hasCommittedArchitectureReview = true,
  hideGettingStartedFromMainNav = false,
  options: ListNavGroupsVisibleInOperatorShellOptions = {},
): NavGroupWithVisibleLinks[] {
  const presetId = resolveNavShellPresetId();
  const showVendorInternalNav = options.showVendorInternalNav ?? false;
  const productLine = options.productLine ?? DEFAULT_PRODUCT_LINE_ID;
  const skipReviewLifecycleNavShaping = productLineSkipsReviewLifecycleNavShaping(productLine);
  const committedForNav = skipReviewLifecycleNavShaping || hasCommittedArchitectureReview;
  const out: NavGroupWithVisibleLinks[] = [];

  for (const group of groups) {
    if (group.staffInternalOnly === true && !showVendorInternalNav) {
      continue;
    }

    let effectiveGroup = group;

    if (group.surface === "system-admin") {
      if (!isSystemAdministrationNavGroupVisible(presetId, showVendorInternalNav)) {
        continue;
      }

      // NAV_GROUPS is built at module load; re-resolve internal links when runtime env allows.
      effectiveGroup = { ...group, links: buildOperatorSystemAdminNavLinks() };
    }

    if (surfaceFilter !== "all" && effectiveGroup.surface !== surfaceFilter) {
      continue;
    }

    const visibleLinks = filterNavLinksByPublishReadiness(
      filterNavLinksForOperatorShell(
        effectiveGroup.links,
        callerAuthorityRank,
        committedForNav,
        hideGettingStartedFromMainNav,
      ),
    );

    if (visibleLinks.length === 0) {
      continue;
    }

    out.push({ group: effectiveGroup, visibleLinks });
  }

  return filterNavGroupsForProductLine(out, productLine, {
    assignmentOverrides: options.productLineAssignmentOverrides,
  });
}

/**
 * Hrefs the operator shell currently exposes (authority ∩ publish gates, all nav groups).
 * Used to filter curated command-palette tasks so Ctrl+K never lists destinations the sidebar would hide.
 */
export function visibleOperatorShellHrefSet(
  callerAuthorityRank: number,
  hasCommittedArchitectureReview: boolean,
  options: ListNavGroupsVisibleInOperatorShellOptions = {},
): Set<string> {
  const rows = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    callerAuthorityRank,
    "all",
    hasCommittedArchitectureReview,
    false,
    options,
  );
  const hrefs = new Set<string>();

  for (const row of rows) {
    for (const link of row.visibleLinks) {
      hrefs.add(link.href);
    }
  }

  return hrefs;
}
