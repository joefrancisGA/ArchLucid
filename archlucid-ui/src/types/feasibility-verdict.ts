import type { components } from "@/lib/openapi-schemas";
import type { ElicitationQuestionTier } from "@/types/policy-packs";

export type FeasibilityVerdictKind = components["schemas"]["FeasibilityVerdictKind"];

type AssertedTrailEntrySchema = components["schemas"]["AssertedTrailEntry"];

export type AssertedTrailEntry = AssertedTrailEntrySchema &
  Required<Pick<AssertedTrailEntrySchema, "key" | "value">> & {
    questionId?: string | null;
    recordedUtc?: string | null;
    responderLabel?: string | null;
  };

type InferredTrailEntrySchema = components["schemas"]["InferredTrailEntry"];

export type InferredTrailEntry = InferredTrailEntrySchema &
  Required<Pick<InferredTrailEntrySchema, "key" | "value" | "confidence">>;

type SkippedQuestionTrailEntrySchema = components["schemas"]["SkippedQuestionTrailEntry"];

export type SkippedQuestionTrailEntry = SkippedQuestionTrailEntrySchema &
  Required<Pick<SkippedQuestionTrailEntrySchema, "questionKey" | "tier">> & {
    tier: ElicitationQuestionTier;
  };

type TransparencyTrailSchema = components["schemas"]["TransparencyTrail"];

export type TransparencyTrail = Omit<TransparencyTrailSchema, "asserted" | "inferred" | "skipped"> & {
  asserted: AssertedTrailEntry[];
  inferred: InferredTrailEntry[];
  skipped: SkippedQuestionTrailEntry[];
};

export type SoftInfeasibilityEnvelope = components["schemas"]["SoftInfeasibilityEnvelope"];

type FeasibilityVerdictSchema = components["schemas"]["FeasibilityVerdict"];

/** Authority manifest or admission feasibility outcome (ADR 0050). */
export type ManifestFeasibilityVerdict = Omit<FeasibilityVerdictSchema, "transparencyTrail"> &
  Required<Pick<FeasibilityVerdictSchema, "kind" | "summary">> & {
    transparencyTrail?: TransparencyTrail | null;
    hardCitations?: FeasibilityVerdictSchema["hardCitations"];
  };
