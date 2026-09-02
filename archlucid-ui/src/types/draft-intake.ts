import type { components } from "@/lib/openapi-schemas";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

/** Lifecycle state for a draft request (ADR 0048). */
export type DraftRequestStatus = components["schemas"]["DraftRequestStatus"];

export type ActorKind = components["schemas"]["ActorKind"];
export type TrustOrigin = components["schemas"]["TrustOrigin"];
export type InteractionContract = components["schemas"]["InteractionContract"];
export type ActorOrigin = components["schemas"]["ActorOrigin"];

export type ActorDescriptor = components["schemas"]["ActorDescriptor"];

export type ActorSet = components["schemas"]["ActorSet"];

export type DraftBranchOverrideKind = components["schemas"]["DraftBranchOverrideKind"];

export type DraftRequestDocument = components["schemas"]["DraftRequestDocument"];

export type BranchDraftRequest = components["schemas"]["BranchDraftRequest"];

export type BranchDraftResponse = components["schemas"]["BranchDraftResponse"];

export type DraftBranchQuotaResponse = components["schemas"]["DraftBranchQuotaResponse"];

export type DraftRequestSummary = components["schemas"]["DraftRequestSummaryResponse"];

export type DraftRequestSummaryPage = components["schemas"]["PagedResponseOfDraftRequestSummaryResponse"];

export type DraftRequestResponse = components["schemas"]["DraftRequestResponse"];

export type DraftElicitationQuestion = components["schemas"]["DraftElicitationQuestion"];

export type QuestionSelectionResult = components["schemas"]["QuestionSelectionResult"];

export type DraftQuestionsResponse = components["schemas"]["DraftQuestionsResponse"];

export type DraftAdmissionResponse = components["schemas"]["DraftAdmissionResponse"];

export type SubmitDraftResponse = components["schemas"]["SubmitDraftResponse"];

export type DraftIntakeReasonResponse = components["schemas"]["DraftIntakeReasonResponse"];

export type CreateDraftRequest = components["schemas"]["CreateDraftRequest"];
export type PatchDraftRequest = components["schemas"]["PatchDraftRequest"];
export type DraftIntakeReasonRequest = components["schemas"]["DraftIntakeReasonRequest"];
