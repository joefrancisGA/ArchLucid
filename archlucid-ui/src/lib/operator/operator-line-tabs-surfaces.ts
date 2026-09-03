/**
 * TB-1662 — Operator line-tabs surface inventory (strip pill/chip/folder overrides).
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator line tabs — visual contract* (**TB-1661**).
 * Vitest follow-on: **TB-1665**.
 */

import { collectJsxOpeningTags } from "@/lib/operator/jsx-opening-tag";

export type OperatorLineTabsSurfaceKind = "tabs-line" | "sections-no-tabs";

export type OperatorLineTabsSurfaceEntry = {
  readonly id: string;
  readonly modulePath: string;
  readonly kind: OperatorLineTabsSurfaceKind;
  readonly tabListTestId?: string;
  readonly notes: string;
};

/** Surfaces named in **TB-1662** — Help hub `HelpTabsShell` retired in favor of `HelpProductGuide` (no tab strip). */
export const OPERATOR_LINE_TABS_TB1662_SURFACES: readonly OperatorLineTabsSurfaceEntry[] = [
  {
    id: "advisory-hub",
    modulePath: "components/advisory/AdvisoryHubClient.tsx",
    kind: "tabs-line",
    tabListTestId: "advisory-hub-tablist",
    notes: "Advisory scans/schedules hub — shared Tabs with line variant only.",
  },
  {
    id: "help-panel",
    modulePath: "components/HelpPanel.tsx",
    kind: "tabs-line",
    tabListTestId: "help-panel-tablist",
    notes: "Shell help drawer — Guides / shortcuts / troubleshooting.",
  },
  {
    id: "buyer-deliverables-artifacts",
    modulePath: "components/BuyerDeliverablesArtifactTabs.tsx",
    kind: "sections-no-tabs",
    notes: "Deliverables use stacked sections — no Tabs primitive (pill strip removed).",
  },
  {
    id: "runs-dashboard-operator",
    modulePath: "components/operator-home/RunsDashboardPanelClient.tsx",
    kind: "tabs-line",
    tabListTestId: "runs-dashboard-status-filters",
    notes: "Operator shell status filters; buyer-polished shell uses FilterChip outside tablist.",
  },
];

/** Surfaces named in **TB-1663** — alert configuration hub migrated from hand-rolled folder tabs. */
export const OPERATOR_LINE_TABS_TB1663_SURFACES: readonly OperatorLineTabsSurfaceEntry[] = [
  {
    id: "alert-rules-hub",
    modulePath: "app/(operator)/governance/alert-rules/AlertRulesHubClient.tsx",
    kind: "tabs-line",
    notes: "Conditions / Notifications / Advanced rules / Test alerts — shared Tabs + panel leads (**TB-1663**).",
  },
];

/** Surface that already declared `variant="line"` before the **TB-1662** wave. */
export const OPERATOR_LINE_TABS_GOLD_SURFACES: readonly OperatorLineTabsSurfaceEntry[] = [
  {
    id: "review-detail-workspace",
    modulePath: "components/reviews/ReviewDetailWorkspace.tsx",
    kind: "tabs-line",
    notes: "Review detail workspace sections — declares variant=\"line\".",
  },
];

/**
 * Call sites that inherit the primitive default rather than naming a variant.
 *
 * `tabs.tsx` now defaults to `line` (**TB-1665**), so inheriting is correct and these
 * need no `variant` prop. They are still allowlisted so a future pill opt-in or chrome
 * override on them fails CI.
 */
export const OPERATOR_LINE_TABS_DEFAULT_VARIANT_SURFACES: readonly OperatorLineTabsSurfaceEntry[] = [
  {
    id: "digests-hub",
    modulePath: "components/digests/DigestsHubClient.tsx",
    kind: "tabs-line",
    notes: "Digests hub — inherits the line default.",
  },
  {
    id: "settings-roles",
    modulePath: "app/(operator)/administration/users/_sections/SettingsRolesPageView.tsx",
    kind: "tabs-line",
    notes: "Users / roles / invitations.",
  },
  {
    id: "reviews-new-path-switcher",
    modulePath: "app/(operator)/architecture/reviews/new/ReviewsNewPathSwitcher.tsx",
    kind: "tabs-line",
    notes: "Review creation paths — overflow helpers only.",
  },
  {
    id: "architecture-created-workspace",
    modulePath: "components/architecture/ArchitectureCreatedWorkspace.tsx",
    kind: "tabs-line",
    notes: "Architect workspace tabs.",
  },
  {
    id: "policy-packs",
    modulePath: "app/(operator)/governance/policy-packs/_sections/PolicyPacksPageView.tsx",
    kind: "tabs-line",
    notes: "My packs / catalog.",
  },
  {
    id: "graph-presentation",
    modulePath: "app/(operator)/insights/evidence-graph/_sections/GraphPageContent.tsx",
    kind: "tabs-line",
    notes: "Graph / trace presentation switch — <Tabs> root lives in GraphPageContent.",
  },
  {
    id: "help-azure-permissions-setup",
    modulePath: "app/(operator)/help/_sections/HelpAzurePermissionsSetupSection.tsx",
    kind: "tabs-line",
    notes: "Portal / CLI setup steps.",
  },
];

