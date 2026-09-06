import { describe, expect, it } from "vitest";

import type { components } from "@/lib/openapi-schemas";
import openApiSnapshot from "../../../ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json";

/**
 * Maps exported UI domain types to their OpenAPI `components.schemas` keys.
 * Update when adding new aliases under `src/types/`.
 */
export const UI_TYPE_OPENAPI_SCHEMA_KEYS = {
  DiffItem: "DiffItemResponse",
  ManifestComparison: "ManifestComparisonResponse",
  RunComparison: "RunComparisonResponse",
  ReplayResponse: "ReplayResponse",
  ReplayValidation: "ReplayValidationResponse",
  ProvenanceNode: "ProvenanceNode",
  ProvenanceEdge: "ProvenanceEdge",
  DecisionProvenanceGraph: "DecisionProvenanceGraph",
  PipelineTimelineItem: "RunPipelineTimelineItemResponse",
  RunSummary: "RunSummaryResponse",
  ManifestSummary: "ManifestSummaryResponse",
  ArtifactDescriptor: "ArtifactDescriptorResponse",
  RunAgentExecutionLlmCostEstimate: "RunAgentLlmCostEstimateResponse",
  RunDetailAgentResult: "AgentResult",
  RunRetrievalGroundingSummary: "RunRetrievalGroundingSummaryDto",
  PilotFunnelSnapshotDto: "PilotFunnelSnapshotResponse",
  OperatorStickinessSnapshotDto: "OperatorStickinessSnapshotResponse",
  ConnectorSurfaceStatusDto: "ConnectorSurfaceStatusResponse",
  IntegrationEventBusStatusDto: "IntegrationEventBusStatusResponse",
  TenantIntegrationsOperationsDto: "TenantIntegrationsOperationsResponse",
  WeeklyDigestHealthDto: "WeeklyDigestHealthResponse",
  AlertActionLoopDto: "AlertActionLoopResponse",
  AlertDeliveryAttemptDto: "AlertDeliveryAttemptResponse",
  TechnologyLedgerRole: "TechnologyLedgerRole",
  TechnologyLedgerStatus: "TechnologyLedgerStatus",
  TechnologyLedgerSource: "TechnologyLedgerSource",
  CloudProviderFamily: "CloudProvider",
  TechnologyLedgerEntry: "TechnologyLedgerEntryResponse",
  TechnologyLedgerListResponse: "TechnologyLedgerListResponse",
  PatchTechnologyLedgerEntryRequest: "PatchTechnologyLedgerEntryRequest",
  PatchTechnologyLedgerEntryResponse: "PatchTechnologyLedgerEntryResponse",
  AlertRule: "AlertRule",
  AlertRecord: "AlertRecord",
  ImprovementRecommendation: "ImprovementRecommendationResponse",
  ImprovementPlan: "ImprovementPlanResponse",
  RecommendationRecord: "RecommendationRecordResponse",
  RecommendationSourceEvidenceLink: "RecommendationSourceEvidenceLink",
  RecommendationImproveLoopEvidence: "RecommendationImproveLoopEvidenceResponse",
  RecommendationActionResult: "RecommendationActionResponse",
  AdvisoryRunRecommendationsList: "AdvisoryRunRecommendationsListResponse",
  GovernanceApprovalRequest: "GovernanceApprovalRequest",
  GovernancePromotionRecord: "GovernancePromotionRecord",
  GovernanceEnvironmentActivation: "GovernanceEnvironmentActivation",
  DigestSubscription: "DigestSubscription",
  DigestDeliveryAttempt: "DigestDeliveryAttempt",
  ConversationThread: "ConversationThread",
  ConversationMessage: "ConversationMessage",
  AskResponse: "AskResponse",
  PolicyPack: "PolicyPack",
  PolicyPackVersion: "PolicyPackVersion",
  PolicyPackAssignment: "PolicyPackAssignment",
  ResolvedPolicyPack: "ResolvedPolicyPack",
  EffectivePolicyPackSet: "EffectivePolicyPackSet",
  PolicyPackContentDocument: "PolicyPackContentDocument",
  ElicitationQuestionTier: "ElicitationQuestionTier",
  ElicitationAnswerKind: "ElicitationAnswerKind",
  ElicitationQuestion: "ElicitationQuestion",
  PolicyPackCatalogListItem: "PolicyPackCatalogListItem",
  PolicyPackCatalogEntryDetail: "PolicyPackCatalogEntryDetail",
  PolicyPackWorkspaceSelectionItem: "PolicyPackWorkspaceSelectionItem",
  GraphNodeVm: "GraphNodeVm",
  GraphEdgeVm: "GraphEdgeVm",
  GraphNodesPageResponse: "GraphNodesPageResponse",
  GraphViewModel: "GraphViewModel",
  DecisionDelta: "DecisionDelta",
  RequirementDelta: "RequirementDelta",
  SecurityDelta: "SecurityDelta",
  TopologyDelta: "TopologyDelta",
  CostDelta: "CostDelta",
  GoldenManifestComparison: "ComparisonResult",
  FindingInspectEvidence: "FindingInspectEvidenceItem",
  FindingInspectPayload: "FindingInspectResponse",
  LearningThemeResponse: "LearningThemeResponse",
  LearningThemesListResponse: "LearningThemesListResponse",
  LearningPlanListItemResponse: "LearningPlanListItemResponse",
  LearningPlansListResponse: "LearningPlansListResponse",
  LearningSummaryResponse: "LearningSummaryResponse",
  LearningPlanStepResponse: "LearningPlanStepResponse",
  LearningPlanEvidenceCountsResponse: "LearningPlanEvidenceCountsResponse",
  LearningPlanDetailResponse: "LearningPlanDetailResponse",
  EvolutionCandidateChangeSetResponse: "EvolutionCandidateChangeSetResponse",
  EvolutionCandidateChangeSetListResponse: "EvolutionCandidateChangeSetListResponse",
  EvaluationScoreResponse: "EvaluationScoreResponse",
  EvolutionSimulationRunWithEvaluationResponse: "EvolutionSimulationRunWithEvaluationResponse",
  EvolutionResultsResponse: "EvolutionResultsResponse",
  EvolutionSimulateResponse: "EvolutionSimulateResponse",
  ThresholdCandidate: "ThresholdCandidate",
  NoiseScoreBreakdown: "NoiseScoreBreakdown",
  ThresholdCandidateEvaluation: "ThresholdCandidateEvaluation",
  ThresholdRecommendationResult: "ThresholdRecommendationResult",
  CompositeAlertRuleCondition: "AlertRuleCondition",
  CompositeAlertRule: "CompositeAlertRule",
  TenantTrialStatusPayload: "TenantTrialStatusResponse",
  TenantHomepageSettingsResponse: "TenantHomepageSettingsGetResponse",
  FeaturedCompletedSampleCandidate: "FeaturedCompletedSampleCandidateResponse",
  TenantHomepageSettingsPutRequest: "TenantHomepageSettingsPutRequest",
  TenantCostSettingsResponse: "TenantCostSettingsGetResponse",
  TenantCostSettingsPutRequest: "TenantCostSettingsPutRequest",
  TenantCostEstimateResponse: "TenantCostEstimateResponse",
  GovernanceResolutionCandidate: "GovernanceResolutionCandidate",
  GovernanceResolutionDecision: "GovernanceResolutionDecision",
  GovernanceConflictRecord: "GovernanceConflictRecord",
  EffectiveGovernanceResolutionResult: "EffectiveGovernanceResolutionResult",
  PolicyPackDryRunSeverityCount: "PolicyPackDryRunSeverityCount",
  PolicyPackDryRunThresholdOutcome: "PolicyPackDryRunThresholdOutcome",
  PolicyPackDryRunRunItem: "PolicyPackDryRunRunItem",
  PolicyPackDryRunDeltaCounts: "PolicyPackDryRunDeltaCounts",
  PolicyPackDryRunResponse: "PolicyPackDryRunResponse",
  PolicyPackDryRunRequest: "PolicyPackDryRunRequest",
  PreFinalizeChecklistItemStatus: "PreFinalizeChecklistItemStatus",
  PreFinalizeChecklistItem: "PreFinalizeChecklistItem",
  PreFinalizeChecklistResult: "PreFinalizeChecklistResult",
  ProductLearningDashboardSummaryResponse: "ProductLearningDashboardSummaryResponse",
  ArtifactOutcomeTrend: "ArtifactOutcomeTrend",
  ImprovementOpportunity: "ImprovementOpportunity",
  TriageQueueItem: "TriageQueueItem",
  ProductLearningImprovementOpportunitiesResponse: "ProductLearningImprovementOpportunitiesResponse",
  ProductLearningArtifactOutcomeTrendsResponse: "ProductLearningArtifactOutcomeTrendsResponse",
  ProductLearningTriageQueueResponse: "ProductLearningTriageQueueResponse",
  ProductLearningDashboardBundle: "ProductLearningDashboardBundleResponse",
  PilotValueReportSeverityJson: "PilotValueReportSeverityBreakdown",
  PilotValueReportTimelineRow: "PilotValueReportRunTimelinePoint",
  PilotValueReportJson: "PilotValueReport",
  PolicyPackChangeLogEntry: "PolicyPackChangeLogEntry",
  GovernanceDashboardSummary: "GovernanceDashboardSummary",
  FeasibilityVerdictKind: "FeasibilityVerdictKind",
  AssertedTrailEntry: "AssertedTrailEntry",
  InferredTrailEntry: "InferredTrailEntry",
  SkippedQuestionTrailEntry: "SkippedQuestionTrailEntry",
  TransparencyTrail: "TransparencyTrail",
  SoftInfeasibilityEnvelope: "SoftInfeasibilityEnvelope",
  ManifestFeasibilityVerdict: "FeasibilityVerdict",
  GovernanceEnvironmentDefinition: "GovernanceEnvironmentDefinition",
  GovernanceEnvironmentTransition: "GovernanceEnvironmentTransition",
  GovernanceEnvironmentCatalog: "GovernanceEnvironmentCatalog",
  ReplaceGovernanceEnvironmentCatalogRequest: "ReplaceGovernanceEnvironmentCatalogRequest",
  DraftRequestStatus: "DraftRequestStatus",
  ActorKind: "ActorKind",
  TrustOrigin: "TrustOrigin",
  InteractionContract: "InteractionContract",
  ActorOrigin: "ActorOrigin",
  DraftBranchOverrideKind: "DraftBranchOverrideKind",
  BranchDraftRequest: "BranchDraftRequest",
  DraftBranchQuotaResponse: "DraftBranchQuotaResponse",
  CreateDraftRequest: "CreateDraftRequest",
  PatchDraftRequest: "PatchDraftRequest",
  DraftIntakeReasonRequest: "DraftIntakeReasonRequest",
  StageTimelineSummary: "StageTimelineSummary",
  RecommendationLearningProfileState: "RecommendationLearningProfileState",
  RecommendationLearningOutcomeEligibility: "RecommendationLearningOutcomeEligibilityBreakdown",
  RecommendationLearningProfileMetadata: "RecommendationLearningProfileMetadataResponse",
  RecommendationLearningOperationalStatus: "RecommendationLearningOperationalStatusResponse",
  RecommendationLearningValidationCheck: "RecommendationLearningValidationCheck",
  RecommendationLearningWeightDelta: "RecommendationLearningWeightDelta",
  LearningProfile: "RecommendationLearningProfile",
  RecommendationLearningPreview: "RecommendationLearningPreviewResponse",
  RecommendationLearningProfileHistoryItem: "RecommendationLearningProfileHistoryItem",
  RecommendationLearningRollbackRequest: "RecommendationLearningRollbackRequest",
  RecommendationLearningOpsPageResponse: "RecommendationLearningOpsPageResponse",
  GlobalSearchResponse: "GlobalSearchResponse",
  GlobalSearchFinding: "GlobalSearchFindingResponse",
  GlobalSearchRun: "GlobalSearchRunResponse",
  GlobalSearchPolicyPack: "GlobalSearchPolicyPackResponse",
  AdvisoryScanSchedule: "AdvisoryScanSchedule",
  AdvisoryScanExecution: "AdvisoryScanExecution",
  ArchitectureDigest: "ArchitectureDigest",
  AlertRoutingSubscription: "AlertRoutingSubscription",
  WebhookTestResponse: "OutboundWebhookDryRunResponse",
  AlertRoutingDeliveryAttempt: "AlertDeliveryAttempt",
  SimulatedAlertOutcome: "SimulatedAlertOutcome",
  RuleSimulationResult: "RuleSimulationResult",
  RuleCandidateComparisonResult: "RuleCandidateComparisonResult",
  ArchitectureLinkageNode: "ArchitectureLinkageNode",
  ArchitectureLinkageEdge: "ArchitectureLinkageEdge",
  ArchitectureTraceTimelineEntry: "ArchitectureTraceTimelineEntry",
  ArchitectureRunProvenanceGraph: "ArchitectureRunProvenanceGraph",
  DemoPreviewRun: "DemoPreviewRun",
  DemoPreviewAuthorityChain: "DemoPreviewAuthorityChain",
  DemoPreviewManifestSummary: "DemoPreviewManifestSummary",
  DemoPreviewArtifact: "DemoPreviewArtifact",
  DemoPreviewTimelineItem: "DemoPreviewTimelineItem",
  DemoCommitPagePreviewResponse: "DemoCommitPagePreviewResponse",
  DemoExplainResponse: "DemoExplainResponse",
  DemoProvenanceGraph: "GraphViewModel",
  DemoProvenanceGraphNode: "GraphNodeVm",
  DemoProvenanceGraphEdge: "GraphEdgeVm",
  ExecDigestPreferencesResponse: "ExecDigestPreferencesResponse",
  ExecDigestPreferencesUpsertRequest: "ExecDigestPreferencesUpsertRequest",
  OutcomeStats: "RecommendationOutcomeStats",
  TeamsIncomingWebhookConnectionResponse: "TeamsIncomingWebhookConnectionResponse",
  TeamsIncomingWebhookConnectionUpsertRequest: "TeamsIncomingWebhookConnectionUpsertRequest",
  TeamsIncomingWebhookSecretValidationResponse: "TeamsIncomingWebhookSecretValidationResponse",
  TeamsIncomingWebhookSecretValidationOutcome: "TeamsIncomingWebhookSecretValidationOutcome",
  TeamsIncomingWebhookConnectionTestResponse: "TeamsIncomingWebhookConnectionTestResponse",
  AgentExecutionTraceRow: "AgentExecutionTraceSummary",
  AgentExecutionTraceListPayload: "AgentExecutionTraceResponse",
  AgentOutputSemanticScoreRow: "AgentOutputSemanticScore",
  AgentOutputEvaluationScoreRow: "AgentOutputEvaluationScore",
  AgentOutputEvaluationPerspectivePayload: "AgentOutputEvaluationPerspective",
  AgentOutputEvaluationSummaryPayload: "AgentOutputEvaluationSummary",
  RunRetrievalGroundingScoreSummary: "RunRetrievalGroundingScoreSummary",
  RunRetrievalGroundingRow: "RunRetrievalGroundingRow",
  RunRetrievalGroundingPayload: "RunRetrievalGroundingResponse",
  ExplanationProvenance: "ExplanationProvenance",
  StructuredExplanation: "StructuredExplanation",
  FindingExplainabilityEvidence: "FindingExplainabilityEvidence",
  FindingEvidenceChain: "FindingEvidenceChainResponse",
  FindingLlmAudit: "FindingLlmAuditResult",
  FindingExplainability: "FindingExplainabilityResult",
  ComparisonExplanation: "ComparisonExplanationResult",
  ComplianceDriftTrendPoint: "ComplianceDriftTrendPoint",
  GovernanceLineageRunSummary: "GovernanceLineageRunSummary",
  GovernanceLineageManifestSummary: "GovernanceLineageManifestSummary",
  GovernanceLineageFindingSummary: "GovernanceLineageFindingSummary",
  GovernanceLineageResult: "GovernanceLineageResult",
  GovernanceRationaleResult: "GovernanceRationaleResult",
  GovernanceBatchReviewItemResult: "GovernanceBatchReviewItemResult",
  GovernanceBatchReviewResponse: "GovernanceBatchReviewResponse",
  ActorDescriptor: "ActorDescriptor",
  ActorSet: "ActorSet",
  DraftRequestDocument: "DraftRequestDocument",
  DraftRequestResponse: "DraftRequestResponse",
  DraftRequestSummary: "DraftRequestSummaryResponse",
  DraftRequestSummaryPage: "PagedResponseOfDraftRequestSummaryResponse",
  BranchDraftResponse: "BranchDraftResponse",
  DraftElicitationQuestion: "DraftElicitationQuestion",
  QuestionSelectionResult: "QuestionSelectionResult",
  DraftQuestionsResponse: "DraftQuestionsResponse",
  DraftAdmissionResponse: "DraftAdmissionResponse",
  SubmitDraftResponse: "SubmitDraftResponse",
  DraftIntakeReasonResponse: "DraftIntakeReasonResponse",
  TrustEvidenceFieldSnapshot: "TrustEvidenceFieldSnapshot",
  RunTrustEvidenceRouteRef: "RunTrustEvidenceRouteRef",
  RunTrustEvidenceTopFindingRow: "RunTrustEvidenceTopFindingRow",
  RunTrustEvidenceCard: "RunTrustEvidenceCard",
  RunExplanation: "ExplanationResult",
  FindingConfidenceLevel: "FindingConfidenceLevel",
  PilotScorecardJson: "PilotInProductScorecardResponse",
  PilotScorecardResponse: "PilotScorecardResponse",
  PagedResponseOfConversationThread: "PagedResponseOfConversationThread",
  PagedResponseOfDraftRequestSummaryResponse: "PagedResponseOfDraftRequestSummaryResponse",
  CursorPagedResponseOfAlertRecord: "CursorPagedResponseOfAlertRecord",
  CursorPagedResponseOfAuditEvent: "CursorPagedResponseOfAuditEvent",
  CursorPagedResponseOfRunListItemResponse: "CursorPagedResponseOfRunListItemResponse",
  CursorPagedResponseOfRunSummaryResponse: "CursorPagedResponseOfRunSummaryResponse",
} as const satisfies Record<string, keyof components["schemas"]>;

