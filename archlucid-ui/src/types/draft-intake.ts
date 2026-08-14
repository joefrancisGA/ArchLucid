import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import type { ElicitationAnswerKind, ElicitationQuestionTier } from "@/types/policy-packs";

/** Lifecycle state for a draft request (ADR 0048). */
export type DraftRequestStatus =
  | "Drafting"
  | "Admitted"
  | "Submitted"
  | "RunSpawned"
  | "Redirected"
  | "Abandoned";

export type ActorKind = "Human" | "Machine" | "Both";
export type TrustOrigin = "Internal" | "External" | "PublicAnonymous";
export type InteractionContract = "Sync" | "AsyncBatch" | "Event" | "Streaming";
export type ActorOrigin = "Asserted" | "Inferred";

export type ActorDescriptor = {
  label?: string;
  kind: ActorKind;
  trustOrigin: TrustOrigin;
  contract: InteractionContract;
  origin: ActorOrigin;
  confidence: number;
};

export type ActorSet = {
  actors: ActorDescriptor[];
};

export type DraftBranchOverrideKind =
  | "QuestionAnswer"
  | "BusinessOutcome"
  | "FreeTextIntent"
  | "SystemName";

export type DraftRequestDocument = {
  freeTextIntent: string;
  systemName?: string;
  businessOutcome?: string;
  actorSet: ActorSet;
  parentDraftId?: string;
  workflowIntent?: "create-architecture" | "start-review";
  structuredBrief?: {
    confirmedConstraints?: string[];
    confirmedAssumptions?: string[];
    confirmedRequiredCapabilities?: string[];
    suggestedConstraints?: string[];
    suggestedAssumptions?: string[];
    suggestedRequiredCapabilities?: string[];
    qualityAttribute?: string;
    failureModeNote?: string;
    operationalOwner?: string;
  };
};

export type BranchDraftRequest = {
  overrideKind: DraftBranchOverrideKind;
  overrideKey?: string;
  overrideValue: string;
};

export type BranchDraftResponse = {
  parentDraftId: string;
  parentSpawnedRunId?: string;
  branch: DraftRequestResponse;
};

export type DraftBranchQuotaResponse = {
  draftId: string;
  existingBranchCount: number;
  maxBranchesPerParent: number;
  remainingBranches: number;
  canBranch: boolean;
  estimatedBranchRunCostUsd: number;
};

export type DraftRequestResponse = {
  draftId: string;
  tenantId: string;
  workspaceId: string;
  projectId: string;
  status: DraftRequestStatus;
  document: DraftRequestDocument;
  redirectReason?: string;
  spawnedRunId?: string;
  createdUtc: string;
  updatedUtc: string;
};

export type DraftElicitationQuestion = {
  questionKey: string;
  prompt: string;
  tier: ElicitationQuestionTier;
  answerKind: ElicitationAnswerKind;
  source: "L0Universal" | "L1PackExplicit" | "L1PackDerived";
  ruleKeys: string[];
};

export type QuestionSelectionResult = {
  allQuestions: DraftElicitationQuestion[];
  requiredMustQuestionKeys: string[];
  pendingMustQuestions: DraftElicitationQuestion[];
};

export type DraftQuestionsResponse = {
  draftId: string;
  status: DraftRequestStatus;
  selection: QuestionSelectionResult;
};

export type DraftAdmissionResponse = {
  admitted: boolean;
  status: DraftRequestStatus;
  redirectReason?: string;
  draft: DraftRequestResponse;
  pendingMustQuestions: DraftElicitationQuestion[];
  requiredMustQuestionKeys: string[];
  verdict: ManifestFeasibilityVerdict;
};

export type SubmitDraftResponse = {
  draftId: string;
  status: DraftRequestStatus;
  runId: string;
  requestId: string;
  /** Set when this draft is a what-if branch and the parent draft already spawned a run (R12). */
  parentSpawnedRunId?: string;
};

export type DraftIntakeReasonResponse = {
  draftId: string;
  conversationThreadId: string;
  status: DraftRequestStatus;
  answer: string;
};
