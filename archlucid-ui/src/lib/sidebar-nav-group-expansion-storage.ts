import { OPERATE_NAV_UNLOCK_STORAGE_KEY } from "@/lib/usability/operate-nav-progressive-unlock";

/** Versioned localStorage blob for collapsible sidebar group expansion (stable group ids, not labels). */
export const SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY = "archlucid_nav_sidebar_groups.v2";

export type SidebarCollapsibleNavGroupId =
  | "pilot"
  | "operate-analysis"
  | "operate-governance"
  | "operate-policy"
  | "operate-integrations"
  | "operate-infrastructure"
  | "operator-admin"
  | "operator-system-admin";

export type SidebarNavGroupExpansionState = Record<SidebarCollapsibleNavGroupId, boolean>;

const LEGACY_SHOW_ADMINISTRATION_KEY = "archlucid_nav_show_administration";
const LEGACY_SHOW_EXTENDED_KEY = "archlucid_nav_show_extended";
const LEGACY_SHOW_ADVANCED_KEY = "archlucid_nav_show_advanced";
const LEGACY_NAV_EXPAND_ALL_KEY = "archlucid-nav-expanded";
const LEGACY_COLLAPSED_PILOT_EXPANDED_KEY = "archlucid-nav-collapsed-pilot-expanded";

export const SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION: SidebarNavGroupExpansionState = {
  pilot: true,
  // Insights is a daily destination cluster — keep expanded so operators are not hunting behind two disclosures.
  "operate-analysis": true,
  "operate-governance": false,
  "operate-policy": false,
  "operate-integrations": false,
  "operate-infrastructure": false,
  "operator-admin": false,
  "operator-system-admin": false,
};

function readLegacyBooleanStorage(key: string): boolean | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) {
      return null;
    }

    return raw === "1" || raw === "true";
  } catch {
    return null;
  }
}

function hasAnyLegacySidebarPreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const keys = [
    SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
    LEGACY_SHOW_ADMINISTRATION_KEY,
    LEGACY_SHOW_EXTENDED_KEY,
    LEGACY_SHOW_ADVANCED_KEY,
    LEGACY_NAV_EXPAND_ALL_KEY,
    LEGACY_COLLAPSED_PILOT_EXPANDED_KEY,
    OPERATE_NAV_UNLOCK_STORAGE_KEY,
  ];

  try {
    return keys.some((key) => window.localStorage.getItem(key) !== null);
  } catch {
    return false;
  }
}

function migrateLegacySidebarExpansion(): SidebarNavGroupExpansionState {
  const showAdministration = readLegacyBooleanStorage(LEGACY_SHOW_ADMINISTRATION_KEY) === true;
  const showExtended = readLegacyBooleanStorage(LEGACY_SHOW_EXTENDED_KEY) === true;
  const showAdvanced = readLegacyBooleanStorage(LEGACY_SHOW_ADVANCED_KEY) === true;
  const expandAll = readLegacyBooleanStorage(LEGACY_NAV_EXPAND_ALL_KEY) === true;
  const collapsedPilotExpanded = readLegacyBooleanStorage(LEGACY_COLLAPSED_PILOT_EXPANDED_KEY) === true;
  const governancePhase =
    typeof window !== "undefined" &&
    (() => {
      try {
        return window.localStorage.getItem(OPERATE_NAV_UNLOCK_STORAGE_KEY) === "2";
      } catch {
        return false;
      }
    })();

  const analysisExpanded = showExtended || expandAll || collapsedPilotExpanded;
  const reportsExpanded = analysisExpanded;
  const integrationsExpanded = analysisExpanded;
  const governanceExpanded = showAdvanced || expandAll || governancePhase;

  return {
    ...SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION,
    ...(analysisExpanded || reportsExpanded ? { "operate-analysis": true } : {}),
    ...(governanceExpanded
      ? { "operate-governance": true, "operate-policy": true }
      : {}),
    ...(integrationsExpanded ? { "operate-integrations": true } : {}),
    ...(showAdministration ? { "operator-admin": true } : {}),
  };
}

function parseStoredExpansion(raw: string): SidebarNavGroupExpansionState | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (parsed === null || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const legacyOperationsExpanded = record["operate-operations"] === true;
    const legacyPlatformOpsExpanded = record["operate-platform-ops"] === true;
    // Retired Programs group (`operate-architect-advanced`) used to expand with Insights.
    const legacyArchitectAdvancedExpanded = record["operate-architect-advanced"] === true;

    return {
      pilot: record.pilot !== false,
      "operate-analysis":
        record["operate-analysis"] === true
        || legacyArchitectAdvancedExpanded
        || record["operate-reports"] === true
        || legacyOperationsExpanded,
      "operate-governance": record["operate-governance"] === true,
      "operate-policy": record["operate-policy"] === true || record["operate-governance"] === true,
      "operate-integrations": record["operate-integrations"] === true || legacyOperationsExpanded,
      "operate-infrastructure": record["operate-infrastructure"] === true,
      "operator-admin":
        record["operator-admin"] === true || legacyPlatformOpsExpanded || legacyOperationsExpanded,
      "operator-system-admin": record["operator-system-admin"] === true,
    };
  } catch {
    return null;
  }
}

/** Reads persisted group expansion; migrates legacy keys once when v2 state is absent. */
export function readSidebarNavGroupExpansionState(): SidebarNavGroupExpansionState {
  if (typeof window === "undefined") {
    return { ...SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION };
  }

  try {
    const raw = window.localStorage.getItem(SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY);

    if (raw !== null) {
      const parsed = parseStoredExpansion(raw);

      if (parsed !== null) {
        return parsed;
      }
    }
  } catch {
    /* private mode */
  }

  if (hasAnyLegacySidebarPreference()) {
    return migrateLegacySidebarExpansion();
  }

  return { ...SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION };
}

export function writeSidebarNavGroupExpansionState(state: SidebarNavGroupExpansionState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY, JSON.stringify(state));
    window.localStorage.setItem(
      LEGACY_SHOW_ADMINISTRATION_KEY,
      state["operator-admin"] ? "1" : "0",
    );
  } catch {
    /* private mode */
  }
}

export function isSidebarCollapsibleNavGroupId(groupId: string): groupId is SidebarCollapsibleNavGroupId {
  return (
    groupId === "pilot" ||
    groupId === "operate-analysis" ||
    groupId === "operate-governance" ||
    groupId === "operate-policy" ||
    groupId === "operate-integrations" ||
    groupId === "operate-infrastructure" ||
    groupId === "operator-admin" ||
    groupId === "operator-system-admin"
  );
}

export function sidebarNavGroupIsExpanded(
  groupId: string,
  expansion: SidebarNavGroupExpansionState,
): boolean {
  if (!isSidebarCollapsibleNavGroupId(groupId)) {
    return true;
  }

  return expansion[groupId];
}