type AssertExtends<Base, Derived extends Base> = Derived;

/** Compile-time guard: aliased DTOs remain assignable to their OpenAPI wire shapes. */
type _AuthorityRunSummaryWave11Aliases = [
  AssertExtends<components["schemas"]["RunSummaryResponse"], import("@/types/authority-run-summary").RunSummary>,
];

type _AuthorityManifestWave11Aliases = [
  AssertExtends<components["schemas"]["DiffItemResponse"], import("@/types/authority-manifest").DiffItem>,
  AssertExtends<components["schemas"]["ManifestComparisonResponse"], import("@/types/authority-manifest").ManifestComparison>,
  AssertExtends<components["schemas"]["RunComparisonResponse"], import("@/types/authority-manifest").RunComparison>,
  AssertExtends<components["schemas"]["ReplayValidationResponse"], import("@/types/authority-manifest").ReplayValidation>,
  AssertExtends<components["schemas"]["ReplayResponse"], import("@/types/authority-manifest").ReplayResponse>,
  AssertExtends<
    components["schemas"]["ManifestSummaryResponse"],
    import("@/types/authority-manifest").ManifestSummary
  >,
  AssertExtends<
    components["schemas"]["ArtifactDescriptorResponse"],
    import("@/types/authority-manifest").ArtifactDescriptor
  >,
  AssertExtends<
    components["schemas"]["RunAgentLlmCostEstimateResponse"],
    import("@/types/authority-manifest").RunAgentExecutionLlmCostEstimate
  >,
];

type _AuthorityRunDetailWave11Aliases = [
  AssertExtends<components["schemas"]["ProvenanceNode"], import("@/types/authority-run-detail").ProvenanceNode>,
  AssertExtends<components["schemas"]["ProvenanceEdge"], import("@/types/authority-run-detail").ProvenanceEdge>,
  AssertExtends<
    components["schemas"]["DecisionProvenanceGraph"],
    import("@/types/authority-run-detail").DecisionProvenanceGraph
  >,
  AssertExtends<
    components["schemas"]["RunPipelineTimelineItemResponse"],
    import("@/types/authority-run-detail").PipelineTimelineItem
  >,
];

/** Wave 12 — explanation run vs structured envelope modules. */
type _ExplanationWave12ModuleAliases = [
  AssertExtends<components["schemas"]["ExplanationProvenance"], import("@/types/explanation-run").ExplanationProvenance>,
  AssertExtends<components["schemas"]["StructuredExplanation"], import("@/types/explanation-structured").StructuredExplanation>,
  AssertExtends<
    components["schemas"]["FindingExplainabilityEvidence"],
    import("@/types/explanation-structured").FindingExplainabilityEvidence
  >,
  AssertExtends<
    components["schemas"]["FindingEvidenceChainResponse"],
    import("@/types/explanation-structured").FindingEvidenceChain
  >,
  AssertExtends<components["schemas"]["FindingLlmAuditResult"], import("@/types/explanation-structured").FindingLlmAudit>,
  AssertExtends<
    components["schemas"]["FindingExplainabilityResult"],
    import("@/types/explanation-structured").FindingExplainability
  >,
  AssertExtends<
    components["schemas"]["ComparisonExplanationResult"],
    import("@/types/explanation-run").ComparisonExplanation
  >,
];

/** Wave 12 — explanation barrel re-exports preserve `@/types/explanation` import surface. */
type _ExplanationWave12BarrelAliases = [
  AssertExtends<import("@/types/explanation-run").RunExplanation, import("@/types/explanation").RunExplanation>,
  AssertExtends<
    import("@/types/explanation-run").ExplanationProvenance,
    import("@/types/explanation").ExplanationProvenance
  >,
  AssertExtends<
    import("@/types/explanation-structured").StructuredExplanation,
    import("@/types/explanation").StructuredExplanation
  >,
  AssertExtends<
    import("@/types/explanation-structured").FindingExplainability,
    import("@/types/explanation").FindingExplainability
  >,
  AssertExtends<
    import("@/types/explanation-run").ComparisonExplanation,
    import("@/types/explanation").ComparisonExplanation
  >,
];

/** Wave 12 — draft-intake actor/trust descriptor module. */
type _DraftIntakeActorsWave12ModuleAliases = [
  AssertExtends<components["schemas"]["ActorKind"], import("@/types/draft-intake-actors").ActorKind>,
  AssertExtends<components["schemas"]["TrustOrigin"], import("@/types/draft-intake-actors").TrustOrigin>,
  AssertExtends<
    components["schemas"]["InteractionContract"],
    import("@/types/draft-intake-actors").InteractionContract
  >,
  AssertExtends<components["schemas"]["ActorOrigin"], import("@/types/draft-intake-actors").ActorOrigin>,
  AssertExtends<components["schemas"]["ActorDescriptor"], import("@/types/draft-intake-actors").ActorDescriptor>,
  AssertExtends<components["schemas"]["ActorSet"], import("@/types/draft-intake-actors").ActorSet>,
];

/** Wave 12 — draft-intake barrel re-exports actor descriptors from `draft-intake-actors`. */
type _DraftIntakeActorsWave12BarrelAliases = [
  AssertExtends<import("@/types/draft-intake-actors").ActorKind, import("@/types/draft-intake").ActorKind>,
  AssertExtends<import("@/types/draft-intake-actors").ActorDescriptor, import("@/types/draft-intake").ActorDescriptor>,
  AssertExtends<import("@/types/draft-intake-actors").ActorSet, import("@/types/draft-intake").ActorSet>,
];

/** Wave 13 — draft-intake document, lifecycle/status, branch, workflow, and request modules. */
type _DraftIntakeWave13ModuleAliases = [
  AssertExtends<components["schemas"]["DraftRequestStatus"], import("@/types/draft-intake-status").DraftRequestStatus>,
  AssertExtends<
    components["schemas"]["DraftBranchOverrideKind"],
    import("@/types/draft-intake-status").DraftBranchOverrideKind
  >,
  AssertExtends<components["schemas"]["BranchDraftRequest"], import("@/types/draft-intake-branch").BranchDraftRequest>,
  AssertExtends<
    components["schemas"]["DraftBranchQuotaResponse"],
    import("@/types/draft-intake-branch").DraftBranchQuotaResponse
  >,
  AssertExtends<
    components["schemas"]["DraftRequestDocument"],
    import("@/types/draft-intake-document").DraftRequestDocument
  >,
  AssertExtends<
    components["schemas"]["DraftRequestResponse"],
    import("@/types/draft-intake-workflow").DraftRequestResponse
  >,
  AssertExtends<
    components["schemas"]["DraftRequestSummaryResponse"],
    import("@/types/draft-intake-workflow").DraftRequestSummary
  >,
  AssertExtends<
    components["schemas"]["CreateDraftRequest"],
    import("@/types/draft-intake-requests").CreateDraftRequest
  >,
  AssertExtends<
    components["schemas"]["PatchDraftRequest"],
    import("@/types/draft-intake-requests").PatchDraftRequest
  >,
  AssertExtends<
    components["schemas"]["DraftIntakeReasonRequest"],
    import("@/types/draft-intake-requests").DraftIntakeReasonRequest
  >,
];

/** Wave 13 — draft-intake barrel re-exports document, lifecycle, and workflow slices. */
type _DraftIntakeWave13BarrelAliases = [
  AssertExtends<
    import("@/types/draft-intake-document").DraftRequestDocument,
    import("@/types/draft-intake").DraftRequestDocument
  >,
  AssertExtends<import("@/types/draft-intake-status").DraftRequestStatus, import("@/types/draft-intake").DraftRequestStatus>,
  AssertExtends<
    import("@/types/draft-intake-branch").BranchDraftResponse,
    import("@/types/draft-intake").BranchDraftResponse
  >,
  AssertExtends<
    import("@/types/draft-intake-workflow").DraftAdmissionResponse,
    import("@/types/draft-intake").DraftAdmissionResponse
  >,
  AssertExtends<
    import("@/types/draft-intake-requests").CreateDraftRequest,
    import("@/types/draft-intake").CreateDraftRequest
  >,
];

/** Wave 13 — agent-forensics trace and evaluation score modules. */
type _AgentForensicsWave13ModuleAliases = [
  AssertExtends<
    components["schemas"]["AgentExecutionTraceSummary"],
    import("@/types/agent-forensics-traces").AgentExecutionTraceRow
  >,
  AssertExtends<
    components["schemas"]["AgentExecutionTraceResponse"],
    import("@/types/agent-forensics-traces").AgentExecutionTraceListPayload
  >,
  AssertExtends<
    components["schemas"]["AgentOutputSemanticScore"],
    import("@/types/agent-forensics-scores").AgentOutputSemanticScoreRow
  >,
  AssertExtends<
    components["schemas"]["AgentOutputEvaluationScore"],
    import("@/types/agent-forensics-scores").AgentOutputEvaluationScoreRow
  >,
  AssertExtends<
    components["schemas"]["RunRetrievalGroundingResponse"],
    import("@/types/agent-forensics-scores").RunRetrievalGroundingPayload
  >,
];

/** Wave 13 — agent-forensics barrel re-exports trace and score slices. */
type _AgentForensicsWave13BarrelAliases = [
  AssertExtends<
    import("@/types/agent-forensics-traces").AgentExecutionTraceRow,
    import("@/types/agent-forensics").AgentExecutionTraceRow
  >,
  AssertExtends<
    import("@/types/agent-forensics-scores").AgentOutputEvaluationSummaryPayload,
    import("@/types/agent-forensics").AgentOutputEvaluationSummaryPayload
  >,
];

/** Wave 13 — explanation confidence helpers and structured envelope modules. */
type _ExplanationWave13ModuleAliases = [
  AssertExtends<
    components["schemas"]["StructuredExplanation"],
    import("@/types/explanation-structured-envelope").StructuredExplanation
  >,
  AssertExtends<
    components["schemas"]["FindingExplainabilityResult"],
    import("@/types/explanation-structured-envelope").FindingExplainability
  >,
  AssertExtends<
    NonNullable<components["schemas"]["FindingConfidenceLevel"]>,
    import("@/types/explanation-confidence").FindingConfidenceLevel
  >,
];

