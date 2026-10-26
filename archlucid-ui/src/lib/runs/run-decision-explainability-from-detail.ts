import type { RunDetail } from "@/types/authority";

export type RunDecisionExplainabilityModel = {
  readonly snapshotIds: {
    readonly contextSnapshotId: string | null;
    readonly graphSnapshotId: string | null;
    readonly findingsSnapshotId: string | null;
  };
  readonly authorityRuleAudit: {
    readonly pipeline: string;
    readonly decisionTraceId: string | null;
    readonly ruleSetId: string;
    readonly ruleSetVersion: string;
    readonly appliedRuleIds: readonly string[] | null;
    readonly acceptedFindingIds: readonly string[] | null;
    readonly rejectedFindingIds: readonly string[];
    readonly notes: readonly string[];
    readonly promptRefs: readonly {
      readonly templateId: string;
      readonly templateVersion: string;
      readonly agentType: string | null;
    }[];
  } | null;
  readonly manifestDecisions: readonly {
    readonly pipeline: string;
    readonly decisionId: string;
    readonly category: string;
    readonly title: string;
    readonly selectedOption: string;
    readonly rationale: string;
    readonly confidence: number | null;
    readonly confidenceSource: string | null;
    readonly buyerConfidenceSource: string | null;
    readonly supportingFindingIds: readonly string[];
  }[] | null;
  readonly coordinatorDecisionNodes: readonly {
    readonly pipeline: string;
    readonly decisionId: string;
    readonly topic: string;
    readonly selectedOptionId: string | null;
    readonly rationale: string;
    readonly confidence: number | null;
    readonly supportingEvaluationIds: readonly string[];
    readonly opposingEvaluationIds: readonly string[];
  }[] | null;
  readonly findingEngineFailures: readonly {
    readonly engineType: string;
    readonly category: string;
    readonly exceptionType: string;
    readonly errorMessage: string;
    readonly durationMs: number | null;
    readonly occurredUtc: string | null;
  }[] | null;
  readonly manifestHonestyWarnings: readonly string[];
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function readOptionalStringArray(value: unknown): readonly string[] | null {
  if (value === undefined) {
    return null;
  }

  return readStringArray(value);
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function readGuid(value: unknown): string | null {
  const text = readString(value);

  if (text === null) {
    return null;
  }

  return text;
}

/** Maps server `decisionExplainability` on run detail into a UI model. */
export function resolveRunDecisionExplainabilityFromDetail(
  detail: RunDetail,
): RunDecisionExplainabilityModel | null {
  const wire = detail.decisionExplainability;

  if (wire === null || wire === undefined || typeof wire !== "object") {
    return null;
  }

  const root = wire as Record<string, unknown>;
  const snapshotWire = (root.snapshotIds ?? {}) as Record<string, unknown>;
  const authorityWire = root.authorityRuleAudit;
  const manifestWire = root.manifestDecisions;
  const coordinatorWire = root.coordinatorDecisionNodes;
  const failureWire = root.findingEngineFailures;
  const warningWire = root.manifestHonestyWarnings;

  const manifestDecisions =
    manifestWire === undefined
      ? null
      : Array.isArray(manifestWire)
        ? manifestWire
            .map((row) => {
              if (row === null || typeof row !== "object") {
                return null;
              }

              const record = row as Record<string, unknown>;

              return {
                pipeline: readString(record.pipeline) ?? "Pipeline was not stored.",
                decisionId: readString(record.decisionId) ?? "Decision id was not stored.",
                category: readString(record.category) ?? "Decision category was not stored.",
                title: readString(record.title) ?? "Decision title was not stored.",
                selectedOption: readString(record.selectedOption) ?? "Selected option was not stored.",
                rationale: readString(record.rationale) ?? "Decision rationale was not stored.",
                confidence: readFiniteNumber(record.confidence),
                confidenceSource: readString(record.confidenceSource),
                buyerConfidenceSource: readString(record.buyerConfidenceSource),
                supportingFindingIds: readStringArray(record.supportingFindingIds),
              };
            })
            .filter((row): row is NonNullable<typeof row> => row !== null)
        : [];

  const coordinatorDecisionNodes =
    coordinatorWire === undefined
      ? null
      : Array.isArray(coordinatorWire)
        ? coordinatorWire
            .map((row) => {
              if (row === null || typeof row !== "object") {
                return null;
              }

              const record = row as Record<string, unknown>;
              const confidence = readFiniteNumber(record.confidence);

              return {
                pipeline: readString(record.pipeline) ?? "Pipeline was not stored.",
                decisionId: readString(record.decisionId) ?? "Decision id was not stored.",
                topic: readString(record.topic) ?? "Decision topic was not stored.",
                selectedOptionId: readString(record.selectedOptionId),
                rationale: readString(record.rationale) ?? "Decision rationale was not stored.",
                confidence,
                supportingEvaluationIds: readStringArray(record.supportingEvaluationIds),
                opposingEvaluationIds: readStringArray(record.opposingEvaluationIds),
              };
            })
            .filter((row): row is NonNullable<typeof row> => row !== null)
        : [];

  const findingEngineFailures =
    failureWire === undefined
      ? null
      : Array.isArray(failureWire)
        ? failureWire
            .map((row) => {
              if (row === null || typeof row !== "object") {
                return null;
              }

              const record = row as Record<string, unknown>;
              return {
                engineType: readString(record.engineType) ?? "Engine type was not stored.",
                category: readString(record.category) ?? "Failure category was not stored.",
                exceptionType: readString(record.exceptionType) ?? "Exception type was not stored.",
                errorMessage: readString(record.errorMessage) ?? "Error message was not stored.",
                durationMs: readFiniteNumber(record.durationMs),
                occurredUtc: readString(record.occurredUtc),
              };
            })
            .filter((row): row is NonNullable<typeof row> => row !== null)
        : [];

  const manifestHonestyWarnings = readStringArray(warningWire);

  let authorityRuleAudit: RunDecisionExplainabilityModel["authorityRuleAudit"] = null;

  if (authorityWire !== null && typeof authorityWire === "object") {
    const record = authorityWire as Record<string, unknown>;
    const promptRefsWire = record.promptRefs;

    authorityRuleAudit = {
      pipeline: readString(record.pipeline) ?? "Pipeline was not stored.",
      decisionTraceId: readGuid(record.decisionTraceId),
      ruleSetId: readString(record.ruleSetId) ?? "Rule set id was not stored.",
      ruleSetVersion: readString(record.ruleSetVersion) ?? "Rule set version was not stored.",
      appliedRuleIds: readOptionalStringArray(record.appliedRuleIds),
      acceptedFindingIds: readOptionalStringArray(record.acceptedFindingIds),
      rejectedFindingIds: readStringArray(record.rejectedFindingIds),
      notes: readStringArray(record.notes),
      promptRefs: Array.isArray(promptRefsWire)
        ? promptRefsWire
            .map((entry) => {
              if (entry === null || typeof entry !== "object") {
                return null;
              }

              const prompt = entry as Record<string, unknown>;
              const templateId = readString(prompt.templateId);

              if (templateId === null) {
                return null;
              }

              return {
                templateId,
                templateVersion: readString(prompt.templateVersion) ?? "Template version not returned",
                agentType: readString(prompt.agentType),
              };
            })
            .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        : [],
    };
  }

  if (
    authorityRuleAudit === null
    && manifestDecisions === null
    && coordinatorDecisionNodes === null
    && findingEngineFailures === null
    && manifestHonestyWarnings.length === 0
  ) {
    return null;
  }

  return {
    snapshotIds: {
      contextSnapshotId: readGuid(snapshotWire.contextSnapshotId),
      graphSnapshotId: readGuid(snapshotWire.graphSnapshotId),
      findingsSnapshotId: readGuid(snapshotWire.findingsSnapshotId),
    },
    authorityRuleAudit,
    manifestDecisions,
    coordinatorDecisionNodes,
    findingEngineFailures,
    manifestHonestyWarnings,
  };
}
