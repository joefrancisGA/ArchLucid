/** Presentation labels for alert-routing finding-type filters (persisted values unchanged). */

export type AlertRoutingFindingTypeTier = "common" | "advanced";

export type AlertRoutingFindingTypePresentation = {
  value: string;
  label: string;
  description?: string;
  tier: AlertRoutingFindingTypeTier;
};

export const ALERT_ROUTING_FINDING_TYPE_PRESENTATION: readonly AlertRoutingFindingTypePresentation[] = [
  { value: "Advisory", label: "Advisory", tier: "common" },
  { value: "Compliance", label: "Compliance issue", tier: "common" },
  { value: "Security", label: "Security issue", tier: "common" },
  { value: "Cost", label: "Cost issue", tier: "common" },
  { value: "Recommendation", label: "Recommendation", tier: "common" },
  { value: "Learning", label: "Learning opportunity", tier: "common" },
  {
    value: "CompositeAlert",
    label: "Combined alert",
    description: "Fires when a composite rule joins multiple signals.",
    tier: "advanced",
  },
  {
    value: "RequirementFinding",
    label: "Missing requirement",
    description: "A required architecture element is absent or incomplete.",
    tier: "advanced",
  },
  {
    value: "TopologyGap",
    label: "Architecture structure gap",
    description: "Expected connectivity or dependency is missing in the architecture structure.",
    tier: "advanced",
  },
  {
    value: "SecurityControlFinding",
    label: "Security control issue",
    description: "A security control is missing, weak, or misapplied.",
    tier: "advanced",
  },
  {
    value: "ComplianceFinding",
    label: "Compliance finding",
    description: "A policy or regulatory control failed evaluation.",
    tier: "advanced",
  },
  {
    value: "CostConstraintFinding",
    label: "Cost constraint",
    description: "Spend or sizing violates a declared budget constraint.",
    tier: "advanced",
  },
  {
    value: "PolicyApplicabilityFinding",
    label: "Policy applicability issue",
    description: "A policy pack does not apply cleanly to this architecture scope.",
    tier: "advanced",
  },
];

const presentationByValue = new Map(
  ALERT_ROUTING_FINDING_TYPE_PRESENTATION.map((entry) => [entry.value.toLowerCase(), entry]),
);

export function labelForAlertRoutingFindingType(value: string): string {
  const match = presentationByValue.get(value.trim().toLowerCase());

  if (match !== undefined) {
    return match.label;
  }

  return value;
}

export function descriptionForAlertRoutingFindingType(value: string): string | undefined {
  return presentationByValue.get(value.trim().toLowerCase())?.description;
}

export const ALERT_ROUTING_COMMON_FINDING_TYPES = ALERT_ROUTING_FINDING_TYPE_PRESENTATION.filter(
  (entry) => entry.tier === "common",
);

export const ALERT_ROUTING_ADVANCED_FINDING_TYPES = ALERT_ROUTING_FINDING_TYPE_PRESENTATION.filter(
  (entry) => entry.tier === "advanced",
);