/** Wave 13 — explanation-structured barrel re-exports confidence and envelope slices. */
type _ExplanationWave13BarrelAliases = [
  AssertExtends<
    import("@/types/explanation-confidence").FindingConfidenceLevel,
    import("@/types/explanation-structured").FindingConfidenceLevel
  >,
  AssertExtends<
    import("@/types/explanation-structured-envelope").StructuredExplanation,
    import("@/types/explanation-structured").StructuredExplanation
  >,
  AssertExtends<
    import("@/types/explanation-confidence").normalizeFindingConfidenceLevel,
    typeof import("@/types/explanation-structured").normalizeFindingConfidenceLevel
  >,
];

/** Wave 14 — governance-stickiness register, disposition, and posture modules. */
type _GovernanceStickinessWave14ModuleAliases = [
  AssertExtends<
    import("@/lib/api/governance-stickiness-register-types").ArchitectureRiskRegisterEntry,
    import("@/lib/api/governance-stickiness-api-types").ArchitectureRiskRegisterEntry
  >,
  AssertExtends<
    import("@/lib/api/governance-stickiness-disposition-types").FindingDispositionKind,
    import("@/lib/api/governance-stickiness-api-types").FindingDispositionKind
  >,
  AssertExtends<
    import("@/lib/api/governance-stickiness-posture-types").ArchitecturePostureSummary,
    import("@/lib/api/governance-stickiness-api-types").ArchitecturePostureSummary
  >,
];

/** Wave 14 — governance-stickiness barrel re-exports register, disposition, and posture slices. */
type _GovernanceStickinessWave14BarrelAliases = [
  AssertExtends<
    import("@/lib/api/governance-stickiness-register-types").ArchitectureDecisionRegisterEntry,
    import("@/lib/api/governance-stickiness-api-types").ArchitectureDecisionRegisterEntry
  >,
  AssertExtends<
    import("@/lib/api/governance-stickiness-disposition-types").RiskExceptionRecord,
    import("@/lib/api/governance-stickiness-api-types").RiskExceptionRecord
  >,
  AssertExtends<
    import("@/lib/api/governance-stickiness-posture-types").ArchitectureReviewRecurrenceSchedule,
    import("@/lib/api/governance-stickiness-api-types").ArchitectureReviewRecurrenceSchedule
  >,
  AssertExtends<
    typeof import("@/lib/api/governance-stickiness-register-types").governanceStickinessBase,
    typeof import("@/lib/api/governance-stickiness-api-types").governanceStickinessBase
  >,
];

/** Wave 14 — health-dashboard ready, detailed, and version modules. */
type _HealthDashboardWave14ModuleAliases = [
  AssertExtends<
    import("@/lib/health-dashboard-ready").HealthReadyResponse,
    import("@/lib/health-dashboard-types").HealthReadyResponse
  >,
  AssertExtends<
    import("@/lib/health-dashboard-detailed").HealthDetailedResponse,
    import("@/lib/health-dashboard-types").HealthDetailedResponse
  >,
  AssertExtends<
    import("@/lib/health-dashboard-version").VersionInfoResponse,
    import("@/lib/health-dashboard-types").VersionInfoResponse
  >,
];

/** Wave 14 — health-dashboard barrel re-exports ready, detailed, and version slices. */
type _HealthDashboardWave14BarrelAliases = [
  AssertExtends<
    import("@/lib/health-dashboard-ready").findHealthReadyEntryByName,
    typeof import("@/lib/health-dashboard-types").findHealthReadyEntryByName
  >,
  AssertExtends<
    import("@/lib/health-dashboard-detailed").parseCircuitGatesFromHealthEntry,
    typeof import("@/lib/health-dashboard-types").parseCircuitGatesFromHealthEntry
  >,
  AssertExtends<
    import("@/lib/health-dashboard-ready").isAzureServiceBusHealthUnhealthy,
    typeof import("@/lib/health-dashboard-types").isAzureServiceBusHealthUnhealthy
  >,
];

/** Wave 14 — AI usage dashboard model-row vs aggregate modules. */
type _AiUsageDashboardModelWave14ModuleAliases = [
  AssertExtends<
    import("@/lib/ai-usage-dashboard-model-row-types").AiUsageActivityRow,
    import("@/lib/ai-usage-dashboard-model-types").AiUsageActivityRow
  >,
  AssertExtends<
    import("@/lib/ai-usage-dashboard-model-aggregate-types").AiUsageDashboardDerived,
    import("@/lib/ai-usage-dashboard-model-types").AiUsageDashboardDerived
  >,
];

/** Wave 14 — AI usage dashboard model barrel re-exports row and aggregate slices. */
type _AiUsageDashboardModelWave14BarrelAliases = [
  AssertExtends<
    import("@/lib/ai-usage-dashboard-model-row-types").AiUsageKpiSummary,
    import("@/lib/ai-usage-dashboard-model-types").AiUsageKpiSummary
  >,
  AssertExtends<
    import("@/lib/ai-usage-dashboard-model-aggregate-types").BuildAiUsageDashboardDerivedInput,
    import("@/lib/ai-usage-dashboard-model-types").BuildAiUsageDashboardDerivedInput
  >,
];

/** Wave 15 — health-dashboard summary tiles and severity-helper modules. */
type _HealthDashboardSummaryWave15ModuleAliases = [
  AssertExtends<
    import("@/lib/health-dashboard-summary-tiles").HealthSummaryTile,
    import("@/lib/health-dashboard-summary").HealthSummaryTile
  >,
  AssertExtends<
    import("@/lib/health-dashboard-summary-severity-helpers").humanizeCircuitGateName,
    typeof import("@/lib/health-dashboard-summary").humanizeCircuitGateName
  >,
];

/** Wave 15 — health-dashboard summary barrel re-exports tiles and severity-helper slices. */
type _HealthDashboardSummaryWave15BarrelAliases = [
  AssertExtends<
    import("@/lib/health-dashboard-summary-tiles").buildHealthSummaryTiles,
    typeof import("@/lib/health-dashboard-summary").buildHealthSummaryTiles
  >,
  AssertExtends<
    import("@/lib/health-dashboard-summary-severity-helpers").circuitSeverity,
    typeof import("@/lib/health-dashboard-summary").circuitSeverity
  >,
];

/** Wave 15 — governance-dashboard summary, lineage, and batch-review modules. */
type _GovernanceDashboardWave15ModuleAliases = [
  AssertExtends<
    components["schemas"]["GovernanceDashboardSummary"],
    import("@/types/governance-dashboard-summary").GovernanceDashboardSummary
  >,
  AssertExtends<
    components["schemas"]["GovernanceLineageResult"],
    import("@/types/governance-dashboard-lineage").GovernanceLineageResult
  >,
  AssertExtends<
    components["schemas"]["GovernanceBatchReviewResponse"],
    import("@/types/governance-dashboard-batch-review").GovernanceBatchReviewResponse
  >,
];

/** Wave 15 — governance-dashboard barrel re-exports summary, lineage, and batch-review slices. */
type _GovernanceDashboardWave15BarrelAliases = [
  AssertExtends<
    import("@/types/governance-dashboard-summary").ComplianceDriftTrendPoint,
    import("@/types/governance-dashboard").ComplianceDriftTrendPoint
  >,
  AssertExtends<
    import("@/types/governance-dashboard-lineage").GovernanceRationaleResult,
    import("@/types/governance-dashboard").GovernanceRationaleResult
  >,
  AssertExtends<
    import("@/types/governance-dashboard-batch-review").GovernanceBatchReviewItemResult,
    import("@/types/governance-dashboard").GovernanceBatchReviewItemResult
  >,
];

/** Wave 15 — operate-rhythm pilot-stickiness, integrations, and alerts modules. */
type _OperateRhythmWave15ModuleAliases = [
  AssertExtends<
    components["schemas"]["OperatorStickinessSnapshotResponse"],
    import("@/types/operate-rhythm-pilot-stickiness").OperatorStickinessSnapshotDto
  >,
  AssertExtends<
    components["schemas"]["TenantIntegrationsOperationsResponse"],
    import("@/types/operate-rhythm-integrations").TenantIntegrationsOperationsDto
  >,
  AssertExtends<
    components["schemas"]["AlertActionLoopResponse"],
    import("@/types/operate-rhythm-alerts").AlertActionLoopDto
  >,
];

/** Wave 15 — operate-rhythm barrel re-exports pilot-stickiness, integrations, and alerts slices. */
type _OperateRhythmWave15BarrelAliases = [
  AssertExtends<
    import("@/types/operate-rhythm-pilot-stickiness").PilotFunnelSnapshotDto,
    import("@/types/operate-rhythm").PilotFunnelSnapshotDto
  >,
  AssertExtends<
    import("@/types/operate-rhythm-integrations").normalizeConnectorSurfaceStatus,
    typeof import("@/types/operate-rhythm").normalizeConnectorSurfaceStatus
  >,
  AssertExtends<
    import("@/types/operate-rhythm-alerts").WeeklyDigestHealthDto,
    import("@/types/operate-rhythm").WeeklyDigestHealthDto
  >,
];

/** Wave 16 — page-help-topic-rows-admin integrations, security, and compose partials. */
type _PageHelpTopicRowsAdminWave16ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/usability/page-help-topic-rows-admin-integrations").PAGE_HELP_TOPIC_ROWS_ADMIN_INTEGRATIONS,
    readonly { prefix: string; topic: import("@/lib/usability/page-help-topic-rows-operator").PageHelpTopic }[]
  >,
  AssertExtends<
    typeof import("@/lib/usability/page-help-topic-rows-admin-security").PAGE_HELP_TOPIC_ROWS_ADMIN_SECURITY,
    readonly { prefix: string; topic: import("@/lib/usability/page-help-topic-rows-operator").PageHelpTopic }[]
  >,
  AssertExtends<
    typeof import("@/lib/usability/page-help-topic-rows-admin-compose").PAGE_HELP_TOPIC_ROWS_ADMIN_COMPOSE,
    readonly { prefix: string; topic: import("@/lib/usability/page-help-topic-rows-operator").PageHelpTopic }[]
  >,
];

/** Wave 16 — page-help-topic-rows-admin barrel composes integrations, security, and compose slices. */
type _PageHelpTopicRowsAdminWave16BarrelAliases = [
  AssertExtends<
    (typeof import("@/lib/usability/page-help-topic-rows-admin-integrations").PAGE_HELP_TOPIC_ROWS_ADMIN_INTEGRATIONS)[number],
    (typeof import("@/lib/usability/page-help-topic-rows-admin").PAGE_HELP_TOPIC_ROWS_ADMIN)[number]
  >,
  AssertExtends<
    (typeof import("@/lib/usability/page-help-topic-rows-admin-security").PAGE_HELP_TOPIC_ROWS_ADMIN_SECURITY)[number],
    (typeof import("@/lib/usability/page-help-topic-rows-admin").PAGE_HELP_TOPIC_ROWS_ADMIN)[number]
  >,
];

/** Wave 16 — first-review-guide state and persistence modules. */
type _FirstReviewGuideWave16ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/first-review-guide-persistence").hasSealedReviewRecord,
    (input: import("@/lib/core-pilot-commit-context").CorePilotCommitContext) => boolean
  >,
  AssertExtends<
    import("@/lib/first-review-guide-state").FirstReviewGuideReadiness,
    import("@/lib/first-review-guide-state").FirstReviewGuideReadiness
  >,
];

/** Wave 16 — first-review-guide-state exports persistence-backed readiness helpers. */
type _FirstReviewGuideWave16BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/first-review-guide-state").resolveFirstReviewGuideReadiness,
    typeof import("@/lib/first-review-guide-state").resolveFirstReviewGuideReadiness
  >,
  AssertExtends<
    typeof import("@/lib/first-review-guide-persistence").hasSealedReviewRecord,
    (input: import("@/lib/core-pilot-commit-context").CorePilotCommitContext) => boolean
  >,
];

/** Wave 16 — connector-operations status and present modules. */
type _ConnectorOperationsWave16ModuleAliases = [
  AssertExtends<
    import("@/lib/connector-operations-status").ConnectorHumanStatus,
    import("@/lib/connector-operations-present").ConnectorHumanStatus
  >,
  AssertExtends<
    typeof import("@/lib/connector-operations-present").resolveConnectorGuidance,
    (connector: import("@/types/operate-rhythm").ConnectorSurfaceStatusDto, humanStatus: import("@/lib/connector-operations-status").ConnectorHumanStatus) => string
  >,
];

/** Wave 16 — connector-operations-present barrel re-exports status slice helpers. */
type _ConnectorOperationsWave16BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/connector-operations-status").resolveConnectorHumanStatus,
    typeof import("@/lib/connector-operations-present").resolveConnectorHumanStatus
  >,
  AssertExtends<
    typeof import("@/lib/connector-operations-present").groupConnectorsByPurpose,
    typeof import("@/lib/connector-operations-present").groupConnectorsByPurpose
  >,
];

/** Wave 17 — first-review-guide state slices export readiness and blocker helpers. */
type _FirstReviewGuideWave17ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/first-review-guide-readiness").resolveFirstReviewGuideReadiness,
    (input: import("@/lib/first-review-guide-status").FirstReviewGuideStateInput) => import("@/lib/first-review-guide-readiness").FirstReviewGuideReadiness
  >,
  AssertExtends<
    typeof import("@/lib/first-review-guide-blockers").resolveFirstReviewGuideRequiredBlockers,
    typeof import("@/lib/first-review-guide-blockers").resolveFirstReviewGuideRequiredBlockers
  >,
  AssertExtends<
    typeof import("@/lib/first-review-guide-status").resolveFirstReviewGuideSteps,
    typeof import("@/lib/first-review-guide-status").resolveFirstReviewGuideSteps
  >,
];

/** Wave 17 — first-review-guide-state barrel re-exports status, readiness, and blocker slices. */
type _FirstReviewGuideWave17BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/first-review-guide-readiness").resolveFirstReviewGuideReadiness,
    typeof import("@/lib/first-review-guide-state").resolveFirstReviewGuideReadiness
  >,
  AssertExtends<
    typeof import("@/lib/first-review-guide-blockers").resolveFirstReviewGuideRequiredBlockers,
    typeof import("@/lib/first-review-guide-state").resolveFirstReviewGuideRequiredBlockers
  >,
  AssertExtends<
    typeof import("@/lib/first-review-guide-status").resolveFirstReviewGuideProgress,
    typeof import("@/lib/first-review-guide-state").resolveFirstReviewGuideProgress
  >,
];

