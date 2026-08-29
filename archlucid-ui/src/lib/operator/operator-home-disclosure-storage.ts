/** Expanded = `0`, collapsed = `1` (matches legacy minimized keys). */
export const OPERATOR_HOME_DISCLOSURE_EXPANDED_VALUE = "0";
export const OPERATOR_HOME_DISCLOSURE_COLLAPSED_VALUE = "1";

export const OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS = {
  advancedGuidance: "archlucid_operator_home_disclosure_advanced_guidance_v1",
  demoOperations: "archlucid_operator_home_disclosure_demo_operations_v1",
  workspaceReadiness: "archlucid_operator_home_disclosure_workspace_readiness_v1",
  pilotStartHere: "archlucid_operator_home_disclosure_pilot_start_here_v1",
  recommendedFirstSessionPath: "archlucid_operator_home_disclosure_recommended_first_session_v1",
  operatingRail: "archlucid_operator_home_disclosure_operating_rail_v1",
  diagnosticsChecklist: "archlucid_operator_home_disclosure_diagnostics_checklist_v1",
  reviewWorkflowChecklist: "archlucid_operator_home_disclosure_review_workflow_checklist_v1",
  assistantDiagnostics: "archlucid_operator_home_disclosure_assistant_diagnostics_v1",
  readinessDetails: "archlucid_operator_home_disclosure_readiness_details_v1",
  firstWeekGuidance: "archlucid_operator_home_disclosure_first_week_guidance_v1",
  lifecycleAlternatives: "archlucid_operator_home_disclosure_lifecycle_alternatives_v1",
} as const;

export function readOperatorHomeDisclosureExpanded(
  storageKey: string,
  defaultExpanded: boolean,
  legacyKeys: readonly string[] = [],
): boolean {
  if (typeof window === "undefined") {
    return defaultExpanded;
  }

  try {
    for (const key of [storageKey, ...legacyKeys]) {
      const raw = window.localStorage.getItem(key);

      if (raw === OPERATOR_HOME_DISCLOSURE_EXPANDED_VALUE) {
        return true;
      }

      if (raw === OPERATOR_HOME_DISCLOSURE_COLLAPSED_VALUE) {
        return false;
      }
    }
  } catch {
    return defaultExpanded;
  }

  return defaultExpanded;
}

export function writeOperatorHomeDisclosureExpanded(storageKey: string, expanded: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      storageKey,
      expanded ? OPERATOR_HOME_DISCLOSURE_EXPANDED_VALUE : OPERATOR_HOME_DISCLOSURE_COLLAPSED_VALUE,
    );
  } catch {
    /* private mode quota */
  }
}

export function collapseAriaLabel(sectionTitle: string): string {
  return `Collapse ${sectionTitle}`;
}

export function expandAriaLabel(sectionTitle: string): string {
  return `Expand ${sectionTitle}`;
}
