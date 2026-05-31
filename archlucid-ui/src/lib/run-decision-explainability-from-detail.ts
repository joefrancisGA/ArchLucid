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
    readonly appliedRuleIds: readonly string[];
    readonly acceptedFindingIds: readonly string[];
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
  }[];
  readonly coordinatorDecisionNodes: readonly {
    readonly pipeline: string;
    readonly decisionId: string;
    readonly topic: string;
    readonly selectedOptionId: string | null;
    readonly rationale: string;
    readonly confidence: number;
    readonly supportingEvaluationIds: readonly string[];
    readonly opposingEvaluationIds: readonly string[];
  }[];
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

  const manifestDecisions = Array.isArray(manifestWire)
    ? manifestWire
        .map((row) => {
          if (row === null || typeof row !== "object") {
            return null;
          }

          const record = row as Record<string, unknown>;

          return {
            pipeline: readString(record.pipeline) ?? "authority",
            decisionId: readString(record.decisionId) ?? "unknown",
            category: readString(record.category) ?? "—",
            title: readString(record.title) ?? "Untitled decision",
            selectedOption: readString(record.selectedOption) ?? "—",
            rationale: readString(record.rationale) ?? "",
            confidence: readFiniteNumber(record.confidence),
            confidenceSource: readString(record.confidenceSource),
            buyerConfidenceSource: readString(record.buyerConfidenceSource),
            supportingFindingIds: readStringArray(record.supportingFindingIds),
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
    : [];

  const coordinatorDecisionNodes = Array.isArray(coordinatorWire)
    ? coordinatorWire
        .map((row) => {
          if (row === null || typeof row !== "object") {
            return null;
          }

          const record = row as Record<string, unknown>;
          const confidence = readFiniteNumber(record.confidence);

          if (confidence === null) {
            return null;
          }

          return {
            pipeline: readString(record.pipeline) ?? "coordinator_v2",
            decisionId: readString(record.decisionId) ?? "unknown",
            topic: readString(record.topic) ?? "Decision",
            selectedOptionId: readString(record.selectedOptionId),
            rationale: readString(record.rationale) ?? "",
            confidence,
            supportingEvaluationIds: readStringArray(record.supportingEvaluationIds),
            opposingEvaluationIds: readStringArray(record.opposingEvaluationIds),
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
    : [];

  let authorityRuleAudit: RunDecisionExplainabilityModel["authorityRuleAudit"] = null;

  if (authorityWire !== null && typeof authorityWire === "object") {
    const record = authorityWire as Record<string, unknown>;
    const promptRefsWire = record.promptRefs;

    authorityRuleAudit = {
      pipeline: readString(record.pipeline) ?? "authority",
      decisionTraceId: readGuid(record.decisionTraceId),
      ruleSetId: readString(record.ruleSetId) ?? "—",
      ruleSetVersion: readString(record.ruleSetVersion) ?? "—",
      appliedRuleIds: readStringArray(record.appliedRuleIds),
      acceptedFindingIds: readStringArray(record.acceptedFindingIds),
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
                templateVersion: readString(prompt.templateVersion) ?? "—",
                agentType: readString(prompt.agentType),
              };
            })
            .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        : [],
    };
  }

  if (authorityRuleAudit === null && manifestDecisions.length === 0 && coordinatorDecisionNodes.length === 0) {
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
  };
}
