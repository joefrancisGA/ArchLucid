import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import type { ElicitationAnswerKind, ElicitationQuestionTier } from "@/types/policy-packs";
import type { DraftRequestDocument } from "@/types/draft-intake-document";
import type { DraftRequestStatus } from "@/types/draft-intake-status";

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
  /** Durable architecture identity when ensure-on-create has run (ADR 0074). */
  architectureId?: string | null;
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
