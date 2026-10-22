import type { components } from "@/lib/openapi-schemas";

type DecisionDeltaSchema = components["schemas"]["DecisionDelta"];

/** A single decision-level change between two golden manifests. */
export type DecisionDelta = DecisionDeltaSchema &
  Required<Pick<DecisionDeltaSchema, "decisionKey" | "changeType">> & {
    /** API may supply an operator-facing caption alongside the dotted key. */
    displayLabel?: string | null;
  };

type RequirementDeltaSchema = components["schemas"]["RequirementDelta"];

/** A requirement-level change (added, removed, or modified) between two manifests. */
export type RequirementDelta = RequirementDeltaSchema &
  Required<Pick<RequirementDeltaSchema, "requirementName" | "changeType">>;

type SecurityDeltaSchema = components["schemas"]["SecurityDelta"];

/** A security control change between two manifests (status transition). */
export type SecurityDelta = SecurityDeltaSchema & Required<Pick<SecurityDeltaSchema, "controlName">>;

type TopologyDeltaSchema = components["schemas"]["TopologyDelta"];

/** A topology resource change (added, removed, or modified) between two manifests. */
export type TopologyDelta = TopologyDeltaSchema &
  Required<Pick<TopologyDeltaSchema, "resource" | "changeType">>;

type CostDeltaSchema = components["schemas"]["CostDelta"];

/** Cost difference between two manifests (base vs target estimated costs). */
export type CostDelta = Omit<CostDeltaSchema, "baseCost" | "targetCost"> & {
  baseCost?: number | null;
  targetCost?: number | null;
};

type ComparisonResultSchema = components["schemas"]["ComparisonResult"];

/** Structured comparison result between two golden manifests (all delta sections). */
export type GoldenManifestComparison = Omit<
  ComparisonResultSchema &
    Required<
      Pick<
        ComparisonResultSchema,
        | "baseRunId"
        | "targetRunId"
        | "summaryHighlights"
      >
    >,
  "decisionChanges" | "requirementChanges" | "securityChanges" | "topologyChanges" | "costChanges"
> & {
  decisionChanges: DecisionDelta[];
  requirementChanges: RequirementDelta[];
  securityChanges: SecurityDelta[];
  topologyChanges: TopologyDelta[];
  costChanges: CostDelta[];
};
