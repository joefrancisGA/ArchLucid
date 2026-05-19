/** Optional routing filters persisted in subscription `metadataJson.routingCriteria`. */
export type AlertRoutingCriteria = {
  severities: string[];
  findingTypes: string[];
  tags: string[];
};

export const EMPTY_ALERT_ROUTING_CRITERIA: AlertRoutingCriteria = {
  severities: [],
  findingTypes: [],
  tags: [],
};

export const ALERT_ROUTING_SEVERITY_OPTIONS = ["Info", "Warning", "High", "Critical"] as const;

export const ALERT_ROUTING_FINDING_TYPE_OPTIONS = [
  "Advisory",
  "Compliance",
  "Security",
  "Cost",
  "Recommendation",
  "Learning",
  "CompositeAlert",
  "RequirementFinding",
  "TopologyGap",
  "SecurityControlFinding",
  "ComplianceFinding",
  "CostConstraintFinding",
  "PolicyApplicabilityFinding",
] as const;

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function parseAlertRoutingCriteriaFromMetadata(metadataJson: string): AlertRoutingCriteria {
  try {
    const parsed = JSON.parse(metadataJson) as { routingCriteria?: Partial<AlertRoutingCriteria> };
    const raw = parsed.routingCriteria;

    if (raw === undefined || raw === null) {
      return { ...EMPTY_ALERT_ROUTING_CRITERIA };
    }

    return {
      severities: readStringArray(raw.severities),
      findingTypes: readStringArray(raw.findingTypes),
      tags: readStringArray(raw.tags),
    };
  } catch {
    return { ...EMPTY_ALERT_ROUTING_CRITERIA };
  }
}

export function mergeAlertRoutingCriteriaIntoMetadata(
  metadataJson: string | undefined,
  criteria: AlertRoutingCriteria,
): string {
  let root: Record<string, unknown> = {};

  if (metadataJson !== undefined && metadataJson.trim().length > 0) {
    try {
      const parsed = JSON.parse(metadataJson) as Record<string, unknown>;

      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        root = { ...parsed };
      }
    } catch {
      root = {};
    }
  }

  const hasCriteria =
    criteria.severities.length > 0 || criteria.findingTypes.length > 0 || criteria.tags.length > 0;

  if (!hasCriteria) {
    delete root.routingCriteria;
  } else {
    root.routingCriteria = {
      severities: criteria.severities,
      findingTypes: criteria.findingTypes,
      tags: criteria.tags,
    };
  }

  return JSON.stringify(root);
}

export function formatAlertRoutingCriteriaSummary(criteria: AlertRoutingCriteria): string {
  const parts: string[] = [];

  if (criteria.severities.length > 0) {
    parts.push(`Severities: ${criteria.severities.join(", ")}`);
  }

  if (criteria.findingTypes.length > 0) {
    parts.push(`Types: ${criteria.findingTypes.join(", ")}`);
  }

  if (criteria.tags.length > 0) {
    parts.push(`Tags: ${criteria.tags.join(", ")}`);
  }

  if (parts.length === 0) {
    return "No extra filters (minimum severity only)";
  }

  return parts.join(" · ");
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function formatTagsInput(tags: string[]): string {
  return tags.join(", ");
}
