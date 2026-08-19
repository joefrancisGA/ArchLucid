import type { ElicitationQuestionTier } from "@/types/policy-packs";

export type FeasibilityVerdictKind = "Feasible" | "SoftInfeasible" | "HardInfeasible";

export type AssertedTrailEntry = {
  key: string;
  value: string;
};

export type InferredTrailEntry = {
  key: string;
  value: string;
  confidence: number;
};

export type SkippedQuestionTrailEntry = {
  questionKey: string;
  tier: ElicitationQuestionTier;
};

export type TransparencyTrail = {
  asserted: AssertedTrailEntry[];
  inferred: InferredTrailEntry[];
  skipped: SkippedQuestionTrailEntry[];
};

export type SoftInfeasibilityEnvelope = {
  confidenceLow: number;
  confidenceHigh: number;
  envelopeDescription: string;
  softAssumption: string;
  costOfBeingWrong: string;
};

/** Authority manifest or admission feasibility outcome (ADR 0050). */
export type ManifestFeasibilityVerdict = {
  kind: FeasibilityVerdictKind;
  summary: string;
  transparencyTrail?: TransparencyTrail;
  confidence?: number | null;
  softEnvelope?: SoftInfeasibilityEnvelope | null;
  unsatCoreInvariantKeys?: string[];
};
