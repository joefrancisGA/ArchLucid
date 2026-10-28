export type ReviewRunEngineProvenance = {
  readonly providerKind: string;
  readonly deploymentOrModelId: string;
  readonly promptPackVersion?: string | null;
  readonly policyPackVersion?: string | null;
  readonly evidenceSnapshotVersion?: string | null;
  readonly outputSchemaVersion?: string | null;
  readonly runTimestampUtc: string;
  readonly totalInputTokens?: number | null;
  readonly totalOutputTokens?: number | null;
  readonly estimatedCostUsd?: number | null;
  readonly engineProfileId?: string | null;
  readonly modelAliasId?: string | null;
  readonly taskEvaluationSnapshotsAtSelection?: readonly {
    readonly taskType: string;
    readonly evaluationState: string;
    readonly evaluatedUtc?: string | null;
  }[] | null;
};

const PROVIDER_KIND_LABELS: Readonly<Record<string, string>> = {
  "azure-openai": "Azure OpenAI",
  deterministic: "Deterministic (simulator)",
  fake: "Test engine",
};

export const REVIEW_ENGINE_PROVIDER_NOT_STORED_LABEL = "Provider was not stored." as const;

export function formatReviewEngineProviderLabel(providerKind: string): string {
  const normalized = providerKind.trim().toLowerCase();

  if (normalized.length === 0) {
    return REVIEW_ENGINE_PROVIDER_NOT_STORED_LABEL;
  }

  return PROVIDER_KIND_LABELS[normalized] ?? providerKind;
}

export function formatReviewEngineOptionalStoredField(
  value: string | null | undefined,
  notStoredLabel: string,
  storedEmptyLabel: string,
): string {
  if (value === null || value === undefined) {
    return notStoredLabel;
  }

  if (value.trim().length === 0) {
    return storedEmptyLabel;
  }

  return value.trim();
}

export function formatReviewEngineRunTimestamp(isoTimestamp: string): string {
  if (isoTimestamp.trim().length === 0) {
    return "Run timestamp was not stored.";
  }

  const parsed = new Date(isoTimestamp);

  if (Number.isNaN(parsed.getTime())) {
    return "Run timestamp was not a valid time.";
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

export function formatReviewEngineCostUsd(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value))
    return null;

  return `$${value.toFixed(4)}`;
}