/** Wave 17 — exec-digest schedule form slices. */
type _ExecDigestScheduleFormWave17ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-validation").validateExecDigestRecipientEmails,
    typeof import("@/lib/exec-digest-schedule-validation").validateExecDigestRecipientEmails
  >,
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-options").computeExecDigestNextSendInstant,
    typeof import("@/lib/exec-digest-schedule-options").computeExecDigestNextSendInstant
  >,
  AssertExtends<
    import("@/lib/exec-digest-schedule-form-state").ExecDigestScheduleFormState,
    import("@/lib/exec-digest-schedule-form-state").ExecDigestScheduleFormState
  >,
];

/** Wave 17 — exec-digest-schedule-form barrel re-exports state, options, and validation slices. */
type _ExecDigestScheduleFormWave17BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-form-state").execDigestFormFromPreferences,
    typeof import("@/lib/exec-digest-schedule-form").execDigestFormFromPreferences
  >,
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-options").formatExecDigestNextSendPreview,
    typeof import("@/lib/exec-digest-schedule-form").formatExecDigestNextSendPreview
  >,
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-validation").isExecDigestScheduleFormValid,
    typeof import("@/lib/exec-digest-schedule-form").isExecDigestScheduleFormValid
  >,
];

/** Wave 17 — buyer CTO demo readiness check slices. */
type _BuyerCtoDemoReadinessWave17ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/buyer/buyer-cto-demo-readiness-check-evaluators").evaluateBuyerCtoDemoShellCheck,
    typeof import("@/lib/buyer/buyer-cto-demo-readiness-check-evaluators").evaluateBuyerCtoDemoShellCheck
  >,
  AssertExtends<
    typeof import("@/lib/buyer/buyer-cto-demo-readiness-signals").readinessDetail,
    typeof import("@/lib/buyer/buyer-cto-demo-readiness-signals").readinessDetail
  >,
];

/** Wave 17 — buyer-cto-demo-readiness-checks barrel re-exports evaluators and signals. */
type _BuyerCtoDemoReadinessWave17BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/buyer/buyer-cto-demo-readiness-check-evaluators").evaluateBuyerCtoDemoAuthCheck,
    typeof import("@/lib/buyer/buyer-cto-demo-readiness-checks").evaluateBuyerCtoDemoAuthCheck
  >,
  AssertExtends<
    typeof import("@/lib/buyer/buyer-cto-demo-readiness-signals").isShowcaseStaticSpineReady,
    typeof import("@/lib/buyer/buyer-cto-demo-readiness-checks").isShowcaseStaticSpineReady
  >,
];

/** Wave 17 — approval workflow API slices. */
type _GovernanceWorkflowApiWave17ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/api/governance-workflow-api-dashboard").getGovernanceDashboard,
    typeof import("@/lib/api/governance-workflow-api-dashboard").getGovernanceDashboard
  >,
  AssertExtends<
    typeof import("@/lib/api/governance-workflow-api-approvals").listApprovalRequests,
    typeof import("@/lib/api/governance-workflow-api-approvals").listApprovalRequests
  >,
  AssertExtends<
    typeof import("@/lib/api/governance-workflow-api-environments").fetchGovernanceEnvironmentCatalog,
    typeof import("@/lib/api/governance-workflow-api-environments").fetchGovernanceEnvironmentCatalog
  >,
];

/** Wave 17 — governance-workflow-api barrel re-exports dashboard, approvals, and environment slices. */
type _GovernanceWorkflowApiWave17BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/api/governance-workflow-api-dashboard").getComplianceDriftTrend,
    typeof import("@/lib/api/governance-workflow-api").getComplianceDriftTrend
  >,
  AssertExtends<
    typeof import("@/lib/api/governance-workflow-api-approvals").approveRequest,
    typeof import("@/lib/api/governance-workflow-api").approveRequest
  >,
  AssertExtends<
    typeof import("@/lib/api/governance-workflow-api-environments").activateEnvironment,
    typeof import("@/lib/api/governance-workflow-api").activateEnvironment
  >,
];

/** Wave 17 — alerts routing API slices. */
type _AlertsRoutingApiWave17ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/api/alerts-routing-api-rules").listAlertRules,
    typeof import("@/lib/api/alerts-routing-api-rules").listAlertRules
  >,
  AssertExtends<
    typeof import("@/lib/api/alerts-routing-api-subscriptions").listAlertRoutingSubscriptions,
    typeof import("@/lib/api/alerts-routing-api-subscriptions").listAlertRoutingSubscriptions
  >,
  AssertExtends<
    typeof import("@/lib/api/alerts-routing-api-simulation").simulateAlertRule,
    typeof import("@/lib/api/alerts-routing-api-simulation").simulateAlertRule
  >,
];

/** Wave 17 — alerts-routing-api barrel re-exports rules, subscriptions, and simulation slices. */
type _AlertsRoutingApiWave17BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/api/alerts-routing-api-rules").createCompositeAlertRule,
    typeof import("@/lib/api/alerts-routing-api").createCompositeAlertRule
  >,
  AssertExtends<
    typeof import("@/lib/api/alerts-routing-api-subscriptions").testWebhookSubscription,
    typeof import("@/lib/api/alerts-routing-api").testWebhookSubscription
  >,
  AssertExtends<
    typeof import("@/lib/api/alerts-routing-api-simulation").compareAlertRuleCandidates,
    typeof import("@/lib/api/alerts-routing-api").compareAlertRuleCandidates
  >,
];

/** Wave 17 — ask SSE stream slices. */
type _AskSseStreamWave17ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/api/ask-sse-connect").resolveAskStreamRequest,
    typeof import("@/lib/api/ask-sse-connect").resolveAskStreamRequest
  >,
  AssertExtends<
    typeof import("@/lib/api/ask-sse-demux").consumeSseStream,
    typeof import("@/lib/api/ask-sse-demux").consumeSseStream
  >,
  AssertExtends<
    typeof import("@/lib/api/ask-sse-recovery").askArchLucidStream,
    typeof import("@/lib/api/ask-sse-recovery").askArchLucidStream
  >,
];

/** Wave 17 — ask-sse-stream barrel re-exports connect, demux, and recovery slices. */
type _AskSseStreamWave17BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/api/ask-sse-connect").resolveAskStreamRequest,
    typeof import("@/lib/api/ask-sse-stream").resolveAskStreamRequest
  >,
  AssertExtends<
    typeof import("@/lib/api/ask-sse-demux").consumeSseStream,
    typeof import("@/lib/api/ask-sse-stream").consumeSseStream
  >,
  AssertExtends<
    typeof import("@/lib/api/ask-sse-recovery").askArchLucidStream,
    typeof import("@/lib/api/ask-sse-stream").askArchLucidStream
  >,
];

/** Wave 18 — artifact review helper slices. */
type _ArtifactReviewWave18ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/artifact-review-view-kind").classifyArtifactView,
    typeof import("@/lib/artifact-review-view-kind").classifyArtifactView
  >,
  AssertExtends<
    typeof import("@/lib/artifact-review-labels").getArtifactDisplayLabel,
    typeof import("@/lib/artifact-review-labels").getArtifactDisplayLabel
  >,
  AssertExtends<
    typeof import("@/lib/artifact-review-audience").sponsorArtifactAudienceBucket,
    typeof import("@/lib/artifact-review-audience").sponsorArtifactAudienceBucket
  >,
];

/** Wave 18 — artifact-review-helpers barrel re-exports view-kind, labels, and audience slices. */
type _ArtifactReviewWave18BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/artifact-review-view-kind").prepareArtifactBodyText,
    typeof import("@/lib/artifact-review-helpers").prepareArtifactBodyText
  >,
  AssertExtends<
    typeof import("@/lib/artifact-review-labels").getArtifactTypeLabel,
    typeof import("@/lib/artifact-review-helpers").getArtifactTypeLabel
  >,
  AssertExtends<
    typeof import("@/lib/artifact-review-audience").sponsorArtifactOpenActionLabel,
    typeof import("@/lib/artifact-review-helpers").sponsorArtifactOpenActionLabel
  >,
];

/** Wave 18 — architecture risk register page slices. */
type _ArchitectureRiskRegisterWave18ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/architecture/architecture-risk-register-copy").ARCHITECTURE_RISK_REGISTER_PAGE_TITLE,
    typeof import("@/lib/architecture/architecture-risk-register-copy").ARCHITECTURE_RISK_REGISTER_PAGE_TITLE
  >,
  AssertExtends<
    typeof import("@/lib/architecture/architecture-risk-register-filters").matchesRiskRegisterFilter,
    typeof import("@/lib/architecture/architecture-risk-register-filters").matchesRiskRegisterFilter
  >,
  AssertExtends<
    typeof import("@/lib/architecture/architecture-risk-register-summary").computeArchitectureRiskRegisterSummary,
    typeof import("@/lib/architecture/architecture-risk-register-summary").computeArchitectureRiskRegisterSummary
  >,
];

/** Wave 18 — architecture-risk-register-page barrel re-exports copy, filters, and summary slices. */
type _ArchitectureRiskRegisterWave18BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/architecture/architecture-risk-register-copy").ARCHITECTURE_RISK_REGISTER_GLOSSARY,
    typeof import("@/lib/architecture/architecture-risk-register-page").ARCHITECTURE_RISK_REGISTER_GLOSSARY
  >,
  AssertExtends<
    typeof import("@/lib/architecture/architecture-risk-register-filters").riskRegisterFilterFromQuery,
    typeof import("@/lib/architecture/architecture-risk-register-page").riskRegisterFilterFromQuery
  >,
  AssertExtends<
    typeof import("@/lib/architecture/architecture-risk-register-summary").computeArchitectureRiskRegisterSummary,
    typeof import("@/lib/architecture/architecture-risk-register-page").computeArchitectureRiskRegisterSummary
  >,
];

/** Wave 18 — exec digest schedule page model slices. */
type _ExecDigestSchedulePageWave18ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-status").resolveExecDigestStatus,
    typeof import("@/lib/exec-digest-schedule-status").resolveExecDigestStatus
  >,
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-readiness").buildExecDigestDeliveryReadiness,
    typeof import("@/lib/exec-digest-schedule-readiness").buildExecDigestDeliveryReadiness
  >,
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-copy").EXEC_DIGEST_PRODUCT_INTRO,
    typeof import("@/lib/exec-digest-schedule-copy").EXEC_DIGEST_PRODUCT_INTRO
  >,
];

/** Wave 18 — exec-digest-schedule-page-model barrel re-exports status, readiness, and copy slices. */
type _ExecDigestSchedulePageWave18BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-status").formatExecDigestNextSendLabel,
    typeof import("@/lib/exec-digest-schedule-page-model").formatExecDigestNextSendLabel
  >,
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-readiness").resolveExecDigestOutboundEmailStatus,
    typeof import("@/lib/exec-digest-schedule-page-model").resolveExecDigestOutboundEmailStatus
  >,
  AssertExtends<
    typeof import("@/lib/exec-digest-schedule-copy").EXEC_DIGEST_READ_ONLY,
    typeof import("@/lib/exec-digest-schedule-page-model").EXEC_DIGEST_READ_ONLY
  >,
];

/** Wave 18 — downloads blob trigger API slices. */
type _DownloadsBlobTriggerWave18ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/api/downloads-blob-trigger-browser").fetchBrowserDownload,
    typeof import("@/lib/api/downloads-blob-trigger-browser").fetchBrowserDownload
  >,
  AssertExtends<
    typeof import("@/lib/api/downloads-blob-trigger-terraform").downloadTerraformAdvisoryExportZip,
    typeof import("@/lib/api/downloads-blob-trigger-terraform").downloadTerraformAdvisoryExportZip
  >,
  AssertExtends<
    typeof import("@/lib/api/downloads-blob-trigger-reports").downloadFirstValueReportPdf,
    typeof import("@/lib/api/downloads-blob-trigger-reports").downloadFirstValueReportPdf
  >,
];

/** Wave 18 — downloads-blob-trigger barrel re-exports browser, terraform, and reports slices. */
type _DownloadsBlobTriggerWave18BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/api/downloads-blob-trigger-browser").triggerBrowserBlobDownload,
    typeof import("@/lib/api/downloads-blob-trigger").triggerBrowserBlobDownload
  >,
  AssertExtends<
    typeof import("@/lib/api/downloads-blob-trigger-terraform").downloadTerraformAdvisoryExportZip,
    typeof import("@/lib/api/downloads-blob-trigger").downloadTerraformAdvisoryExportZip
  >,
  AssertExtends<
    typeof import("@/lib/api/downloads-blob-trigger-reports").downloadBoardPackPdf,
    typeof import("@/lib/api/downloads-blob-trigger").downloadBoardPackPdf
  >,
];

/** Wave 18 — ITSM outbound connections API slices. */
type _ItsmOutboundConnectionsWave18ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/api/itsm-outbound-connections-health").fetchItsmIntegrationHealth,
    typeof import("@/lib/api/itsm-outbound-connections-health").fetchItsmIntegrationHealth
  >,
  AssertExtends<
    typeof import("@/lib/api/itsm-outbound-connections-settings").fetchTenantItsmOutboundSettings,
    typeof import("@/lib/api/itsm-outbound-connections-settings").fetchTenantItsmOutboundSettings
  >,
  AssertExtends<
    typeof import("@/lib/api/itsm-outbound-connections-oauth").startItsmAtlassianOAuthConsent,
    typeof import("@/lib/api/itsm-outbound-connections-oauth").startItsmAtlassianOAuthConsent
  >,
];

/** Wave 18 — itsm-outbound-connections barrel re-exports health, settings, and oauth slices. */
type _ItsmOutboundConnectionsWave18BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/api/itsm-outbound-connections-health").probeItsmIntegrationHealth,
    typeof import("@/lib/api/itsm-outbound-connections").probeItsmIntegrationHealth
  >,
  AssertExtends<
    typeof import("@/lib/api/itsm-outbound-connections-settings").upsertTenantItsmConnectorConnection,
    typeof import("@/lib/api/itsm-outbound-connections").upsertTenantItsmConnectorConnection
  >,
  AssertExtends<
    typeof import("@/lib/api/itsm-outbound-connections-oauth").completeItsmAtlassianOAuthConsent,
    typeof import("@/lib/api/itsm-outbound-connections").completeItsmAtlassianOAuthConsent
  >,
];

