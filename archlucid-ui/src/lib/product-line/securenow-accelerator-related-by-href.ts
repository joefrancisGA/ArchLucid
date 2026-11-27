
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_SCENARIO_ARCHLUCID_REVIEW_HANDOFF: SecureNowHomeDestinationRow = {
  href: "/architecture/reviews",
  label: "Architecture reviews hub",
  summary: "Cross-product handoff — ArchLucid review record, not SecureNow capture.",
};

const RELATED: Record<string, readonly SecureNowHomeDestinationRow[]> = {
  "/administration/securenow-scenario-walks#fixture-path-03": [
    { href: "/securenow-sample", label: "SecureNow sample", summary: "Synthetic ranked path on the public sample page." },
    SECURENOW_SCENARIO_ARCHLUCID_REVIEW_HANDOFF,
  ],
  "/administration/securenow-first-hour": [
    { href: "/administration/securenow-accelerator-index", label: "Accelerator index", summary: "Return to the full accelerator catalog." },
    { href: "/integrations/cloud-connections", label: "Collection setup", summary: "Finish connector posture before another walk." },
  ],
  "/administration/securenow-pilot-spine": [
    { href: "/administration/securenow-scenario-walks", label: "Scenario walks", summary: "Additional fixture scenarios with handoffs." },
  ],
};

export function resolveSecureNowAcceleratorRelatedRows(contextHref: string): readonly SecureNowHomeDestinationRow[] {
  const key = contextHref.trim();
  const exact = RELATED[key];
  if (exact !== undefined) return exact;

  const base = key.split("#")[0] ?? key;
  return RELATED[base] ?? [];
}

export function resolveSecureNowScenarioWalkRelatedRows(scenarioId: string): readonly SecureNowHomeDestinationRow[] {
  if (scenarioId === "fixture-path-03") {
    return RELATED["/administration/securenow-scenario-walks#fixture-path-03"] ?? [];
  }

  if (scenarioId === "first-hour") {
    return resolveSecureNowAcceleratorRelatedRows("/administration/securenow-first-hour");
  }

  if (scenarioId === "collection-gap") {
    return [
      { href: "/integrations/cloud-connections", label: "Collection setup", summary: "Re-check connector and capture status." },
    ];
  }

  return [];
}