/** The legacy dialect the contract bans — no call site may opt back into it. */
export const BANNED_TABS_VARIANT_OPT_IN = /variant\s*=\s*["']pill["']/;

export function findPillVariantOptInPaths(sources: ReadonlyMap<string, string>): readonly string[] {
  const offenders: string[] = [];

  for (const [relativePath, source] of sources) {
    if (BANNED_TABS_VARIANT_OPT_IN.test(source)) {
      offenders.push(relativePath);
    }
  }

  return offenders.sort();
}

/** Combined inventory for the **TB-1665** allowlist. */
export const OPERATOR_LINE_TABS_MIGRATED_SURFACES: readonly OperatorLineTabsSurfaceEntry[] = [
  ...OPERATOR_LINE_TABS_TB1662_SURFACES,
  ...OPERATOR_LINE_TABS_TB1663_SURFACES,
];

/** Every surface the **TB-1665** guard holds to the line-tab visual contract. */
export const OPERATOR_LINE_TABS_ALLOWLIST: readonly OperatorLineTabsSurfaceEntry[] = [
  ...OPERATOR_LINE_TABS_GOLD_SURFACES,
  ...OPERATOR_LINE_TABS_MIGRATED_SURFACES,
  ...OPERATOR_LINE_TABS_DEFAULT_VARIANT_SURFACES,
];

export function operatorLineTabsSurfacesByKind(
  kind: OperatorLineTabsSurfaceKind,
): readonly OperatorLineTabsSurfaceEntry[] {
  return OPERATOR_LINE_TABS_ALLOWLIST.filter((entry) => entry.kind === kind);
}

/**
 * Override classes that turn the Carbon line-tab strip into a pill row, chip pair, or
 * segmented tray. `border-0` is banned because it removes the list's bottom rule, which
 * is the affordance that makes the strip read as tabs at all.
 */
export const TABS_LIST_BANNED_CLASS_FRAGMENTS = [
  "border-0",
  "rounded-full",
  "rounded-md border",
  "bg-neutral-50 p-0.5",
  "bg-neutral-100 p-0.5",
] as const;

export const TABS_TRIGGER_BANNED_CLASS_FRAGMENTS = [
  "rounded-full",
  "rounded-md",
  "bg-neutral-900",
] as const;

export function operatorLineTabsModuleUsesLineVariant(source: string): boolean {
  return /variant\s*=\s*["']line["']/.test(source);
}

export function operatorLineTabsModuleHasBannedListChrome(source: string): string[] {
  return findBannedTabsListClassFragments(source);
}

export function operatorLineTabsModuleHasBannedTriggerChrome(source: string): string[] {
  return findBannedTabsTriggerClassFragments(source);
}

function findBannedTabsListClassFragments(source: string): string[] {
  const matches: string[] = [];

  for (const fragment of TABS_LIST_BANNED_CLASS_FRAGMENTS) {
    if (tabsListClassNameIncludes(source, fragment)) {
      matches.push(fragment);
    }
  }

  return matches;
}

function findBannedTabsTriggerClassFragments(source: string): string[] {
  const matches: string[] = [];

  for (const fragment of TABS_TRIGGER_BANNED_CLASS_FRAGMENTS) {
    if (tabsTriggerClassNameIncludes(source, fragment)) {
      matches.push(fragment);
    }
  }

  return matches;
}

function tabsListClassNameIncludes(source: string, fragment: string): boolean {
  return tabClassNameIncludes(source, "TabsList", fragment);
}

function tabsTriggerClassNameIncludes(source: string, fragment: string): boolean {
  return tabClassNameIncludes(source, "TabsTrigger", fragment);
}

/** True when any opening tag for `element` carries `fragment` in its own attributes. */
function tabClassNameIncludes(source: string, element: string, fragment: string): boolean {
  return collectJsxOpeningTags(source, element).some((tag) => tag.includes(fragment));
}

/** Hand-rolled tablists are only legitimate inside the shared primitive itself. */
export const HAND_ROLLED_TABLIST_ALLOWED_PATHS = new Set<string>(["components/ui/tabs.tsx"]);

export function hasHandRolledTablist(source: string): boolean {
  return /role\s*=\s*["']tablist["']/.test(source);
}

export function findHandRolledTablistPaths(
  sources: ReadonlyMap<string, string>,
): readonly string[] {
  const offenders: string[] = [];

  for (const [relativePath, source] of sources) {
    if (HAND_ROLLED_TABLIST_ALLOWED_PATHS.has(relativePath)) {
      continue;
    }

    if (hasHandRolledTablist(source)) {
      offenders.push(relativePath);
    }
  }

  return offenders.sort();
}

export type OperatorLineTabsChromeViolation = {
  readonly relativePath: string;
  readonly element: "TabsList" | "TabsTrigger";
  readonly fragment: string;
};

export function findOperatorLineTabsChromeViolations(
  sources: ReadonlyMap<string, string>,
): readonly OperatorLineTabsChromeViolation[] {
  const violations: OperatorLineTabsChromeViolation[] = [];

  for (const [relativePath, source] of sources) {
    if (HAND_ROLLED_TABLIST_ALLOWED_PATHS.has(relativePath)) {
      continue;
    }

    for (const fragment of operatorLineTabsModuleHasBannedListChrome(source)) {
      violations.push({ relativePath, element: "TabsList", fragment });
    }

    for (const fragment of operatorLineTabsModuleHasBannedTriggerChrome(source)) {
      violations.push({ relativePath, element: "TabsTrigger", fragment });
    }
  }

  return violations;
}