/** Wave 18 — policy packs API slices. */
type _PolicyPacksApiWave18ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/api/policy-packs-api-catalog").listPolicyPacks,
    typeof import("@/lib/api/policy-packs-api-catalog").listPolicyPacks
  >,
  AssertExtends<
    typeof import("@/lib/api/policy-packs-api-mutate").createPolicyPack,
    typeof import("@/lib/api/policy-packs-api-mutate").createPolicyPack
  >,
  AssertExtends<
    typeof import("@/lib/api/policy-packs-api-assign").assignPolicyPack,
    typeof import("@/lib/api/policy-packs-api-assign").assignPolicyPack
  >,
];

/** Wave 18 — policy-packs-api barrel re-exports catalog, mutate, and assign slices. */
type _PolicyPacksApiWave18BarrelAliases = [
  AssertExtends<
    typeof import("@/lib/api/policy-packs-api-catalog").getEffectivePolicyPacks,
    typeof import("@/lib/api/policy-packs-api").getEffectivePolicyPacks
  >,
  AssertExtends<
    typeof import("@/lib/api/policy-packs-api-mutate").dryRunPolicyPack,
    typeof import("@/lib/api/policy-packs-api").dryRunPolicyPack
  >,
  AssertExtends<
    typeof import("@/lib/api/policy-packs-api-assign").setPolicyPackAssignmentEnabled,
    typeof import("@/lib/api/policy-packs-api").setPolicyPackAssignmentEnabled
  >,
];

/** Wave 19 — recommendation-learning-operational type slices. */
type _RecommendationLearningOperationalWave19ModuleAliases = [
  AssertExtends<
    import("@/types/recommendation-learning-operational-profile-metadata").RecommendationLearningProfileMetadata,
    import("@/types/recommendation-learning-operational").RecommendationLearningProfileMetadata
  >,
  AssertExtends<
    import("@/types/recommendation-learning-operational-operational-status").RecommendationLearningOperationalStatus,
    import("@/types/recommendation-learning-operational").RecommendationLearningOperationalStatus
  >,
  AssertExtends<
    import("@/types/recommendation-learning-operational-preview-validation").RecommendationLearningPreview,
    import("@/types/recommendation-learning-operational").RecommendationLearningPreview
  >,
];

/** Wave 19 — recommendation-learning-operational barrel re-exports profile, status, and preview slices. */
type _RecommendationLearningOperationalWave19BarrelAliases = [
  AssertExtends<
    import("@/types/recommendation-learning-operational-profile-metadata").RECOMMENDATION_LEARNING_CANONICAL_PATH,
    typeof import("@/types/recommendation-learning-operational").RECOMMENDATION_LEARNING_CANONICAL_PATH
  >,
  AssertExtends<
    import("@/types/recommendation-learning-operational-operational-status").RecommendationLearningOutcomeEligibility,
    import("@/types/recommendation-learning-operational").RecommendationLearningOutcomeEligibility
  >,
  AssertExtends<
    import("@/types/recommendation-learning-operational-preview-validation").RecommendationLearningRollbackRequest,
    import("@/types/recommendation-learning-operational").RecommendationLearningRollbackRequest
  >,
];

/** Wave 19 — advisory type slices. */
type _AdvisoryWave19ModuleAliases = [
  AssertExtends<
    import("@/types/advisory-improvement-plan").ImprovementPlan,
    import("@/types/advisory").ImprovementPlan
  >,
  AssertExtends<
    import("@/types/advisory-recommendation-record").RecommendationRecord,
    import("@/types/advisory").RecommendationRecord
  >,
  AssertExtends<
    import("@/types/advisory-action-result").RecommendationActionResult,
    import("@/types/advisory").RecommendationActionResult
  >,
];

/** Wave 19 — advisory barrel re-exports improvement-plan, recommendation-record, and action-result slices. */
type _AdvisoryWave19BarrelAliases = [
  AssertExtends<
    import("@/types/advisory-improvement-plan").ImprovementRecommendation,
    import("@/types/advisory").ImprovementRecommendation
  >,
  AssertExtends<
    import("@/types/advisory-recommendation-record").AdvisoryRunRecommendationsList,
    import("@/types/advisory").AdvisoryRunRecommendationsList
  >,
  AssertExtends<
    import("@/types/advisory-recommendation-record").RecommendationImproveLoopEvidence,
    import("@/types/advisory").RecommendationImproveLoopEvidence
  >,
];

/** Wave 19 — agent-forensics-scores type slices. */
type _AgentForensicsScoresWave19ModuleAliases = [
  AssertExtends<
    import("@/types/agent-forensics-scores-semantic").AgentOutputSemanticScoreRow,
    import("@/types/agent-forensics-scores").AgentOutputSemanticScoreRow
  >,
  AssertExtends<
    import("@/types/agent-forensics-scores-evaluation-summary").AgentOutputEvaluationSummaryPayload,
    import("@/types/agent-forensics-scores").AgentOutputEvaluationSummaryPayload
  >,
  AssertExtends<
    import("@/types/agent-forensics-scores-retrieval-grounding").RunRetrievalGroundingPayload,
    import("@/types/agent-forensics-scores").RunRetrievalGroundingPayload
  >,
];

/** Wave 19 — agent-forensics-scores barrel re-exports semantic, evaluation-summary, and retrieval-grounding slices. */
type _AgentForensicsScoresWave19BarrelAliases = [
  AssertExtends<
    import("@/types/agent-forensics-scores-evaluation-summary").AgentOutputEvaluationScoreRow,
    import("@/types/agent-forensics-scores").AgentOutputEvaluationScoreRow
  >,
  AssertExtends<
    import("@/types/agent-forensics-scores-evaluation-summary").AgentOutputEvaluationPerspectivePayload,
    import("@/types/agent-forensics-scores").AgentOutputEvaluationPerspectivePayload
  >,
  AssertExtends<
    import("@/types/agent-forensics-scores-retrieval-grounding").RunRetrievalGroundingRow,
    import("@/types/agent-forensics-scores").RunRetrievalGroundingRow
  >,
];

/** Wave 20 — copy-finding-as-work-item module slices. */
type _CopyFindingAsWorkItemWave20ModuleAliases = [
  AssertExtends<
    import("@/lib/copy-finding-as-work-item-types").WorkItemClipboardFormat,
    import("@/lib/copy-finding-as-work-item").WorkItemClipboardFormat
  >,
  AssertExtends<
    import("@/lib/copy-finding-as-work-item-trace-row").buildTraceRowWorkItemBody,
    typeof import("@/lib/copy-finding-as-work-item").buildTraceRowWorkItemBody
  >,
  AssertExtends<
    import("@/lib/copy-finding-as-work-item-inspect").buildInspectFindingWorkItemBody,
    typeof import("@/lib/copy-finding-as-work-item").buildInspectFindingWorkItemBody
  >,
];

/** Wave 20 — copy-finding-as-work-item barrel re-exports types, trace-row, and inspect slices. */
type _CopyFindingAsWorkItemWave20BarrelAliases = [
  AssertExtends<
    import("@/lib/copy-finding-as-work-item-types").FindingWorkItemBuildInput,
    import("@/lib/copy-finding-as-work-item").FindingWorkItemBuildInput
  >,
  AssertExtends<
    import("@/lib/copy-finding-as-work-item-types").TraceRowWorkItemInput,
    import("@/lib/copy-finding-as-work-item").TraceRowWorkItemInput
  >,
  AssertExtends<
    import("@/lib/copy-finding-as-work-item-types").writeWorkItemBodyToClipboard,
    typeof import("@/lib/copy-finding-as-work-item").writeWorkItemBodyToClipboard
  >,
];

/** Wave 20 — architecture-draft-structured-brief-suggestions module slices. */
type _ArchitectureDraftStructuredBriefSuggestionsWave20ModuleAliases = [
  AssertExtends<
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions-source-text").buildArchitectureDraftSuggestionSourceText,
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions").buildArchitectureDraftSuggestionSourceText
  >,
  AssertExtends<
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions-apply").applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse,
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions").applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse
  >,
  AssertExtends<
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions-extract").buildDeterministicStructuredBriefSuggestionsFromText,
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions").buildDeterministicStructuredBriefSuggestionsFromText
  >,
];

/** Wave 20 — architecture-draft-structured-brief-suggestions barrel re-exports source-text, apply, and extract slices. */
type _ArchitectureDraftStructuredBriefSuggestionsWave20BarrelAliases = [
  AssertExtends<
    import("@/lib/architecture/architecture-draft-structured-brief-suggestions-apply").ApplyArchitectureDraftStructuredBriefSuggestionsResult,
    import("@/lib/architecture/architecture-draft-structured-brief-suggestions").ApplyArchitectureDraftStructuredBriefSuggestionsResult
  >,
  AssertExtends<
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions-extract").extractFailureModeSuggestionFromText,
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions").extractFailureModeSuggestionFromText
  >,
  AssertExtends<
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions-apply").hasArchitectureContextForFailureModeSuggestion,
    typeof import("@/lib/architecture/architecture-draft-structured-brief-suggestions").hasArchitectureContextForFailureModeSuggestion
  >,
];

/** Wave 20 — adr-from-run module slices. */
type _AdrFromRunWave20ModuleAliases = [
  AssertExtends<
    import("@/lib/adr-from-run-slices").AdrGeneratorRunInput,
    import("@/lib/adr-from-run").AdrGeneratorRunInput
  >,
  AssertExtends<
    typeof import("@/lib/adr-from-run-mappers").buildAdrExplanationSlice,
    typeof import("@/lib/adr-from-run").buildAdrExplanationSlice
  >,
  AssertExtends<
    typeof import("@/lib/adr-from-run-markdown").buildMadrMarkdownFromRun,
    typeof import("@/lib/adr-from-run").buildMadrMarkdownFromRun
  >,
];

/** Wave 20 — adr-from-run barrel re-exports slices, mappers, and markdown compose. */
type _AdrFromRunWave20BarrelAliases = [
  AssertExtends<
    import("@/lib/adr-from-run-slices").AdrGeneratorExplanationSlice,
    import("@/lib/adr-from-run").AdrGeneratorExplanationSlice
  >,
  AssertExtends<
    typeof import("@/lib/adr-from-run-mappers").buildAdrGeneratorRunInput,
    typeof import("@/lib/adr-from-run").buildAdrGeneratorRunInput
  >,
  AssertExtends<
    import("@/lib/adr-from-run-slices").AdrGeneratorFindingSlice,
    import("@/lib/adr-from-run").AdrGeneratorFindingSlice
  >,
];

/** Wave 12 — authority run-detail trust-evidence module. */
type _AuthorityRunDetailWave12TrustModuleAliases = [
  AssertExtends<
    components["schemas"]["TrustEvidenceFieldSnapshot"],
    import("@/types/authority-run-detail-trust").TrustEvidenceFieldSnapshot
  >,
  AssertExtends<
    components["schemas"]["RunTrustEvidenceRouteRef"],
    import("@/types/authority-run-detail-trust").RunTrustEvidenceRouteRef
  >,
  AssertExtends<
    components["schemas"]["RunTrustEvidenceTopFindingRow"],
    import("@/types/authority-run-detail-trust").RunTrustEvidenceTopFindingRow
  >,
  AssertExtends<
    components["schemas"]["RunTrustEvidenceCard"],
    import("@/types/authority-run-detail-trust").RunTrustEvidenceCard
  >,
  AssertExtends<
    components["schemas"]["RunRetrievalGroundingSummaryDto"],
    import("@/types/authority-run-detail-trust").RunRetrievalGroundingSummary
  >,
];

/** Wave 12 — authority run-detail provenance and pipeline timeline module. */
type _AuthorityRunDetailWave12ProvenanceModuleAliases = [
  AssertExtends<
    components["schemas"]["ProvenanceNode"],
    import("@/types/authority-run-detail-provenance").ProvenanceNode
  >,
  AssertExtends<
    components["schemas"]["ProvenanceEdge"],
    import("@/types/authority-run-detail-provenance").ProvenanceEdge
  >,
  AssertExtends<
    components["schemas"]["DecisionProvenanceGraph"],
    import("@/types/authority-run-detail-provenance").DecisionProvenanceGraph
  >,
  AssertExtends<
    components["schemas"]["RunPipelineTimelineItemResponse"],
    import("@/types/authority-run-detail-provenance").PipelineTimelineItem
  >,
];

/** Wave 12 — authority run-detail barrel re-exports trust and provenance slices. */
type _AuthorityRunDetailWave12BarrelAliases = [
  AssertExtends<
    import("@/types/authority-run-detail-trust").RunTrustEvidenceCard,
    import("@/types/authority-run-detail").RunTrustEvidenceCard
  >,
  AssertExtends<
    import("@/types/authority-run-detail-provenance").ProvenanceNode,
    import("@/types/authority-run-detail").ProvenanceNode
  >,
  AssertExtends<
    import("@/types/authority-run-detail-provenance").PipelineTimelineItem,
    import("@/types/authority-run-detail").PipelineTimelineItem
  >,
];

/** Barrel re-exports preserve the public `@/types/authority` import surface. */
type _AuthorityBarrelWave11Aliases = [
  AssertExtends<import("@/types/authority-run-summary").RunSummary, import("@/types/authority").RunSummary>,
  AssertExtends<import("@/types/authority-manifest").ManifestSummary, import("@/types/authority").ManifestSummary>,
  AssertExtends<import("@/types/authority-run-detail").RunDetail, import("@/types/authority").RunDetail>,
];

/** Wave 10 — run-detail wire shapes while OpenAPI `AgentResult` snapshot stays `{}`. */
type _AuthorityRunDetailWave10Aliases = [
  AssertExtends<
    Pick<components["schemas"]["Finding"], "category" | "findingId" | "severity">,
    import("@/types/authority-run-detail-wire").RunDetailAgentFinding
  >,
  AssertExtends<
    components["schemas"]["RunRetrievalGroundingSummaryDto"],
    import("@/types/authority-run-detail").RunRetrievalGroundingSummary
  >,
];

