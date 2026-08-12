/**
 * TB-1662 — Operator line-tabs surface inventory (strip pill/chip/folder overrides).
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator line tabs — visual contract* (**TB-1661**).
 * Vitest follow-on: **TB-1665**.
 */

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

const TABS_LIST_BANNED_CLASS_FRAGMENTS = [
  "border-0",
  "rounded-full",
  "rounded-md border",
] as const;

const TABS_TRIGGER_BANNED_CLASS_FRAGMENTS = ["rounded-full", "rounded-md"] as const;

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
  return /<TabsList\b[^>]*className=\{?["'`][^"'`]*\b${escapeRegExp(fragment)}\b/.test(source);
}

function tabsTriggerClassNameIncludes(source: string, fragment: string): boolean {
  return /<TabsTrigger\b[^>]*className=\{?["'`][^"'`]*\b${escapeRegExp(fragment)}\b/.test(source);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
