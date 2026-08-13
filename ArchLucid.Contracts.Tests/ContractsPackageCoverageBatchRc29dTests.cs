using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>RC29d package-coverage batch: explanation, evolution, and governance DTO roundtrips.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc29dTests
{
    [Fact]
    public void HolisticCriticRequest_and_response_roundtrip_properties()
    {
        HolisticCriticRequest request = new() { Focus = "network segmentation" };
        HolisticCriticResponse response = new()
        {
            CritiqueMarkdown = "## Observations\n- tighten ingress",
            Disclaimer = HolisticCriticResponse.DefaultDisclaimer,
        };

        request.Focus.Should().Be("network segmentation");
        response.CritiqueMarkdown.Should().Contain("ingress");
        response.Disclaimer.Should().Contain("not a formal finding");
    }

    [Fact]
    public void RunRetrievalGrounding_response_and_row_roundtrip_properties()
    {
        RunRetrievalGroundingScoreSummary score = new()
        {
            ChunkId = "chunk-1",
            Score = 0.92,
        };

        RunRetrievalGroundingRow row = new()
        {
            TraceId = "trace-1",
            AgentName = "holistic-critic",
            CorpusKind = "TenantManifest",
            RetrievedChunkIds = ["chunk-1"],
            DocumentIds = ["doc-1"],
            ScoreSummaries = [score],
            RetrievedChunkCount = 1,
            TokensIn = 120,
            TokensOut = 48,
            CitationCoverage = 0.75,
            TopK = 8,
            AgentExecutionTraceId = "agent-trace",
            ScoreMetadataMalformed = false,
            DocumentMetadataMalformed = false,
            GraphRagNeighborsAdded = 3,
            GraphRagSeedHits = 2,
            GraphRagExpansionLatencyMs = 12.5,
            CreatedUtc = new DateTime(2026, 1, 2, 3, 4, 5, DateTimeKind.Utc),
        };

        RunRetrievalGroundingResponse response = new()
        {
            RunId = "run-1",
            Rows = [row],
            TraceCount = 1,
            HasDegradedMetadata = true,
        };

        response.RunId.Should().Be("run-1");
        response.HasDegradedMetadata.Should().BeTrue();
        response.Rows[0].CorpusKind.Should().Be("TenantManifest");
        response.Rows[0].ScoreSummaries[0].Score.Should().Be(0.92);
    }

    [Fact]
    public void ShadowExecutionRequest_and_pipeline_options_roundtrip_properties()
    {
        CandidateChangeSet changeSet = new()
        {
            ChangeSetId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            SourcePlanId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Description = "Add WAF",
            ApprovalStatus = ApprovalStatus.PendingReview,
        };

        ShadowExecutionPipelineOptions pipeline = new()
        {
            IncludeManifest = true,
            IncludeSummary = false,
            IncludeDiagram = true,
        };

        ShadowExecutionRequest request = new()
        {
            BaselineArchitectureRunId = "baseline-run",
            CandidateChangeSet = changeSet,
            Pipeline = pipeline,
        };

        request.BaselineArchitectureRunId.Should().Be("baseline-run");
        request.CandidateChangeSet.Description.Should().Be("Add WAF");
        request.Pipeline!.IncludeSummary.Should().BeFalse();
        request.Pipeline.IncludeDiagram.Should().BeTrue();
    }

    [Fact]
    public void Evolution_records_and_evaluation_score_roundtrip_properties()
    {
        EvaluationScore score = new()
        {
            SimulationScore = 0.8,
            DeterminismScore = 0.95,
            RegressionRiskScore = 0.1,
            ImprovementDelta = 0.2,
            RegressionSignals = ["determinism-warning"],
            ConfidenceScore = 0.85,
        };

        ExpectedImpact impact = new()
        {
            Summary = "moderate cost increase",
            Rationale = "extra WAF capacity",
        };

        ChangeSetAffectedComponent component = new()
        {
            ComponentKey = "ingress-gateway",
            DisplayName = "Ingress gateway",
            WorkflowArea = "network",
        };

        EvolutionSimulationRunRecord runRecord = new()
        {
            SimulationRunId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            CandidateChangeSetId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            BaselineArchitectureRunId = "baseline",
            EvaluationMode = EvolutionEvaluationModeValues.ReadOnlyArchitectureAnalysis,
            OutcomeJson = "{\"ok\":true}",
            WarningsJson = "[]",
            CompletedUtc = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
            IsShadowOnly = true,
        };

        EvolutionCandidateChangeSetRecord changeSetRecord = new()
        {
            CandidateChangeSetId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            TenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            WorkspaceId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            ProjectId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            SourcePlanId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Status = EvolutionCandidateChangeSetStatusValues.PendingHumanReview,
            Title = "Add WAF",
            Summary = "Ingress hardening",
            PlanSnapshotJson = "{}",
            CreatedUtc = new DateTime(2026, 2, 2, 0, 0, 0, DateTimeKind.Utc),
            CreatedByUserId = "user-1",
        };

        score.SimulationScore.Should().Be(0.8);
        impact.Summary.Should().Contain("cost");
        component.WorkflowArea.Should().Be("network");
        runRecord.IsShadowOnly.Should().BeTrue();
        changeSetRecord.Title.Should().Be("Add WAF");
    }

    [Fact]
    public void Product_learning_governance_and_agent_evaluation_dtos_roundtrip_properties()
    {
        ProductLearningPilotSignalRecord pilotSignal = new()
        {
            SignalId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            TenantId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            WorkspaceId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            ProjectId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            ArchitectureRunId = "run-1",
            SubjectType = ProductLearningSubjectTypeValues.Finding,
            Disposition = ProductLearningDispositionValues.Trusted,
            TriageStatus = ProductLearningTriageStatusValues.Open,
            CommentShort = "repeat pattern",
            RecordedUtc = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
        };

        ProductLearningImprovementThemeRecord theme = new()
        {
            ThemeId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            TenantId = pilotSignal.TenantId,
            WorkspaceId = pilotSignal.WorkspaceId,
            ProjectId = pilotSignal.ProjectId,
            ThemeKey = "ingress-hardening",
            Title = "Ingress controls",
            Status = ProductLearningImprovementThemeStatusValues.Accepted,
            CreatedUtc = new DateTime(2026, 3, 2, 0, 0, 0, DateTimeKind.Utc),
        };

        GovernanceLineageRunSummary lineage = new()
        {
            RunId = "run-lineage",
            Status = "Completed",
            CreatedUtc = new DateTime(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 3, 1, 13, 0, 0, DateTimeKind.Utc),
            CurrentManifestVersion = "v1",
        };

        AgentOutputEvaluationScore agentScore = new()
        {
            TraceId = "trace-1",
            AgentType = AgentType.Critic,
            StructuralCompletenessRatio = 0.9,
            IsJsonParseFailure = false,
            MissingKeys = ["summary"],
            QualityWarning = false,
            BlobUploadFailed = false,
        };

        pilotSignal.SubjectType.Should().Be(ProductLearningSubjectTypeValues.Finding);
        theme.ThemeKey.Should().Be("ingress-hardening");
        lineage.CurrentManifestVersion.Should().Be("v1");
        agentScore.StructuralCompletenessRatio.Should().Be(0.9);
    }
}
