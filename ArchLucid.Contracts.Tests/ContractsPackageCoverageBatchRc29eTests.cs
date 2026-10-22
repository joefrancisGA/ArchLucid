using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>RC29e package-coverage batch: forensic pointers, pilot proof DTOs, and product-learning scope.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc29eTests
{
    [Fact]
    public void FindingEvidenceChainResponse_and_forensic_pointers_roundtrip_properties()
    {
        FindingForensicAgentTracePointer agentPointer = new()
        {
            TraceId = "agent-trace-1",
            AgentType = "holistic-critic",
            ModelDeploymentName = "gpt-4o-mini",
            FullPromptBlobAvailable = true,
            FullResponseBlobAvailable = false,
            InlineFallbackFailed = false,
            ProvenanceCorrelationId = "corr-1",
        };

        FindingForensicRetrievalGroundingPointer groundingPointer = new()
        {
            TraceId = "ground-trace-1",
            AgentName = "holistic-critic",
            CorpusKind = "TenantManifest",
            CitationCoverage = 0.82,
            AgentExecutionTraceId = "agent-trace-1",
        };

        FindingEvidenceChainResponse response = new()
        {
            RunId = "run-1",
            FindingId = "finding-1",
            ManifestVersion = "v3",
            FindingsSnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            GraphSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            DecisionTraceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            GoldenManifestId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            RelatedGraphNodeIds = ["node-ingress"],
            AgentExecutionTraceIds = ["agent-trace-1"],
            RetrievalGroundingTraceIds = ["ground-trace-1"],
            AgentTracePointers = [agentPointer],
            RetrievalGroundingPointers = [groundingPointer],
            AuditCorrelationIds = ["audit-1"],
            SupportHint = "Open support bundle for run-1",
        };

        response.RunId.Should().Be("run-1");
        response.AgentTracePointers[0].ModelDeploymentName.Should().Be("gpt-4o-mini");
        response.RetrievalGroundingPointers[0].CitationCoverage.Should().Be(0.82);
        response.SupportHint.Should().Contain("support bundle");
    }

    [Fact]
    public void CandidateChangeSet_with_steps_and_impact_roundtrip_properties()
    {
        CandidateChangeSetStep step = new()
        {
            Ordinal = 1,
            ActionType = "AddControl",
            Description = "Deploy WAF",
            AcceptanceCriteria = "Ingress blocked by policy",
        };

        CandidateChangeSet changeSet = new()
        {
            ChangeSetId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            SourcePlanId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Description = "Ingress hardening",
            ProposedActions = [step],
            AffectedComponents = [
                new ChangeSetAffectedComponent
                {
                    ComponentKey = "ingress",
                    DisplayName = "Ingress gateway",
                    WorkflowArea = "network",
                },
            ],
            ExpectedImpact = new ExpectedImpact
            {
                Summary = "Higher security posture",
                Rationale = "Blocks anonymous ingress",
            },
            SimulationScore = 0.9,
            DeterminismScore = 0.95,
            RegressionRiskScore = 0.1,
            ApprovalStatus = ApprovalStatus.PendingReview,
            CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
        };

        changeSet.ProposedActions[0].ActionType.Should().Be("AddControl");
        changeSet.ExpectedImpact.Summary.Should().Contain("security");
        changeSet.ApprovalStatus.Should().Be(ApprovalStatus.PendingReview);
    }

    [Fact]
    public void ProductLearningScope_and_aggregation_snapshot_roundtrip_properties()
    {
        ProductLearningScope scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        ProductLearningAggregationSnapshot snapshot = new()
        {
            Scope = scope,
            SinceUtc = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            FeedbackRollups = [
                new FeedbackAggregate
                {
                    AggregateKey = "ingress-hardening",
                    SubjectTypeOrWorkflowArea = "Finding",
                    TotalSignalCount = 4,
                    TrustedCount = 3,
                },
            ],
            ArtifactTrends = [
                new ArtifactOutcomeTrend
                {
                    TrendKey = "narrative",
                    ArtifactTypeOrHint = "ArchitectureNarrative",
                    AcceptedOrTrustedCount = 2,
                    RejectionCount = 1,
                },
            ],
            RepeatedCommentThemes = [
                new RepeatedCommentTheme
                {
                    ThemeKey = "ingress",
                    OccurrenceCount = 3,
                    SampleCommentShort = "tighten ingress",
                },
            ],
        };

        snapshot.Scope.ProjectId.Should().Be(scope.ProjectId);
        snapshot.FeedbackRollups[0].TotalSignalCount.Should().Be(4);
        snapshot.ArtifactTrends[0].AcceptedOrTrustedCount.Should().Be(2);
        snapshot.RepeatedCommentThemes[0].ThemeKey.Should().Be("ingress");
    }

    [Fact]
    public void Pilot_proof_and_report_card_dtos_roundtrip_properties()
    {
        ProofPackageCompletenessResponse completeness = new()
        {
            DemoTenantWarningRequired = true,
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            CommittedManifestTimestampResolved = true,
            RunInCommittedStatus = true,
            ArtifactDescriptorCount = 6,
            ArtifactDescriptorCountResolved = true,
            TimeToCommittedManifestResolved = true,
            FindingsBySeverityPresent = true,
            TopFindingEvidenceChainPresentOrNotApplicable = true,
            AuditRowsPresentOrLowerBound = true,
            LlmCallCount = 12,
            LlmCallCountResolved = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Partial,
            RoiConfidenceLabel = "Partial baseline",
            BuyerSafeRedactionProfile = "tenant-export",
            PublishingTier = "Complete",
            ProofSendability = "Sendable",
            EvidenceCompleteness = "Strong",
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Sendable),
        };

        PilotRunDeltasResponse deltas = new()
        {
            RunCreatedUtc = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
            ManifestCommittedUtc = new DateTime(2026, 2, 1, 1, 0, 0, DateTimeKind.Utc),
            TimeToCommittedManifestTotalSeconds = 3600,
            FindingsBySeverity = [
                new PilotRunDeltaSeverityCountResponse { Severity = "Critical", Count = 1 },
            ],
            AuditRowCount = 20,
            AuditRowCountTruncated = false,
            LlmCallCount = 5,
            LlmCallCountResolved = true,
            TopFindingSeverity = "Critical",
            TopFindingId = "finding-1",
            IsDemoTenant = false,
            GovernedFindingCoverage = GovernedFindingCoverageMetric.Compute(
                totalDecisionGradeCount: 10,
                governedCount: 8,
                advisoryCount: 2,
                withPolicyRuleCount: 7,
                withEvidenceRefsCount: 6),
        };

        PilotReportCard reportCard = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ScopeProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            PeriodStartUtc = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            PeriodEndUtc = new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero),
            TotalCompletedRuns = 3,
        };

        completeness.PublishingTier.Should().Be("Complete");
        deltas.TopFindingSeverity.Should().Be("Critical");
        deltas.GovernedFindingCoverage!.GovernedCount.Should().Be(8);
        reportCard.TotalCompletedRuns.Should().Be(3);
    }

    [Fact]
    public void Sponsor_roi_disposition_and_evidence_pack_roundtrip_properties()
    {
        SponsorRoiClaimDisposition disposition = SponsorRoiClaimDisposition.Warn;

        SponsorEvidencePackResponse evidencePack = new()
        {
            GeneratedUtc = new DateTimeOffset(2026, 4, 1, 12, 0, 0, TimeSpan.Zero),
            DemoRunId = "demo-run-1",
            ProcessInstrumentation = new WhyArchLucidSnapshotResponse { DemoRunId = "demo-run-1" },
            ExplainabilityTrace = new ExplainabilityTraceCompletenessPack
            {
                TotalFindings = 5,
                OverallCompletenessRatio = 0.9,
            },
            GovernanceOutcomes = new SponsorEvidenceGovernanceOutcomes
            {
                PendingApprovalCount = 1,
                RecentTerminalDecisionCount = 2,
                RecentPolicyPackChangeCount = 0,
            },
        };

        disposition.Should().Be(SponsorRoiClaimDisposition.Warn);
        evidencePack.DemoRunId.Should().Be("demo-run-1");
        evidencePack.ExplainabilityTrace.OverallCompletenessRatio.Should().Be(0.9);
        evidencePack.GovernanceOutcomes.RecentTerminalDecisionCount.Should().Be(2);
    }
}
