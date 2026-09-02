import type { components } from "@/lib/openapi-schemas";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import type { ElicitationAnswerKind, ElicitationQuestionTier } from "@/types/policy-packs";

/** Lifecycle state for a draft request (ADR 0048). */
export type DraftRequestStatus = components["schemas"]["DraftRequestStatus"];

export type ActorKind = components["schemas"]["ActorKind"];
export type TrustOrigin = components["schemas"]["TrustOrigin"];
export type InteractionContract = components["schemas"]["InteractionContract"];
export type ActorOrigin = components["schemas"]["ActorOrigin"];

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

export type DraftBranchOverrideKind = components["schemas"]["DraftBranchOverrideKind"];

export type DraftRequestDocument = {
  freeTextIntent: string;
  systemName?: string;
  businessOutcome?: string;
  actorSet: ActorSet;
  parentDraftId?: string;
  questionAnswers?: Record<string, string>;
  requiredMustQuestionKeys?: string[];
  workflowIntent?: "create-architecture" | "start-review";
  structuredBrief?: {
    confirmedConstraints?: string[];
    confirmedAssumptions?: string[];
    confirmedRequiredCapabilities?: string[];
    suggestedConstraints?: string[];
    suggestedAssumptions?: string[];
    suggestedRequiredCapabilities?: string[];
    deniedConstraints?: string[];
    deniedAssumptions?: string[];
    deniedRequiredCapabilities?: string[];
    qualityAttribute?: string;
    failureModeNote?: string;
    suggestedFailureModeNote?: string;
    deniedFailureModeNote?: string;
    operationalOwner?: string;
  };
};

export type BranchDraftRequest = components["schemas"]["BranchDraftRequest"];

export type BranchDraftResponse = {
  parentDraftId: string;
  parentSpawnedRunId?: string;
  branch: DraftRequestResponse;
};

export type DraftBranchQuotaResponse = components["schemas"]["DraftBranchQuotaResponse"];

export type DraftRequestSummary = {
  draftId: string;
  status: DraftRequestStatus;
  systemName?: string | null;
  freeTextIntent: string;
  spawnedRunId?: string | null;
  createdByUserId: string;
  createdUtc: string;
  updatedUtc: string;
  reviewReadinessValid: boolean;
};

export type DraftRequestSummaryPage = {
  items: DraftRequestSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
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
  createdByUserId?: string;
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

export type CreateDraftRequest = components["schemas"]["CreateDraftRequest"];
export type PatchDraftRequest = components["schemas"]["PatchDraftRequest"];
export type DraftIntakeReasonRequest = components["schemas"]["DraftIntakeReasonRequest"];