type _OperateRhythmAliases = [
  AssertExtends<
    components["schemas"]["PilotFunnelSnapshotResponse"],
    import("@/types/operate-rhythm").PilotFunnelSnapshotDto
  >,
  AssertExtends<
    components["schemas"]["OperatorStickinessSnapshotResponse"],
    import("@/types/operate-rhythm").OperatorStickinessSnapshotDto
  >,
  AssertExtends<
    components["schemas"]["ConnectorSurfaceStatusResponse"],
    import("@/types/operate-rhythm").ConnectorSurfaceStatusDto
  >,
  AssertExtends<
    components["schemas"]["IntegrationEventBusStatusResponse"],
    import("@/types/operate-rhythm").IntegrationEventBusStatusDto
  >,
  AssertExtends<
    components["schemas"]["TenantIntegrationsOperationsResponse"],
    import("@/types/operate-rhythm").TenantIntegrationsOperationsDto
  >,
  AssertExtends<
    components["schemas"]["WeeklyDigestHealthResponse"],
    import("@/types/operate-rhythm").WeeklyDigestHealthDto
  >,
  AssertExtends<
    components["schemas"]["AlertActionLoopResponse"],
    import("@/types/operate-rhythm").AlertActionLoopDto
  >,
  AssertExtends<
    components["schemas"]["AlertDeliveryAttemptResponse"],
    import("@/types/operate-rhythm").AlertDeliveryAttemptDto
  >,
];

type _TechnologyLedgerAliases = [
  AssertExtends<components["schemas"]["TechnologyLedgerRole"], import("@/types/technology-ledger").TechnologyLedgerRole>,
  AssertExtends<
    components["schemas"]["TechnologyLedgerStatus"],
    import("@/types/technology-ledger").TechnologyLedgerStatus
  >,
  AssertExtends<
    components["schemas"]["TechnologyLedgerSource"],
    import("@/types/technology-ledger").TechnologyLedgerSource
  >,
  AssertExtends<components["schemas"]["CloudProvider"], import("@/types/technology-ledger").CloudProviderFamily>,
  AssertExtends<
    components["schemas"]["TechnologyLedgerEntryResponse"],
    import("@/types/technology-ledger").TechnologyLedgerEntry
  >,
  AssertExtends<
    components["schemas"]["TechnologyLedgerListResponse"],
    import("@/types/technology-ledger").TechnologyLedgerListResponse
  >,
  AssertExtends<
    components["schemas"]["PatchTechnologyLedgerEntryRequest"],
    import("@/types/technology-ledger").PatchTechnologyLedgerEntryRequest
  >,
  AssertExtends<
    components["schemas"]["PatchTechnologyLedgerEntryResponse"],
    import("@/types/technology-ledger").PatchTechnologyLedgerEntryResponse
  >,
];

type _AlertsAliases = [
  AssertExtends<components["schemas"]["AlertRule"], import("@/types/alerts").AlertRule>,
  AssertExtends<components["schemas"]["AlertRecord"], import("@/types/alerts").AlertRecord>,
];

type _AdvisoryAliases = [
  AssertExtends<
    components["schemas"]["ImprovementRecommendationResponse"],
    import("@/types/advisory").ImprovementRecommendation
  >,
  AssertExtends<components["schemas"]["ImprovementPlanResponse"], import("@/types/advisory").ImprovementPlan>,
  AssertExtends<
    components["schemas"]["RecommendationRecordResponse"],
    import("@/types/advisory").RecommendationRecord
  >,
  AssertExtends<
    components["schemas"]["RecommendationSourceEvidenceLink"],
    import("@/types/advisory").RecommendationSourceEvidenceLink
  >,
  AssertExtends<
    components["schemas"]["RecommendationImproveLoopEvidenceResponse"],
    import("@/types/advisory").RecommendationImproveLoopEvidence
  >,
  AssertExtends<
    components["schemas"]["RecommendationActionResponse"],
    import("@/types/advisory").RecommendationActionResult
  >,
  AssertExtends<
    components["schemas"]["AdvisoryRunRecommendationsListResponse"],
    import("@/types/advisory").AdvisoryRunRecommendationsList
  >,
];

type _GovernanceWorkflowAliases = [
  AssertExtends<
    components["schemas"]["GovernanceApprovalRequest"],
    import("@/types/governance-workflow").GovernanceApprovalRequest
  >,
  AssertExtends<
    components["schemas"]["GovernancePromotionRecord"],
    import("@/types/governance-workflow").GovernancePromotionRecord
  >,
  AssertExtends<
    components["schemas"]["GovernanceEnvironmentActivation"],
    import("@/types/governance-workflow").GovernanceEnvironmentActivation
  >,
];

type _DigestSubscriptionAliases = [
  AssertExtends<
    components["schemas"]["DigestSubscription"],
    import("@/types/digest-subscriptions").DigestSubscription
  >,
  AssertExtends<
    components["schemas"]["DigestDeliveryAttempt"],
    import("@/types/digest-subscriptions").DigestDeliveryAttempt
  >,
];

type _ConversationAliases = [
  AssertExtends<components["schemas"]["ConversationThread"], import("@/types/conversation").ConversationThread>,
  AssertExtends<components["schemas"]["ConversationMessage"], import("@/types/conversation").ConversationMessage>,
  AssertExtends<components["schemas"]["AskResponse"], import("@/types/conversation").AskResponse>,
];

type _PolicyPackAliases = [
  AssertExtends<components["schemas"]["PolicyPack"], import("@/types/policy-packs").PolicyPack>,
  AssertExtends<components["schemas"]["PolicyPackVersion"], import("@/types/policy-packs").PolicyPackVersion>,
  AssertExtends<components["schemas"]["PolicyPackAssignment"], import("@/types/policy-packs").PolicyPackAssignment>,
  AssertExtends<components["schemas"]["ResolvedPolicyPack"], import("@/types/policy-packs").ResolvedPolicyPack>,
  AssertExtends<components["schemas"]["EffectivePolicyPackSet"], import("@/types/policy-packs").EffectivePolicyPackSet>,
  AssertExtends<
    components["schemas"]["PolicyPackContentDocument"],
    import("@/types/policy-packs").PolicyPackContentDocument
  >,
  AssertExtends<components["schemas"]["ElicitationQuestionTier"], import("@/types/policy-packs").ElicitationQuestionTier>,
  AssertExtends<components["schemas"]["ElicitationAnswerKind"], import("@/types/policy-packs").ElicitationAnswerKind>,
  AssertExtends<components["schemas"]["ElicitationQuestion"], import("@/types/policy-packs").ElicitationQuestion>,
  AssertExtends<
    components["schemas"]["PolicyPackCatalogListItem"],
    import("@/types/policy-packs").PolicyPackCatalogListItem
  >,
  AssertExtends<
    components["schemas"]["PolicyPackCatalogEntryDetail"],
    import("@/types/policy-packs").PolicyPackCatalogEntryDetail
  >,
  AssertExtends<
    components["schemas"]["PolicyPackWorkspaceSelectionItem"],
    import("@/types/policy-packs").PolicyPackWorkspaceSelectionItem
  >,
];

type _GraphAliases = [
  AssertExtends<components["schemas"]["GraphNodeVm"], import("@/types/graph").GraphNodeVm>,
  AssertExtends<components["schemas"]["GraphEdgeVm"], import("@/types/graph").GraphEdgeVm>,
  AssertExtends<components["schemas"]["GraphNodesPageResponse"], import("@/types/graph").GraphNodesPageResponse>,
  AssertExtends<components["schemas"]["GraphViewModel"], import("@/types/graph").GraphViewModel>,
];

type _ComparisonAliases = [
  AssertExtends<components["schemas"]["DecisionDelta"], import("@/types/comparison").DecisionDelta>,
  AssertExtends<components["schemas"]["RequirementDelta"], import("@/types/comparison").RequirementDelta>,
  AssertExtends<components["schemas"]["SecurityDelta"], import("@/types/comparison").SecurityDelta>,
  AssertExtends<components["schemas"]["TopologyDelta"], import("@/types/comparison").TopologyDelta>,
  AssertExtends<components["schemas"]["CostDelta"], import("@/types/comparison").CostDelta>,
  AssertExtends<components["schemas"]["ComparisonResult"], import("@/types/comparison").GoldenManifestComparison>,
];

type _FindingInspectAliases = [
  AssertExtends<
    components["schemas"]["FindingInspectEvidenceItem"],
    import("@/types/finding-inspect").FindingInspectEvidence
  >,
  AssertExtends<components["schemas"]["FindingInspectResponse"], import("@/types/finding-inspect").FindingInspectPayload>,
];

type _LearningAliases = [
  AssertExtends<components["schemas"]["LearningThemeResponse"], import("@/types/learning").LearningThemeResponse>,
  AssertExtends<components["schemas"]["LearningThemesListResponse"], import("@/types/learning").LearningThemesListResponse>,
  AssertExtends<
    components["schemas"]["LearningPlanListItemResponse"],
    import("@/types/learning").LearningPlanListItemResponse
  >,
  AssertExtends<components["schemas"]["LearningPlansListResponse"], import("@/types/learning").LearningPlansListResponse>,
  AssertExtends<components["schemas"]["LearningSummaryResponse"], import("@/types/learning").LearningSummaryResponse>,
  AssertExtends<components["schemas"]["LearningPlanStepResponse"], import("@/types/learning").LearningPlanStepResponse>,
  AssertExtends<
    components["schemas"]["LearningPlanEvidenceCountsResponse"],
    import("@/types/learning").LearningPlanEvidenceCountsResponse
  >,
  AssertExtends<components["schemas"]["LearningPlanDetailResponse"], import("@/types/learning").LearningPlanDetailResponse>,
];

type _EvolutionAliases = [
  AssertExtends<
    components["schemas"]["EvolutionCandidateChangeSetResponse"],
    import("@/types/evolution").EvolutionCandidateChangeSetResponse
  >,
  AssertExtends<
    components["schemas"]["EvolutionCandidateChangeSetListResponse"],
    import("@/types/evolution").EvolutionCandidateChangeSetListResponse
  >,
  AssertExtends<components["schemas"]["EvaluationScoreResponse"], import("@/types/evolution").EvaluationScoreResponse>,
  AssertExtends<
    components["schemas"]["EvolutionSimulationRunWithEvaluationResponse"],
    import("@/types/evolution").EvolutionSimulationRunWithEvaluationResponse
  >,
  AssertExtends<components["schemas"]["EvolutionResultsResponse"], import("@/types/evolution").EvolutionResultsResponse>,
  AssertExtends<components["schemas"]["EvolutionSimulateResponse"], import("@/types/evolution").EvolutionSimulateResponse>,
];

type _AlertTuningAliases = [
  AssertExtends<components["schemas"]["ThresholdCandidate"], import("@/types/alert-tuning").ThresholdCandidate>,
  AssertExtends<components["schemas"]["NoiseScoreBreakdown"], import("@/types/alert-tuning").NoiseScoreBreakdown>,
  AssertExtends<
    components["schemas"]["ThresholdCandidateEvaluation"],
    import("@/types/alert-tuning").ThresholdCandidateEvaluation
  >,
  AssertExtends<
    components["schemas"]["ThresholdRecommendationResult"],
    import("@/types/alert-tuning").ThresholdRecommendationResult
  >,
];

type _CompositeAlertRuleAliases = [
  AssertExtends<
    components["schemas"]["AlertRuleCondition"],
    import("@/types/composite-alert-rules").CompositeAlertRuleCondition
  >,
  AssertExtends<components["schemas"]["CompositeAlertRule"], import("@/types/composite-alert-rules").CompositeAlertRule>,
];

type _DraftIntakeAliases = [
  AssertExtends<components["schemas"]["DraftRequestStatus"], import("@/types/draft-intake").DraftRequestStatus>,
  AssertExtends<components["schemas"]["ActorKind"], import("@/types/draft-intake").ActorKind>,
  AssertExtends<components["schemas"]["TrustOrigin"], import("@/types/draft-intake").TrustOrigin>,
  AssertExtends<components["schemas"]["InteractionContract"], import("@/types/draft-intake").InteractionContract>,
  AssertExtends<components["schemas"]["ActorOrigin"], import("@/types/draft-intake").ActorOrigin>,
  AssertExtends<
    components["schemas"]["DraftBranchOverrideKind"],
    import("@/types/draft-intake").DraftBranchOverrideKind
  >,
  AssertExtends<components["schemas"]["BranchDraftRequest"], import("@/types/draft-intake").BranchDraftRequest>,
  AssertExtends<
    components["schemas"]["DraftBranchQuotaResponse"],
    import("@/types/draft-intake").DraftBranchQuotaResponse
  >,
  AssertExtends<components["schemas"]["CreateDraftRequest"], import("@/types/draft-intake").CreateDraftRequest>,
  AssertExtends<components["schemas"]["PatchDraftRequest"], import("@/types/draft-intake").PatchDraftRequest>,
  AssertExtends<
    components["schemas"]["DraftIntakeReasonRequest"],
    import("@/types/draft-intake").DraftIntakeReasonRequest
  >,
];

type _StageTimelineAliases = [
  AssertExtends<components["schemas"]["StageTimelineSummary"], import("@/types/stage-timeline").StageTimelineSummary>,
];

type _RecommendationLearningOperationalAliases = [
  AssertExtends<
    components["schemas"]["RecommendationLearningProfileState"],
    import("@/types/recommendation-learning-operational").RecommendationLearningProfileState
  >,
  AssertExtends<
    components["schemas"]["RecommendationLearningOutcomeEligibilityBreakdown"],
    import("@/types/recommendation-learning-operational").RecommendationLearningOutcomeEligibility
  >,
  AssertExtends<
    components["schemas"]["RecommendationLearningProfileMetadataResponse"],
    import("@/types/recommendation-learning-operational").RecommendationLearningProfileMetadata
  >,
  AssertExtends<
    components["schemas"]["RecommendationLearningOperationalStatusResponse"],
    import("@/types/recommendation-learning-operational").RecommendationLearningOperationalStatus
  >,
  AssertExtends<
    components["schemas"]["RecommendationLearningValidationCheck"],
    import("@/types/recommendation-learning-operational").RecommendationLearningValidationCheck
  >,
  AssertExtends<
    components["schemas"]["RecommendationLearningWeightDelta"],
    import("@/types/recommendation-learning-operational").RecommendationLearningWeightDelta
  >,
  AssertExtends<
    components["schemas"]["RecommendationLearningProfile"],
    import("@/types/recommendation-learning-operational").LearningProfile
  >,
  AssertExtends<
    components["schemas"]["RecommendationLearningPreviewResponse"],
    import("@/types/recommendation-learning-operational").RecommendationLearningPreview
  >,
  AssertExtends<
    components["schemas"]["RecommendationLearningProfileHistoryItem"],
    import("@/types/recommendation-learning-operational").RecommendationLearningProfileHistoryItem
  >,
  AssertExtends<
    components["schemas"]["RecommendationLearningRollbackRequest"],
    import("@/types/recommendation-learning-operational").RecommendationLearningRollbackRequest
  >,
];

