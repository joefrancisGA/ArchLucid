import type { EnterpriseStatusKind } from "@/lib/design-tokens";

const CHANGE_TYPE_INDEX_TO_KEY: readonly string[] = [
  "ResourceAdded",
  "ResourceRemoved",
  "ResourceModified",
  "RelationshipAdded",
  "RelationshipRemoved",
  "IdentityChanged",
  "PermissionChanged",
  "NetworkExposureChanged",
  "SecurityControlChanged",
  "LoggingChanged",
  "EncryptionChanged",
  "TagChanged",
  "RegionChanged",
  "SkuChanged",
  "DependencyChanged",
  "PolicyAssignmentChanged",
  "Unknown",
];

const CHANGE_TYPE_LABELS: Readonly<Record<string, string>> = {
  ResourceAdded: "Resource added",
  ResourceRemoved: "Resource removed",
  ResourceModified: "Resource modified",
  RelationshipAdded: "Relationship added",
  RelationshipRemoved: "Relationship removed",
  IdentityChanged: "Identity changed",
  PermissionChanged: "Permission changed",
  NetworkExposureChanged: "Network exposure changed",
  SecurityControlChanged: "Security control changed",
  LoggingChanged: "Logging changed",
  EncryptionChanged: "Encryption changed",
  TagChanged: "Tag changed",
  RegionChanged: "Region changed",
  SkuChanged: "SKU changed",
  DependencyChanged: "Dependency changed",
  PolicyAssignmentChanged: "Policy assignment changed",
  Unknown: "Unknown",
  Modified: "Modified",
  Added: "Added",
  Removed: "Removed",
};

export const INFRA_EVIDENCE_DRIFT_CHANGE_TYPE_FILTER_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "", label: "All change types" },
  ...CHANGE_TYPE_INDEX_TO_KEY.map((key) => ({
    value: key,
    label: CHANGE_TYPE_LABELS[key] ?? key,
  })),
];

export const INFRA_EVIDENCE_DRIFT_RISK_FILTER_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "", label: "All risk levels" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "info", label: "Info" },
  { value: "unknown", label: "Unclassified" },
];

export function normalizeInfraEvidenceChangeTypeKey(changeType: string | number | null | undefined): string {
  if (typeof changeType === "number" && Number.isInteger(changeType)) {
    const indexed = CHANGE_TYPE_INDEX_TO_KEY[changeType];

    if (indexed != null) {
      return indexed;
    }
  }

  const trimmed = String(changeType ?? "").trim();

  if (trimmed.length === 0) {
    return "Unknown";
  }

  if (CHANGE_TYPE_LABELS[trimmed] != null) {
    return trimmed;
  }

  const pascal = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  if (CHANGE_TYPE_LABELS[pascal] != null) {
    return pascal;
  }

  return trimmed;
}

export function formatInfraEvidenceChangeTypeLabel(changeType: string | number | null | undefined): string {
  const key = normalizeInfraEvidenceChangeTypeKey(changeType);

  return CHANGE_TYPE_LABELS[key] ?? key;
}

export function resolveInfraEvidenceChangeTypeStatusKind(
  changeType: string | number | null | undefined,
): EnterpriseStatusKind {
  const key = normalizeInfraEvidenceChangeTypeKey(changeType);

  switch (key) {
    case "ResourceAdded":
    case "RelationshipAdded":
      return "ready";

    case "ResourceRemoved":
    case "RelationshipRemoved":
      return "blocked";

    case "PermissionChanged":
    case "NetworkExposureChanged":
    case "SecurityControlChanged":
    case "EncryptionChanged":
    case "LoggingChanged":
      return "needs-attention";

    case "ResourceModified":
    case "IdentityChanged":
    case "DependencyChanged":
    case "PolicyAssignmentChanged":
      return "in-progress";

    case "Unknown":
      return "draft";

    default:
      return "neutral";
  }
}

export function isNavigableEvidenceReference(reference: string | null | undefined): boolean {
  const trimmed = reference?.trim() ?? "";

  return trimmed.startsWith("/") || trimmed.startsWith("http://") || trimmed.startsWith("https://");
}
