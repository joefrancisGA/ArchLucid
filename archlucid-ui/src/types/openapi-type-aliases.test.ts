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
} as const satisfies Record<string, keyof components["schemas"]>;

type AssertExtends<Base, Derived extends Base> = Derived;

/** Compile-time guard: aliased DTOs remain assignable to their OpenAPI wire shapes. */
type _AuthorityAliases = [
  AssertExtends<components["schemas"]["DiffItemResponse"], import("@/types/authority").DiffItem>,
  AssertExtends<components["schemas"]["ManifestComparisonResponse"], import("@/types/authority").ManifestComparison>,
  AssertExtends<components["schemas"]["RunComparisonResponse"], import("@/types/authority").RunComparison>,
  AssertExtends<components["schemas"]["ReplayValidationResponse"], import("@/types/authority").ReplayValidation>,
  AssertExtends<components["schemas"]["ReplayResponse"], import("@/types/authority").ReplayResponse>,
  AssertExtends<components["schemas"]["ProvenanceNode"], import("@/types/authority").ProvenanceNode>,
  AssertExtends<components["schemas"]["ProvenanceEdge"], import("@/types/authority").ProvenanceEdge>,
  AssertExtends<
    components["schemas"]["DecisionProvenanceGraph"],
    import("@/types/authority").DecisionProvenanceGraph
  >,
  AssertExtends<
    components["schemas"]["RunPipelineTimelineItemResponse"],
    import("@/types/authority").PipelineTimelineItem
  >,
];

/** Wave 10 — run-detail wire shapes while OpenAPI `AgentResult` snapshot stays `{}`. */
type _AuthorityRunDetailWave10Aliases = [
  AssertExtends<
    Pick<components["schemas"]["Finding"], "category" | "findingId" | "severity">,
    import("@/types/authority-run-detail-wire").RunDetailAgentFinding
  >,
  AssertExtends<
    components["schemas"]["RunRetrievalGroundingSummaryDto"],
    import("@/types/authority").RunRetrievalGroundingSummary
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

const _compileTimeAliasGuards: [
  _AuthorityAliases,
  _AuthorityRunDetailWave10Aliases,
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
] = [
  [] as unknown as _AuthorityAliases,
  [] as unknown as _AuthorityRunDetailWave10Aliases,
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
    expect(Object.keys(UI_TYPE_OPENAPI_SCHEMA_KEYS)).toHaveLength(194);
  });

  it("documents empty AgentResult OpenAPI snapshot (wave 10 wire module)", () => {
    expect(openApiSnapshot.components.schemas.AgentResult).toEqual({});
  });
});