type _GlobalSearchAliases = [
  AssertExtends<components["schemas"]["GlobalSearchResponse"], import("@/types/global-search").GlobalSearchResponse>,
  AssertExtends<components["schemas"]["GlobalSearchFindingResponse"], import("@/types/global-search").GlobalSearchFinding>,
  AssertExtends<components["schemas"]["GlobalSearchRunResponse"], import("@/types/global-search").GlobalSearchRun>,
  AssertExtends<
    components["schemas"]["GlobalSearchPolicyPackResponse"],
    import("@/types/global-search").GlobalSearchPolicyPack
  >,
];

type _AdvisorySchedulingAliases = [
  AssertExtends<
    components["schemas"]["AdvisoryScanSchedule"],
    import("@/types/advisory-scheduling").AdvisoryScanSchedule
  >,
  AssertExtends<
    components["schemas"]["AdvisoryScanExecution"],
    import("@/types/advisory-scheduling").AdvisoryScanExecution
  >,
  AssertExtends<
    components["schemas"]["ArchitectureDigest"],
    import("@/types/advisory-scheduling").ArchitectureDigest
  >,
];

type _AlertRoutingAliases = [
  AssertExtends<
    components["schemas"]["AlertRoutingSubscription"],
    import("@/types/alert-routing").AlertRoutingSubscription
  >,
  AssertExtends<
    components["schemas"]["OutboundWebhookDryRunResponse"],
    import("@/types/alert-routing").WebhookTestResponse
  >,
];

type _AlertSimulationAliases = [
  AssertExtends<
    components["schemas"]["SimulatedAlertOutcome"],
    import("@/types/alert-simulation").SimulatedAlertOutcome
  >,
  AssertExtends<
    components["schemas"]["RuleSimulationResult"],
    import("@/types/alert-simulation").RuleSimulationResult
  >,
  AssertExtends<
    components["schemas"]["RuleCandidateComparisonResult"],
    import("@/types/alert-simulation").RuleCandidateComparisonResult
  >,
];

type _ArchitectureProvenanceAliases = [
  AssertExtends<
    components["schemas"]["ArchitectureLinkageNode"],
    import("@/types/architecture-provenance").ArchitectureLinkageNode
  >,
  AssertExtends<
    components["schemas"]["ArchitectureLinkageEdge"],
    import("@/types/architecture-provenance").ArchitectureLinkageEdge
  >,
  AssertExtends<
    components["schemas"]["ArchitectureTraceTimelineEntry"],
    import("@/types/architecture-provenance").ArchitectureTraceTimelineEntry
  >,
  AssertExtends<
    components["schemas"]["ArchitectureRunProvenanceGraph"],
    import("@/types/architecture-provenance").ArchitectureRunProvenanceGraph
  >,
];

type _DemoPreviewAliases = [
  AssertExtends<components["schemas"]["DemoPreviewRun"], import("@/types/demo-preview").DemoPreviewRun>,
  AssertExtends<
    components["schemas"]["DemoPreviewAuthorityChain"],
    import("@/types/demo-preview").DemoPreviewAuthorityChain
  >,
  AssertExtends<
    components["schemas"]["DemoPreviewManifestSummary"],
    import("@/types/demo-preview").DemoPreviewManifestSummary
  >,
  AssertExtends<components["schemas"]["DemoPreviewArtifact"], import("@/types/demo-preview").DemoPreviewArtifact>,
  AssertExtends<
    components["schemas"]["DemoPreviewTimelineItem"],
    import("@/types/demo-preview").DemoPreviewTimelineItem
  >,
];

type _DemoExplainAliases = [
  AssertExtends<components["schemas"]["GraphNodeVm"], import("@/types/demo-explain").DemoProvenanceGraphNode>,
  AssertExtends<components["schemas"]["GraphEdgeVm"], import("@/types/demo-explain").DemoProvenanceGraphEdge>,
  AssertExtends<components["schemas"]["GraphViewModel"], import("@/types/demo-explain").DemoProvenanceGraph>,
];

type _ExecDigestPreferencesAliases = [
  AssertExtends<
    components["schemas"]["ExecDigestPreferencesResponse"],
    import("@/types/exec-digest-preferences").ExecDigestPreferencesResponse
  >,
  AssertExtends<
    components["schemas"]["ExecDigestPreferencesUpsertRequest"],
    import("@/types/exec-digest-preferences").ExecDigestPreferencesUpsertRequest
  >,
];

type _RecommendationLearningAliases = [
  AssertExtends<
    components["schemas"]["RecommendationOutcomeStats"],
    import("@/types/recommendation-learning").OutcomeStats
  >,
];

type _TeamsIncomingWebhookAliases = [
  AssertExtends<
    components["schemas"]["TeamsIncomingWebhookConnectionResponse"],
    import("@/types/teams-incoming-webhook-connection").TeamsIncomingWebhookConnectionResponse
  >,
  AssertExtends<
    components["schemas"]["TeamsIncomingWebhookConnectionUpsertRequest"],
    import("@/types/teams-incoming-webhook-connection").TeamsIncomingWebhookConnectionUpsertRequest
  >,
  AssertExtends<
    components["schemas"]["TeamsIncomingWebhookSecretValidationOutcome"],
    import("@/types/teams-incoming-webhook-connection").TeamsIncomingWebhookSecretValidationOutcome
  >,
  AssertExtends<
    components["schemas"]["TeamsIncomingWebhookConnectionTestResponse"],
    import("@/types/teams-incoming-webhook-connection").TeamsIncomingWebhookConnectionTestResponse
  >,
];

type _AgentForensicsAliases = [
  AssertExtends<
    components["schemas"]["AgentExecutionTraceSummary"],
    import("@/types/agent-forensics").AgentExecutionTraceRow
  >,
  AssertExtends<
    components["schemas"]["AgentExecutionTraceResponse"],
    import("@/types/agent-forensics").AgentExecutionTraceListPayload
  >,
  AssertExtends<
    components["schemas"]["AgentOutputSemanticScore"],
    import("@/types/agent-forensics").AgentOutputSemanticScoreRow
  >,
  AssertExtends<
    components["schemas"]["AgentOutputEvaluationScore"],
    import("@/types/agent-forensics").AgentOutputEvaluationScoreRow
  >,
  AssertExtends<
    components["schemas"]["AgentOutputEvaluationPerspective"],
    import("@/types/agent-forensics").AgentOutputEvaluationPerspectivePayload
  >,
  AssertExtends<
    components["schemas"]["AgentOutputEvaluationSummary"],
    import("@/types/agent-forensics").AgentOutputEvaluationSummaryPayload
  >,
  AssertExtends<
    components["schemas"]["RunRetrievalGroundingScoreSummary"],
    import("@/types/agent-forensics").RunRetrievalGroundingScoreSummary
  >,
  AssertExtends<
    components["schemas"]["RunRetrievalGroundingRow"],
    import("@/types/agent-forensics").RunRetrievalGroundingRow
  >,
  AssertExtends<
    components["schemas"]["RunRetrievalGroundingResponse"],
    import("@/types/agent-forensics").RunRetrievalGroundingPayload
  >,
];

type _ExplanationAliases = [
  AssertExtends<components["schemas"]["ExplanationProvenance"], import("@/types/explanation").ExplanationProvenance>,
  AssertExtends<components["schemas"]["StructuredExplanation"], import("@/types/explanation").StructuredExplanation>,
  AssertExtends<
    components["schemas"]["FindingExplainabilityEvidence"],
    import("@/types/explanation").FindingExplainabilityEvidence
  >,
  AssertExtends<
    components["schemas"]["FindingEvidenceChainResponse"],
    import("@/types/explanation").FindingEvidenceChain
  >,
  AssertExtends<components["schemas"]["FindingLlmAuditResult"], import("@/types/explanation").FindingLlmAudit>,
  AssertExtends<
    components["schemas"]["FindingExplainabilityResult"],
    import("@/types/explanation").FindingExplainability
  >,
  AssertExtends<
    components["schemas"]["ComparisonExplanationResult"],
    import("@/types/explanation").ComparisonExplanation
  >,
];

type _GovernanceDashboardAliases = [
  AssertExtends<
    components["schemas"]["ComplianceDriftTrendPoint"],
    import("@/types/governance-dashboard").ComplianceDriftTrendPoint
  >,
  AssertExtends<
    components["schemas"]["GovernanceLineageRunSummary"],
    import("@/types/governance-dashboard").GovernanceLineageRunSummary
  >,
  AssertExtends<
    components["schemas"]["GovernanceLineageManifestSummary"],
    import("@/types/governance-dashboard").GovernanceLineageManifestSummary
  >,
  AssertExtends<
    components["schemas"]["GovernanceLineageFindingSummary"],
    import("@/types/governance-dashboard").GovernanceLineageFindingSummary
  >,
  AssertExtends<
    components["schemas"]["GovernanceLineageResult"],
    import("@/types/governance-dashboard").GovernanceLineageResult
  >,
  AssertExtends<
    components["schemas"]["GovernanceRationaleResult"],
    import("@/types/governance-dashboard").GovernanceRationaleResult
  >,
  AssertExtends<
    components["schemas"]["GovernanceBatchReviewItemResult"],
    import("@/types/governance-dashboard").GovernanceBatchReviewItemResult
  >,
  AssertExtends<
    components["schemas"]["GovernanceBatchReviewResponse"],
    import("@/types/governance-dashboard").GovernanceBatchReviewResponse
  >,
];

type _DraftIntakeStructuralAliases = [
  AssertExtends<components["schemas"]["ActorDescriptor"], import("@/types/draft-intake").ActorDescriptor>,
  AssertExtends<components["schemas"]["ActorSet"], import("@/types/draft-intake").ActorSet>,
  AssertExtends<components["schemas"]["DraftRequestDocument"], import("@/types/draft-intake").DraftRequestDocument>,
  AssertExtends<components["schemas"]["DraftRequestResponse"], import("@/types/draft-intake").DraftRequestResponse>,
  AssertExtends<
    components["schemas"]["DraftRequestSummaryResponse"],
    import("@/types/draft-intake").DraftRequestSummary
  >,
  AssertExtends<
    components["schemas"]["PagedResponseOfDraftRequestSummaryResponse"],
    import("@/types/draft-intake").DraftRequestSummaryPage
  >,
  AssertExtends<components["schemas"]["BranchDraftResponse"], import("@/types/draft-intake").BranchDraftResponse>,
  AssertExtends<
    components["schemas"]["DraftElicitationQuestion"],
    import("@/types/draft-intake").DraftElicitationQuestion
  >,
  AssertExtends<
    components["schemas"]["QuestionSelectionResult"],
    import("@/types/draft-intake").QuestionSelectionResult
  >,
  AssertExtends<
    components["schemas"]["DraftQuestionsResponse"],
    import("@/types/draft-intake").DraftQuestionsResponse
  >,
  AssertExtends<
    components["schemas"]["DraftAdmissionResponse"],
    import("@/types/draft-intake").DraftAdmissionResponse
  >,
  AssertExtends<components["schemas"]["SubmitDraftResponse"], import("@/types/draft-intake").SubmitDraftResponse>,
  AssertExtends<
    components["schemas"]["DraftIntakeReasonResponse"],
    import("@/types/draft-intake").DraftIntakeReasonResponse
  >,
];

type _ExplanationWave8Aliases = [
  AssertExtends<components["schemas"]["ExplanationResult"], import("@/types/explanation").RunExplanation>,
  AssertExtends<
    NonNullable<components["schemas"]["FindingConfidenceLevel"]>,
    import("@/types/explanation").FindingConfidenceLevel
  >,
];

type _PilotScorecardAliases = [
  AssertExtends<
    components["schemas"]["PilotInProductScorecardResponse"],
    import("@/types/pilot-scorecard").PilotScorecardJson
  >,
  AssertExtends<
    components["schemas"]["PilotScorecardResponse"],
    import("@/types/pilot-scorecard").PilotScorecardResponse
  >,
];

type _AuthorityTrustEvidenceAliases = [
  AssertExtends<
    components["schemas"]["TrustEvidenceFieldSnapshot"],
    import("@/types/authority-run-detail").TrustEvidenceFieldSnapshot
  >,
  AssertExtends<
    components["schemas"]["RunTrustEvidenceRouteRef"],
    import("@/types/authority-run-detail").RunTrustEvidenceRouteRef
  >,
  AssertExtends<
    components["schemas"]["RunTrustEvidenceTopFindingRow"],
    import("@/types/authority-run-detail").RunTrustEvidenceTopFindingRow
  >,
  AssertExtends<components["schemas"]["RunTrustEvidenceCard"], import("@/types/authority-run-detail").RunTrustEvidenceCard>,
  AssertExtends<
    components["schemas"]["RunRetrievalGroundingSummaryDto"],
    import("@/types/authority-run-detail").RunRetrievalGroundingSummary
  >,
];

type _PaginationWave9Aliases = [
  AssertExtends<
    components["schemas"]["PagedResponseOfConversationThread"],
    import("@/types/pagination").PagedResponseOfConversationThread
  >,
  AssertExtends<
    components["schemas"]["PagedResponseOfDraftRequestSummaryResponse"],
    import("@/types/pagination").PagedResponseOfDraftRequestSummaryResponse
  >,
  AssertExtends<
    components["schemas"]["CursorPagedResponseOfAlertRecord"],
    import("@/types/pagination").CursorPagedResponseOfAlertRecord
  >,
  AssertExtends<
    components["schemas"]["CursorPagedResponseOfAuditEvent"],
    import("@/types/pagination").CursorPagedResponseOfAuditEvent
  >,
  AssertExtends<
    components["schemas"]["CursorPagedResponseOfRunListItemResponse"],
    import("@/types/pagination").CursorPagedResponseOfRunListItemResponse
  >,
  AssertExtends<
    components["schemas"]["CursorPagedResponseOfRunSummaryResponse"],
    import("@/types/pagination").CursorPagedResponseOfRunSummaryResponse
  >,
];

