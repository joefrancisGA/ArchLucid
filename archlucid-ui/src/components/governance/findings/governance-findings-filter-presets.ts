import {
  RISK_REGISTER_FILTER_LABELS,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";

const FILTER_PRESET_STORAGE_KEY = "archlucid.governance.filterPresets.v1";

export type GovernanceFindingsFilterPreset = {
  readonly id: string;
  readonly label: string;
  readonly filter: RiskRegisterFilter;
};

export const GOVERNANCE_FINDINGS_FILTER_PRESET_LABELS: Record<RiskRegisterFilter, string> =
  RISK_REGISTER_FILTER_LABELS;

export function loadGovernanceFindingsFilterPresets(): GovernanceFindingsFilterPreset[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(FILTER_PRESET_STORAGE_KEY) : null;

    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is GovernanceFindingsFilterPreset =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).id === "string" &&
        typeof (item as Record<string, unknown>).label === "string" &&
        typeof (item as Record<string, unknown>).filter === "string",
    );
  } catch {
    return [];
  }
}

export function saveGovernanceFindingsFilterPresets(presets: GovernanceFindingsFilterPreset[]): void {
  try {
    window.localStorage.setItem(FILTER_PRESET_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // localStorage may be unavailable (e.g. private browsing with storage blocked)
  }
}