const _compileTimeAliasGuards: [
  _AuthorityRunSummaryWave11Aliases,
  _AuthorityManifestWave11Aliases,
  _AuthorityRunDetailWave11Aliases,
  _AuthorityBarrelWave11Aliases,
  _AuthorityRunDetailWave10Aliases,
  _ExplanationWave12ModuleAliases,
  _ExplanationWave12BarrelAliases,
  _DraftIntakeActorsWave12ModuleAliases,
  _DraftIntakeActorsWave12BarrelAliases,
  _DraftIntakeWave13ModuleAliases,
  _DraftIntakeWave13BarrelAliases,
  _AgentForensicsWave13ModuleAliases,
  _AgentForensicsWave13BarrelAliases,
  _ExplanationWave13ModuleAliases,
  _ExplanationWave13BarrelAliases,
  _GovernanceStickinessWave14ModuleAliases,
  _GovernanceStickinessWave14BarrelAliases,
  _HealthDashboardWave14ModuleAliases,
  _HealthDashboardWave14BarrelAliases,
  _AiUsageDashboardModelWave14ModuleAliases,
  _AiUsageDashboardModelWave14BarrelAliases,
  _HealthDashboardSummaryWave15ModuleAliases,
  _HealthDashboardSummaryWave15BarrelAliases,
  _GovernanceDashboardWave15ModuleAliases,
  _GovernanceDashboardWave15BarrelAliases,
  _OperateRhythmWave15ModuleAliases,
  _OperateRhythmWave15BarrelAliases,
  _PageHelpTopicRowsAdminWave16ModuleAliases,
  _PageHelpTopicRowsAdminWave16BarrelAliases,
  _FirstReviewGuideWave16ModuleAliases,
  _FirstReviewGuideWave16BarrelAliases,
  _ConnectorOperationsWave16ModuleAliases,
  _ConnectorOperationsWave16BarrelAliases,
  _FirstReviewGuideWave17ModuleAliases,
  _FirstReviewGuideWave17BarrelAliases,
  _ExecDigestScheduleFormWave17ModuleAliases,
  _ExecDigestScheduleFormWave17BarrelAliases,
  _BuyerCtoDemoReadinessWave17ModuleAliases,
  _BuyerCtoDemoReadinessWave17BarrelAliases,
  _GovernanceWorkflowApiWave17ModuleAliases,
  _GovernanceWorkflowApiWave17BarrelAliases,
  _AlertsRoutingApiWave17ModuleAliases,
  _AlertsRoutingApiWave17BarrelAliases,
  _AskSseStreamWave17ModuleAliases,
  _AskSseStreamWave17BarrelAliases,
  _ArtifactReviewWave18ModuleAliases,
  _ArtifactReviewWave18BarrelAliases,
  _ArchitectureRiskRegisterWave18ModuleAliases,
  _ArchitectureRiskRegisterWave18BarrelAliases,
  _ExecDigestSchedulePageWave18ModuleAliases,
  _ExecDigestSchedulePageWave18BarrelAliases,
  _DownloadsBlobTriggerWave18ModuleAliases,
  _DownloadsBlobTriggerWave18BarrelAliases,
  _ItsmOutboundConnectionsWave18ModuleAliases,
  _ItsmOutboundConnectionsWave18BarrelAliases,
  _PolicyPacksApiWave18ModuleAliases,
  _PolicyPacksApiWave18BarrelAliases,
  _RecommendationLearningOperationalWave19ModuleAliases,
  _RecommendationLearningOperationalWave19BarrelAliases,
  _AdvisoryWave19ModuleAliases,
  _AdvisoryWave19BarrelAliases,
  _AgentForensicsScoresWave19ModuleAliases,
  _AgentForensicsScoresWave19BarrelAliases,
  _CopyFindingAsWorkItemWave20ModuleAliases,
  _CopyFindingAsWorkItemWave20BarrelAliases,
  _ArchitectureDraftStructuredBriefSuggestionsWave20ModuleAliases,
  _ArchitectureDraftStructuredBriefSuggestionsWave20BarrelAliases,
  _AdrFromRunWave20ModuleAliases,
  _AdrFromRunWave20BarrelAliases,
  _AuthorityRunDetailWave12TrustModuleAliases,
  _AuthorityRunDetailWave12ProvenanceModuleAliases,
  _AuthorityRunDetailWave12BarrelAliases,
  _OperateRhythmAliases,
  _TechnologyLedgerAliases,
  _AlertsAliases,
  _AdvisoryAliases,
  _GovernanceWorkflowAliases,
  _DigestSubscriptionAliases,
  _ConversationAliases,
  _PolicyPackAliases,
  _GraphAliases,
  _ComparisonAliases,
  _FindingInspectAliases,
  _LearningAliases,
  _EvolutionAliases,
  _AlertTuningAliases,
  _CompositeAlertRuleAliases,
  _DraftIntakeAliases,
  _StageTimelineAliases,
  _RecommendationLearningOperationalAliases,
  _GlobalSearchAliases,
  _AdvisorySchedulingAliases,
  _AlertRoutingAliases,
  _AlertSimulationAliases,
  _ArchitectureProvenanceAliases,
  _DemoPreviewAliases,
  _DemoExplainAliases,
  _ExecDigestPreferencesAliases,
  _RecommendationLearningAliases,
  _TeamsIncomingWebhookAliases,
  _AgentForensicsAliases,
  _ExplanationAliases,
  _GovernanceDashboardAliases,
  _DraftIntakeStructuralAliases,
  _ExplanationWave8Aliases,
  _PilotScorecardAliases,
  _AuthorityTrustEvidenceAliases,
  _PaginationWave9Aliases,
] = [
  [] as unknown as _AuthorityRunSummaryWave11Aliases,
  [] as unknown as _AuthorityManifestWave11Aliases,
  [] as unknown as _AuthorityRunDetailWave11Aliases,
  [] as unknown as _AuthorityBarrelWave11Aliases,
  [] as unknown as _AuthorityRunDetailWave10Aliases,
  [] as unknown as _ExplanationWave12ModuleAliases,
  [] as unknown as _ExplanationWave12BarrelAliases,
  [] as unknown as _DraftIntakeActorsWave12ModuleAliases,
  [] as unknown as _DraftIntakeActorsWave12BarrelAliases,
  [] as unknown as _DraftIntakeWave13ModuleAliases,
  [] as unknown as _DraftIntakeWave13BarrelAliases,
  [] as unknown as _AgentForensicsWave13ModuleAliases,
  [] as unknown as _AgentForensicsWave13BarrelAliases,
  [] as unknown as _ExplanationWave13ModuleAliases,
  [] as unknown as _ExplanationWave13BarrelAliases,
  [] as unknown as _GovernanceStickinessWave14ModuleAliases,
  [] as unknown as _GovernanceStickinessWave14BarrelAliases,
  [] as unknown as _HealthDashboardWave14ModuleAliases,
  [] as unknown as _HealthDashboardWave14BarrelAliases,
  [] as unknown as _AiUsageDashboardModelWave14ModuleAliases,
  [] as unknown as _AiUsageDashboardModelWave14BarrelAliases,
  [] as unknown as _HealthDashboardSummaryWave15ModuleAliases,
  [] as unknown as _HealthDashboardSummaryWave15BarrelAliases,
  [] as unknown as _GovernanceDashboardWave15ModuleAliases,
  [] as unknown as _GovernanceDashboardWave15BarrelAliases,
  [] as unknown as _OperateRhythmWave15ModuleAliases,
  [] as unknown as _OperateRhythmWave15BarrelAliases,
  [] as unknown as _PageHelpTopicRowsAdminWave16ModuleAliases,
  [] as unknown as _PageHelpTopicRowsAdminWave16BarrelAliases,
  [] as unknown as _FirstReviewGuideWave16ModuleAliases,
  [] as unknown as _FirstReviewGuideWave16BarrelAliases,
  [] as unknown as _ConnectorOperationsWave16ModuleAliases,
  [] as unknown as _ConnectorOperationsWave16BarrelAliases,
  [] as unknown as _RecommendationLearningOperationalWave19ModuleAliases,
  [] as unknown as _RecommendationLearningOperationalWave19BarrelAliases,
  [] as unknown as _AdvisoryWave19ModuleAliases,
  [] as unknown as _AdvisoryWave19BarrelAliases,
  [] as unknown as _AgentForensicsScoresWave19ModuleAliases,
  [] as unknown as _AgentForensicsScoresWave19BarrelAliases,
  [] as unknown as _CopyFindingAsWorkItemWave20ModuleAliases,
  [] as unknown as _CopyFindingAsWorkItemWave20BarrelAliases,
  [] as unknown as _ArchitectureDraftStructuredBriefSuggestionsWave20ModuleAliases,
  [] as unknown as _ArchitectureDraftStructuredBriefSuggestionsWave20BarrelAliases,
  [] as unknown as _AdrFromRunWave20ModuleAliases,
  [] as unknown as _AdrFromRunWave20BarrelAliases,
  [] as unknown as _FirstReviewGuideWave17ModuleAliases,
  [] as unknown as _FirstReviewGuideWave17BarrelAliases,
  [] as unknown as _ExecDigestScheduleFormWave17ModuleAliases,
  [] as unknown as _ExecDigestScheduleFormWave17BarrelAliases,
  [] as unknown as _BuyerCtoDemoReadinessWave17ModuleAliases,
  [] as unknown as _BuyerCtoDemoReadinessWave17BarrelAliases,
  [] as unknown as _GovernanceWorkflowApiWave17ModuleAliases,
  [] as unknown as _GovernanceWorkflowApiWave17BarrelAliases,
  [] as unknown as _AlertsRoutingApiWave17ModuleAliases,
  [] as unknown as _AlertsRoutingApiWave17BarrelAliases,
  [] as unknown as _AskSseStreamWave17ModuleAliases,
  [] as unknown as _AskSseStreamWave17BarrelAliases,
  [] as unknown as _ArtifactReviewWave18ModuleAliases,
  [] as unknown as _ArtifactReviewWave18BarrelAliases,
  [] as unknown as _ArchitectureRiskRegisterWave18ModuleAliases,
  [] as unknown as _ArchitectureRiskRegisterWave18BarrelAliases,
  [] as unknown as _ExecDigestSchedulePageWave18ModuleAliases,
  [] as unknown as _ExecDigestSchedulePageWave18BarrelAliases,
  [] as unknown as _DownloadsBlobTriggerWave18ModuleAliases,
  [] as unknown as _DownloadsBlobTriggerWave18BarrelAliases,
  [] as unknown as _ItsmOutboundConnectionsWave18ModuleAliases,
  [] as unknown as _ItsmOutboundConnectionsWave18BarrelAliases,
  [] as unknown as _PolicyPacksApiWave18ModuleAliases,
  [] as unknown as _PolicyPacksApiWave18BarrelAliases,
  [] as unknown as _RecommendationLearningOperationalWave19ModuleAliases,
  [] as unknown as _RecommendationLearningOperationalWave19BarrelAliases,
  [] as unknown as _AdvisoryWave19ModuleAliases,
  [] as unknown as _AdvisoryWave19BarrelAliases,
  [] as unknown as _AgentForensicsScoresWave19ModuleAliases,
  [] as unknown as _AgentForensicsScoresWave19BarrelAliases,
  [] as unknown as _AuthorityRunDetailWave12TrustModuleAliases,
  [] as unknown as _AuthorityRunDetailWave12ProvenanceModuleAliases,
  [] as unknown as _AuthorityRunDetailWave12BarrelAliases,
  [] as unknown as _OperateRhythmAliases,
  [] as unknown as _TechnologyLedgerAliases,
  [] as unknown as _AlertsAliases,
  [] as unknown as _AdvisoryAliases,
  [] as unknown as _GovernanceWorkflowAliases,
  [] as unknown as _DigestSubscriptionAliases,
  [] as unknown as _ConversationAliases,
  [] as unknown as _PolicyPackAliases,
  [] as unknown as _GraphAliases,
  [] as unknown as _ComparisonAliases,
  [] as unknown as _FindingInspectAliases,
  [] as unknown as _LearningAliases,
  [] as unknown as _EvolutionAliases,
  [] as unknown as _AlertTuningAliases,
  [] as unknown as _CompositeAlertRuleAliases,
  [] as unknown as _DraftIntakeAliases,
  [] as unknown as _StageTimelineAliases,
  [] as unknown as _RecommendationLearningOperationalAliases,
  [] as unknown as _GlobalSearchAliases,
  [] as unknown as _AdvisorySchedulingAliases,
  [] as unknown as _AlertRoutingAliases,
  [] as unknown as _AlertSimulationAliases,
  [] as unknown as _ArchitectureProvenanceAliases,
  [] as unknown as _DemoPreviewAliases,
  [] as unknown as _DemoExplainAliases,
  [] as unknown as _ExecDigestPreferencesAliases,
  [] as unknown as _RecommendationLearningAliases,
  [] as unknown as _TeamsIncomingWebhookAliases,
  [] as unknown as _AgentForensicsAliases,
  [] as unknown as _ExplanationAliases,
  [] as unknown as _GovernanceDashboardAliases,
  [] as unknown as _DraftIntakeStructuralAliases,
  [] as unknown as _ExplanationWave8Aliases,
  [] as unknown as _PilotScorecardAliases,
  [] as unknown as _AuthorityTrustEvidenceAliases,
  [] as unknown as _PaginationWave9Aliases,
];
void _compileTimeAliasGuards;

describe("openapi type alias schema keys", () => {
  const snapshotSchemaKeys = new Set(Object.keys(openApiSnapshot.components.schemas));

  it("maps each aliased UI type to an existing OpenAPI components schema key", () => {
    for (const [uiType, schemaKey] of Object.entries(UI_TYPE_OPENAPI_SCHEMA_KEYS)) {
      expect(snapshotSchemaKeys.has(schemaKey), `${uiType} → ${schemaKey}`).toBe(true);
    }
  });

  it("keeps the mapping table in sync with the number of guarded aliases", () => {
    expect(Object.keys(UI_TYPE_OPENAPI_SCHEMA_KEYS)).toHaveLength(245);
  });

  it("documents empty AgentResult OpenAPI snapshot (wave 10 wire module)", () => {
    expect(openApiSnapshot.components.schemas.AgentResult).toEqual({});
  });
});
